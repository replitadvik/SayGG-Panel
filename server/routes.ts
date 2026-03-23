import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import crypto from "crypto";
import { storage } from "./storage";
import { pool } from "./db";
import {
  hashPassword, verifyPassword, generateKeyLicense,
  getPrice, getLevelName,
} from "./auth";
import { loginSchema, registerSchema, generateKeySchema } from "@shared/schema";

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

const STATIC_WORDS = "Vm8Lk7Uj2JmsjCPVPVjrLa7zgfx3uz9E";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  const PgSession = connectPgSimple(session);
  app.use(
    session({
      store: new PgSession({ pool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    })
  );

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
      const { username, password, stayLog, deviceId } = loginSchema.parse(req.body);
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
          stayLog: !!stayLog,
          attempts: 0,
        };
        const response: any = { requires2fa: true };
        if (process.env.NODE_ENV !== "production") response.otp_hint = otp;
        return res.json(response);
      }

      await storage.clearThrottle(throttleId);
      req.session.regenerate((err) => {
        if (err) return res.status(500).json({ message: "Session error." });
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.userLevel = user.level;
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

    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ message: "Session error." });
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.userLevel = user.level;
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
      } as any);

      await storage.useReferral(refCode.id, data.username);
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
    const keys = user.level === 1
      ? await storage.getAllKeys()
      : await storage.getKeysByRegistrator(user.username);
    res.json(keys);
  });

  app.get("/api/keys/:id", requireAuth, async (req, res) => {
    const key = await storage.getKey(parseInt(req.params.id));
    if (!key) return res.status(404).json({ message: "Key not found" });
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.level !== 1 && key.registrator !== user.username) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(key);
  });

  app.post("/api/keys/generate", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const data = generateKeySchema.parse(req.body);

      if (user.level === 3 && data.maxDevices > 2) {
        return res.status(400).json({ message: "Reseller cannot create keys for more than 2 devices." });
      }
      if (user.level === 3 && data.customInput === "custom") {
        return res.status(400).json({ message: "Custom key not allowed for reseller." });
      }

      const activePrices = await storage.getActivePrices();
      const priceMap: Record<number, number> = {};
      for (const p of activePrices) priceMap[p.duration] = p.price;

      const cost = getPrice(priceMap, data.duration, data.maxDevices);
      if (user.saldo - cost < 0) {
        return res.status(400).json({ message: "Insufficient balance." });
      }

      let license: string;
      if (data.customInput === "custom" && data.customLicense) {
        if (data.customLicense.length < 4 || data.customLicense.length > 19) {
          return res.status(400).json({ message: "Custom key must be 4-19 characters." });
        }
        const existingKey = await storage.getKeyByUserKeyAndGame(data.customLicense, data.game);
        if (existingKey) return res.status(400).json({ message: "Key already exists." });
        license = data.customLicense;
      } else {
        license = generateKeyLicense(data.duration);
      }

      const newKey = await storage.createKey({
        game: data.game,
        userKey: license,
        duration: data.duration,
        maxDevices: data.maxDevices,
        registrator: user.username,
        adminId: user.id,
        status: 1,
      } as any);

      await storage.updateUser(user.id, { saldo: user.saldo - cost });

      await storage.createHistory({
        keysId: newKey.id,
        userDo: user.username,
        info: `${data.game}|${license.substring(0, 5)}|${data.duration}|${data.maxDevices}`,
      });

      res.json({ key: newKey, cost });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Key generation failed." });
    }
  });

  app.patch("/api/keys/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const keyId = parseInt(req.params.id);
      const key = await storage.getKey(keyId);
      if (!key) return res.status(404).json({ message: "Key not found" });

      if (user.level !== 1 && key.registrator !== user.username) {
        return res.status(403).json({ message: "Access denied" });
      }

      let updates: any = {};
      if (user.level === 1) {
        const { game, userKey, duration, maxDevices, status, registrator, expiredDate, devices } = req.body;
        updates = { game, userKey, duration, maxDevices, status, registrator, devices };
        if (expiredDate) updates.expiredDate = new Date(expiredDate);
        else if (expiredDate === null) updates.expiredDate = null;
      } else if (user.level === 2) {
        const { game, userKey, duration, maxDevices, status, registrator, expiredDate, devices } = req.body;
        updates = { game, userKey, duration, maxDevices, status, registrator, devices };
        if (expiredDate) updates.expiredDate = new Date(expiredDate);
        else if (expiredDate === null) updates.expiredDate = null;
      } else {
        updates = { status: req.body.status };
      }

      Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);
      const updated = await storage.updateKey(keyId, updates);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Update failed." });
    }
  });

  app.post("/api/keys/:id/extend", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const keyId = parseInt(req.params.id);
      const key = await storage.getKey(keyId);
      if (!key) return res.status(404).json({ message: "Key not found" });

      if (user.level !== 1 && key.registrator !== user.username) {
        return res.status(403).json({ message: "Permission denied" });
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

      if (addHours <= 0) {
        return res.status(400).json({ message: "Invalid duration value." });
      }

      const currentExpiry = key.expiredDate;
      const newDuration = key.duration + addHours;

      if (!currentExpiry) {
        await storage.updateKey(key.id, { duration: newDuration });
        return res.json({ success: true, newExpiry: null, totalDuration: newDuration });
      }

      const now = new Date();
      const baseTime = currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(baseTime.getTime() + addHours * 3600000);

      await storage.updateKey(key.id, { expiredDate: newExpiry, duration: newDuration });
      res.json({ success: true, newExpiry: newExpiry.toISOString(), totalDuration: newDuration });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Extend failed." });
    }
  });

  app.delete("/api/keys/:id", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const key = await storage.getKey(parseInt(req.params.id));
    if (!key) return res.status(404).json({ message: "Key not found" });
    if (user.level !== 1 && key.registrator !== user.username) {
      return res.status(403).json({ message: "Access denied" });
    }
    await storage.deleteKey(key.id);
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
    res.json({ message: `${ids.length} keys deleted.` });
  });

  app.post("/api/keys/:id/reset-device", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const key = await storage.getKey(parseInt(req.params.id));
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
    const maxLimit = isOwner ? 999 : 3;

    if (!isOwner && resetCount >= maxLimit) {
      return res.status(400).json({ message: "Max reset already done." });
    }

    const newCount = resetCount + 1;
    const token = crypto.randomBytes(16).toString("hex");

    await storage.updateKey(key.id, {
      devices: null,
      keyResetTime: String(newCount),
      keyResetToken: token,
    } as any);

    res.json({
      message: "Devices reset successfully.",
      resetUsed: newCount,
      resetLeft: isOwner ? "Unlimited" : Math.max(0, maxLimit - newCount),
    });
  });

  app.get("/api/users", requireAuth, async (req, res) => {
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

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    const me = await storage.getUser(req.session.userId!);
    if (!me) return res.status(401).json({ message: "Unauthorized" });
    const target = await storage.getUser(parseInt(req.params.id));
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
    const target = await storage.getUser(parseInt(req.params.id));
    if (!target) return res.status(404).json({ message: "User not found" });
    if (me.level === 2 && target.uplink !== me.username) {
      return res.status(403).json({ message: "Can only approve users you referred." });
    }
    await storage.updateUser(target.id, { status: 1 });
    res.json({ message: "User approved." });
  });

  app.post("/api/users/:id/decline", requireLevel(2), async (req, res) => {
    const me = await storage.getUser(req.session.userId!);
    if (!me) return res.status(401).json({ message: "Unauthorized" });
    const target = await storage.getUser(parseInt(req.params.id));
    if (!target) return res.status(404).json({ message: "User not found" });
    if (me.level === 2 && target.uplink !== me.username) {
      return res.status(403).json({ message: "Can only decline users you referred." });
    }
    await storage.updateUser(target.id, { status: 2 });
    await storage.blockKeysByRegistrator(target.username);
    res.json({ message: "User declined." });
  });

  app.patch("/api/users/:id", requireLevel(2), async (req, res) => {
    const me = await storage.getUser(req.session.userId!);
    if (!me) return res.status(401).json({ message: "Unauthorized" });
    const target = await storage.getUser(parseInt(req.params.id));
    if (!target) return res.status(404).json({ message: "User not found" });

    if (me.level === 2) {
      if (target.level === 1) return res.status(403).json({ message: "Cannot edit owner." });
      if (target.uplink !== me.username) return res.status(403).json({ message: "Can only edit users you referred." });
    }

    const { level, status, saldo, expirationDate, fullname } = req.body;
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

    const updated = await storage.updateUser(target.id, updates);
    if (updated) {
      const { password, ...safe } = updated;
      res.json({ ...safe, levelName: getLevelName(updated.level) });
    } else {
      res.status(500).json({ message: "Update failed." });
    }
  });

  app.delete("/api/users/:id", requireLevel(2), async (req, res) => {
    const me = await storage.getUser(req.session.userId!);
    if (!me) return res.status(401).json({ message: "Unauthorized" });
    const targetId = parseInt(req.params.id);
    if (targetId === req.session.userId) return res.status(400).json({ message: "Cannot delete yourself." });

    const target = await storage.getUser(targetId);
    if (!target) return res.status(404).json({ message: "User not found" });

    if (me.level === 2) {
      if (target.level !== 3 || target.uplink !== me.username) {
        return res.status(403).json({ message: "Admin can only delete referred Resellers." });
      }
    }

    await storage.deleteUser(targetId);
    res.json({ message: "User deleted." });
  });

  app.post("/api/users/:id/reset-device", requireLevel(2), async (req, res) => {
    const me = await storage.getUser(req.session.userId!);
    if (!me) return res.status(401).json({ message: "Unauthorized" });
    const target = await storage.getUser(parseInt(req.params.id));
    if (!target) return res.status(404).json({ message: "User not found" });

    if (me.level === 2) {
      if (target.level === 1) return res.status(403).json({ message: "Cannot reset owner device." });
      if (target.uplink !== me.username) return res.status(403).json({ message: "Can only reset devices for users you referred." });
    }

    await storage.updateUser(target.id, { deviceId: null } as any);
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
    const codes = await storage.getReferralCodes();
    res.json(codes);
  });

  app.post("/api/referrals", requireLevel(2), async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const { level, setSaldo, accExpiration } = req.body;

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
    } as any);
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
    await storage.deactivatePrice(parseInt(req.params.duration));
    res.json({ message: "Duration removed." });
  });

  app.get("/api/settings/features", requireLevel(1), async (req, res) => {
    const features = await storage.getFeatures();
    res.json(features || {});
  });

  app.patch("/api/settings/features", requireLevel(1), async (req, res) => {
    await storage.updateFeatures(req.body);
    res.json({ message: "Features updated." });
  });

  app.get("/api/settings/modname", requireLevel(1), async (req, res) => {
    const name = await storage.getModname();
    res.json({ modname: name });
  });

  app.patch("/api/settings/modname", requireLevel(1), async (req, res) => {
    await storage.updateModname(req.body.modname || "");
    res.json({ message: "Mod name updated." });
  });

  app.get("/api/settings/ftext", requireLevel(1), async (req, res) => {
    const data = await storage.getFtext();
    res.json(data || {});
  });

  app.patch("/api/settings/ftext", requireLevel(1), async (req, res) => {
    await storage.updateFtext(req.body);
    res.json({ message: "Text updated." });
  });

  app.get("/api/settings/maintenance", requireLevel(1), async (req, res) => {
    const data = await storage.getMaintenanceStatus();
    res.json(data || { status: "off", myinput: "" });
  });

  app.patch("/api/settings/maintenance", requireLevel(1), async (req, res) => {
    const { status, myinput } = req.body;
    await storage.updateMaintenance(status, myinput);
    res.json({ message: "Maintenance status updated." });
  });

  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    let allKeys: any[];
    let allUsers: any[];
    if (user.level === 1) {
      allKeys = await storage.getAllKeys();
      allUsers = await storage.getAllUsers();
    } else {
      allKeys = await storage.getKeysByRegistrator(user.username);
      allUsers = await storage.getUsersByUplink(user.username);
    }

    const totalKeys = allKeys.length;
    const activeKeys = allKeys.filter(k => k.status === 1).length;
    const expiredKeys = allKeys.filter(k => k.expiredDate && new Date() > new Date(k.expiredDate)).length;
    const totalUsers = allUsers.length;
    const pendingUsers = allUsers.filter(u => u.status === 0).length;

    res.json({
      totalKeys, activeKeys, expiredKeys,
      totalUsers, pendingUsers,
      saldo: user.saldo,
      level: user.level,
      levelName: getLevelName(user.level),
    });
  });

  app.post("/connect", async (req, res) => {
    try {
      const maintenance = await storage.getMaintenanceStatus();
      if (maintenance && maintenance.status === "on") {
        return res.json({ status: false, reason: maintenance.myinput || "Maintenance Mode" });
      }

      const { game, user_key, serial } = req.body;
      if (!game || !user_key || !serial) {
        return res.json({ status: false, reason: "INVALID PARAMETER" });
      }

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

      const real = `${game}-${user_key}-${serial}-${STATIC_WORDS}`;
      const token = crypto.createHash("md5").update(real).digest("hex");

      res.json({
        status: true,
        data: {
          real, token,
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
          EXP: expired.toISOString(),
          device: findKey.maxDevices,
          rng: Date.now(),
        },
      });
    } catch (e: any) {
      res.json({ status: false, reason: "INTERNAL ERROR" });
    }
  });

  app.get("/api/games", requireAuth, async (req, res) => {
    const features = await storage.getFeatures();
    const games: Record<string, string> = {};
    if (features) {
      games["FreeFire"] = "FreeFire";
      games["PUBG"] = "PUBG";
      games["CODM"] = "CODM";
    }
    res.json(games);
  });

  return httpServer;
}
