// src/commands/categories.ts
import { getCategories, getTermsByCategory } from "@stbr/solana-glossary";
import type { Category } from "@stbr/solana-glossary";
import { formatCategoryList, formatTermList, formatCategoryName } from "../utils/format.js";
import type { MyContext } from "../context.js";

const VALID_CATEGORIES = new Set<string>(getCategories());

export async function categoriesCommand(ctx: MyContext): Promise<void> {
  const categories = getCategories();
  const text = formatCategoryList(categories, ctx.t.bind(ctx));
  await ctx.reply(text, { parse_mode: "HTML" });
}

export async function categoryCommand(ctx: MyContext): Promise<void> {
  const input = (ctx.match as string).trim().toLowerCase();

  if (!input) {
    await ctx.reply(ctx.t("usage-category"), { parse_mode: "HTML" });
    return;
  }

  if (!VALID_CATEGORIES.has(input)) {
    await ctx.reply(ctx.t("category-not-found", { name: input }), { parse_mode: "HTML" });
    return;
  }

  const terms = getTermsByCategory(input as Category);
  const header = ctx.t("category-header", {
    name: formatCategoryName(input),
    count: terms.length,
  });
  const text = formatTermList(terms, header);

  // Telegram message limit is 4096 chars — truncate if needed
  const truncated = text.length > 4000 ? text.slice(0, 3990) + "\n…" : text;

  await ctx.reply(truncated, { parse_mode: "HTML" });
}
