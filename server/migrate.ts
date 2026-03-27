import { pool } from "./db";

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id_users" serial PRIMARY KEY NOT NULL,
        "username" varchar(50) NOT NULL,
        "fullname" varchar(100),
        "email" varchar(100),
        "password" text NOT NULL,
        "saldo" integer DEFAULT 0 NOT NULL,
        "level" integer DEFAULT 3 NOT NULL,
        "status" integer DEFAULT 0 NOT NULL,
        "uplink" varchar(50),
        "user_ip" varchar(45),
        "expiration_date" timestamp,
        "device_id" varchar(255),
        "device_reset_count" integer DEFAULT 0 NOT NULL,
        "last_reset_at" timestamp,
        "telegram_chat_id" varchar(30),
        "twofa_enabled" integer DEFAULT 0 NOT NULL,
        "max_key_edits" integer DEFAULT 3 NOT NULL,
        "max_devices_limit" integer DEFAULT 1000 NOT NULL,
        "max_key_extends" integer DEFAULT 5 NOT NULL,
        "max_key_resets" integer DEFAULT 3 NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "users_username_unique" UNIQUE("username")
      )
    `);

    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "max_key_edits" integer DEFAULT 3 NOT NULL`);
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "max_devices_limit" integer DEFAULT 1000 NOT NULL`);
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "max_key_extends" integer DEFAULT 5 NOT NULL`);
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "max_key_resets" integer DEFAULT 3 NOT NULL`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "games" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "slug" varchar(100) NOT NULL,
        "display_name" varchar(100) NOT NULL,
        "description" text,
        "is_active" integer DEFAULT 1 NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "games_name_unique" UNIQUE("name"),
        CONSTRAINT "games_slug_unique" UNIQUE("slug")
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "game_durations" (
        "id" serial PRIMARY KEY NOT NULL,
        "game_id" integer NOT NULL,
        "duration_hours" integer NOT NULL,
        "label" varchar(50) NOT NULL,
        "price" integer DEFAULT 0 NOT NULL,
        "is_active" integer DEFAULT 1 NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "keys_code" (
        "id_keys" serial PRIMARY KEY NOT NULL,
        "game" varchar(100) NOT NULL,
        "game_id" integer,
        "user_key" varchar(100) NOT NULL,
        "duration" integer NOT NULL,
        "expired_date" timestamp,
        "max_devices" integer DEFAULT 1 NOT NULL,
        "devices" text,
        "status" integer DEFAULT 1 NOT NULL,
        "registrator" varchar(50),
        "admin_id" integer,
        "key_reset_time" text,
        "key_reset_token" varchar(255),
        "edit_count" integer DEFAULT 0 NOT NULL,
        "extend_count" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);

    await client.query(`ALTER TABLE "keys_code" ADD COLUMN IF NOT EXISTS "game_id" integer`);
    await client.query(`ALTER TABLE "keys_code" ADD COLUMN IF NOT EXISTS "edit_count" integer DEFAULT 0 NOT NULL`);
    await client.query(`ALTER TABLE "keys_code" ADD COLUMN IF NOT EXISTS "extend_count" integer DEFAULT 0 NOT NULL`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "referral_code" (
        "id_reff" serial PRIMARY KEY NOT NULL,
        "code" text NOT NULL,
        "Referral" varchar(100),
        "set_saldo" integer DEFAULT 0,
        "level" integer DEFAULT 3,
        "used_by" varchar(100),
        "created_by" varchar(100),
        "acc_expiration" varchar(100),
        "max_key_edits" integer DEFAULT 3,
        "max_devices_limit" integer DEFAULT 1000,
        "max_key_extends" integer DEFAULT 5,
        "max_key_resets" integer DEFAULT 3,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);

    await client.query(`ALTER TABLE "referral_code" ADD COLUMN IF NOT EXISTS "max_key_edits" integer DEFAULT 3`);
    await client.query(`ALTER TABLE "referral_code" ADD COLUMN IF NOT EXISTS "max_devices_limit" integer DEFAULT 1000`);
    await client.query(`ALTER TABLE "referral_code" ADD COLUMN IF NOT EXISTS "max_key_extends" integer DEFAULT 5`);
    await client.query(`ALTER TABLE "referral_code" ADD COLUMN IF NOT EXISTS "max_key_resets" integer DEFAULT 3`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "price_config" (
        "duration" integer PRIMARY KEY NOT NULL,
        "price" integer NOT NULL,
        "is_active" integer DEFAULT 1 NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "feature" (
        "id" serial PRIMARY KEY NOT NULL,
        "ESP" varchar(10) DEFAULT 'off',
        "Item" varchar(10) DEFAULT 'off',
        "AIM" varchar(10) DEFAULT 'off',
        "SilentAim" varchar(10) DEFAULT 'off',
        "BulletTrack" varchar(10) DEFAULT 'off',
        "Floating" varchar(10) DEFAULT 'off',
        "Memory" varchar(10) DEFAULT 'off',
        "Setting" varchar(10) DEFAULT 'off'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "modname" (
        "id" serial PRIMARY KEY NOT NULL,
        "modname" varchar(255)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "site_config" (
        "id" serial PRIMARY KEY NOT NULL,
        "site_name" varchar(255)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "_ftext" (
        "id" serial PRIMARY KEY NOT NULL,
        "_status" text,
        "_ftext" text
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "onoff" (
        "id" serial PRIMARY KEY NOT NULL,
        "status" varchar(10) DEFAULT 'off',
        "myinput" text
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "history" (
        "id" serial PRIMARY KEY NOT NULL,
        "keys_id" integer,
        "id_user" integer,
        "user_do" varchar(100),
        "info" text,
        "activity" varchar(100),
        "description" text,
        "created_at" timestamp DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "login_throttle" (
        "id" serial PRIMARY KEY NOT NULL,
        "identifier" varchar(255) NOT NULL,
        "attempts" integer DEFAULT 0 NOT NULL,
        "blocked_until" timestamp,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "session_settings" (
        "id" serial PRIMARY KEY NOT NULL,
        "normal_ttl" varchar(20) DEFAULT '30m' NOT NULL,
        "remember_me_ttl" varchar(20) DEFAULT '24h' NOT NULL,
        "changed_by" varchar(50),
        "changed_at" timestamp DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "connect_config" (
        "id" serial PRIMARY KEY NOT NULL,
        "game_name" varchar(100) DEFAULT 'PUBG' NOT NULL,
        "active_secret" text NOT NULL,
        "previous_secret" text,
        "secret_version" integer DEFAULT 1 NOT NULL,
        "grace_period_until" timestamp,
        "created_by" varchar(50),
        "changed_by" varchar(50),
        "created_at" timestamp DEFAULT now(),
        "changed_at" timestamp DEFAULT now()
      )
    `);

    await client.query(`ALTER TABLE "connect_config" ADD COLUMN IF NOT EXISTS "created_by" varchar(50)`);
    await client.query(`ALTER TABLE "connect_config" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now()`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "connect_audit_log" (
        "id" serial PRIMARY KEY NOT NULL,
        "action_type" varchar(50) NOT NULL,
        "entity_type" varchar(50) NOT NULL,
        "old_value" text,
        "new_value" text,
        "actor_user_id" integer,
        "actor_username" varchar(50),
        "note" text,
        "created_at" timestamp DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_uplink" ON "users" ("uplink")
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_status" ON "users" ("status")
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_level" ON "users" ("level")
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_game_durations_game_id" ON "game_durations" ("game_id")
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_keys_registrator" ON "keys_code" ("registrator")
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_keys_game_id" ON "keys_code" ("game_id")
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_keys_status" ON "keys_code" ("status")
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "api_generator_config" (
        "id" serial PRIMARY KEY NOT NULL,
        "enabled" integer DEFAULT 0 NOT NULL,
        "token" text NOT NULL,
        "segment_1" varchar(100) NOT NULL,
        "segment_2" varchar(100) NOT NULL,
        "segment_3" varchar(100) NOT NULL,
        "segment_4" varchar(100) NOT NULL,
        "segment_5" varchar(100) NOT NULL,
        "max_quantity" integer DEFAULT 10 NOT NULL,
        "registrator" varchar(100) DEFAULT 'SayGG' NOT NULL,
        "rate_limit_enabled" integer DEFAULT 1 NOT NULL,
        "rate_limit_window" integer DEFAULT 60 NOT NULL,
        "rate_limit_max_requests" integer DEFAULT 10 NOT NULL,
        "custom_duration_enabled" integer DEFAULT 0 NOT NULL,
        "custom_duration_max_hours" integer DEFAULT 8760 NOT NULL,
        "ip_allowlist" text,
        "last_rotated_at" timestamp,
        "last_used_at" timestamp,
        "changed_by" varchar(50),
        "changed_at" timestamp DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "api_generator_log" (
        "id" serial PRIMARY KEY NOT NULL,
        "ip" varchar(45),
        "user_agent" text,
        "game" varchar(100),
        "duration" varchar(50),
        "max_devices" integer,
        "quantity" integer,
        "currency" varchar(50),
        "success" integer DEFAULT 0 NOT NULL,
        "reason" text,
        "generated_key_ids" text,
        "generated_key_values" text,
        "resolved_duration_hours" integer,
        "duration_source" varchar(20),
        "token_used" integer DEFAULT 0 NOT NULL,
        "route_matched" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_api_gen_log_created" ON "api_generator_log"("created_at")
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_api_gen_log_success" ON "api_generator_log"("success")
    `);

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_generator_config' AND column_name='custom_duration_enabled') THEN
          ALTER TABLE "api_generator_config" ADD COLUMN "custom_duration_enabled" integer DEFAULT 0 NOT NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_generator_config' AND column_name='custom_duration_max_hours') THEN
          ALTER TABLE "api_generator_config" ADD COLUMN "custom_duration_max_hours" integer DEFAULT 8760 NOT NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_generator_log' AND column_name='resolved_duration_hours') THEN
          ALTER TABLE "api_generator_log" ADD COLUMN "resolved_duration_hours" integer;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_generator_log' AND column_name='duration_source') THEN
          ALTER TABLE "api_generator_log" ADD COLUMN "duration_source" varchar(20);
        END IF;
      END $$;
    `);

    await client.query("COMMIT");
    console.log("[migrate] Schema sync complete");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[migrate] Migration failed:", err);
    throw err;
  } finally {
    client.release();
  }
}
