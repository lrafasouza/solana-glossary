// src/commands/categories.ts
import { InlineKeyboard } from "grammy";
import { getCategories, getTermsByCategory } from "@stbr/solana-glossary";
import type { Category } from "@stbr/solana-glossary";
import { formatTermList, formatCategoryName } from "../utils/format.js";
import type { MyContext } from "../context.js";

const VALID_CATEGORIES = new Set<string>(getCategories());

export async function categoriesCommand(ctx: MyContext): Promise<void> {
  const categories = getCategories();

  // Build 2-column inline keyboard of clickable category buttons
  const keyboard = new InlineKeyboard();
  categories.forEach((cat, i) => {
    keyboard.text(formatCategoryName(cat), `browse_cat:${cat}`);
    if (i % 2 === 1) keyboard.row();
  });

  await ctx.reply(ctx.t("categories-choose"), {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
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

  await sendCategoryTerms(ctx, input as Category);
}

export async function sendCategoryTerms(ctx: MyContext, category: Category): Promise<void> {
  const terms = getTermsByCategory(category);
  const header = ctx.t("category-header", {
    name: formatCategoryName(category),
    count: terms.length,
  });
  const text = formatTermList(terms, header);
  await ctx.reply(text, { parse_mode: "HTML" });
}
