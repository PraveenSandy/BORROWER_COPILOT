import { describe, expect, it } from "vitest";
import { ANSWER_SCHEMA, Answer, BorrowerAnswers, choice } from "../../src/domain";
import { ALL_QUESTIONS, purposeChoicesFor } from "../../src/interview";

/**
 * These are the guard rails for anyone adding a question later. If you add one
 * and forget a schema row or a `whyItMatters`, one of these fails immediately.
 */
describe("Question registry integrity", () => {
  it("has a unique id for every question", () => {
    const ids = ALL_QUESTIONS.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("points every question at an answer that exists in the schema", () => {
    const schemaIds = new Set(ANSWER_SCHEMA.map((row) => row.id));
    for (const question of ALL_QUESTIONS) {
      expect(schemaIds.has(question.answerId)).toBe(true);
    }
  });

  it("makes every question justify itself to the borrower", () => {
    for (const question of ALL_QUESTIONS) {
      expect(question.whyItMatters.length).toBeGreaterThan(10);
      expect(question.prompt.length).toBeGreaterThan(5);
    }
  });

  it("gives every choice question either fixed choices or a dynamic source", () => {
    for (const question of ALL_QUESTIONS) {
      if (question.inputType !== "choice") continue;
      const hasChoices = (question.choices ?? []).length > 0;
      expect(hasChoices || question.dynamicChoices !== undefined).toBe(true);
    }
  });

  it("keeps choice ids unique inside each question, so React keys never clash", () => {
    for (const question of ALL_QUESTIONS) {
      const choiceIds = (question.choices ?? []).map((option) => option.id);
      expect(new Set(choiceIds).size).toBe(choiceIds.length);
    }
  });

  it("asks all nine must-questions and no more", () => {
    const mustQuestions = ALL_QUESTIONS.filter((question) => question.stage === "must");
    expect(mustQuestions).toHaveLength(9);
  });
});

describe("Purpose choices adapt to the loan type", () => {
  const loanTypes = ["personal", "property", "gold", "two_wheeler", "business", "home"];

  it("offers a non-empty, duplicate-free purpose list for every loan type", () => {
    for (const loanType of loanTypes) {
      const answers = new BorrowerAnswers().set(Answer.loanType, choice(loanType));
      const purposes = purposeChoicesFor(answers);
      expect(purposes.length).toBeGreaterThan(0);
      const ids = purposes.map((purpose) => purpose.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("never offers a wedding as a purpose for a home loan", () => {
    const answers = new BorrowerAnswers().set(Answer.loanType, choice("home"));
    const ids = purposeChoicesFor(answers).map((purpose) => purpose.id);
    expect(ids).not.toContain("wedding");
  });

  it("falls back to the personal-loan list when no loan type is chosen yet", () => {
    const purposes = purposeChoicesFor(new BorrowerAnswers());
    expect(purposes.map((purpose) => purpose.id)).toContain("wedding");
  });
});
