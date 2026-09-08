import { Answer } from "../../../domain";
import type { QuestionDefinition, ShowWhenCondition } from "../../question-types";

const AFTER_MUST_QUESTIONS: ShowWhenCondition[] = [
  { answer: Answer.creditScore, wasAnswered: true },
];

/**
 * Property as security.
 *
 * This is also asked of anyone wanting an unsecured business loan, because the
 * answer is what lets the app move them onto a loan against property at
 * roughly half the rate. It is the single highest-value question in the app for
 * a self-employed borrower.
 */
export const PROPERTY_LOAN_QUESTIONS: QuestionDefinition[] = [
  {
    id: "q-property-value",
    answerId: Answer.propertyValue,
    stage: "extra",
    inputType: "number",
    unit: "rupees",
    prompt: "Roughly what is the market value of a property you could pledge?",
    help: "Only count property with no existing loan against it. Enter ₹0 if none.",
    whyItMatters:
      "A lender will fund at most 55% of this value, so it can cap the amount regardless of your income. It can also move you to a much cheaper product.",
    showWhen: [
      ...AFTER_MUST_QUESTIONS,
      { answer: Answer.loanType, isOneOf: ["property", "home", "business"] },
    ],
    minValue: 0,
    maxValue: 200_000_000,
  },
];
