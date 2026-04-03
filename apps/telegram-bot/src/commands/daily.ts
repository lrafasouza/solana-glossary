// src/commands/daily.ts
import { allTerms } from "@stbr/solana-glossary";
import { formatTermCard } from "../utils/format.js";
import { buildTermKeyboard } from "../utils/keyboard.js";
import type { MyContext } from "../context.js";

/** Returns the same term for every user on a given day (date-based seed) */
function getDailyTerm() {
  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  return allTerms[seed % allTerms.length];
}

export async function dailyTermCommand(ctx: MyContext): Promise<void> {
  const term = getDailyTerm();
  const header = `📅 <b>${ctx.t("daily-term-header")}</b>\n\n`;
  const card = formatTermCard(term, ctx.t.bind(ctx));
  await ctx.reply(header + card, {
    parse_mode: "HTML",
    reply_markup: buildTermKeyboard(term.id, ctx.t.bind(ctx)),
  });
}
