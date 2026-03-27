import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  index,
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
  maxKeyEdits: integer("max_key_edits").default(3).notNull(),
  maxDevicesLimit: integer("max_devices_limit").default(1000).notNull(),
  maxKeyExtends: integer("max_key_extends").default(5).notNull(),
  maxKeyResets: integer("max_key_resets").default(3).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_users_uplink").on(table.uplink),
  index("idx_users_status").on(table.status),
  index("idx_users_level").on(table.level),
]);

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  isActive: integer("is_active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gameDurations = pgTable("game_durations", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  durationHours: integer("duration_hours").notNull(),
  label: varchar("label", { length: 50 }).notNull(),
  price: integer("price").default(0).notNull(),
  isActive: integer("is_active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_game_durations_game_id").on(table.gameId),
]);

export const keysCode = pgTable("keys_code", {
  id: serial("id_keys").primaryKey(),
  game: varchar("game", { length: 100 }).notNull(),
  gameId: integer("game_id"),
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
  editCount: integer("edit_count").default(0).notNull(),
  extendCount: integer("extend_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_keys_registrator").on(table.registrator),
  index("idx_keys_game_userkey").on(table.game, table.userKey),
  index("idx_keys_game_id").on(table.gameId),
  index("idx_keys_status").on(table.status),
]);

export const referralCode = pgTable("referral_code", {
  id: serial("id_reff").primaryKey(),
  code: text("code").notNull(),
  referral: varchar("Referral", { length: 100 }),
  setSaldo: integer("set_saldo").default(0),
  level: integer("level").default(3),
  usedBy: varchar("used_by", { length: 100 }),
  createdBy: varchar("created_by", { length: 100 }),
  accExpiration: varchar("acc_expiration", { length: 100 }),
  maxKeyEdits: integer("max_key_edits").default(3),
  maxDevicesLimit: integer("max_devices_limit").default(1000),
  maxKeyExtends: integer("max_key_extends").default(5),
  maxKeyResets: integer("max_key_resets").default(3),
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

export const siteConfig = pgTable("site_config", {
  id: serial("id").primaryKey(),
  siteName: varchar("site_name", { length: 255 }),
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
  createdBy: varchar("created_by", { length: 50 }),
  changedBy: varchar("changed_by", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  changedAt: timestamp("changed_at").defaultNow(),
});

export const connectAuditLog = pgTable("connect_audit_log", {
  id: serial("id").primaryKey(),
  actionType: varchar("action_type", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  actorUserId: integer("actor_user_id"),
  actorUsername: varchar("actor_username", { length: 50 }),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const loginThrottle = pgTable("login_throttle", {
  id: serial("id").primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  blockedUntil: timestamp("blocked_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const apiGeneratorConfig = pgTable("api_generator_config", {
  id: serial("id").primaryKey(),
  enabled: integer("enabled").default(0).notNull(),
  token: text("token").notNull(),
  segment1: varchar("segment_1", { length: 100 }).notNull(),
  segment2: varchar("segment_2", { length: 100 }).notNull(),
  segment3: varchar("segment_3", { length: 100 }).notNull(),
  segment4: varchar("segment_4", { length: 100 }).notNull(),
  segment5: varchar("segment_5", { length: 100 }).notNull(),
  maxQuantity: integer("max_quantity").default(10).notNull(),
  registrator: varchar("registrator", { length: 100 }).default("SayGG").notNull(),
  rateLimitEnabled: integer("rate_limit_enabled").default(1).notNull(),
  rateLimitWindow: integer("rate_limit_window").default(60).notNull(),
  rateLimitMaxRequests: integer("rate_limit_max_requests").default(10).notNull(),
  customDurationEnabled: integer("custom_duration_enabled").default(0).notNull(),
  customDurationMaxHours: integer("custom_duration_max_hours").default(8760).notNull(),
  ipAllowlist: text("ip_allowlist"),
  lastRotatedAt: timestamp("last_rotated_at"),
  lastUsedAt: timestamp("last_used_at"),
  changedBy: varchar("changed_by", { length: 50 }),
  changedAt: timestamp("changed_at").defaultNow(),
});

export const apiGeneratorLog = pgTable("api_generator_log", {
  id: serial("id").primaryKey(),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("user_agent"),
  game: varchar("game", { length: 100 }),
  duration: varchar("duration", { length: 50 }),
  maxDevices: integer("max_devices"),
  quantity: integer("quantity"),
  currency: varchar("currency", { length: 50 }),
  success: integer("success").default(0).notNull(),
  reason: text("reason"),
  generatedKeyIds: text("generated_key_ids"),
  generatedKeyValues: text("generated_key_values"),
  resolvedDurationHours: integer("resolved_duration_hours"),
  durationSource: varchar("duration_source", { length: 20 }),
  tokenUsed: integer("token_used").default(0).notNull(),
  routeMatched: integer("route_matched").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_api_gen_log_created").on(table.createdAt),
  index("idx_api_gen_log_success").on(table.success),
]);

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
  game: z.string().optional(),
  gameId: z.number().int().min(1),
  duration: z.number().int().min(1),
  maxDevices: z.number().int().min(1),
  customInput: z.enum(["random", "custom"]).optional(),
  customLicense: z.string().min(4).max(19).optional(),
});

export const insertGameSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  isActive: z.number().int().min(0).max(1).optional(),
});

export const insertGameDurationSchema = z.object({
  gameId: z.number().int().min(1),
  durationHours: z.number().int().min(1),
  label: z.string().min(1).max(50),
  price: z.number().int().min(0),
  isActive: z.number().int().min(0).max(1).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertKey = z.infer<typeof insertKeySchema>;
export type Key = typeof keysCode.$inferSelect;
export type ReferralCode = typeof referralCode.$inferSelect;
export type PriceConfig = typeof priceConfig.$inferSelect;
export type Feature = typeof feature.$inferSelect;
export type SiteConfig = typeof siteConfig.$inferSelect;
export type History = typeof history.$inferSelect;
export type ConnectConfig = typeof connectConfig.$inferSelect;
export type ConnectAuditLog = typeof connectAuditLog.$inferSelect;
export type SessionSettings = typeof sessionSettings.$inferSelect;
export type Game = typeof games.$inferSelect;
export type GameDuration = typeof gameDurations.$inferSelect;
export type ApiGeneratorConfig = typeof apiGeneratorConfig.$inferSelect;
export type ApiGeneratorLog = typeof apiGeneratorLog.$inferSelect;
