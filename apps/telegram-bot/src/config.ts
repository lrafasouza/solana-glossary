// src/config.ts
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config = {
  botToken: requireEnv("BOT_TOKEN"),
  webhookDomain: process.env["WEBHOOK_DOMAIN"] ?? "",
  port: parseInt(process.env["PORT"] ?? "3000", 10),
  isProduction: !!process.env["WEBHOOK_DOMAIN"],
};
