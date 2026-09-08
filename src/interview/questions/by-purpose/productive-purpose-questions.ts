import { Answer } from "../../../domain";
import type { QuestionDefinition, ShowWhenCondition } from "../../question-types";

const AFTER_MUST_QUESTIONS: ShowWhenCondition[] = [
  { answer: Answer.creditScore, wasAnswered: true },
];

/**
 * Asked when the loan is meant to create income — expanding a shop, or a
 * vehicle used for work.
 *
 * Keyed to the PURPOSE rather than the product, because a gold loan taken for
 * working capital is just as productive as a property loan taken for the same
 * reason, and deserves the same question.
 */
export const PRODUCTIVE_PURPOSE_QUESTIONS: QuestionDefinition[] = [
  {
    id: "q-expected-extra-income",
    answerId: Answer.expectedExtraMonthlyIncome,
    stage: "extra",
    inputType: "number",
    unit: "rupees",
    prompt: "How much extra monthly income do you honestly expect this to create?",
    help: "Enter ₹0 if you are not sure it will bring in more money.",
    whyItMatters:
      "A loan that earns its own EMI is a different decision from one that does not. We check the instalment against this, and never count it as income until it is actually earned.",
    showWhen: [
      ...AFTER_MUST_QUESTIONS,
      { answer: Answer.loanPurpose, isOneOf: ["business_expansion", "vehicle"] },
    ],
    minValue: 0,
    maxValue: 5_000_000,
  },
];
