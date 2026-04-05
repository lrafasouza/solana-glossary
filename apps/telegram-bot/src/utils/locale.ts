import { db } from "../db/index.js";
import type { MyContext, SessionData } from "../context.js";

export type SupportedLocale = NonNullable<SessionData["language"]>;

export function getEffectiveLocale(ctx: Pick<MyContext, "chat" | "from" | "session">): SupportedLocale {
  const isGroup =
    ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";

  if (isGroup && ctx.chat?.id) {
    const groupLang = db.getGroupLanguage(ctx.chat.id);
    if (isSupportedLocale(groupLang)) return groupLang;
  }

  const sessionLang = ctx.session?.language;
  if (isSupportedLocale(sessionLang)) return sessionLang;

  const tgLang = ctx.from?.language_code ?? "";
  if (tgLang.startsWith("pt")) return "pt";
  if (tgLang.startsWith("es")) return "es";

  return "en";
}

function isSupportedLocale(value: string | undefined): value is SupportedLocale {
  return value === "pt" || value === "en" || value === "es";
}
