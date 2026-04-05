import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockCtx } from "../helpers.js";

const dbMock = vi.hoisted(() => ({
  getQuizSession: vi.fn(),
  saveQuizSession: vi.fn(),
  clearQuizSession: vi.fn(),
  incrementStreak: vi.fn(() => ({ current: 2, max: 2, isNewRecord: false })),
}));

vi.mock("../../src/db/index.js", () => ({
  db: dbMock,
  GROUP_STREAK_THRESHOLD: 2,
}));

vi.mock("../../src/glossary/index.js", () => ({
  getTerm: vi.fn((id: string) => ({
    id,
    term: id.toUpperCase(),
    definition: "Long enough definition for the quiz flow.",
    category: "defi",
    depth: 3,
  })),
  getTermsByCategory: vi.fn(() => []),
  getCategories: vi.fn(() => []),
}));

vi.mock("../../src/utils/term-card.js", () => ({
  buildEnrichedTermCard: vi.fn(async () => "<b>Card</b>"),
}));

import {
  handleQuizModeCallback,
  handleQuizRoundAnswerCallback,
} from "../../src/handlers/callbacks.js";

describe("quiz callbacks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates the quiz mode and re-renders the menu", async () => {
    const ctx = createMockCtx({ match: "quiz_mode:single", chatType: "private" });
    await handleQuizModeCallback(ctx);
    expect(ctx.editMessageText).toHaveBeenCalledOnce();
    const [text] = (ctx.editMessageText as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("[quiz-menu-title]");
  });

  it("advances the round after a correct answer", async () => {
    dbMock.getQuizSession.mockReturnValueOnce({
      mode: "round",
      currentQuestion: 1,
      totalQuestions: 3,
      correctAnswers: 0,
      wrongAnswers: 0,
      difficultyKey: "all",
      failureMode: "continue",
      termId: "alpha",
      correctIdx: 0,
      options: ["alpha", "beta", "gamma", "delta"],
      remainingTermIds: ["beta", "gamma"],
      askedTermIds: ["alpha"],
      poolTermIds: ["alpha", "beta", "gamma", "delta"],
    });
    const ctx = createMockCtx({
      match: "quiz_round_answer:1:0",
      chatType: "private",
    });
    await handleQuizRoundAnswerCallback(ctx);
    expect(dbMock.saveQuizSession).toHaveBeenCalledOnce();
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[quiz-round-feedback-correct-streak]");
  });
});
