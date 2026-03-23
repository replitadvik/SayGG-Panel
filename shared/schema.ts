import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id_users").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  fullname: varchar("fullname", { length: 100 }),
  email: varchar("email", { length: 100 }),
  password: text("password").notNull(),
  saldo: integer("saldo").default(0).notNull(),
  level: integer("level").default(3).notNull(),
  status: integer("status").default(0).notNull(),
  uplink: varchar("uplink", { length: 50 }),
  userIp: varchar("user_ip", { length: 45 }),
  expirationDate: timestamp("expiration_date"),
  deviceId: varchar("device_id", { length: 255 }),
  deviceResetCount: integer("device_reset_count").default(0).notNull(),
  lastResetAt: timestamp("last_reset_at"),
  telegramChatId: varchar("telegram_chat_id", { length: 30 }),
  twofaEnabled: integer("twofa_enabled").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const keysCode = pgTable("keys_code", {
  id: serial("id_keys").primaryKey(),
  game: varchar("game", { length: 100 }).notNull(),
  userKey: varchar("user_key", { length: 100 }).notNull(),
  duration: integer("duration").notNull(),
  expiredDate: timestamp("expired_date"),
  maxDevices: integer("max_devices").default(1).notNull(),
  devices: text("devices"),
  status: integer("status").default(1).notNull(),
  registrator: varchar("registrator", { length: 50 }),
  adminId: integer("admin_id"),
  keyResetTime: text("key_reset_time"),
  keyResetToken: varchar("key_reset_token", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const referralCode = pgTable("referral_code", {
  id: serial("id_reff").primaryKey(),
  code: text("code").notNull(),
  referral: varchar("Referral", { length: 100 }),
  setSaldo: integer("set_saldo").default(0),
  level: integer("level").default(3),
  usedBy: varchar("used_by", { length: 100 }),
  createdBy: varchar("created_by", { length: 100 }),
  accExpiration: varchar("acc_expiration", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const priceConfig = pgTable("price_config", {
  duration: integer("duration").primaryKey(),
  price: integer("price").notNull(),
  isActive: integer("is_active").default(1).notNull(),
});

export const feature = pgTable("feature", {
  id: serial("id").primaryKey(),
  ESP: varchar("ESP", { length: 10 }).default("off"),
  Item: varchar("Item", { length: 10 }).default("off"),
  AIM: varchar("AIM", { length: 10 }).default("off"),
  SilentAim: varchar("SilentAim", { length: 10 }).default("off"),
  BulletTrack: varchar("BulletTrack", { length: 10 }).default("off"),
  Floating: varchar("Floating", { length: 10 }).default("off"),
  Memory: varchar("Memory", { length: 10 }).default("off"),
  Setting: varchar("Setting", { length: 10 }).default("off"),
});

export const modname = pgTable("modname", {
  id: serial("id").primaryKey(),
  modname: varchar("modname", { length: 255 }),
});

export const ftext = pgTable("_ftext", {
  id: serial("id").primaryKey(),
  _status: text("_status"),
  _ftext: text("_ftext"),
});

export const onoff = pgTable("onoff", {
  id: serial("id").primaryKey(),
  status: varchar("status", { length: 10 }).default("off"),
  myinput: text("myinput"),
});

export const history = pgTable("history", {
  id: serial("id").primaryKey(),
  keysId: integer("keys_id"),
  userId: integer("id_user"),
  userDo: varchar("user_do", { length: 100 }),
  info: text("info"),
  activity: varchar("activity", { length: 100 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessionSettings = pgTable("session_settings", {
  id: serial("id").primaryKey(),
  normalTtl: varchar("normal_ttl", { length: 20 }).default("30m").notNull(),
  rememberMeTtl: varchar("remember_me_ttl", { length: 20 }).default("24h").notNull(),
  changedBy: varchar("changed_by", { length: 50 }),
  changedAt: timestamp("changed_at").defaultNow(),
});

export const connectConfig = pgTable("connect_config", {
  id: serial("id").primaryKey(),
  gameName: varchar("game_name", { length: 100 }).default("PUBG").notNull(),
  activeSecret: text("active_secret").notNull(),
  previousSecret: text("previous_secret"),
  secretVersion: integer("secret_version").default(1).notNull(),
  gracePeriodUntil: timestamp("grace_period_until"),
  changedBy: varchar("changed_by", { length: 50 }),
  changedAt: timestamp("changed_at").defaultNow(),
});

export const loginThrottle = pgTable("login_throttle", {
  id: serial("id").primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  blockedUntil: timestamp("blocked_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKeySchema = createInsertSchema(keysCode).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferralSchema = createInsertSchema(referralCode).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(4).max(25),
  password: z.string().min(6).max(45),
  stayLog: z.boolean().optional(),
  rememberMe: z.boolean().optional(),
  deviceId: z.string().optional(),
});

export const registerSchema = z.object({
  email: z.string().email().min(13).max(40),
  username: z.string().min(4).max(25).regex(/^[a-zA-Z0-9]+$/),
  fullname: z.string().min(4).max(100),
  telegramChatId: z.string().min(6).max(20).regex(/^\d+$/),
  password: z.string().min(6).max(45),
  password2: z.string().min(6).max(45),
  referral: z.string().min(6),
});

export const generateKeySchema = z.object({
  game: z.string().min(1),
  duration: z.number().int().min(1),
  maxDevices: z.number().int().min(1),
  customInput: z.enum(["random", "custom"]).optional(),
  customLicense: z.string().min(4).max(19).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertKey = z.infer<typeof insertKeySchema>;
export type Key = typeof keysCode.$inferSelect;
export type ReferralCode = typeof referralCode.$inferSelect;
export type PriceConfig = typeof priceConfig.$inferSelect;
export type Feature = typeof feature.$inferSelect;
export type History = typeof history.$inferSelect;
export type ConnectConfig = typeof connectConfig.$inferSelect;
export type SessionSettings = typeof sessionSettings.$inferSelect;
