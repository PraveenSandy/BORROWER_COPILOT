import { ANSWER_SCHEMA, Answer, type BorrowerAnswers } from "../answers";
import { answerDefinition } from "../answers/answer-schema";
import type { ConfidenceLevel } from "../types";

const MUST_ANSWER_IDS = ANSWER_SCHEMA.filter((row) => row.importance === "must").map(
  (row) => row.id,
);
const HIGH_IMPACT_IDS = ANSWER_SCHEMA.filter((row) => row.importance === "high").map(
  (row) => row.id,
);

/** Above this many unanswered high-impact extras, confidence cannot be high. */
const TOO_MANY_GAPS = 4;

/**
 * How much the app trusts its own output.
 *
 * This exists so the screens never look more certain than the inputs justify.
 * Two answers dominate the result — existing EMIs and credit score — so an
 * "I don't know" on either forces low confidence no matter what else is filled.
 */
export function assessConfidence(answers: BorrowerAnswers): {
  level: ConfidenceLevel;
  reason: string;
} {
  const unknownMustAnswers = MUST_ANSWER_IDS.filter((id) => answers.isUnknown(id));
  const unansweredHighImpact = HIGH_IMPACT_IDS.filter((id) => !answers.isKnown(id));

  if (
    answers.isUnknown(Answer.existingEmiTotal) ||
    answers.isUnknown(Answer.creditScore)
  ) {
    const labels = unknownMustAnswers.map((id) => answerDefinition(id).label.toLowerCase());
    return {
      level: "low",
      reason: labels.length
        ? `You marked ${labels.join(", ")} as unknown, so the ranges stay wide on purpose.`
        : "A high-impact must-answer is unknown, so we refuse to show tight ranges.",
    };
  }

  if (unansweredHighImpact.length >= TOO_MANY_GAPS) {
    return {
      level: "medium",
      reason:
        "The must-answers are in, but several extras that would tighten the rate or the amount are still unanswered.",
    };
  }

  if (unansweredHighImpact.length === 0) {
    return {
      level: "high",
      reason:
        "Must-answers plus the high-impact extras are filled, so the ranges are as tight as a self-assessment can honestly be.",
    };
  }

  return {
    level: "medium",
    reason:
      "Enough to compute all four outputs; the extras you skipped keep some width in the ranges.",
  };
}
