import { db } from "./server/db";
import { users, priceConfig, feature, modname, ftext, onoff, games, gameDurations } from "./shared/schema";
import { hashPassword } from "./server/auth";

async function seed() {
  console.log("Seeding database...");

  const [existingAdmin] = await db.select().from(users).limit(1);
  if (existingAdmin) {
    console.log("Database already has users. Skipping seed.");
    process.exit(0);
  }

  await db.insert(users).values({
    username: "admin",
    fullname: "Administrator",
    email: "admin@keypanel.local",
    password: hashPassword("admin123"),
    saldo: 999999,
    level: 1,
    status: 1,
  } as any);
  console.log("Created owner: username=admin, password=admin123");

  await db.insert(priceConfig).values([
    { duration: 1, price: 500, isActive: 1 },
    { duration: 2, price: 1000, isActive: 1 },
    { duration: 24, price: 5000, isActive: 1 },
    { duration: 168, price: 25000, isActive: 1 },
    { duration: 720, price: 75000, isActive: 1 },
  ]);
  console.log("Inserted default price tiers.");

  await db.insert(feature).values({
    ESP: "on",
    Item: "on",
    AIM: "on",
    SilentAim: "off",
    BulletTrack: "off",
    Floating: "off",
    Memory: "off",
    Setting: "off",
  } as any);
  console.log("Inserted default feature flags.");

  await db.insert(modname).values({ modname: "PowerHouse" } as any);
  console.log("Set default mod name.");

  await db.insert(ftext).values({ _status: "on", _ftext: "Welcome" } as any);
  console.log("Set default floating text.");

  await db.insert(onoff).values({ status: "off", myinput: "" } as any);
  console.log("Set maintenance mode to OFF.");

  const [pubgGame] = await db.insert(games).values({
    name: "PUBG",
    slug: "pubg",
    displayName: "PUBG Mobile",
    description: "PUBG Mobile game",
    isActive: 1,
  } as any).returning();
  console.log("Created default PUBG game.");

  await db.insert(gameDurations).values([
    { gameId: pubgGame.id, durationHours: 1, label: "1 Hour Trial", price: 500, isActive: 1 },
    { gameId: pubgGame.id, durationHours: 2, label: "2 Hours Trial", price: 1000, isActive: 1 },
    { gameId: pubgGame.id, durationHours: 24, label: "1 Day", price: 5000, isActive: 1 },
    { gameId: pubgGame.id, durationHours: 168, label: "1 Week", price: 25000, isActive: 1 },
    { gameId: pubgGame.id, durationHours: 720, label: "1 Month", price: 75000, isActive: 1 },
  ] as any);
  console.log("Created default PUBG game durations.");

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
