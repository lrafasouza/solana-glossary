// src/commands/start.ts
import type { MyContext } from "../context.js";

export async function startCommand(ctx: MyContext): Promise<void> {
  await ctx.reply(
    ctx.t("start-welcome", { bot_username: ctx.me.username }),
    { parse_mode: "HTML" }
  );
}
