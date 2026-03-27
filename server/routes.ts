import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import crypto from "crypto";
import { storage } from "./storage";
import { pool } from "./db";
import {
  hashPassword, verifyPassword, generateKeyLicense,
  getPrice, getLevelName,
  parseTtl, isValidTtlFormat, getDefaultNormalTtlMs, getDefaultRememberMeTtlMs,
  getEnvNormalTtl, getEnvRememberMeTtl,
} from "./auth";
import { loginSchema, registerSchema, generateKeySchema, insertGameSchema, insertGameDurationSchema } from "@shared/schema";
import {
  emitScopedKeyEvent, emitScopedUserEvent, emitToAll,
  emitToOwners, emitToAdminsAndAbove, emitToUser,
  type WsEvent, type WsEventType,
} from "./websocket";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(windowMs: number, maxHits: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= maxHits) {
      return res.status(429).json({ message: "Too many requests. Please try again later." });
    }
    entry.count++;
    return next();
  };
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
    username?: string;
    userLevel?: number;
    timeLogin?: string;
    pending2fa?: {
      userId: number;
      otpHash: string;
      expires: number;
      stayLog: boolean;
      attempts: number;
    };
    pendingPasswordReset?: {
      userId: number;
      otpHash: string;
      expires: number;
      username: string;
      attempts: number;
    };
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireLevel(maxLevel: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user || user.level > maxLevel) return res.status(403).json({ message: "Access Denied" });
    next();
  };
}

const BOOTSTRAP_SECRET = process.env.CONNECT_BOOTSTRAP_SECRET || "Vm8Lk7Uj2JmsjCPVPVjrLa7zgfx3uz9E";
const DEFAULT_GAME_NAME = process.env.CONNECT_GAME_NAME || "PUBG";

async function resolveSessionTtlMs(rememberMe: boolean): Promise<number> {
  const settings = await storage.getSessionSettings();
  if (rememberMe) {
    if (settings?.rememberMeTtl) {
      const ms = parseTtl(settings.rememberMeTtl);
      if (ms) return ms;
    }
    return getDefaultRememberMeTtlMs();
  } else {
    if (settings?.normalTtl) {
      const ms = parseTtl(settings.normalTtl);
      if (ms) return ms;
    }
    return getDefaultNormalTtlMs();
  }
}

function wsEvent(type: WsEventType, payload?: any): WsEvent {
  return { type, payload, timestamp: Date.now() };
}

