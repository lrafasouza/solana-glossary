// src/commands/start.ts
import { InlineKeyboard } from "grammy";
import { lookupTerm } from "../utils/search.js";
import { formatTermCard } from "../utils/format.js";
import { buildTermKeyboard } from "../utils/keyboard.js";
import type { MyContext } from "../context.js";

// Optional banner image — replace with your own hosted image URL, or set to "" to skip
export const BANNER_URL = "";

const LANGUAGE_PICKER = `🌐 <b>Choose your language</b>
Escolha seu idioma
Elige tu idioma`;

const languageKeyboard = new InlineKeyboard()
  .text("🇧🇷 Português", "lang:pt")
  .text("🇺🇸 English", "lang:en")
  .text("🇪🇸 Español", "lang:es");

export async function startCommand(ctx: MyContext): Promise<void> {
  const deepLink = (ctx.match as string).trim();

  // Deep link: /start proof-of-history → show term directly
  if (deepLink) {
    const result = lookupTerm(deepLink);
    if (result.type === "found") {
      const card = formatTermCard(result.term, ctx.t.bind(ctx));
      await ctx.reply(card, {
        parse_mode: "HTML",
        reply_markup: buildTermKeyboard(result.term.id, ctx.t.bind(ctx)),
      });
      return;
    }
  }

  // New user — no language set yet → show onboarding picker
  if (!ctx.session.language) {
    await ctx.reply(LANGUAGE_PICKER, {
      parse_mode: "HTML",
      reply_markup: languageKeyboard,
    });
    return;
  }

  // Returning user — show welcome with optional banner
  await sendWelcome(ctx);
}

export async function sendWelcome(ctx: MyContext): Promise<void> {
  const text = ctx.t("start-welcome", { bot_username: ctx.me.username });
  if (BANNER_URL) {
    await ctx.replyWithPhoto(BANNER_URL, { caption: text, parse_mode: "HTML" });
  } else {
    await ctx.reply(text, { parse_mode: "HTML" });
  }
}
