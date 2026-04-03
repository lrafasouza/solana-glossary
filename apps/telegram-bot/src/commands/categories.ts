// src/commands/categories.ts
import { InlineKeyboard } from "grammy";
import { getCategories, getTermsByCategory } from "@stbr/solana-glossary";
import type { Category } from "@stbr/solana-glossary";
import { formatTermList, formatCategoryName } from "../utils/format.js";
import { buildCategoryPageKeyboard } from "../utils/keyboard.js";
import type { MyContext } from "../context.js";

const VALID_CATEGORIES = new Set<string>(getCategories());
const PAGE_SIZE = 15;

export async function categoriesCommand(ctx: MyContext): Promise<void> {
  const categories = getCategories();

  // Build 2-column inline keyboard of clickable category buttons
  const keyboard = new InlineKeyboard();
  categories.forEach((cat: string, i: number) => {
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

  await sendCategoryTerms(ctx, input as Category, 1, false);
}

export async function sendCategoryTerms(
  ctx: MyContext,
  category: Category,
  page = 1,
  editMessage = false
): Promise<void> {
  const allTerms = getTermsByCategory(category);
  const totalPages = Math.ceil(allTerms.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageTerms = allTerms.slice(start, start + PAGE_SIZE);

  const header = ctx.t("category-header", {
    name: formatCategoryName(category),
    count: allTerms.length,
  });

  const text = formatTermList(pageTerms, `${header} (${ctx.t("btn-page", { current: page, total: totalPages })})`);
  const keyboard = totalPages > 1
    ? buildCategoryPageKeyboard(category, page, totalPages, ctx.t.bind(ctx))
    : undefined;

  if (editMessage && ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  } else {
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  }
}
