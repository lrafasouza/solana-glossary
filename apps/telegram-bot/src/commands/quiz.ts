// src/commands/quiz.ts
import { allTerms } from "../glossary/index.js";
import type { GlossaryTerm } from "../glossary/index.js";
import { InlineKeyboard } from "grammy";
import { db } from "../db/index.js";
import type { MyContext } from "../context.js";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function quizCommand(ctx: MyContext): Promise<void> {
  await sendQuiz(ctx);
}

export async function sendQuiz(
  ctx: MyContext,
  pool?: GlossaryTerm[],
): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply(ctx.t("quiz-no-user"));
    return;
  }

  // Pick a random term with definition
  const candidatePool = pool && pool.length >= 4 ? pool : allTerms;
  const termsWithDef = candidatePool.filter(
    (t: GlossaryTerm) => t.definition && t.definition.length > 20,
  );
  if (termsWithDef.length < 4) {
    await ctx.reply(ctx.t("internal-error"));
    return;
  }
  const targetTerm =
    termsWithDef[Math.floor(Math.random() * termsWithDef.length)];

  // Get 3 distractors from same category, fallback to random if not enough
  const categoryTerms = candidatePool
    .filter((t: GlossaryTerm) => t.category === targetTerm.category)
    .filter((t: GlossaryTerm) => t.id !== targetTerm.id);

  const otherPool = candidatePool.filter(
    (t: GlossaryTerm) => t.id !== targetTerm.id,
  );

  let distractors: GlossaryTerm[];
  if (categoryTerms.length >= 3) {
    distractors = shuffleArray(categoryTerms).slice(0, 3);
  } else {
    // Fallback: get remaining from other categories
    const remaining = 3 - categoryTerms.length;
    const otherTerms = otherPool.filter(
      (t: GlossaryTerm) =>
        !categoryTerms.some((ct: GlossaryTerm) => ct.id === t.id),
    );
    distractors = [
      ...categoryTerms,
      ...shuffleArray(otherTerms).slice(0, remaining),
    ];
  }

  if (distractors.length < 3) {
    const backupTerms = allTerms.filter(
      (t: GlossaryTerm) =>
        t.id !== targetTerm.id &&
        !distractors.some((d: GlossaryTerm) => d.id === t.id),
    );
    distractors = [
      ...distractors,
      ...shuffleArray(backupTerms).slice(0, 3 - distractors.length),
    ];
  }

  // Build 4 options
  const options = shuffleArray([targetTerm, ...distractors]);
  const correctIdx = options.findIndex(
    (t: GlossaryTerm) => t.id === targetTerm.id,
  );

  // Save session
  db.saveQuizSession(
    userId,
    targetTerm.id,
    correctIdx,
    options.map((t: GlossaryTerm) => t.id),
  );

  // Show question
  const definitionSnippet = targetTerm.definition;
  const question = ctx.t("quiz-question", { definition: definitionSnippet });

  const keyboard = new InlineKeyboard()
    .text(ctx.t("quiz-option-a", { term: options[0].term }), `quiz_answer:0`)
    .row()
    .text(ctx.t("quiz-option-b", { term: options[1].term }), `quiz_answer:1`)
    .row()
    .text(ctx.t("quiz-option-c", { term: options[2].term }), `quiz_answer:2`)
    .row()
    .text(ctx.t("quiz-option-d", { term: options[3].term }), `quiz_answer:3`);

  await ctx.reply(question, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}
