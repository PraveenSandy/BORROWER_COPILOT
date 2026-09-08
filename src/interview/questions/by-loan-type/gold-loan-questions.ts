import { Answer } from "../../../domain";
import type { QuestionDefinition, ShowWhenCondition } from "../../question-types";

const AFTER_MUST_QUESTIONS: ShowWhenCondition[] = [
  { answer: Answer.creditScore, wasAnswered: true },
];

/** A gold loan needs exactly one extra fact: what the jewellery is worth. */
export const GOLD_LOAN_QUESTIONS: QuestionDefinition[] = [
  {
    id: "q-gold-value",
    answerId: Answer.goldValue,
    stage: "extra",
    inputType: "number",
    unit: "rupees",
    prompt: "Roughly what is the gold jewellery you could pledge worth today?",
    whyItMatters:
      "A gold loan is capped at 75% of the value, so this sets the maximum on its own.",
    showWhen: [...AFTER_MUST_QUESTIONS, { answer: Answer.loanType, equals: "gold" }],
    minValue: 0,
    maxValue: 20_000_000,
  },
];
