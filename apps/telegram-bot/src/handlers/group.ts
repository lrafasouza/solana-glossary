import type { MyContext } from "../context.js";

export async function handleBotAdded(ctx: MyContext): Promise<void> {
  const update = ctx.myChatMember;
  if (!update) return;

  const newStatus = update.new_chat_member.status;
  const oldStatus = update.old_chat_member.status;
  const chatType = ctx.chat?.type;

  const wasNotMember = oldStatus === "left" || oldStatus === "kicked";
  const isNowMember = newStatus === "member" || newStatus === "administrator";
  const isGroup = chatType === "group" || chatType === "supergroup";

  if (!wasNotMember || !isNowMember || !isGroup) return;

  await ctx.reply(ctx.t("group-welcome", { bot_username: ctx.me.username }), {
    parse_mode: "HTML",
  });
}
