import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import {
  users, keysCode, referralCode, priceConfig,
  feature, modname, ftext, onoff, history, loginThrottle, connectConfig, sessionSettings,
  type User, type Key, type ReferralCode, type PriceConfig,
  type Feature, type History, type ConnectConfig, type SessionSettings,
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

  getReferralCodes(): Promise<ReferralCode[]>;
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
  getFtext(): Promise<{ _status: string | null; _ftext: string | null } | undefined>;
  updateFtext(data: { _status?: string; _ftext?: string }): Promise<void>;
  getMaintenanceStatus(): Promise<{ status: string; myinput: string | null } | undefined>;
  updateMaintenance(status: string, myinput?: string): Promise<void>;

  createHistory(data: Partial<History>): Promise<void>;

  blockKeysByRegistrator(registrator: string): Promise<void>;

  getThrottle(identifier: string): Promise<{ attempts: number; blockedUntil: Date | null } | undefined>;
  recordLoginFailure(identifier: string): Promise<void>;
  clearThrottle(identifier: string): Promise<void>;

  getConnectConfig(): Promise<ConnectConfig | undefined>;
  upsertConnectConfig(data: Partial<ConnectConfig>): Promise<ConnectConfig>;
  rotateConnectSecret(newSecret: string, changedBy: string, gracePeriodMinutes?: number): Promise<ConnectConfig>;

  getSessionSettings(): Promise<SessionSettings | undefined>;
  upsertSessionSettings(data: Partial<SessionSettings>): Promise<SessionSettings>;
  deleteSessionSettings(): Promise<void>;
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
    for (const id of ids) {
      await db.delete(keysCode).where(eq(keysCode.id, id));
    }
  }

  async getReferralCodes(): Promise<ReferralCode[]> {
    return db.select().from(referralCode).orderBy(desc(referralCode.id));
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
        changedBy,
        changedAt: new Date(),
      } as any).returning();
      return created;
    }
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
}

export const storage = new DatabaseStorage();
