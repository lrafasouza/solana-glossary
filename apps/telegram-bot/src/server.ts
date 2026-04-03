// src/server.ts
import express from "express";
import { webhookCallback } from "grammy";
import { bot } from "./bot.js";
import { config } from "./config.js";

async function start() {
  if (config.isProduction) {
    // Webhook mode — used on Railway
    const app = express();
    app.use(express.json());
    app.use("/webhook", webhookCallback(bot, "express"));

    app.listen(config.port, () => {
      console.log(`Webhook server running on port ${config.port}`);
    });

    await bot.api.setWebhook(`${config.webhookDomain}/webhook`);
    console.log(`Webhook set to ${config.webhookDomain}/webhook`);
  } else {
    // Long polling — used locally
    console.log("Starting bot in long polling mode...");
    await bot.start({
      onStart: (info) => console.log(`Bot @${info.username} started`),
    });
  }
}

start().catch((err) => {
  console.error("Failed to start bot:", err);
  process.exit(1);
});
