import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockCtx } from "../helpers.js";

const dbMock = vi.hoisted(() => ({
  getQuizSession: vi.fn(),
  saveQuizSession: vi.fn(),
  clearQuizSession: vi.fn(),
  incrementStreak: vi.fn(() => ({ current: 2, max: 2, isNewRecord: false })),
  getGroupLanguage: vi.fn(),
  recordGroupMember: vi.fn(),
  maybeResetGroupStreak: vi.fn(() => ({ wasBroken: false })),
  recordGroupParticipant: vi.fn(() => ({ participantsToday: 1, date: "2026-04-05" })),
  getOrCreateGroupStreak: vi.fn(() => ({ current_streak: 0, max_streak: 0, last_active_date: "2026-04-04" })),
  incrementGroupStreak: vi.fn(() => ({ newStreak: 1, justCrossedThreshold: true })),
}));

const buildEnrichedTermCardMock = vi.hoisted(() => vi.fn(async () => "<b>Card</b>"));

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
  buildEnrichedTermCard: buildEnrichedTermCardMock,
}));

import {
  handleQuizAnswerCallback,
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

  it("uses the group language for the quiz result card when session language is empty", async () => {
    dbMock.getGroupLanguage.mockReturnValueOnce("pt");
    dbMock.getQuizSession.mockReturnValueOnce({
      mode: "single",
      currentQuestion: 1,
      totalQuestions: 1,
      correctAnswers: 0,
      wrongAnswers: 0,
      difficultyKey: "all",
      failureMode: "continue",
      termId: "alpha",
      correctIdx: 0,
      options: ["alpha", "beta", "gamma", "delta"],
      remainingTermIds: [],
      askedTermIds: ["alpha"],
      poolTermIds: ["alpha", "beta", "gamma", "delta"],
    });

    const ctx = createMockCtx({
      match: "quiz_answer:1:0",
      chatType: "group",
      sessionLanguage: undefined,
      languageCode: "en",
    });

    await handleQuizAnswerCallback(ctx);

    expect(buildEnrichedTermCardMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "alpha" }),
      expect.any(Function),
      "pt",
    );
  });
});
