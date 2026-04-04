import { db } from "../db/index.js";
import { buildTermKeyboard } from "../utils/keyboard.js";
import { findTermsInText } from "../utils/search.js";
import { buildEnrichedTermCard } from "../utils/term-card.js";
import type { MyContext } from "../context.js";

export async function explainCommand(ctx: MyContext): Promise<void> {
  const repliedText =
    ctx.message?.reply_to_message?.text ??
    ctx.message?.reply_to_message?.caption ??
    "";

  if (!repliedText) {
    await ctx.reply(ctx.t("explain-no-reply"), { parse_mode: "HTML" });
    return;
  }

  const matches = findTermsInText(repliedText);
  if (matches.length === 0) {
    await ctx.reply(ctx.t("explain-not-found"), { parse_mode: "HTML" });
    return;
  }

  const userId = ctx.from?.id;

  for (const term of matches.slice(0, 3)) {
    if (userId) {
      db.addHistory(userId, term.id);
    }

    const card = await buildEnrichedTermCard(
      term,
      ctx.t.bind(ctx),
      ctx.session.language || "en",
    );

    await ctx.reply(card, {
      parse_mode: "HTML",
      reply_markup: buildTermKeyboard(term.id, ctx.t.bind(ctx), userId),
    });
  }
}
