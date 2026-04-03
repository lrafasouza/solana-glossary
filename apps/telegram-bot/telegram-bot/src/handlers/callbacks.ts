// src/handlers/callbacks.ts
import { getTerm, getTermsByCategory } from "@stbr/solana-glossary";
import { formatTermCard, formatTermList, formatCategoryName } from "../utils/format.js";
import { buildTermKeyboard } from "../utils/keyboard.js";
import type { MyContext } from "../context.js";

/** Strip HTML tags for use in plain-text callback popups */
function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

export async function handleRelatedCallback(ctx: MyContext): Promise<void> {
  const data = ctx.callbackQuery?.data ?? "";
  const termId = data.slice("related:".length);
  const term = getTerm(termId);

  if (!term || !term.related || term.related.length === 0) {
    await ctx.answerCallbackQuery({
      text: stripHtml(ctx.t("term-not-found", { query: termId })),
      show_alert: true,
    });
    return;
  }

  const relatedTerms = term.related
    .map((id) => getTerm(id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)
    .slice(0, 8);

  const header = `📂 <b>${ctx.t("term-related")}: ${term.term}</b>`;
  const text = formatTermList(relatedTerms, header);
  const truncated = text.length > 4000 ? text.slice(0, 3990) + "\n…" : text;

  await ctx.answerCallbackQuery();
  await ctx.reply(truncated, { parse_mode: "HTML" });
}

export async function handleCategoryCallback(ctx: MyContext): Promise<void> {
  const data = ctx.callbackQuery?.data ?? "";
  const termId = data.slice("category:".length);
  const term = getTerm(termId);

  if (!term) {
    await ctx.answerCallbackQuery({
      text: stripHtml(ctx.t("term-not-found", { query: termId })),
      show_alert: true,
    });
    return;
  }

  const terms = getTermsByCategory(term.category);
  const header = ctx.t("category-header", {
    name: formatCategoryName(term.category),
    count: terms.length,
  });
  const text = formatTermList(terms, header);
  const truncated = text.length > 4000 ? text.slice(0, 3990) + "\n…" : text;

  await ctx.answerCallbackQuery();
  await ctx.reply(truncated, { parse_mode: "HTML" });
}

export async function handleSelectCallback(ctx: MyContext): Promise<void> {
  const data = ctx.callbackQuery?.data ?? "";
  const termId = data.slice("select:".length);
  const term = getTerm(termId);

  if (!term) {
    await ctx.answerCallbackQuery({
      text: stripHtml(ctx.t("term-not-found", { query: termId })),
      show_alert: true,
    });
    return;
  }

  const card = formatTermCard(term, ctx.t.bind(ctx));
  await ctx.answerCallbackQuery();
  await ctx.reply(card, {
    parse_mode: "HTML",
    reply_markup: buildTermKeyboard(termId, ctx.t.bind(ctx)),
  });
}
