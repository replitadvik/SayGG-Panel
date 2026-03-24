import crypto from "crypto";

export function hashPassword(password: string): string {
  const salted = crypto.createHash("md5").update(password).digest("hex");
  return crypto.createHash("sha256").update(salted).digest("hex");
}

export function verifyPassword(plain: string, hashed: string): boolean {
  return hashPassword(plain) === hashed;
}

export function generateKeyLicense(durationHours: number): string {
  let durationLabel: string;
  switch (durationHours) {
    case 24: durationLabel = "Day"; break;
    case 168: durationLabel = "Week"; break;
    case 720: durationLabel = "Month"; break;
    case 1440: durationLabel = "Season"; break;
    default:
      if (durationHours < 24) {
        durationLabel = "Trial";
      } else if (durationHours % 720 === 0) {
        durationLabel = `${durationHours / 720}Months`;
      } else if (durationHours % 168 === 0) {
        durationLabel = `${durationHours / 168}Weeks`;
      } else if (durationHours % 24 === 0) {
        durationLabel = `${durationHours / 24}Days`;
      } else {
        durationLabel = "Custom";
      }
      break;
  }
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 5; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SayGG_${durationLabel}_${suffix}`;
}

export function getDurationLabel(hours: number): string {
  if (hours === 1) return "1 Hours Trail";
  if (hours === 2) return "2 Hours Trail";
  if (hours < 24) return `${hours} Hours`;
  if (hours % 720 === 0) return `${hours / 720} Months`;
  if (hours % 24 === 0) return `${hours / 24} Days`;
  return `${hours} Hours`;
}

export function formatDuration(hours: number): string {
  if (hours === 1) return "1 Hour";
  if (hours >= 2 && hours < 24) return `${hours} Hours`;
  if (hours === 24) return "1 Day";
  return `${(hours / 24).toFixed(0)} Days`;
}

export function getPrice(prices: Record<number, number>, duration: number, maxDevices: number): number {
  const base = prices[duration] || 0;
  return base * maxDevices;
}

const TTL_REGEX = /^(\d+)(m|h|d)$/;

export function parseTtl(value: string): number | null {
  const match = value.trim().match(TTL_REGEX);
  if (!match) return null;
  const num = parseInt(match[1]);
  if (num <= 0) return null;
  switch (match[2]) {
    case "m": return num * 60 * 1000;
    case "h": return num * 60 * 60 * 1000;
    case "d": return num * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

export function isValidTtlFormat(value: string): boolean {
  return TTL_REGEX.test(value.trim());
}

const ENV_NORMAL_TTL = process.env.AUTH_NORMAL_TOKEN_TTL || "30m";
const ENV_REMEMBER_TTL = process.env.AUTH_REMEMBER_ME_TOKEN_TTL || "24h";

export function getDefaultNormalTtlMs(): number {
  return parseTtl(ENV_NORMAL_TTL) || 30 * 60 * 1000;
}

export function getDefaultRememberMeTtlMs(): number {
  return parseTtl(ENV_REMEMBER_TTL) || 24 * 60 * 60 * 1000;
}

export function getEnvNormalTtl(): string {
  return ENV_NORMAL_TTL;
}

export function getEnvRememberMeTtl(): string {
  return ENV_REMEMBER_TTL;
}

export function getLevelName(level: number): string {
  switch (level) {
    case 1: return "Owner";
    case 2: return "Admin";
    case 3: return "Reseller";
    default: return "Unknown";
  }
}
