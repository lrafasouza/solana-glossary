import { describe, it, expect, vi } from "vitest";
import { explainCommand } from "../../src/commands/explain.js";
import { createMockCtx } from "../helpers.js";

describe("explainCommand", () => {
  it("prompts the user when there is no replied message", async () => {
    const ctx = createMockCtx({ text: "/explicar", chatType: "group" });
    await explainCommand(ctx);
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[explain-no-reply]");
  });

  it("returns a glossary card for a replied message with Solana terms", async () => {
    const ctx = createMockCtx({
      text: "/explicar",
      replyToText: "Gulf Stream and Proof of History make this fast.",
      chatType: "group",
    });
    await explainCommand(ctx);
    expect(ctx.reply).toHaveBeenCalled();
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("Proof of History");
  });
});