export async function registerRoutes(httpServer: Server | null, app: Express): Promise<RequestHandler> {
  const PgSession = connectPgSimple(session);
  const sessionMiddleware = session({
    store: new PgSession({ pool }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  });

  app.use(sessionMiddleware);

  const cfg = await storage.getConnectConfig();
  if (!cfg) {
    await storage.upsertConnectConfig({
      activeSecret: BOOTSTRAP_SECRET,
      gameName: DEFAULT_GAME_NAME,
      secretVersion: 1,
      changedBy: "system",
    });
  }

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(req.session.userId);
    if (!user || user.status !== 1) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Session invalid" });
    }
    const { password, ...safe } = user;
    res.json({ ...safe, levelName: getLevelName(user.level) });
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, stayLog, rememberMe, deviceId } = loginSchema.parse(req.body);
      const useRememberMe = !!(rememberMe || stayLog);
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const throttleId = `${ip}-${deviceId || "no-device"}`;

      const throttle = await storage.getThrottle(throttleId);
      if (throttle && throttle.blockedUntil && new Date() < throttle.blockedUntil) {
        const remain = Math.ceil((throttle.blockedUntil.getTime() - Date.now()) / 60000);
        return res.status(423).json({ message: `Too many failed logins. Blocked for ${remain} minute(s).` });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) return res.status(400).json({ message: "Invalid username or password." });

      if (!verifyPassword(password, user.password)) {
        await storage.recordLoginFailure(throttleId);
        const t = await storage.getThrottle(throttleId);
        const left = Math.max(0, 5 - (t?.attempts || 0));
        return res.status(400).json({ message: `Invalid username or password. Attempts left: ${left}` });
      }

      if (user.status === 0) return res.status(400).json({ message: "Registration received. Wait for approval." });
      if (user.status === 2) return res.status(400).json({ message: "Your account was declined." });
      if (user.status !== 1) return res.status(400).json({ message: "Account is not active." });

      if (user.expirationDate && new Date() > user.expirationDate) {
        return res.status(400).json({ message: "Account expired. Please renew." });
      }

      if ([2, 3].includes(user.level)) {
        if (!deviceId) return res.status(400).json({ message: "Device ID required." });
        if (user.deviceId && user.deviceId !== deviceId) {
          return res.status(400).json({ message: "Wrong device. Account locked to another device." });
        }
        if (!user.deviceId) {
          await storage.updateUser(user.id, { deviceId });
        }
      }

      if (user.twofaEnabled === 1 && user.telegramChatId) {
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
        req.session.pending2fa = {
          userId: user.id,
          otpHash,
          expires: Date.now() + 300000,
          stayLog: useRememberMe,
          attempts: 0,
        };
        const response: any = { requires2fa: true };
        if (process.env.NODE_ENV !== "production") response.otp_hint = otp;
        return res.json(response);
      }

      await storage.clearThrottle(throttleId);
      const ttlMs = await resolveSessionTtlMs(useRememberMe);
      req.session.regenerate((err) => {
        if (err) return res.status(500).json({ message: "Session error." });
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.userLevel = user.level;
        req.session.cookie.maxAge = ttlMs;
        req.session.save(() => {
          const { password: _, ...safe } = user;
          res.json({ ...safe, levelName: getLevelName(user.level) });
        });
      });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Login failed" });
    }
  });

  app.post("/api/auth/verify-otp", rateLimit(60000, 10), async (req, res) => {
    const pending = req.session.pending2fa;
    if (!pending) return res.status(400).json({ message: "No pending 2FA session." });

    const { otp } = req.body;
    if (Date.now() > pending.expires) {
      delete req.session.pending2fa;
      return res.status(400).json({ message: "OTP expired." });
    }

    if (pending.attempts >= 5) {
      delete req.session.pending2fa;
      return res.status(400).json({ message: "Too many failed OTP attempts. Please login again." });
    }

    const inputHash = crypto.createHash("sha256").update(String(otp)).digest("hex");
    if (inputHash !== pending.otpHash) {
      pending.attempts++;
      return res.status(400).json({ message: "Invalid OTP." });
    }

    const user = await storage.getUser(pending.userId);
    if (!user) return res.status(400).json({ message: "User not found." });

    const ttlMs = await resolveSessionTtlMs(!!pending.stayLog);
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ message: "Session error." });
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.userLevel = user.level;
      req.session.cookie.maxAge = ttlMs;
      req.session.save(() => {
        const { password: _pw, ...safe } = user;
        res.json({ ...safe, levelName: getLevelName(user.level) });
      });
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      if (data.password !== data.password2) {
        return res.status(400).json({ message: "Passwords do not match." });
      }

      const existing = await storage.getUserByUsername(data.username);
      if (existing) return res.status(400).json({ message: "Username already taken." });

      const refCode = await storage.checkReferralCode(data.referral);
      if (!refCode) return res.status(400).json({ message: "Invalid referral code." });
      if (refCode.usedBy) return res.status(400).json({ message: "Referral code already used." });

      const hashedPw = hashPassword(data.password);
      const ip = req.ip || req.socket.remoteAddress || "unknown";

      const expDate = refCode.accExpiration
        ? new Date(refCode.accExpiration)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const newUser = await storage.createUser({
        email: data.email,
        username: data.username,
        fullname: data.fullname,
        telegramChatId: data.telegramChatId,
        password: hashedPw,
        saldo: refCode.setSaldo || 0,
        level: refCode.level || 3,
        uplink: refCode.createdBy || undefined,
        userIp: ip,
        status: 0,
        expirationDate: expDate,
        maxKeyEdits: refCode.maxKeyEdits ?? 3,
        maxDevicesLimit: refCode.maxDevicesLimit ?? 1000,
        maxKeyExtends: refCode.maxKeyExtends ?? 5,
        maxKeyResets: refCode.maxKeyResets ?? 3,
      } as any);

      await storage.useReferral(refCode.id, data.username);

      emitScopedUserEvent(wsEvent("users:created"), refCode.createdBy || undefined);
      emitScopedUserEvent(wsEvent("referrals:used"), refCode.createdBy || undefined);

      res.json({ message: "Registration submitted. Wait for approval." });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Registration failed." });
    }
  });

  app.post("/api/auth/forgot-password", rateLimit(60000, 5), async (req, res) => {
    try {
      const { username } = req.body;
      if (!username || typeof username !== "string" || username.length < 4) {
        return res.status(400).json({ message: "Please enter a valid username." });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) return res.status(400).json({ message: "Username not found." });

      if (!user.telegramChatId) {
        return res.status(400).json({ message: "Telegram Chat ID not found. Please contact administrator for password reset." });
      }

      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

      req.session.pendingPasswordReset = {
        userId: user.id,
        otpHash,
        expires: Date.now() + 300000,
        username: user.username,
        attempts: 0,
      };

      const response: any = { message: "OTP sent to your Telegram. Enter it to reset your password." };
      if (process.env.NODE_ENV !== "production") response.otp_hint = otp;
      res.json(response);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Request failed." });
    }
  });

  app.post("/api/auth/reset-password", rateLimit(60000, 10), async (req, res) => {
    try {
      const pending = req.session.pendingPasswordReset;
      if (!pending || !pending.userId) {
        return res.status(400).json({ message: "Session expired. Please request OTP again." });
      }

      const { otp, newPassword, confirmPassword } = req.body;
      if (!otp || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "All fields are required." });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match." });
      }

      if (newPassword.length < 6 || newPassword.length > 45) {
        return res.status(400).json({ message: "Password must be 6-45 characters." });
      }

      if (Date.now() > pending.expires) {
        delete req.session.pendingPasswordReset;
        return res.status(400).json({ message: "OTP expired. Please request again." });
      }

      if (pending.attempts >= 5) {
        delete req.session.pendingPasswordReset;
        return res.status(400).json({ message: "Too many failed OTP attempts. Please request a new code." });
      }

      const inputHash = crypto.createHash("sha256").update(String(otp)).digest("hex");
      if (inputHash !== pending.otpHash) {
        pending.attempts++;
        return res.status(400).json({ message: "Invalid OTP. Please try again." });
      }

      const user = await storage.getUser(pending.userId);
      if (!user) {
        delete req.session.pendingPasswordReset;
        return res.status(400).json({ message: "User not found." });
      }

      await storage.updateUser(user.id, { password: hashPassword(newPassword) });
      delete req.session.pendingPasswordReset;

      res.json({ message: "Password reset successfully. You can now login with your new password." });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Reset failed." });
    }
  });

  app.post("/api/auth/device-reset", rateLimit(60000, 5), async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) return res.status(400).json({ message: "User not found." });

      if (!verifyPassword(password, user.password)) {
        return res.status(400).json({ message: "Invalid password." });
      }

      const deviceResetLimit = 2;
      const count = user.deviceResetCount || 0;
      const lastReset = user.lastResetAt;
      const now = new Date();
      let allowReset = false;
      let newCount = 1;

      if (!lastReset) {
        allowReset = true;
        newCount = 1;
      } else {
        const hoursDiff = (now.getTime() - lastReset.getTime()) / (1000 * 3600);
        if (hoursDiff >= 24) {
          allowReset = true;
          newCount = 1;
        } else if (count < deviceResetLimit) {
          allowReset = true;
          newCount = count + 1;
        }
      }

      if (!allowReset) {
        return res.status(400).json({ message: `You have reached the ${deviceResetLimit} reset limit in 24 hours. Try again later.` });
      }

      await storage.updateUser(user.id, {
        deviceId: null,
        deviceResetCount: newCount,
        lastResetAt: now,
      } as any);

      res.json({ message: "Device reset successfully. You can login again." });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Device reset failed." });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {});
    res.json({ message: "Logged out." });
  });

  app.get("/api/keys", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 15));
    const search = (req.query.search as string) || undefined;
    const filter = (req.query.filter as string) || undefined;

    const result = await storage.getPaginatedKeys({
      page,
      limit,
      search,
      filter,
      registrator: user.level === 1 ? undefined : user.username,
    });

    res.json({
      keys: result.keys,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  });

  app.get("/api/keys/:id", requireAuth, async (req, res) => {
    const key = await storage.getKey(parseInt(req.params.id as string));
    if (!key) return res.status(404).json({ message: "Key not found" });
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.level !== 1 && key.registrator !== user.username) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(key);
  });

  app.get("/api/keys/:id/history", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const key = await storage.getKey(parseInt(req.params.id as string));
    if (!key) return res.status(404).json({ message: "Key not found" });
    if (user.level !== 1 && key.registrator !== user.username) {
      return res.status(403).json({ message: "Access denied" });
    }
    let logs = await storage.getHistoryByKeyId(key.id);
    const activityType = req.query.type as string | undefined;
    if (activityType) {
      logs = logs.filter((l: any) => l.activity === activityType);
    }
    res.json(logs);
  });

  app.post("/api/keys/generate", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const data = generateKeySchema.parse(req.body);
      const isOwner = user.level === 1;
      const roleName = isOwner ? "Owner" : user.level === 2 ? "Admin" : "Reseller";

      if (user.level === 3 && data.maxDevices > 2) {
        return res.status(400).json({ message: "Reseller accounts are limited to 2 devices per key." });
      }
      if (user.level === 3 && data.customInput === "custom") {
        return res.status(400).json({ message: "Custom key names are not available for Reseller accounts." });
      }

      if (!isOwner) {
        const deviceCap = user.level === 3 ? 2 : Math.min(user.maxDevicesLimit ?? 1000, 1000);
        if (data.maxDevices > deviceCap) {
          return res.status(400).json({
            message: `Max devices exceeded. Your account allows up to ${deviceCap} devices per key.`,
          });
        }
      }

      const gameRecord = await storage.getGame(data.gameId);
      if (!gameRecord) return res.status(400).json({ message: "Game not found." });
      if (gameRecord.isActive !== 1) return res.status(400).json({ message: "Game is not active." });

      const gameDurs = await storage.getActiveGameDurations(data.gameId);
      const durEntry = gameDurs.find(d => d.durationHours === data.duration);
      if (!durEntry) {
        return res.status(400).json({ message: "Invalid duration for this game." });
      }

      const cost = durEntry.price * data.maxDevices;

      if (!isOwner && cost > user.saldo) {
        return res.status(400).json({
          message: `Insufficient balance. This key costs ${cost.toLocaleString()} but your balance is ${user.saldo.toLocaleString()}.`,
        });
      }

      let license: string;
      if (data.customInput === "custom" && data.customLicense) {
        if (data.customLicense.length < 4 || data.customLicense.length > 19) {
          return res.status(400).json({ message: "Custom key must be 4-19 characters." });
        }
        const existingKey = await storage.getKeyByUserKeyAndGame(data.customLicense, gameRecord.name);
        if (existingKey) return res.status(400).json({ message: "Key already exists." });
        license = data.customLicense;
      } else {
        license = generateKeyLicense(data.duration);
      }

      const newKey = await storage.createKey({
        game: gameRecord.name,
        gameId: data.gameId,
        userKey: license,
        duration: data.duration,
        maxDevices: data.maxDevices,
        registrator: user.username,
        adminId: user.id,
        status: 1,
      } as any);

      const newBalance = isOwner ? user.saldo : user.saldo - cost;
      if (!isOwner) {
        await storage.updateUser(user.id, { saldo: newBalance });
      }

      const costLabel = isOwner ? "Free (Owner)" : cost.toLocaleString();
      const balLabel = isOwner ? "∞" : newBalance.toLocaleString();
      await storage.createHistory({
        keysId: newKey.id,
        userId: user.id,
        userDo: user.username,
        activity: "Key Generated",
        info: `[${roleName}] Generated key #${newKey.id}`,
        description: [
          `Key: ${license}`,
          `Game: ${gameRecord.name}`,
          `Duration: ${data.duration}h`,
          `Devices: ${data.maxDevices}`,
          `Type: ${data.customInput === "custom" ? "Custom" : "Random"}`,
          `Cost: ${costLabel}`,
          `Balance after: ${balLabel}`,
        ].join(". ") + ".",
      });

      emitScopedKeyEvent(wsEvent("keys:created", { keyId: newKey.id, registrator: user.username }), user.username);

      res.json({ key: newKey, cost: isOwner ? 0 : cost, balanceAfter: newBalance });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Key generation failed." });
    }
  });

  app.post("/api/keys/log-action", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const { action, keyIds } = req.body;
      if (!action || !["Key Copied", "Key Downloaded"].includes(action)) {
        return res.status(400).json({ message: "Invalid action." });
      }
      if (!Array.isArray(keyIds) || keyIds.length === 0 || keyIds.length > 100) {
        return res.status(400).json({ message: "Invalid key IDs." });
      }

      const isOwner = user.level === 1;
      const roleName = isOwner ? "Owner" : user.level === 2 ? "Admin" : "Reseller";

      const verifiedKeys: { id: number; userKey: string }[] = [];
      for (const kid of keyIds) {
        const k = await storage.getKey(kid);
        if (!k) continue;
        if (!isOwner && k.registrator !== user.username) continue;
        verifiedKeys.push({ id: k.id, userKey: k.userKey });
      }

      if (verifiedKeys.length === 0) {
        return res.status(400).json({ message: "No valid keys found." });
      }

      const keysLabel = verifiedKeys.length <= 3
        ? verifiedKeys.map(k => k.userKey).join(", ")
        : `${verifiedKeys.length} key(s)`;

      for (const vk of verifiedKeys) {
        await storage.createHistory({
          keysId: vk.id,
          userId: user.id,
          userDo: user.username,
          activity: action,
          info: `[${roleName}] ${action}: ${vk.userKey}`,
          description: `${action} by ${user.username}. Key: ${vk.userKey}.`,
        });
      }

      res.json({ success: true, logged: verifiedKeys.length });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Log failed." });
    }
  });

  app.patch("/api/keys/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const keyId = parseInt(req.params.id as string);
      const key = await storage.getKey(keyId);
      if (!key) return res.status(404).json({ message: "Key not found" });

      if (user.level !== 1 && key.registrator !== user.username) {
        return res.status(403).json({ message: "Access denied" });
      }

      const isOwner = user.level === 1;
      const isAdmin = user.level === 2;

      if (!isOwner) {
        const editLimit = user.maxKeyEdits ?? 3;
        if (key.editCount >= editLimit) {
          return res.status(403).json({
            message: `Edit limit reached (${key.editCount}/${editLimit}). Contact Owner to increase your limit.`,
          });
        }
      }

      const changes: string[] = [];
      let updates: any = {};

      if (isOwner) {
        const { game, userKey, duration, maxDevices, status, registrator } = req.body;
        if (game !== undefined && game !== key.game) { changes.push(`game: "${key.game}" → "${game}"`); updates.game = game; }
        if (userKey !== undefined && userKey !== key.userKey) { changes.push(`key: "${key.userKey}" → "${userKey}"`); updates.userKey = userKey; }
        if (duration !== undefined && duration !== key.duration) { changes.push(`duration: ${key.duration}h → ${duration}h`); updates.duration = duration; }
        if (maxDevices !== undefined && maxDevices !== key.maxDevices) { changes.push(`maxDevices: ${key.maxDevices} → ${maxDevices}`); updates.maxDevices = maxDevices; }
        if (status !== undefined && status !== key.status) { changes.push(`status: ${key.status === 1 ? "Active" : "Block"} → ${status === 1 ? "Active" : "Block"}`); updates.status = status; }
        if (registrator !== undefined && registrator !== key.registrator) {
          const targetUser = await storage.getUserByUsername(registrator);
          if (!targetUser) {
            return res.status(400).json({ message: `User "${registrator}" does not exist.` });
          }
          changes.push(`registrator: "${key.registrator || "none"}" → "${registrator}"`);
          updates.registrator = registrator;
        }
      } else if (isAdmin) {
        const { userKey, duration, maxDevices, status } = req.body;
        if (userKey !== undefined && userKey !== key.userKey) { changes.push(`key: "${key.userKey}" → "${userKey}"`); updates.userKey = userKey; }
        if (duration !== undefined && duration !== key.duration) {
          if (user.expirationDate) {
            const userExpiry = new Date(user.expirationDate);
            const now = new Date();
            const maxHours = Math.floor((userExpiry.getTime() - now.getTime()) / 3600000);
            if (maxHours <= 0) {
              return res.status(403).json({ message: "Your account has expired. Cannot edit key duration." });
            }
            if (duration > maxHours) {
              return res.status(403).json({
                message: `Duration ${duration}h exceeds your account validity (${maxHours}h remaining). Max allowed: ${maxHours}h.`,
              });
            }
          }
          changes.push(`duration: ${key.duration}h → ${duration}h`);
          updates.duration = duration;
        }
        if (maxDevices !== undefined && maxDevices !== key.maxDevices) {
          const deviceCap = Math.min(user.maxDevicesLimit ?? 1000, 1000);
          if (maxDevices > deviceCap) {
            return res.status(403).json({ message: `Max devices cannot exceed ${deviceCap} for your account.` });
          }
          changes.push(`maxDevices: ${key.maxDevices} → ${maxDevices}`);
          updates.maxDevices = maxDevices;
        }
        if (status !== undefined && status !== key.status) { changes.push(`status: ${key.status === 1 ? "Active" : "Block"} → ${status === 1 ? "Active" : "Block"}`); updates.status = status; }
      } else {
        const { status } = req.body;
        if (status !== undefined && status !== key.status) { changes.push(`status: ${key.status === 1 ? "Active" : "Block"} → ${status === 1 ? "Active" : "Block"}`); updates.status = status; }
      }

      if (Object.keys(updates).length === 0) {
        return res.json(key);
      }

      if (!isOwner) {
        updates.editCount = (key.editCount || 0) + 1;
      }

      const updated = await storage.updateKey(keyId, updates);

      const roleName = isOwner ? "Owner" : isAdmin ? "Admin" : "Reseller";
      const editNum = isOwner ? "∞ (unlimited)" : `${updates.editCount}/${user.maxKeyEdits ?? 3}`;
      await storage.createHistory({
        keysId: keyId,
        userId: user.id,
        userDo: user.username,
        activity: "Key Edit",
        info: `[${roleName}] Edited key #${keyId}`,
        description: `Changes: ${changes.join("; ")}. Edit count: ${editNum}.`,
      });

      emitScopedKeyEvent(wsEvent("keys:updated", { keyId }), key.registrator || user.username);

      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Update failed." });
    }
  });

  app.post("/api/keys/:id/extend", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const keyId = parseInt(req.params.id as string);
      const key = await storage.getKey(keyId);
      if (!key) return res.status(404).json({ message: "Key not found" });

      if (user.level !== 1 && key.registrator !== user.username) {
        return res.status(403).json({ message: "Permission denied" });
      }

      const isOwner = user.level === 1;
      const roleName = isOwner ? "Owner" : user.level === 2 ? "Admin" : "Reseller";

      if (!isOwner) {
        const extendLimit = user.maxKeyExtends ?? 5;
        const currentExtendCount = key.extendCount ?? 0;
        if (currentExtendCount >= extendLimit) {
          return res.status(403).json({
            message: `Extend limit reached (${currentExtendCount}/${extendLimit}). Contact Owner for more.`,
          });
        }
      }

      const { duration } = req.body;
      if (!duration || typeof duration !== "string") {
        return res.status(400).json({ message: "Missing duration parameter." });
      }

      const durationUpper = duration.toUpperCase().trim();
      const match = durationUpper.match(/^(\d+)([DH])$/);
      if (!match) {
        return res.status(400).json({ message: "Invalid duration format. Use e.g. 30D or 12H." });
      }

      const value = parseInt(match[1]);
      const type = match[2];
      const addHours = type === "D" ? value * 24 : value;
      const extensionLabel = type === "D" ? `${value} Day${value > 1 ? "s" : ""}` : `${value} Hour${value > 1 ? "s" : ""}`;

      if (addHours <= 0) {
        return res.status(400).json({ message: "Invalid duration value." });
      }

      const previousExpiry = key.expiredDate;
      const previousDuration = key.duration;
      const newDuration = key.duration + addHours;

      let newExpiry: Date | null = null;

      if (!previousExpiry) {
        await storage.updateKey(key.id, {
          duration: newDuration,
          extendCount: (key.extendCount ?? 0) + (isOwner ? 0 : 1),
        });
      } else {
        const now = new Date();
        const baseTime = previousExpiry > now ? previousExpiry : now;
        newExpiry = new Date(baseTime.getTime() + addHours * 3600000);
        await storage.updateKey(key.id, {
          expiredDate: newExpiry,
          duration: newDuration,
          extendCount: (key.extendCount ?? 0) + (isOwner ? 0 : 1),
        });
      }

      const newExtendCount = (key.extendCount ?? 0) + (isOwner ? 0 : 1);
      const extendLimit = isOwner ? null : (user.maxKeyExtends ?? 5);
      const remaining = extendLimit !== null ? Math.max(0, extendLimit - newExtendCount) : null;
      const extendNum = isOwner ? "∞ (unlimited)" : `${newExtendCount}/${extendLimit}`;

      const fmtDate = (d: Date | null) => d ? d.toISOString().replace("T", " ").substring(0, 19) + " UTC" : "N/A";
      const descParts = [
        `Extension: +${extensionLabel} (+${addHours}h)`,
        `Previous expiry: ${fmtDate(previousExpiry)}`,
        `New expiry: ${fmtDate(newExpiry)}`,
        `Previous duration: ${previousDuration}h → ${newDuration}h`,
        `Extend count: ${extendNum}`,
      ];

      await storage.createHistory({
        keysId: key.id,
        userId: user.id,
        userDo: user.username,
        activity: "Key Extend",
        info: `[${roleName}] Extended key #${keyId}`,
        description: descParts.join(". ") + ".",
      });

      emitScopedKeyEvent(wsEvent("keys:extended", { keyId }), key.registrator || user.username);

      res.json({
        success: true,
        newExpiry: newExpiry?.toISOString() || null,
        previousExpiry: previousExpiry?.toISOString() || null,
        totalDuration: newDuration,
        previousDuration,
        addedHours: addHours,
        extensionLabel,
        extendCount: newExtendCount,
        extendLimit: extendLimit,
        remaining: remaining,
      });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Extend failed." });
    }
  });

  app.delete("/api/keys/:id", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const key = await storage.getKey(parseInt(req.params.id as string));
    if (!key) return res.status(404).json({ message: "Key not found" });
    if (user.level !== 1 && key.registrator !== user.username) {
      return res.status(403).json({ message: "Access denied" });
    }
    await storage.deleteKey(key.id);

    emitScopedKeyEvent(wsEvent("keys:deleted", { keyId: key.id }), key.registrator || user.username);

    res.json({ message: "Key deleted." });
  });

  app.post("/api/keys/bulk-delete", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "Invalid ids." });

    if (user.level !== 1) {
      for (const id of ids) {
        const key = await storage.getKey(id);
        if (!key || key.registrator !== user.username) {
          return res.status(403).json({ message: "Access denied: you can only delete your own keys." });
        }
      }
    }

    await storage.deleteKeys(ids);

    emitToAll(wsEvent("keys:bulk-deleted", { count: ids.length }));

    res.json({ message: `${ids.length} keys deleted.` });
  });

  app.post("/api/keys/bulk-reset", requireLevel(1), async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "Invalid ids." });

    const count = await storage.resetKeysDevices(ids);
    emitToAll(wsEvent("keys:bulk-reset", { count }));
    res.json({ message: `${count} keys reset.` });
  });

  app.post("/api/keys/delete-expired", requireLevel(1), async (req, res) => {
    const count = await storage.deleteExpiredKeys();
    emitToAll(wsEvent("keys:bulk-deleted", { count }));
    res.json({ message: `${count} expired keys deleted.` });
  });

  app.post("/api/keys/delete-unactivated", requireLevel(1), async (req, res) => {
    const count = await storage.deleteUnactivatedKeys();
    emitToAll(wsEvent("keys:bulk-deleted", { count }));
    res.json({ message: `${count} unactivated keys deleted.` });
  });

  app.post("/api/keys/:id/reset-device", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const key = await storage.getKey(parseInt(req.params.id as string));
    if (!key) return res.status(404).json({ message: "Key not found" });
    if (user.level !== 1 && key.registrator !== user.username) {
      return res.status(403).json({ message: "Access denied" });
    }

    const devicesArray = key.devices ? key.devices.split(",").filter(Boolean) : [];
    if (devicesArray.length === 0) {
      return res.status(400).json({ message: "No devices registered." });
    }

    const resetCount = key.keyResetTime && /^\d+$/.test(key.keyResetTime)
      ? parseInt(key.keyResetTime)
      : 0;

    const isOwner = user.level === 1;
    const resetLimit = isOwner ? null : (user.maxKeyResets ?? 3);

    if (!isOwner && resetLimit !== null && resetCount >= resetLimit) {
      return res.status(403).json({
        message: `Reset limit reached (${resetCount}/${resetLimit}). Contact Owner for more.`,
      });
    }

    const newCount = resetCount + (isOwner ? 0 : 1);
    const token = crypto.randomBytes(16).toString("hex");

    await storage.updateKey(key.id, {
      devices: null,
      keyResetTime: String(newCount),
      keyResetToken: token,
    } as any);

    const roleName = isOwner ? "Owner" : user.level === 2 ? "Admin" : "Reseller";
    const remaining = resetLimit !== null ? Math.max(0, resetLimit - newCount) : null;
    const resetNum = isOwner ? "∞ (unlimited)" : `${newCount}/${resetLimit}`;

    const devicesSummary = devicesArray.length <= 5
      ? devicesArray.join(", ")
      : `${devicesArray.slice(0, 5).join(", ")} (+${devicesArray.length - 5} more)`;

    await storage.createHistory({
      keysId: key.id,
      userId: user.id,
      userDo: user.username,
      activity: "Key Reset",
      info: `[${roleName}] Reset devices on key #${key.id}`,
      description: [
        `Devices removed: ${devicesArray.length}`,
        `Previous devices: ${devicesSummary}`,
        `Reset count: ${resetNum}`,
      ].join(". ") + ".",
    });

    emitScopedKeyEvent(wsEvent("keys:device-reset", { keyId: key.id }), key.registrator || user.username);

    res.json({
      message: "Devices reset successfully.",
      devicesRemoved: devicesArray.length,
      resetUsed: newCount,
      resetLimit: resetLimit,
      resetLeft: remaining,
      keyUserKey: key.userKey,
    });
  });

  app.get("/api/users/usernames", requireLevel(1), async (req, res) => {
    const allUsers = await storage.getAllUsers();
    res.json(allUsers.map(u => ({ username: u.username, level: u.level })));
  });

  app.get("/api/users", requireLevel(2), async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    let userList: any[];
    if (user.level === 1) {
      userList = await storage.getAllUsers();
    } else {
      userList = await storage.getUsersByUplink(user.username);
    }

    res.json(userList.map(u => {
      const { password, ...safe } = u;
      return { ...safe, levelName: getLevelName(u.level) };
    }));
  });

  app.get("/api/users/:id", requireLevel(2), async (req, res) => {
    const me = await storage.getUser(req.session.userId!);
    if (!me) return res.status(401).json({ message: "Unauthorized" });
    const target = await storage.getUser(parseInt(req.params.id as string));
    if (!target) return res.status(404).json({ message: "User not found" });

    if (me.level !== 1 && target.id !== me.id && target.uplink !== me.username) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { password, ...safe } = target;
    res.json({ ...safe, levelName: getLevelName(target.level) });
  });

  app.post("/api/users/:id/approve", requireLevel(2), async (req, res) => {
    const me = await storage.getUser(req.session.userId!);
    if (!me) return res.status(401).json({ message: "Unauthorized" });
    const target = await storage.getUser(parseInt(req.params.id as string));
    if (!target) return res.status(404).json({ message: "User not found" });
    if (me.level === 2 && target.uplink !== me.username) {
      return res.status(403).json({ message: "Can only approve users you referred." });
    }
    await storage.updateUser(target.id, { status: 1 });

    emitScopedUserEvent(wsEvent("users:approved", { userId: target.id }), target.uplink || undefined);

    res.json({ message: "User approved." });
  });

  app.post("/api/users/:id/decline", requireLevel(2), async (req, res) => {
    const me = await storage.getUser(req.session.userId!);
    if (!me) return res.status(401).json({ message: "Unauthorized" });
    const target = await storage.getUser(parseInt(req.params.id as string));
    if (!target) return res.status(404).json({ message: "User not found" });
    if (me.level === 2 && target.uplink !== me.username) {
      return res.status(403).json({ message: "Can only decline users you referred." });
    }
    await storage.updateUser(target.id, { status: 2 });
    await storage.blockKeysByRegistrator(target.username);

    emitScopedUserEvent(wsEvent("users:declined", { userId: target.id }), target.uplink || undefined);

    res.json({ message: "User declined." });
  });

  app.patch("/api/users/:id", requireLevel(2), async (req, res) => {
    const me = await storage.getUser(req.session.userId!);
    if (!me) return res.status(401).json({ message: "Unauthorized" });
    const target = await storage.getUser(parseInt(req.params.id as string));
    if (!target) return res.status(404).json({ message: "User not found" });

    if (me.level === 2) {
      if (target.level === 1) return res.status(403).json({ message: "Cannot edit owner." });
      if (target.uplink !== me.username) return res.status(403).json({ message: "Can only edit users you referred." });
    }

    const { level, status, saldo, expirationDate, fullname, maxKeyEdits, maxDevicesLimit, maxKeyExtends, maxKeyResets } = req.body;
    const updates: any = {};
    if (level !== undefined) updates.level = level;
    if (status !== undefined) {
      updates.status = status;
      if (status === 2) {
        await storage.blockKeysByRegistrator(target.username);
      }
    }
    if (saldo !== undefined) updates.saldo = saldo;
    if (expirationDate !== undefined) updates.expirationDate = expirationDate ? new Date(expirationDate) : null;
    if (fullname !== undefined) updates.fullname = fullname;
    if (me.level === 1) {
      if (maxKeyEdits !== undefined) updates.maxKeyEdits = Math.max(1, parseInt(maxKeyEdits) || 3);
      if (maxDevicesLimit !== undefined) updates.maxDevicesLimit = Math.max(1, parseInt(maxDevicesLimit) || 1000);
      if (maxKeyExtends !== undefined) updates.maxKeyExtends = Math.max(1, parseInt(maxKeyExtends) || 5);
      if (maxKeyResets !== undefined) updates.maxKeyResets = Math.max(1, parseInt(maxKeyResets) || 3);
    }

    const updated = await storage.updateUser(target.id, updates);
    if (updated) {
      const { password, ...safe } = updated;

      emitScopedUserEvent(wsEvent("users:updated", { userId: target.id }), target.uplink || undefined);
      if (saldo !== undefined) {
        emitToUser(target.id, wsEvent("balance:topup", { userId: target.id }));
      }

      res.json({ ...safe, levelName: getLevelName(updated.level) });
    } else {
      res.status(500).json({ message: "Update failed." });
    }
  });

  app.delete("/api/users/:id", requireLevel(2), async (req, res) => {
    const me = await storage.getUser(req.session.userId!);
    if (!me) return res.status(401).json({ message: "Unauthorized" });
    const targetId = parseInt(req.params.id as string);
    if (targetId === req.session.userId) return res.status(400).json({ message: "Cannot delete yourself." });

    const target = await storage.getUser(targetId);
    if (!target) return res.status(404).json({ message: "User not found" });

    if (me.level === 2) {
      if (target.level !== 3 || target.uplink !== me.username) {
        return res.status(403).json({ message: "Admin can only delete referred Resellers." });
      }
    }

    await storage.deleteUser(targetId);

    emitScopedUserEvent(wsEvent("users:deleted", { userId: targetId }), target.uplink || undefined);

    res.json({ message: "User deleted." });
  });

  app.post("/api/users/:id/reset-device", requireLevel(2), async (req, res) => {
    const me = await storage.getUser(req.session.userId!);
    if (!me) return res.status(401).json({ message: "Unauthorized" });
    const target = await storage.getUser(parseInt(req.params.id as string));
    if (!target) return res.status(404).json({ message: "User not found" });

    if (me.level === 2) {
      if (target.level === 1) return res.status(403).json({ message: "Cannot reset owner device." });
      if (target.uplink !== me.username) return res.status(403).json({ message: "Can only reset devices for users you referred." });
    }

    await storage.updateUser(target.id, { deviceId: null } as any);

    emitScopedUserEvent(wsEvent("users:device-reset", { userId: target.id }), target.uplink || undefined);

    res.json({ message: "User device reset." });
  });

  app.post("/api/users/balance", requireLevel(2), async (req, res) => {
    const { userId, amount, note } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid input." });
    }
    const target = await storage.getUser(userId);
    if (!target) return res.status(404).json({ message: "User not found." });

    await storage.updateUser(userId, { saldo: target.saldo + amount });
    await storage.createHistory({
      userId,
      activity: "Balance Topup",
      description: `Added saldo: +${amount}${note ? ` (${note})` : ""}`,
    });

    emitToUser(userId, wsEvent("balance:topup", { userId, amount }));
    emitToAdminsAndAbove(wsEvent("balance:topup", { userId, amount }));

    res.json({ message: "Balance added successfully." });
  });

  app.patch("/api/profile/username", requireAuth, async (req, res) => {
    const { newUsername } = req.body;
    if (!newUsername || !/^[A-Za-z0-9._-]{3,32}$/.test(newUsername)) {
      return res.status(400).json({ message: "Use 3-32 chars: letters, numbers, dot, underscore, hyphen." });
    }
    const existing = await storage.getUserByUsername(newUsername);
    if (existing && existing.id !== req.session.userId) {
      return res.status(400).json({ message: "Username already taken." });
    }
    const updated = await storage.updateUser(req.session.userId!, { username: newUsername });
    if (updated) {
      req.session.username = newUsername;
      res.json({ message: "Username updated.", username: newUsername });
    } else {
      res.status(500).json({ message: "Update failed." });
    }
  });

  app.patch("/api/profile/password", requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new password are required." });
    }
    if (newPassword.length < 6 || newPassword.length > 45) {
      return res.status(400).json({ message: "New password must be 6-45 characters." });
    }
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!verifyPassword(currentPassword, user.password)) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }
    await storage.updateUser(user.id, { password: hashPassword(newPassword) });
    res.json({ message: "Password updated." });
  });

  app.patch("/api/profile/telegram", requireAuth, async (req, res) => {
    const { telegramChatId } = req.body;
    if (telegramChatId === "" || telegramChatId === null) {
      await storage.updateUser(req.session.userId!, { telegramChatId: null, twofaEnabled: 0 } as any);
      return res.json({ message: "Telegram Chat ID removed and 2FA disabled." });
    }
    if (!/^\d{5,20}$/.test(telegramChatId)) {
      return res.status(400).json({ message: "Invalid Telegram Chat ID." });
    }
    await storage.updateUser(req.session.userId!, { telegramChatId });
    res.json({ message: "Telegram Chat ID updated." });
  });

  app.patch("/api/profile/2fa", requireAuth, async (req, res) => {
    const { enabled } = req.body;
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (enabled && !user.telegramChatId) {
      return res.status(400).json({ message: "Add Telegram Chat ID first." });
    }
    await storage.updateUser(user.id, { twofaEnabled: enabled ? 1 : 0 });
    res.json({ message: enabled ? "2FA enabled." : "2FA disabled." });
  });

  app.get("/api/referrals", requireLevel(2), async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    let codes;
    if (user.level === 1) {
      codes = await storage.getReferralCodes();
    } else {
      codes = await storage.getReferralCodesByCreator(user.username);
    }
    res.json(codes);
  });

  app.post("/api/referrals", requireLevel(2), async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const { level, setSaldo, accExpiration, maxKeyEdits, maxDevicesLimit, maxKeyExtends, maxKeyResets } = req.body;

    const refLevel = level || 3;
    if (user.level === 2 && refLevel !== 3) {
      return res.status(400).json({ message: "Admin can only create Reseller referral codes." });
    }

    const code = crypto.randomBytes(6).toString("hex");
    const ref = await storage.createReferral({
      code,
      referral: code,
      level: refLevel,
      setSaldo: setSaldo || 0,
      createdBy: user.username,
      accExpiration: accExpiration || undefined,
      maxKeyEdits: maxKeyEdits !== undefined ? Math.max(1, parseInt(maxKeyEdits) || 3) : 3,
      maxDevicesLimit: maxDevicesLimit !== undefined ? Math.max(1, parseInt(maxDevicesLimit) || 1000) : 1000,
      maxKeyExtends: maxKeyExtends !== undefined ? Math.max(1, parseInt(maxKeyExtends) || 5) : 5,
      maxKeyResets: maxKeyResets !== undefined ? Math.max(1, parseInt(maxKeyResets) || 3) : 3,
    } as any);

    emitScopedUserEvent(wsEvent("referrals:created", { refId: ref.id }), user.username);

    res.json(ref);
  });

  app.get("/api/prices", requireAuth, async (req, res) => {
    const prices = await storage.getActivePrices();
    res.json(prices);
  });

  app.get("/api/prices/all", requireLevel(1), async (req, res) => {
    const prices = await storage.getPrices();
    res.json(prices);
  });

  app.post("/api/prices", requireLevel(1), async (req, res) => {
    const { duration, price } = req.body;
    if (!duration || duration <= 0 || !price || price <= 0) {
      return res.status(400).json({ message: "Invalid duration or price." });
    }
    await storage.upsertPrice(duration, price);
    res.json({ message: "Price saved." });
  });

  app.delete("/api/prices/:duration", requireLevel(1), async (req, res) => {
    await storage.deactivatePrice(parseInt(req.params.duration as string));
    res.json({ message: "Duration removed." });
  });

  app.get("/api/settings/features", requireLevel(1), async (req, res) => {
    const features = await storage.getFeatures();
    res.json(features || {});
  });

  app.patch("/api/settings/features", requireLevel(1), async (req, res) => {
    await storage.updateFeatures(req.body);
    emitToOwners(wsEvent("settings:updated", { section: "features" }));
    res.json({ message: "Features updated." });
  });

  app.get("/api/settings/site-name", async (req, res) => {
    const name = await storage.getSiteName();
    res.json({ siteName: name });
  });

  app.patch("/api/settings/site-name", requireAuth, requireLevel(1), async (req, res) => {
    const { siteName } = req.body;
    if (!siteName || typeof siteName !== "string" || siteName.trim().length === 0) {
      return res.status(400).json({ message: "Site name is required." });
    }
    if (siteName.trim().length > 50) {
      return res.status(400).json({ message: "Site name must be 50 characters or less." });
    }
    await storage.updateSiteName(siteName.trim());
    emitToAll(wsEvent("settings:updated", { section: "site-name" }));
    res.json({ message: "Site name updated." });
  });

  app.get("/api/settings/modname", requireLevel(1), async (req, res) => {
    const name = await storage.getModname();
    res.json({ modname: name });
  });

  app.patch("/api/settings/modname", requireLevel(1), async (req, res) => {
    await storage.updateModname(req.body.modname || "");
    emitToOwners(wsEvent("settings:updated", { section: "modname" }));
    res.json({ message: "Mod name updated." });
  });

  app.get("/api/settings/ftext", requireLevel(1), async (req, res) => {
    const data = await storage.getFtext();
    res.json(data || {});
  });

  app.patch("/api/settings/ftext", requireLevel(1), async (req, res) => {
    await storage.updateFtext(req.body);
    emitToOwners(wsEvent("settings:updated", { section: "ftext" }));
    res.json({ message: "Text updated." });
  });

  app.get("/api/settings/maintenance", requireLevel(1), async (req, res) => {
    const data = await storage.getMaintenanceStatus();
    res.json(data || { status: "off", myinput: "" });
  });

  app.patch("/api/settings/maintenance", requireLevel(1), async (req, res) => {
    const { status, myinput } = req.body;
    await storage.updateMaintenance(status, myinput);
    emitToOwners(wsEvent("settings:updated", { section: "maintenance" }));
    res.json({ message: "Maintenance status updated." });
  });

  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const stats = user.level === 1
      ? await storage.getDashboardStats()
      : await storage.getDashboardStatsByUser(user.username);

    const cookieMaxAge = req.session.cookie?.maxAge ?? 0;
    const sessionExpiry = cookieMaxAge > 0 ? Date.now() + cookieMaxAge : null;

    res.json({
      ...stats,
      saldo: user.saldo,
      level: user.level,
      levelName: getLevelName(user.level),
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt,
      sessionExpiresAt: sessionExpiry,
    });
  });

  app.get("/api/games", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const gameList = user.level === 1
      ? await storage.getAllGames()
      : await storage.getActiveGames();

    const enriched = await Promise.all(gameList.map(async (g) => ({
      ...g,
      durationCount: await storage.getGameDurationCount(g.id),
    })));
    res.json(enriched);
  });

  app.get("/api/games/active", requireAuth, async (req, res) => {
    const activeGames = await storage.getActiveGames();
    const counts = await storage.getKeyCountsPerGame();
    const countMap = new Map(counts.map(c => [c.gameId, c.count]));
    const enriched = activeGames.map(g => ({ ...g, keyCount: countMap.get(g.id) ?? 0 }));
    res.json(enriched);
  });

  app.get("/api/games/:id", requireAuth, async (req, res) => {
    const game = await storage.getGame(parseInt(req.params.id as string));
    if (!game) return res.status(404).json({ message: "Game not found" });
    res.json(game);
  });

  app.post("/api/games", requireAuth, requireLevel(1), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const data = insertGameSchema.parse(req.body);
      const existingName = await storage.getGameByName(data.name);
      if (existingName) return res.status(400).json({ message: "Game name already exists." });
      const existingSlug = await storage.getGameBySlug(data.slug);
      if (existingSlug) return res.status(400).json({ message: "Game slug already exists." });
      const game = await storage.createGame(data as any);
      await storage.createHistory({
        userId: user.id,
        userDo: user.username,
        activity: "game_create",
        description: `Created game: ${data.name} (${data.slug})`,
      });

      emitToAll(wsEvent("games:created", { gameId: game.id }));

      res.json(game);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to create game" });
    }
  });

  app.patch("/api/games/:id", requireAuth, requireLevel(1), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const game = await storage.getGame(parseInt(req.params.id as string));
      if (!game) return res.status(404).json({ message: "Game not found" });
      const { name, slug, displayName, description, isActive } = req.body;
      const updates: any = {};
      if (name !== undefined) {
        const existing = await storage.getGameByName(name);
        if (existing && existing.id !== game.id) return res.status(400).json({ message: "Game name already exists." });
        updates.name = name;
      }
      if (slug !== undefined) {
        const existing = await storage.getGameBySlug(slug);
        if (existing && existing.id !== game.id) return res.status(400).json({ message: "Game slug already exists." });
        updates.slug = slug;
      }
      if (displayName !== undefined) updates.displayName = displayName;
      if (description !== undefined) updates.description = description;
      if (isActive !== undefined) updates.isActive = isActive;
      const updated = await storage.updateGame(game.id, updates);
      await storage.createHistory({
        userId: user.id,
        userDo: user.username,
        activity: "game_update",
        description: `Updated game: ${game.name} → ${JSON.stringify(updates)}`,
      });

      emitToAll(wsEvent("games:updated", { gameId: game.id }));

      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to update game" });
    }
  });

  app.delete("/api/games/:id", requireAuth, requireLevel(1), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const game = await storage.getGame(parseInt(req.params.id as string));
      if (!game) return res.status(404).json({ message: "Game not found" });
      const keyCount = await storage.getKeyCountByGameId(game.id);
      if (keyCount > 0) {
        return res.status(400).json({ message: `Cannot delete game with ${keyCount} existing keys. Disable it instead.` });
      }
      await storage.deleteGame(game.id);
      await storage.createHistory({
        userId: user.id,
        userDo: user.username,
        activity: "game_delete",
        description: `Deleted game: ${game.name} (${game.slug})`,
      });

      emitToAll(wsEvent("games:deleted", { gameId: game.id }));

      res.json({ message: "Game deleted" });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to delete game" });
    }
  });

  app.get("/api/games/:id/durations", requireAuth, async (req, res) => {
    const gameId = parseInt(req.params.id as string);
    const game = await storage.getGame(gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });
    const user = await storage.getUser(req.session.userId!);
    if (user?.level === 1) {
      res.json(await storage.getGameDurations(gameId));
    } else {
      res.json(await storage.getActiveGameDurations(gameId));
    }
  });

  app.post("/api/games/:id/durations", requireAuth, requireLevel(1), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const gameId = parseInt(req.params.id as string);
      const game = await storage.getGame(gameId);
      if (!game) return res.status(404).json({ message: "Game not found" });
      const data = insertGameDurationSchema.parse({ ...req.body, gameId });
      const dur = await storage.createGameDuration(data as any);
      await storage.createHistory({
        userId: user.id,
        userDo: user.username,
        activity: "game_duration_create",
        description: `Added duration ${data.label} (${data.durationHours}h, ₹${data.price}) to game ${game.name}`,
      });

      emitToAll(wsEvent("durations:created", { gameId, durationId: dur.id }));

      res.json(dur);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to create duration" });
    }
  });

  app.patch("/api/games/:gameId/durations/:id", requireAuth, requireLevel(1), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const dur = await storage.getGameDuration(parseInt(req.params.id as string));
      if (!dur) return res.status(404).json({ message: "Duration not found" });
      if (dur.gameId !== parseInt(req.params.gameId as string)) return res.status(400).json({ message: "Duration does not belong to this game" });
      const { durationHours, label, price, isActive } = req.body;
      const updates: any = {};
      if (durationHours !== undefined) updates.durationHours = durationHours;
      if (label !== undefined) updates.label = label;
      if (price !== undefined) updates.price = price;
      if (isActive !== undefined) updates.isActive = isActive;
      const updated = await storage.updateGameDuration(dur.id, updates);

      emitToAll(wsEvent("durations:updated", { gameId: dur.gameId, durationId: dur.id }));

      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to update duration" });
    }
  });

  app.delete("/api/games/:gameId/durations/:id", requireAuth, requireLevel(1), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const dur = await storage.getGameDuration(parseInt(req.params.id as string));
      if (!dur) return res.status(404).json({ message: "Duration not found" });
      if (dur.gameId !== parseInt(req.params.gameId as string)) return res.status(400).json({ message: "Duration does not belong to this game" });
      await storage.deleteGameDuration(dur.id);

      emitToAll(wsEvent("durations:deleted", { gameId: dur.gameId, durationId: dur.id }));

      res.json({ message: "Duration deleted" });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to delete duration" });
    }
  });

  app.get("/connect", (_req, res) => {
    res.json({ status: false, reason: "Use POST" });
  });

  app.post("/connect", async (req, res) => {
    try {
      const maintenance = await storage.getMaintenanceStatus();
      if (maintenance && maintenance.status === "on") {
        return res.json({ status: false, reason: maintenance.myinput || "Maintenance Mode" });
      }

      const body = req.body || {};
      const game = body.game;
      const user_key = body.user_key;
      const serial = body.serial;
      if (!game || !user_key || !serial) {
        return res.json({ status: false, reason: "INVALID PARAMETER" });
      }

      const gameRecord = await storage.getGameByName(game);
      if (!gameRecord) return res.json({ status: false, reason: "GAME NOT FOUND" });
      if (gameRecord.isActive !== 1) return res.json({ status: false, reason: "GAME INACTIVE" });

      const findKey = await storage.getKeyByUserKeyAndGame(user_key, game);
      if (!findKey) return res.json({ status: false, reason: "USER OR GAME NOT REGISTERED" });
      if (findKey.status !== 1) return res.json({ status: false, reason: "USER BLOCKED" });

      let expired = findKey.expiredDate;
      if (!expired) {
        expired = new Date(Date.now() + findKey.duration * 60 * 60 * 1000);
        await storage.updateKey(findKey.id, { expiredDate: expired });
      }

      if (new Date() > expired) {
        return res.json({ status: false, reason: "EXPIRED KEY" });
      }

      const devicesArray = findKey.devices ? findKey.devices.split(",").filter(Boolean) : [];
      if (!devicesArray.includes(serial)) {
        if (devicesArray.length >= findKey.maxDevices) {
          return res.json({ status: false, reason: "MAX DEVICE REACHED" });
        }
        devicesArray.push(serial);
        await storage.updateKey(findKey.id, { devices: devicesArray.join(",") });
      }

      const featureData = await storage.getFeatures();
      const modData = await storage.getModname();
      const textData = await storage.getFtext();

      const connectCfg = await storage.getConnectConfig();
      const activeSecret = connectCfg?.activeSecret || BOOTSTRAP_SECRET;
      const real = `${game}-${user_key}-${serial}-${activeSecret}`;
      const token = crypto.createHash("md5").update(real).digest("hex");

      const timeLeftMs = expired.getTime() - Date.now();
      const durationLabel = findKey.duration >= 720 ? `${Math.round(findKey.duration / 720)} Month` :
                            findKey.duration >= 168 ? `${Math.round(findKey.duration / 168)} Week` :
                            findKey.duration >= 24 ? `${Math.round(findKey.duration / 24)} Day` :
                            `${findKey.duration} Hour`;

      res.json({
        status: true,
        data: {
          token,
          rng: Math.floor(Date.now() / 1000),
          EXP: expired.toISOString(),
          secret_version: connectCfg?.secretVersion || 1,
          modname: modData || "",
          mod_status: textData?._status || "",
          credit: textData?._ftext || "",
          ESP: featureData?.ESP || "off",
          Item: featureData?.Item || "off",
          AIM: featureData?.AIM || "off",
          SilentAim: featureData?.SilentAim || "off",
          BulletTrack: featureData?.BulletTrack || "off",
          Floating: featureData?.Floating || "off",
          Memory: featureData?.Memory || "off",
          Setting: featureData?.Setting || "off",
          device: findKey.maxDevices,
          game: gameRecord.name,
          gameDisplayName: gameRecord.displayName,
          keyStatus: findKey.status === 1 ? "active" : "blocked",
          durationLabel,
          expiresAt: expired.toISOString(),
          timeLeftMs,
          timeLeft: timeLeftMs > 0 ? `${Math.floor(timeLeftMs / 3600000)}h ${Math.floor((timeLeftMs % 3600000) / 60000)}m` : "Expired",
          maxDevices: findKey.maxDevices,
          usedDevices: devicesArray.length,
        },
      });
    } catch (e: any) {
      res.json({ status: false, reason: "INTERNAL ERROR" });
    }
  });

  app.get("/api/settings/session", requireAuth, requireLevel(1), async (req, res) => {
    const settings = await storage.getSessionSettings();
    const envNormal = getEnvNormalTtl();
    const envRemember = getEnvRememberMeTtl();
    res.json({
      normalTtl: settings?.normalTtl || envNormal,
      rememberMeTtl: settings?.rememberMeTtl || envRemember,
      envNormalTtl: envNormal,
      envRememberMeTtl: envRemember,
      isCustom: !!settings,
      changedBy: settings?.changedBy || null,
      changedAt: settings?.changedAt || null,
    });
  });

  app.patch("/api/settings/session", requireAuth, requireLevel(1), async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const { normalTtl, rememberMeTtl } = req.body;
    if (!normalTtl || !rememberMeTtl) {
      return res.status(400).json({ message: "Both normalTtl and rememberMeTtl are required." });
    }
    if (!isValidTtlFormat(normalTtl)) {
      return res.status(400).json({ message: "Invalid normal TTL format. Use format like: 30m, 1h, 24h, 7d" });
    }
    if (!isValidTtlFormat(rememberMeTtl)) {
      return res.status(400).json({ message: "Invalid remember-me TTL format. Use format like: 30m, 1h, 24h, 7d" });
    }
    const oldSettings = await storage.getSessionSettings();
    const oldNormal = oldSettings?.normalTtl || getEnvNormalTtl();
    const oldRemember = oldSettings?.rememberMeTtl || getEnvRememberMeTtl();
    await storage.upsertSessionSettings({
      normalTtl: normalTtl.trim(),
      rememberMeTtl: rememberMeTtl.trim(),
      changedBy: user.username,
    });
    await storage.createHistory({
      userId: user.id,
      userDo: user.username,
      activity: "session_settings",
      description: `Session TTL changed: normal ${oldNormal}->${normalTtl.trim()}, rememberMe ${oldRemember}->${rememberMeTtl.trim()}`,
    });

    emitToOwners(wsEvent("settings:updated", { section: "session" }));

    res.json({ message: "Session settings updated" });
  });

  app.post("/api/settings/session/reset", requireAuth, requireLevel(1), async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const oldSettings = await storage.getSessionSettings();
    if (oldSettings) {
      await storage.deleteSessionSettings();
      await storage.createHistory({
        userId: user.id,
        userDo: user.username,
        activity: "session_settings",
        description: `Session TTL reset to env defaults: normal=${getEnvNormalTtl()}, rememberMe=${getEnvRememberMeTtl()}`,
      });
    }

    emitToOwners(wsEvent("settings:updated", { section: "session" }));

    res.json({ message: "Session settings reset to defaults" });
  });

  app.get("/api/connect-config", requireAuth, requireLevel(1), async (req, res) => {
    const cfg = await storage.getConnectConfig();
    if (!cfg) return res.json(null);
    res.json({
      id: cfg.id,
      gameName: cfg.gameName,
      activeSecret: cfg.activeSecret,
      previousSecret: cfg.previousSecret,
      secretVersion: cfg.secretVersion,
      gracePeriodUntil: cfg.gracePeriodUntil,
      createdBy: cfg.createdBy,
      changedBy: cfg.changedBy,
      createdAt: cfg.createdAt,
      changedAt: cfg.changedAt,
    });
  });

  app.get("/api/connect-config/audit-logs", requireAuth, requireLevel(1), async (req, res) => {
    const logs = await storage.getConnectAuditLogs();
    res.json(logs);
  });

  app.patch("/api/connect-config/game", requireAuth, requireLevel(1), async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const { gameName } = req.body;
    if (!gameName || typeof gameName !== "string" || gameName.trim().length === 0) {
      return res.status(400).json({ message: "Game name is required" });
    }
    const oldCfg = await storage.getConnectConfig();
    const oldGameName = oldCfg?.gameName || "";
    await storage.upsertConnectConfig({ gameName: gameName.trim(), changedBy: user.username, changedAt: new Date() });
    await storage.createConnectAuditLog({
      actionType: "update",
      entityType: "game_name",
      oldValue: oldGameName,
      newValue: gameName.trim(),
      actorUserId: user.id,
      actorUsername: user.username,
    });
    await storage.createHistory({
      userId: user.id,
      userDo: user.username,
      activity: "connect_config",
      description: `Changed game name to "${gameName.trim()}"`,
    });

    emitToOwners(wsEvent("connect:updated", { section: "game_name" }));

    res.json({ message: "Game name updated" });
  });

  app.patch("/api/connect-config/secret", requireAuth, requireLevel(1), async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const { activeSecret } = req.body;
    if (!activeSecret || typeof activeSecret !== "string" || activeSecret.trim().length < 16) {
      return res.status(400).json({ message: "Secret must be at least 16 characters" });
    }
    const oldCfg = await storage.getConnectConfig();
    const oldMasked = oldCfg?.activeSecret
      ? (oldCfg.activeSecret.length > 8
        ? oldCfg.activeSecret.slice(0, 4) + "****" + oldCfg.activeSecret.slice(-4)
        : "****")
      : "(none)";
    const newMasked = activeSecret.trim().length > 8
      ? activeSecret.trim().slice(0, 4) + "****" + activeSecret.trim().slice(-4)
      : "****";
    await storage.upsertConnectConfig({
      activeSecret: activeSecret.trim(),
      previousSecret: null,
      gracePeriodUntil: null,
      changedBy: user.username,
      changedAt: new Date(),
    } as any);
    await storage.createConnectAuditLog({
      actionType: "update",
      entityType: "active_secret",
      oldValue: oldMasked,
      newValue: newMasked,
      actorUserId: user.id,
      actorUsername: user.username,
    });
    await storage.createHistory({
      userId: user.id,
      userDo: user.username,
      activity: "connect_config",
      description: `Updated active secret directly`,
    });

    emitToOwners(wsEvent("connect:updated", { section: "secret" }));

    res.json({ message: "Secret updated" });
  });

  app.post("/api/connect-config/rotate-secret", requireAuth, requireLevel(1), async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const { newSecret, gracePeriodMinutes, note } = req.body;
    if (!newSecret || typeof newSecret !== "string" || newSecret.trim().length < 16) {
      return res.status(400).json({ message: "Secret must be at least 16 characters" });
    }
    const grace = Math.max(0, Math.min(1440, parseInt(gracePeriodMinutes) || 60));
    const oldCfg = await storage.getConnectConfig();
    const oldMasked = oldCfg?.activeSecret
      ? (oldCfg.activeSecret.length > 8
        ? oldCfg.activeSecret.slice(0, 4) + "****" + oldCfg.activeSecret.slice(-4)
        : "****")
      : "(none)";
    const newMasked = newSecret.trim().length > 8
      ? newSecret.trim().slice(0, 4) + "****" + newSecret.trim().slice(-4)
      : "****";
    const updated = await storage.rotateConnectSecret(newSecret.trim(), user.username, grace);
    await storage.createConnectAuditLog({
      actionType: "rotate",
      entityType: "secret",
      oldValue: `v${(oldCfg?.secretVersion || 0)} — ${oldMasked}`,
      newValue: `v${updated.secretVersion} — ${newMasked}`,
      actorUserId: user.id,
      actorUsername: user.username,
      note: note || `Grace period: ${grace}min`,
    });
    await storage.createHistory({
      userId: user.id,
      userDo: user.username,
      activity: "connect_secret_rotate",
      description: `Rotated connect secret to v${updated.secretVersion}, grace period ${grace}min`,
    });

    emitToOwners(wsEvent("connect:updated", { section: "secret_rotated" }));

    res.json({ message: "Secret rotated", version: updated.secretVersion });
  });

  app.post("/api/connect-config/generate-secret", requireAuth, requireLevel(1), async (req, res) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let secret = "";
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    res.json({ secret });
  });

  app.get("/api/api-generator/config", requireAuth, requireLevel(1), async (req, res) => {
    const cfg = await storage.getApiGeneratorConfig();
    if (!cfg) return res.json(null);
    res.json(cfg);
  });

  app.put("/api/api-generator/config", requireAuth, requireLevel(1), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const {
        enabled, token, segment1, segment2, segment3, segment4, segment5,
        maxQuantity, registrator, rateLimitEnabled, rateLimitWindow, rateLimitMaxRequests,
        ipAllowlist, customDurationEnabled, customDurationMaxHours,
      } = req.body;

      const updates: any = { changedBy: user.username };
      if (enabled !== undefined) updates.enabled = enabled ? 1 : 0;
      if (token !== undefined) {
        if (typeof token !== "string" || token.trim().length < 16) {
          return res.status(400).json({ message: "Token must be at least 16 characters." });
        }
        updates.token = token.trim();
      }

      const segmentFields = { segment1, segment2, segment3, segment4, segment5 };
      const segRegex = /^[a-zA-Z0-9_-]{3,40}$/;
      const reservedPrefixes = ["api", "connect", "login", "register", "setup", "keys", "users", "profile", "settings", "games", "balance", "referrals", "prices"];
      for (const [key, val] of Object.entries(segmentFields)) {
        if (val !== undefined) {
          if (typeof val !== "string" || !segRegex.test(val)) {
            return res.status(400).json({ message: `Segment ${key.replace("segment", "")} must be 3-40 URL-safe characters (a-z, 0-9, _, -).` });
          }
          if (key === "segment1" && reservedPrefixes.includes(val.toLowerCase())) {
            return res.status(400).json({ message: `Segment 1 cannot be a reserved path like "${val}".` });
          }
          (updates as any)[key] = val;
        }
      }

      if (maxQuantity !== undefined) updates.maxQuantity = Math.max(1, Math.min(100, parseInt(maxQuantity) || 10));
      if (registrator !== undefined) {
        if (typeof registrator !== "string" || registrator.trim().length === 0 || registrator.trim().length > 100) {
          return res.status(400).json({ message: "Registrator must be 1-100 characters." });
        }
        updates.registrator = registrator.trim();
      }
      if (rateLimitEnabled !== undefined) updates.rateLimitEnabled = rateLimitEnabled ? 1 : 0;
      if (rateLimitWindow !== undefined) updates.rateLimitWindow = Math.max(1, Math.min(3600, parseInt(rateLimitWindow) || 60));
      if (rateLimitMaxRequests !== undefined) updates.rateLimitMaxRequests = Math.max(1, Math.min(1000, parseInt(rateLimitMaxRequests) || 10));
      if (ipAllowlist !== undefined) updates.ipAllowlist = ipAllowlist || null;
      if (customDurationEnabled !== undefined) updates.customDurationEnabled = customDurationEnabled ? 1 : 0;
      if (customDurationMaxHours !== undefined) updates.customDurationMaxHours = Math.max(1, Math.min(87600, parseInt(customDurationMaxHours) || 8760));

      const cfg = await storage.upsertApiGeneratorConfig(updates);
      res.json(cfg);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to update config." });
    }
  });

  function apiGenDefaults(): Record<string, any> {
    return {
      enabled: 0,
      token: crypto.randomBytes(36).toString("base64url"),
      segment1: crypto.randomBytes(5).toString("hex"),
      segment2: crypto.randomBytes(5).toString("hex"),
      segment3: crypto.randomBytes(5).toString("hex"),
      segment4: crypto.randomBytes(5).toString("hex"),
      segment5: crypto.randomBytes(5).toString("hex"),
      maxQuantity: 10,
      registrator: "SayGG",
      rateLimitEnabled: 1,
      rateLimitWindow: 60,
      rateLimitMaxRequests: 10,
      customDurationEnabled: 0,
      customDurationMaxHours: 8760,
    };
  }

  app.post("/api/api-generator/regenerate-token", requireAuth, requireLevel(1), async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const existing = await storage.getApiGeneratorConfig();
    const token = crypto.randomBytes(36).toString("base64url");
    const data = existing
      ? { token, lastRotatedAt: new Date(), changedBy: user.username }
      : { ...apiGenDefaults(), token, lastRotatedAt: new Date(), changedBy: user.username };
    const cfg = await storage.upsertApiGeneratorConfig(data);
    res.json(cfg);
  });

  app.post("/api/api-generator/regenerate-segments", requireAuth, requireLevel(1), async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const existing = await storage.getApiGeneratorConfig();
    const segs = {
      segment1: crypto.randomBytes(5).toString("hex"),
      segment2: crypto.randomBytes(5).toString("hex"),
      segment3: crypto.randomBytes(5).toString("hex"),
      segment4: crypto.randomBytes(5).toString("hex"),
      segment5: crypto.randomBytes(5).toString("hex"),
    };
    const data = existing
      ? { ...segs, changedBy: user.username }
      : { ...apiGenDefaults(), ...segs, changedBy: user.username };
    const cfg = await storage.upsertApiGeneratorConfig(data);
    res.json(cfg);
  });

  app.get("/api/api-generator/logs", requireAuth, requireLevel(1), async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const success = req.query.success !== undefined ? parseInt(req.query.success as string) : undefined;
    const search = (req.query.search as string) || undefined;
    const result = await storage.getApiGeneratorLogs({ page, limit, success, search });
    res.json({ ...result, page, limit, totalPages: Math.ceil(result.total / limit) });
  });

  app.delete("/api/api-generator/logs", requireAuth, requireLevel(1), async (req, res) => {
    const before = req.query.before ? new Date(req.query.before as string) : undefined;
    const cleared = await storage.clearApiGeneratorLogs(before);
    res.json({ message: `Cleared ${cleared} log entries.`, cleared });
  });

  const apiGenRateMap = new Map<string, { count: number; resetAt: number }>();
  app.use("/g", async (req, res, next) => {
    try {
      const cfg = await storage.getApiGeneratorConfig();
      if (!cfg) return res.status(404).json({ success: false, message: "API not configured" });

      const pathSegments = req.path.split("/").filter(Boolean);
      const expectedPath = [cfg.segment1, cfg.segment2, cfg.segment3, cfg.segment4, cfg.segment5];

      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const ua = req.headers["user-agent"] || "";
      const { token, game, max_devices, duration, quantity: qtyStr, currency } = req.query as Record<string, string>;

      const logBase: any = {
        ip,
        userAgent: ua,
        game: game || null,
        duration: duration || null,
        maxDevices: max_devices ? parseInt(max_devices) : null,
        quantity: qtyStr ? parseInt(qtyStr) : null,
        currency: currency || null,
        tokenUsed: token ? 1 : 0,
        routeMatched: 0,
        success: 0,
      };

      if (pathSegments.length !== 5 || pathSegments.some((s, i) => s !== expectedPath[i])) {
        logBase.reason = "Route mismatch";
        await storage.createApiGeneratorLog(logBase);
        return res.status(404).json({ success: false, message: "Not found" });
      }

      logBase.routeMatched = 1;

      if (cfg.enabled !== 1) {
        logBase.reason = "API disabled";
        await storage.createApiGeneratorLog(logBase);
        return res.json({ success: false, message: "API is currently disabled" });
      }

      if (!token || token !== cfg.token) {
        logBase.reason = "Invalid token";
        await storage.createApiGeneratorLog(logBase);
        return res.json({ success: false, message: "Unauthorized" });
      }

      if (cfg.ipAllowlist) {
        const allowed = cfg.ipAllowlist.split(",").map(s => s.trim()).filter(Boolean);
        if (allowed.length > 0 && !allowed.includes(ip)) {
          logBase.reason = "IP not in allowlist";
          await storage.createApiGeneratorLog(logBase);
          return res.json({ success: false, message: "Unauthorized" });
        }
      }

      if (cfg.rateLimitEnabled === 1) {
        const rKey = `apigen:${ip}`;
        const now = Date.now();
        const windowMs = (cfg.rateLimitWindow || 60) * 1000;
        const entry = apiGenRateMap.get(rKey);
        if (!entry || now > entry.resetAt) {
          apiGenRateMap.set(rKey, { count: 1, resetAt: now + windowMs });
        } else if (entry.count >= (cfg.rateLimitMaxRequests || 10)) {
          logBase.reason = "Rate limit exceeded";
          await storage.createApiGeneratorLog(logBase);
          return res.status(429).json({ success: false, message: "Rate limit exceeded" });
        } else {
          entry.count++;
        }
      }

      if (!game) {
        logBase.reason = "Missing game parameter";
        await storage.createApiGeneratorLog(logBase);
        return res.json({ success: false, message: "Missing required parameter: game" });
      }

      const gameRecord = await storage.getGameByName(game);
      if (!gameRecord) {
        logBase.reason = "Game not found";
        await storage.createApiGeneratorLog(logBase);
        return res.json({ success: false, message: "Game not found" });
      }
      if (gameRecord.isActive !== 1) {
        logBase.reason = "Game inactive";
        await storage.createApiGeneratorLog(logBase);
        return res.json({ success: false, message: "Game is not active" });
      }

      if (!duration) {
        logBase.reason = "Missing duration parameter";
        await storage.createApiGeneratorLog(logBase);
        return res.json({ success: false, message: "Missing required parameter: duration" });
      }

      const durStr = String(duration).trim().toLowerCase();
      let durationHours: number;
      if (/^\d+d$/.test(durStr)) durationHours = parseInt(durStr) * 24;
      else if (/^\d+w$/.test(durStr)) durationHours = parseInt(durStr) * 168;
      else if (/^\d+m$/.test(durStr)) durationHours = parseInt(durStr) * 720;
      else if (/^\d+h$/.test(durStr)) durationHours = parseInt(durStr);
      else if (/^\d+$/.test(durStr)) durationHours = parseInt(durStr);
      else durationHours = NaN;

      if (!durationHours || isNaN(durationHours) || durationHours <= 0) {
        logBase.reason = "Invalid duration value";
        logBase.resolvedDurationHours = null;
        logBase.durationSource = null;
        await storage.createApiGeneratorLog(logBase);
        return res.json({ success: false, message: "Invalid duration format. Use: 1d, 7d, 1w, 1m, 24h, 5h" });
      }

      let durationSource: string;

      if (cfg.customDurationEnabled === 1) {
        const maxCustom = cfg.customDurationMaxHours || 8760;
        if (durationHours > maxCustom) {
          logBase.reason = `Custom duration ${durationHours}h exceeds limit of ${maxCustom}h`;
          logBase.resolvedDurationHours = durationHours;
          logBase.durationSource = "rejected";
          await storage.createApiGeneratorLog(logBase);
          return res.json({ success: false, message: "Custom duration exceeds allowed limit" });
        }
        durationSource = "custom";
      } else {
        const gameDurs = await storage.getActiveGameDurations(gameRecord.id);
        const durEntry = gameDurs.find(d => d.durationHours === durationHours);
        if (!durEntry) {
          logBase.reason = `Duration ${durationHours}h not available for ${game}`;
          logBase.resolvedDurationHours = durationHours;
          logBase.durationSource = "rejected";
          await storage.createApiGeneratorLog(logBase);
          return res.json({ success: false, message: `Duration not available for ${game}` });
        }
        durationSource = "configured";
      }

      logBase.resolvedDurationHours = durationHours;
      logBase.durationSource = durationSource;

      const maxDev = Math.max(1, parseInt(max_devices || "1") || 1);
      const qty = Math.max(1, Math.min(cfg.maxQuantity, parseInt(qtyStr || "1") || 1));

      const keys: any[] = [];
      const keyIds: number[] = [];
      const keyValues: string[] = [];

      for (let i = 0; i < qty; i++) {
        const license = generateKeyLicense(durationHours);
        const newKey = await storage.createKey({
          game: gameRecord.name,
          gameId: gameRecord.id,
          userKey: license,
          duration: durationHours,
          maxDevices: maxDev,
          registrator: cfg.registrator || "SayGG",
          status: 1,
        } as any);

        keyIds.push(newKey.id);
        keyValues.push(license);
        keys.push({
          game: gameRecord.name,
          user_key: license,
          duration: durationHours,
          max_devices: maxDev,
          status: 1,
          registrator: cfg.registrator || "SayGG",
          created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
        });
      }

      await storage.upsertApiGeneratorConfig({ lastUsedAt: new Date() } as any);

      logBase.success = 1;
      logBase.generatedKeyIds = JSON.stringify(keyIds);
      logBase.generatedKeyValues = JSON.stringify(keyValues);
      logBase.reason = null;
      await storage.createApiGeneratorLog(logBase);

      res.json({
        success: true,
        currency: currency || "",
        quantity: qty,
        keys,
      });
    } catch (e: any) {
      console.error("[api-generator] Error:", e.message);
      res.json({ success: false, message: "Internal error" });
    }
  });

  app.get("/api/setup/status", async (_req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json({ needsSetup: allUsers.length === 0 });
    } catch {
      res.json({ needsSetup: false });
    }
  });

  app.post("/api/setup/owner", async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      if (allUsers.length > 0) {
        return res.status(403).json({ message: "Setup already completed. System already has users." });
      }
      const { username, password, fullname } = req.body;
      if (!username || typeof username !== "string" || username.trim().length < 4 || username.trim().length > 25) {
        return res.status(400).json({ message: "Username must be 4–25 characters" });
      }
      if (!/^[a-zA-Z0-9]+$/.test(username.trim())) {
        return res.status(400).json({ message: "Username must be alphanumeric only" });
      }
      if (!password || typeof password !== "string" || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      const recheck = await storage.getAllUsers();
      if (recheck.length > 0) {
        return res.status(403).json({ message: "Setup already completed" });
      }
      const { hashPassword } = await import("./auth");
      const owner = await storage.createUser({
        username: username.trim(),
        password: hashPassword(password),
        fullname: ((fullname as string | undefined)?.trim() || username.trim()),
        level: 1,
        status: 1,
        saldo: 0,
      });
      console.log(`[setup] First owner "${owner.username}" created via setup page`);
      res.json({ message: "Owner account created successfully. You can now log in." });
    } catch (err: any) {
      console.error("[setup] Error creating owner:", err);
      res.status(500).json({ message: err.message || "Failed to create owner" });
    }
  });

  return sessionMiddleware;
}
