import { storage } from "./storage";
import { hashPassword } from "./auth";

export async function runEnvBootstrap(): Promise<void> {
  const username = process.env.BOOTSTRAP_OWNER_USERNAME;
  const password = process.env.BOOTSTRAP_OWNER_PASSWORD;

  if (!username || !password) return;

  const allUsers = await storage.getAllUsers();
  if (allUsers.length > 0) {
    console.log("[bootstrap] Users already exist, skipping env bootstrap");
    return;
  }

  const fullname = process.env.BOOTSTRAP_OWNER_NAME || username;

  await storage.createUser({
    username: username.trim(),
    password: hashPassword(password),
    fullname: fullname.trim(),
    level: 1,
    status: 1,
    saldo: 0,
  });

  console.log(`[bootstrap] First owner "${username}" created from env vars`);
}
