// tests/commands/language.test.ts
import { describe, it, expect, vi } from "vitest";
import { languageCommand } from "../../src/commands/language.js";
import { createMockCtx } from "../helpers.js";

describe("languageCommand", () => {
  it("sets session language and replies with confirmation", async () => {
    const ctx = createMockCtx({ match: "pt" });
    await languageCommand(ctx);
    expect(ctx.session.language).toBe("pt");
    expect(ctx.reply).toHaveBeenCalledOnce();
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("Idioma alterado para português.");
  });

  it("rejects invalid language codes", async () => {
    const ctx = createMockCtx({ match: "fr" });
    await languageCommand(ctx);
    expect(ctx.session.language).toBeUndefined();
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[language-invalid]");
  });

  it("rejects empty input", async () => {
    const ctx = createMockCtx({ match: "" });
    await languageCommand(ctx);
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[language-invalid]");
  });

  it("is case-insensitive (accepts PT, EN, ES uppercase)", async () => {
    const ctx = createMockCtx({ match: "ES" });
    await languageCommand(ctx);
    expect(ctx.session.language).toBe("es");
  });
});
