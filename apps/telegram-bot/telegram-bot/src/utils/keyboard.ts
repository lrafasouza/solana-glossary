// src/utils/keyboard.ts
import { InlineKeyboard } from "grammy";
import type { GlossaryTerm } from "@stbr/solana-glossary";
import type { MyContext } from "../context.js";

export function buildTermKeyboard(termId: string, t: MyContext["t"]): InlineKeyboard {
  return new InlineKeyboard()
    .text(t("btn-related"), `related:${termId}`)
    .text(t("btn-category"), `category:${termId}`);
}

export function buildSelectKeyboard(terms: GlossaryTerm[]): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  terms.forEach((term, i) => {
    keyboard.text(term.term, `select:${term.id}`);
    if (i < terms.length - 1) keyboard.row();
  });
  return keyboard;
}
