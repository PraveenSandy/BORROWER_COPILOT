import { Answer } from "../../../domain";
import type { QuestionDefinition, ShowWhenCondition } from "../../question-types";

const AFTER_MUST_QUESTIONS: ShowWhenCondition[] = [
  { answer: Answer.creditScore, wasAnswered: true },
];

export const TWO_WHEELER_QUESTIONS: QuestionDefinition[] = [
  {
    id: "q-vehicle-price",
    answerId: Answer.vehicleOnRoadPrice,
    stage: "extra",
    inputType: "number",
    unit: "rupees",
    prompt: "What is the on-road price of the two-wheeler?",
    whyItMatters:
      "The loan is capped at 85% of the on-road price, so you need the rest as a down payment.",
    showWhen: [
      ...AFTER_MUST_QUESTIONS,
      { answer: Answer.loanType, equals: "two_wheeler" },
    ],
    minValue: 0,
    maxValue: 500_000,
  },
];
