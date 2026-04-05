import { describe, it, expect, vi } from "vitest";
import { createMockCtx } from "../helpers.js";
import { handleBotAdded } from "../../src/handlers/group.js";

describe("handleBotAdded", () => {
  it("welcomes the group when the bot is added", async () => {
    const ctx = createMockCtx({ chatType: "group" });
    (ctx as any).myChatMember = {
      old_chat_member: { status: "left" },
      new_chat_member: { status: "member" },
    };
    await handleBotAdded(ctx);
    expect(ctx.reply).toHaveBeenCalledOnce();
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[group-welcome]");
  });

  it("ignores unrelated membership changes", async () => {
    const ctx = createMockCtx({ chatType: "group" });
    (ctx as any).myChatMember = {
      old_chat_member: { status: "member" },
      new_chat_member: { status: "administrator" },
    };
    await handleBotAdded(ctx);
    expect(ctx.reply).not.toHaveBeenCalled();
  });
});
