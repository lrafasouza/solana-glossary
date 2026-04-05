import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockCtx } from "../helpers.js";

const dbMock = vi.hoisted(() => ({
  getGroupLanguage: vi.fn(),
}));

vi.mock("../../src/db/index.js", () => ({
  db: dbMock,
  GROUP_STREAK_THRESHOLD: 2,
}));

vi.mock("../../src/glossary/index.js", () => ({
  getTerm: vi.fn(),
  getTermsByCategory: vi.fn(() => []),
  getCategories: vi.fn(() => []),
}));

vi.mock("../../src/utils/term-card.js", () => ({
  buildEnrichedTermCard: vi.fn(),
}));

import { handleMenuCallback } from "../../src/handlers/callbacks.js";

describe("menu callbacks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the progress submenu", async () => {
    const ctx = createMockCtx({ match: "menu:progress" });
    await handleMenuCallback(ctx);
    expect(ctx.editMessageText).toHaveBeenCalledOnce();
    const [text, opts] = (ctx.editMessageText as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[progress-menu-title]");
    expect(opts.reply_markup).toBeDefined();
  });

  it("opens the library submenu", async () => {
    const ctx = createMockCtx({ match: "menu:library" });
    await handleMenuCallback(ctx);
    expect(ctx.editMessageText).toHaveBeenCalledOnce();
    const [text, opts] = (ctx.editMessageText as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[library-menu-title]");
    expect(opts.reply_markup).toBeDefined();
  });
});
