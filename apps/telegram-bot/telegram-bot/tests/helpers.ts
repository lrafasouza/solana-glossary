// tests/helpers.ts
import { vi } from "vitest";
import type { MyContext, SessionData } from "../src/context.js";

export function createMockCtx(options?: {
  text?: string;
  match?: string;
  languageCode?: string;
  sessionLanguage?: SessionData["language"];
  chatType?: "private" | "group" | "supergroup" | "channel";
}): MyContext {
  const opts = options ?? {};
  return {
    reply: vi.fn().mockResolvedValue(undefined),
    answerInlineQuery: vi.fn().mockResolvedValue(undefined),
    answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
    editMessageText: vi.fn().mockResolvedValue(undefined),
    me: { username: "SolanaGlossaryBot" },
    from: {
      id: 123,
      language_code: opts.languageCode ?? "en",
      first_name: "Test",
      is_bot: false,
    },
    chat: { type: opts.chatType ?? "private", id: 456 },
    match: opts.match ?? "",
    message: { text: opts.text ?? "" },
    session: { language: opts.sessionLanguage },
    inlineQuery: {
      query: opts.match ?? "",
      id: "test-inline-id",
    },
    callbackQuery: {
      data: opts.match ?? "",
      id: "test-cb-id",
    },
    t: (key: string, _params?: Record<string, unknown>) => `[${key}]`,
  } as unknown as MyContext;
}
