// src/commands/language.ts
import type { MyContext, SessionData } from "../context.js";

const VALID_LANGUAGES = ["pt", "en", "es"] as const;
type Lang = (typeof VALID_LANGUAGES)[number];

function isValidLang(value: string): value is Lang {
  return (VALID_LANGUAGES as readonly string[]).includes(value);
}

export async function languageCommand(ctx: MyContext): Promise<void> {
  const input = (ctx.match as string).trim().toLowerCase();

  if (!input || !isValidLang(input)) {
    await ctx.reply(ctx.t("language-invalid"), { parse_mode: "HTML" });
    return;
  }

  ctx.session.language = input as SessionData["language"];
  // Switch locale for the current request so the confirmation is in the new language
  await ctx.i18n.setLocale(input);
  await ctx.reply(ctx.t("language-changed"), { parse_mode: "HTML" });
}
