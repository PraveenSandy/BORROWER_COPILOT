import { Answer } from "../../../domain";
import type { QuestionDefinition, ShowWhenCondition } from "../../question-types";

const AFTER_MUST_QUESTIONS: ShowWhenCondition[] = [
  { answer: Answer.creditScore, wasAnswered: true },
];

/**
 * Asked of anyone with informal income, whatever product they chose.
 *
 * This is the highest-harm path in the whole app. An informal earner refused a
 * personal loan is one tap away from a 36% app loan, so both questions exist to
 * find a cheaper way out.
 */
export const INFORMAL_INCOME_QUESTIONS: QuestionDefinition[] = [
  {
    id: "q-app-loan-outstanding",
    answerId: Answer.appLoanOutstanding,
    stage: "extra",
    inputType: "number",
    unit: "rupees",
    prompt: "How much do you still owe on app, BNPL or payday loans?",
    whyItMatters:
      "These rarely show up as a neat EMI. We convert the balance into roughly 12% a month of servicing, because that is what it really costs you.",
    showWhen: [
      ...AFTER_MUST_QUESTIONS,
      { answer: Answer.incomeType, equals: "informal" },
    ],
    minValue: 0,
    maxValue: 2_000_000,
  },
  {
    id: "q-gold-instead-of-unsecured",
    answerId: Answer.goldValue,
    stage: "extra",
    inputType: "number",
    unit: "rupees",
    prompt: "Do you have gold you could pledge instead of taking another unsecured loan?",
    help: "Enter ₹0 if none.",
    whyItMatters:
      "Informal income rarely gets a fair unsecured rate. Gold can move you from a 30% product to a 12% one.",
    showWhen: [
      ...AFTER_MUST_QUESTIONS,
      { answer: Answer.incomeType, equals: "informal" },
      { answer: Answer.loanType, isOneOf: ["personal", "business"] },
    ],
    minValue: 0,
    maxValue: 20_000_000,
  },
];
