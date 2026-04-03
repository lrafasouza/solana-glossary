// src/commands/glossary.ts
import { lookupTerm } from "../utils/search.js";
import { formatTermCard } from "../utils/format.js";
import { buildTermKeyboard, buildSelectKeyboard } from "../utils/keyboard.js";
import type { MyContext } from "../context.js";

export async function glossaryCommand(ctx: MyContext): Promise<void> {
  const query = (ctx.match as string).trim();

  if (!query) {
    await ctx.reply(ctx.t("usage-glossary"), { parse_mode: "HTML" });
    return;
  }

  const result = lookupTerm(query);

  if (result.type === "not-found") {
    await ctx.reply(ctx.t("term-not-found", { query }), { parse_mode: "HTML" });
    return;
  }

  if (result.type === "found") {
    const card = formatTermCard(result.term, ctx.t.bind(ctx));
    await ctx.reply(card, {
      parse_mode: "HTML",
      reply_markup: buildTermKeyboard(result.term.id, ctx.t.bind(ctx)),
    });
    return;
  }

  // Multiple results — show a selection list with inline buttons
  const header = ctx.t("multiple-results", { count: result.terms.length, query });
  await ctx.reply(header, {
    parse_mode: "HTML",
    reply_markup: buildSelectKeyboard(result.terms),
  });
}
