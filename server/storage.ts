import { db } from "./db";
import { eq, and, desc, asc, count, sql, like, or, isNull, isNotNull, lt } from "drizzle-orm";
import {
  users, keysCode, referralCode, priceConfig,
  feature, modname, ftext, onoff, history, loginThrottle, connectConfig, connectAuditLog, sessionSettings,
  games, gameDurations, siteConfig, apiGeneratorConfig, apiGeneratorLog,
  type User, type Key, type ReferralCode, type PriceConfig,
  type Feature, type History, type ConnectConfig, type ConnectAuditLog, type SessionSettings,
  type Game, type GameDuration, type ApiGeneratorConfig, type ApiGeneratorLog,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByUplink(uplink: string): Promise<User[]>;
  createUser(data: Partial<User>): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;

  getKey(id: number): Promise<Key | undefined>;
  getKeyByUserKeyAndGame(userKey: string, game: string): Promise<Key | undefined>;
  getAllKeys(): Promise<Key[]>;
  getKeysByRegistrator(registrator: string): Promise<Key[]>;
  createKey(data: Partial<Key>): Promise<Key>;
  updateKey(id: number, data: Partial<Key>): Promise<Key | undefined>;
  deleteKey(id: number): Promise<void>;
  deleteKeys(ids: number[]): Promise<void>;
  resetKeysDevices(ids: number[]): Promise<number>;
  deleteExpiredKeys(registrator?: string): Promise<number>;
  deleteUnactivatedKeys(registrator?: string): Promise<number>;
  getPaginatedKeys(options: {
    page: number;
    limit: number;
    search?: string;
    filter?: string;
    registrator?: string;
  }): Promise<{ keys: Key[]; total: number }>;

  getReferralCodes(): Promise<ReferralCode[]>;
  getReferralCodesByCreator(createdBy: string): Promise<ReferralCode[]>;
  createReferral(data: Partial<ReferralCode>): Promise<ReferralCode>;
  checkReferralCode(code: string): Promise<ReferralCode | undefined>;
  useReferral(id: number, usedBy: string): Promise<void>;

  getPrices(): Promise<PriceConfig[]>;
  getActivePrices(): Promise<PriceConfig[]>;
  upsertPrice(duration: number, price: number): Promise<void>;
  deactivatePrice(duration: number): Promise<void>;

  getFeatures(): Promise<Feature | undefined>;
  updateFeatures(data: Partial<Feature>): Promise<void>;
  getModname(): Promise<string>;
  updateModname(name: string): Promise<void>;
  getSiteName(): Promise<string>;
  updateSiteName(name: string): Promise<void>;
  getFtext(): Promise<{ _status: string | null; _ftext: string | null } | undefined>;
  updateFtext(data: { _status?: string; _ftext?: string }): Promise<void>;
  getMaintenanceStatus(): Promise<{ status: string; myinput: string | null } | undefined>;
  updateMaintenance(status: string, myinput?: string): Promise<void>;

  createHistory(data: Partial<History>): Promise<void>;
  getHistoryByKeyId(keyId: number): Promise<History[]>;

  blockKeysByRegistrator(registrator: string): Promise<void>;

  getThrottle(identifier: string): Promise<{ attempts: number; blockedUntil: Date | null } | undefined>;
  recordLoginFailure(identifier: string): Promise<void>;
  clearThrottle(identifier: string): Promise<void>;

  getConnectConfig(): Promise<ConnectConfig | undefined>;
  upsertConnectConfig(data: Partial<ConnectConfig>): Promise<ConnectConfig>;
  rotateConnectSecret(newSecret: string, changedBy: string, gracePeriodMinutes?: number): Promise<ConnectConfig>;
  getConnectAuditLogs(): Promise<ConnectAuditLog[]>;
  createConnectAuditLog(data: Partial<ConnectAuditLog>): Promise<ConnectAuditLog>;

  getSessionSettings(): Promise<SessionSettings | undefined>;
  upsertSessionSettings(data: Partial<SessionSettings>): Promise<SessionSettings>;
  deleteSessionSettings(): Promise<void>;

  getAllGames(): Promise<Game[]>;
  getActiveGames(): Promise<Game[]>;
  getKeyCountsPerGame(): Promise<{ gameId: number; count: number }[]>;
  getGame(id: number): Promise<Game | undefined>;
  getGameDurationCount(gameId: number): Promise<number>;
  getGameBySlug(slug: string): Promise<Game | undefined>;
  getGameByName(name: string): Promise<Game | undefined>;
  createGame(data: Partial<Game>): Promise<Game>;
  updateGame(id: number, data: Partial<Game>): Promise<Game | undefined>;
  deleteGame(id: number): Promise<void>;

  getGameDurations(gameId: number): Promise<GameDuration[]>;
  getActiveGameDurations(gameId: number): Promise<GameDuration[]>;
  getGameDuration(id: number): Promise<GameDuration | undefined>;
  createGameDuration(data: Partial<GameDuration>): Promise<GameDuration>;
  updateGameDuration(id: number, data: Partial<GameDuration>): Promise<GameDuration | undefined>;
  deleteGameDuration(id: number): Promise<void>;
  getKeyCountByGameId(gameId: number): Promise<number>;

  getApiGeneratorConfig(): Promise<ApiGeneratorConfig | undefined>;
  upsertApiGeneratorConfig(data: Partial<ApiGeneratorConfig>): Promise<ApiGeneratorConfig>;
  createApiGeneratorLog(data: Partial<ApiGeneratorLog>): Promise<ApiGeneratorLog>;
  getApiGeneratorLogs(options: {
    page: number;
    limit: number;
    success?: number;
    search?: string;
  }): Promise<{ logs: ApiGeneratorLog[]; total: number }>;
  clearApiGeneratorLogs(beforeDate?: Date): Promise<number>;

  getDashboardStats(): Promise<{
    totalKeys: number; activeKeys: number; expiredKeys: number;
    totalUsers: number; pendingUsers: number;
    totalAdmins: number; totalResellers: number;
    totalGames: number; totalReferrals: number;
    blockedKeys: number;
  }>;
  getDashboardStatsByUser(username: string): Promise<{
    totalKeys: number; activeKeys: number; expiredKeys: number;
    totalUsers: number; pendingUsers: number;
    totalReferrals: number; blockedKeys: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.id));
  }

  async getUsersByUplink(uplink: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.uplink, uplink)).orderBy(desc(users.id));
  }

  async createUser(data: Partial<User>): Promise<User> {
    const [user] = await db.insert(users).values(data as any).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set({ ...data, updatedAt: new Date() } as any).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getKey(id: number): Promise<Key | undefined> {
    const [key] = await db.select().from(keysCode).where(eq(keysCode.id, id));
    return key;
  }

  async getKeyByUserKeyAndGame(userKey: string, game: string): Promise<Key | undefined> {
    const [key] = await db.select().from(keysCode).where(and(eq(keysCode.userKey, userKey), eq(keysCode.game, game)));
    return key;
  }

  async getAllKeys(): Promise<Key[]> {
    return db.select().from(keysCode).orderBy(desc(keysCode.id));
  }

  async getKeysByRegistrator(registrator: string): Promise<Key[]> {
    return db.select().from(keysCode).where(eq(keysCode.registrator, registrator)).orderBy(desc(keysCode.id));
  }

  async createKey(data: Partial<Key>): Promise<Key> {
    const [key] = await db.insert(keysCode).values(data as any).returning();
    return key;
  }

  async updateKey(id: number, data: Partial<Key>): Promise<Key | undefined> {
    const [key] = await db.update(keysCode).set({ ...data, updatedAt: new Date() } as any).where(eq(keysCode.id, id)).returning();
    return key;
  }

  async deleteKey(id: number): Promise<void> {
    await db.delete(keysCode).where(eq(keysCode.id, id));
  }

  async deleteKeys(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await db.delete(keysCode).where(sql`${keysCode.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`);
  }

  async resetKeysDevices(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await db.update(keysCode)
      .set({ devices: null, updatedAt: new Date() } as any)
      .where(sql`${keysCode.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`)
      .returning();
    return result.length;
  }

  async deleteExpiredKeys(registrator?: string): Promise<number> {
    const conditions = [
      isNotNull(keysCode.expiredDate),
      lt(keysCode.expiredDate, new Date()),
    ];
    if (registrator) conditions.push(eq(keysCode.registrator, registrator));
    const result = await db.delete(keysCode).where(and(...conditions)).returning();
    return result.length;
  }

  async deleteUnactivatedKeys(registrator?: string): Promise<number> {
    const conditions = [
      isNull(keysCode.expiredDate),
      or(isNull(keysCode.devices), eq(keysCode.devices, "")),
    ];
    if (registrator) conditions.push(eq(keysCode.registrator, registrator as any));
    const result = await db.delete(keysCode).where(and(...(conditions.filter(Boolean) as any))).returning();
    return result.length;
  }

  async getPaginatedKeys(options: {
    page: number;
    limit: number;
    search?: string;
    filter?: string;
    registrator?: string;
  }): Promise<{ keys: Key[]; total: number }> {
    const { page, limit, search, filter, registrator } = options;
    const conditions: any[] = [];

    if (registrator) {
      conditions.push(eq(keysCode.registrator, registrator));
    }

    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          like(keysCode.userKey, term),
          like(keysCode.game, term),
          like(keysCode.registrator, term),
        )
      );
    }

    if (filter && filter !== "all") {
      switch (filter) {
        case "active":
          conditions.push(eq(keysCode.status, 1));
          conditions.push(
            sql`(${keysCode.expiredDate} IS NULL OR ${keysCode.expiredDate} >= NOW())`
          );
          break;
        case "blocked":
          conditions.push(eq(keysCode.status, 0));
          break;
        case "expired":
          conditions.push(and(isNotNull(keysCode.expiredDate), lt(keysCode.expiredDate, new Date())));
          break;
        case "activated":
          conditions.push(isNotNull(keysCode.expiredDate));
          break;
        case "not-activated":
          conditions.push(isNull(keysCode.expiredDate));
          break;
      }
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db.select({ total: count() }).from(keysCode).where(where);
    const total = countResult?.total ?? 0;

    const keys = await db.select().from(keysCode)
      .where(where)
      .orderBy(desc(keysCode.id))
      .limit(limit)
      .offset((page - 1) * limit);

    return { keys, total };
  }

  async getReferralCodes(): Promise<ReferralCode[]> {
    return db.select().from(referralCode).orderBy(desc(referralCode.id));
  }

  async getReferralCodesByCreator(createdBy: string): Promise<ReferralCode[]> {
    return db.select().from(referralCode)
      .where(eq(referralCode.createdBy, createdBy))
      .orderBy(desc(referralCode.id));
  }

  async createReferral(data: Partial<ReferralCode>): Promise<ReferralCode> {
    const [ref] = await db.insert(referralCode).values(data as any).returning();
    return ref;
  }

  async checkReferralCode(code: string): Promise<ReferralCode | undefined> {
    const [ref] = await db.select().from(referralCode).where(eq(referralCode.code, code));
    return ref;
  }

  async useReferral(id: number, usedBy: string): Promise<void> {
    await db.update(referralCode).set({ usedBy } as any).where(eq(referralCode.id, id));
  }

  async getPrices(): Promise<PriceConfig[]> {
    return db.select().from(priceConfig).orderBy(asc(priceConfig.duration));
  }

  async getActivePrices(): Promise<PriceConfig[]> {
    return db.select().from(priceConfig).where(eq(priceConfig.isActive, 1)).orderBy(asc(priceConfig.duration));
  }

  async upsertPrice(duration: number, price: number): Promise<void> {
    const existing = await db.select().from(priceConfig).where(eq(priceConfig.duration, duration));
    if (existing.length > 0) {
      await db.update(priceConfig).set({ price, isActive: 1 }).where(eq(priceConfig.duration, duration));
    } else {
      await db.insert(priceConfig).values({ duration, price, isActive: 1 });
    }
  }

  async deactivatePrice(duration: number): Promise<void> {
    await db.update(priceConfig).set({ isActive: 0 }).where(eq(priceConfig.duration, duration));
  }

  async getFeatures(): Promise<Feature | undefined> {
    const [f] = await db.select().from(feature);
    return f;
  }

  async updateFeatures(data: Partial<Feature>): Promise<void> {
    const existing = await db.select().from(feature);
    if (existing.length === 0) {
      await db.insert(feature).values(data as any);
    } else {
      await db.update(feature).set(data as any).where(eq(feature.id, existing[0].id));
    }
  }

  async getModname(): Promise<string> {
    const [m] = await db.select().from(modname);
    return m?.modname || "";
  }

  async updateModname(name: string): Promise<void> {
    const existing = await db.select().from(modname);
    if (existing.length === 0) {
      await db.insert(modname).values({ modname: name } as any);
    } else {
      await db.update(modname).set({ modname: name } as any).where(eq(modname.id, existing[0].id));
    }
  }

  async getSiteName(): Promise<string> {
    const [row] = await db.select().from(siteConfig);
    return row?.siteName || "";
  }

  async updateSiteName(name: string): Promise<void> {
    const existing = await db.select().from(siteConfig);
    if (existing.length === 0) {
      await db.insert(siteConfig).values({ siteName: name } as any);
    } else {
      await db.update(siteConfig).set({ siteName: name } as any).where(eq(siteConfig.id, existing[0].id));
    }
  }

  async getFtext(): Promise<{ _status: string | null; _ftext: string | null } | undefined> {
    const [f] = await db.select().from(ftext);
    return f;
  }

  async updateFtext(data: { _status?: string; _ftext?: string }): Promise<void> {
    const existing = await db.select().from(ftext);
    if (existing.length === 0) {
      await db.insert(ftext).values(data as any);
    } else {
      await db.update(ftext).set(data as any).where(eq(ftext.id, existing[0].id));
    }
  }

  async getMaintenanceStatus(): Promise<{ status: string; myinput: string | null } | undefined> {
    const [m] = await db.select().from(onoff);
    return m ? { status: m.status || "off", myinput: m.myinput } : undefined;
  }

  async updateMaintenance(status: string, myinput?: string): Promise<void> {
    const existing = await db.select().from(onoff);
    if (existing.length === 0) {
      await db.insert(onoff).values({ status, myinput } as any);
    } else {
      await db.update(onoff).set({ status, myinput } as any).where(eq(onoff.id, existing[0].id));
    }
  }

  async createHistory(data: Partial<History>): Promise<void> {
    await db.insert(history).values(data as any);
  }

  async getHistoryByKeyId(keyId: number): Promise<History[]> {
    return db.select().from(history).where(eq(history.keysId, keyId)).orderBy(desc(history.id));
  }

  async blockKeysByRegistrator(registrator: string): Promise<void> {
    await db.update(keysCode).set({ status: 0 }).where(eq(keysCode.registrator, registrator));
  }

  async getThrottle(identifier: string): Promise<{ attempts: number; blockedUntil: Date | null } | undefined> {
    const [t] = await db.select().from(loginThrottle).where(eq(loginThrottle.identifier, identifier));
    return t ? { attempts: t.attempts, blockedUntil: t.blockedUntil } : undefined;
  }

  async recordLoginFailure(identifier: string): Promise<void> {
    const existing = await this.getThrottle(identifier);
    if (existing) {
      const newAttempts = existing.attempts + 1;
      const blockedUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await db.update(loginThrottle)
        .set({ attempts: newAttempts, blockedUntil, updatedAt: new Date() } as any)
        .where(eq(loginThrottle.identifier, identifier));
    } else {
      await db.insert(loginThrottle).values({ identifier, attempts: 1 } as any);
    }
  }

  async clearThrottle(identifier: string): Promise<void> {
    await db.delete(loginThrottle).where(eq(loginThrottle.identifier, identifier));
  }

  async getConnectConfig(): Promise<ConnectConfig | undefined> {
    const [cfg] = await db.select().from(connectConfig);
    return cfg;
  }

  async upsertConnectConfig(data: Partial<ConnectConfig>): Promise<ConnectConfig> {
    const existing = await this.getConnectConfig();
    if (existing) {
      const [updated] = await db.update(connectConfig).set({ ...data, changedAt: new Date() } as any).where(eq(connectConfig.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(connectConfig).values(data as any).returning();
      return created;
    }
  }

  async rotateConnectSecret(newSecret: string, changedBy: string, gracePeriodMinutes = 60): Promise<ConnectConfig> {
    const existing = await this.getConnectConfig();
    if (existing) {
      const [updated] = await db.update(connectConfig).set({
        previousSecret: existing.activeSecret,
        activeSecret: newSecret,
        secretVersion: existing.secretVersion + 1,
        gracePeriodUntil: new Date(Date.now() + gracePeriodMinutes * 60 * 1000),
        changedBy,
        changedAt: new Date(),
      } as any).where(eq(connectConfig.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(connectConfig).values({
        activeSecret: newSecret,
        secretVersion: 1,
        createdBy: changedBy,
        changedBy,
        createdAt: new Date(),
        changedAt: new Date(),
      } as any).returning();
      return created;
    }
  }

  async getConnectAuditLogs(): Promise<ConnectAuditLog[]> {
    return db.select().from(connectAuditLog).orderBy(desc(connectAuditLog.id));
  }

  async createConnectAuditLog(data: Partial<ConnectAuditLog>): Promise<ConnectAuditLog> {
    const [log] = await db.insert(connectAuditLog).values(data as any).returning();
    return log;
  }

  async getSessionSettings(): Promise<SessionSettings | undefined> {
    const [s] = await db.select().from(sessionSettings);
    return s;
  }

  async upsertSessionSettings(data: Partial<SessionSettings>): Promise<SessionSettings> {
    const existing = await this.getSessionSettings();
    if (existing) {
      const [updated] = await db.update(sessionSettings).set({ ...data, changedAt: new Date() } as any).where(eq(sessionSettings.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(sessionSettings).values(data as any).returning();
      return created;
    }
  }

  async deleteSessionSettings(): Promise<void> {
    await db.delete(sessionSettings);
  }

  async getAllGames(): Promise<Game[]> {
    return db.select().from(games).orderBy(asc(games.name));
  }

  async getActiveGames(): Promise<Game[]> {
    return db.select().from(games).where(eq(games.isActive, 1)).orderBy(asc(games.name));
  }

  async getKeyCountsPerGame(): Promise<{ gameId: number; count: number }[]> {
    const result = await db
      .select({ gameId: keysCode.gameId, count: count() })
      .from(keysCode)
      .where(isNotNull(keysCode.gameId))
      .groupBy(keysCode.gameId);
    return result.map(r => ({ gameId: r.gameId!, count: r.count }));
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [g] = await db.select().from(games).where(eq(games.id, id));
    return g;
  }

  async getGameDurationCount(gameId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(gameDurations).where(eq(gameDurations.gameId, gameId));
    return result?.count ?? 0;
  }

  async getGameBySlug(slug: string): Promise<Game | undefined> {
    const [g] = await db.select().from(games).where(eq(games.slug, slug));
    return g;
  }

  async getGameByName(name: string): Promise<Game | undefined> {
    const [g] = await db.select().from(games).where(eq(games.name, name));
    return g;
  }

  async createGame(data: Partial<Game>): Promise<Game> {
    const [g] = await db.insert(games).values(data as any).returning();
    return g;
  }

  async updateGame(id: number, data: Partial<Game>): Promise<Game | undefined> {
    const [g] = await db.update(games).set({ ...data, updatedAt: new Date() } as any).where(eq(games.id, id)).returning();
    return g;
  }

  async deleteGame(id: number): Promise<void> {
    await db.delete(gameDurations).where(eq(gameDurations.gameId, id));
    await db.delete(games).where(eq(games.id, id));
  }

  async getGameDurations(gameId: number): Promise<GameDuration[]> {
    return db.select().from(gameDurations).where(eq(gameDurations.gameId, gameId)).orderBy(asc(gameDurations.durationHours));
  }

  async getActiveGameDurations(gameId: number): Promise<GameDuration[]> {
    return db.select().from(gameDurations).where(and(eq(gameDurations.gameId, gameId), eq(gameDurations.isActive, 1))).orderBy(asc(gameDurations.durationHours));
  }

  async getGameDuration(id: number): Promise<GameDuration | undefined> {
    const [d] = await db.select().from(gameDurations).where(eq(gameDurations.id, id));
    return d;
  }

  async createGameDuration(data: Partial<GameDuration>): Promise<GameDuration> {
    const [d] = await db.insert(gameDurations).values(data as any).returning();
    return d;
  }

  async updateGameDuration(id: number, data: Partial<GameDuration>): Promise<GameDuration | undefined> {
    const [d] = await db.update(gameDurations).set({ ...data, updatedAt: new Date() } as any).where(eq(gameDurations.id, id)).returning();
    return d;
  }

  async deleteGameDuration(id: number): Promise<void> {
    await db.delete(gameDurations).where(eq(gameDurations.id, id));
  }

  async getKeyCountByGameId(gameId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(keysCode).where(eq(keysCode.gameId, gameId));
    return result?.count ?? 0;
  }

  async getDashboardStats() {
    const [keyStats] = await db.select({
      totalKeys: count(),
      activeKeys: sql<number>`COUNT(*) FILTER (WHERE ${keysCode.status} = 1)`,
      expiredKeys: sql<number>`COUNT(*) FILTER (WHERE ${keysCode.expiredDate} IS NOT NULL AND ${keysCode.expiredDate} < NOW())`,
      blockedKeys: sql<number>`COUNT(*) FILTER (WHERE ${keysCode.status} = 0)`,
    }).from(keysCode);

    const [userStats] = await db.select({
      totalUsers: count(),
      pendingUsers: sql<number>`COUNT(*) FILTER (WHERE ${users.status} = 0)`,
      totalAdmins: sql<number>`COUNT(*) FILTER (WHERE ${users.level} = 2)`,
      totalResellers: sql<number>`COUNT(*) FILTER (WHERE ${users.level} = 3)`,
    }).from(users);

    const [gameStats] = await db.select({ totalGames: count() }).from(games);
    const [refStats] = await db.select({ totalReferrals: count() }).from(referralCode);

    return {
      totalKeys: keyStats?.totalKeys ?? 0,
      activeKeys: Number(keyStats?.activeKeys ?? 0),
      expiredKeys: Number(keyStats?.expiredKeys ?? 0),
      blockedKeys: Number(keyStats?.blockedKeys ?? 0),
      totalUsers: userStats?.totalUsers ?? 0,
      pendingUsers: Number(userStats?.pendingUsers ?? 0),
      totalAdmins: Number(userStats?.totalAdmins ?? 0),
      totalResellers: Number(userStats?.totalResellers ?? 0),
      totalGames: gameStats?.totalGames ?? 0,
      totalReferrals: refStats?.totalReferrals ?? 0,
    };
  }

  async getDashboardStatsByUser(username: string) {
    const [keyStats] = await db.select({
      totalKeys: count(),
      activeKeys: sql<number>`COUNT(*) FILTER (WHERE ${keysCode.status} = 1)`,
      expiredKeys: sql<number>`COUNT(*) FILTER (WHERE ${keysCode.expiredDate} IS NOT NULL AND ${keysCode.expiredDate} < NOW())`,
      blockedKeys: sql<number>`COUNT(*) FILTER (WHERE ${keysCode.status} = 0)`,
    }).from(keysCode).where(eq(keysCode.registrator, username));

    const [userStats] = await db.select({
      totalUsers: count(),
      pendingUsers: sql<number>`COUNT(*) FILTER (WHERE ${users.status} = 0)`,
    }).from(users).where(eq(users.uplink, username));

    const [refStats] = await db.select({ totalReferrals: count() }).from(referralCode).where(eq(referralCode.createdBy, username));

    return {
      totalKeys: keyStats?.totalKeys ?? 0,
      activeKeys: Number(keyStats?.activeKeys ?? 0),
      expiredKeys: Number(keyStats?.expiredKeys ?? 0),
      blockedKeys: Number(keyStats?.blockedKeys ?? 0),
      totalUsers: userStats?.totalUsers ?? 0,
      pendingUsers: Number(userStats?.pendingUsers ?? 0),
      totalReferrals: refStats?.totalReferrals ?? 0,
    };
  }
  async getApiGeneratorConfig(): Promise<ApiGeneratorConfig | undefined> {
    const [cfg] = await db.select().from(apiGeneratorConfig);
    return cfg;
  }

  async upsertApiGeneratorConfig(data: Partial<ApiGeneratorConfig>): Promise<ApiGeneratorConfig> {
    const existing = await this.getApiGeneratorConfig();
    if (existing) {
      const [updated] = await db.update(apiGeneratorConfig)
        .set({ ...data, changedAt: new Date() } as any)
        .where(eq(apiGeneratorConfig.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(apiGeneratorConfig).values(data as any).returning();
      return created;
    }
  }

  async createApiGeneratorLog(data: Partial<ApiGeneratorLog>): Promise<ApiGeneratorLog> {
    const [log] = await db.insert(apiGeneratorLog).values(data as any).returning();
    return log;
  }

  async getApiGeneratorLogs(options: {
    page: number;
    limit: number;
    success?: number;
    search?: string;
  }): Promise<{ logs: ApiGeneratorLog[]; total: number }> {
    const { page, limit, success, search } = options;
    const conditions: any[] = [];

    if (success !== undefined) {
      conditions.push(eq(apiGeneratorLog.success, success));
    }

    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          like(apiGeneratorLog.ip, term),
          like(apiGeneratorLog.game, term),
          like(apiGeneratorLog.reason, term),
          like(apiGeneratorLog.generatedKeyValues, term),
        )
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [countResult] = await db.select({ total: count() }).from(apiGeneratorLog).where(where);
    const total = countResult?.total ?? 0;

    const logs = await db.select().from(apiGeneratorLog)
      .where(where)
      .orderBy(desc(apiGeneratorLog.id))
      .limit(limit)
      .offset((page - 1) * limit);

    return { logs, total };
  }

  async clearApiGeneratorLogs(beforeDate?: Date): Promise<number> {
    if (beforeDate) {
      const result = await db.delete(apiGeneratorLog).where(lt(apiGeneratorLog.createdAt, beforeDate)).returning();
      return result.length;
    }
    const result = await db.delete(apiGeneratorLog).returning();
    return result.length;
  }
}

export const storage = new DatabaseStorage();
