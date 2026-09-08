import { Answer } from "../../domain";
import type { QuestionDefinition, ShowWhenCondition } from "../question-types";

const AFTER_MUST_QUESTIONS: ShowWhenCondition[] = [
  { answer: Answer.creditScore, wasAnswered: true },
];

/** Asked of everybody, whatever the loan type or income type. */
export const COMMON_EXTRA_QUESTIONS: QuestionDefinition[] = [
  {
    id: "q-emi-bounce",
    answerId: Answer.hadEmiBounceLast12Months,
    stage: "extra",
    inputType: "yesNo",
    prompt: "Has any EMI bounced in the last 12 months?",
    whyItMatters:
      "A bounce plus an unsecured loan is a hard stop. It is the single answer most likely to change the verdict to don't borrow.",
    showWhen: AFTER_MUST_QUESTIONS,
  },
  {
    id: "q-emergency-savings",
    answerId: Answer.emergencySavingsMonths,
    stage: "extra",
    inputType: "number",
    unit: "months",
    prompt: "How many months of expenses do you have in emergency savings?",
    whyItMatters:
      "Below three months there is no cushion, so we cut the safe amount by a quarter.",
    showWhen: AFTER_MUST_QUESTIONS,
    minValue: 0,
    maxValue: 36,
  },
  {
    id: "q-dependents",
    answerId: Answer.dependentCount,
    stage: "extra",
    inputType: "number",
    unit: "count",
    prompt: "How many people depend on this income, including children and parents?",
    whyItMatters:
      "Each dependent raises the minimum we assume for essentials, which protects you if you understated expenses.",
    showWhen: AFTER_MUST_QUESTIONS,
    minValue: 0,
    maxValue: 15,
  },
  {
    id: "q-co-applicant-income",
    answerId: Answer.coApplicantMonthlyIncome,
    stage: "extra",
    inputType: "number",
    unit: "rupees",
    prompt: "If someone will apply with you, what is their net monthly income?",
    help: "Enter ₹0 if you are applying alone.",
    whyItMatters:
      "A co-applicant raises both numbers. If you are self-employed only 70% of their income is counted.",
    showWhen: AFTER_MUST_QUESTIONS,
    minValue: 0,
    maxValue: 5_000_000,
  },
  {
    id: "q-months-left-on-loans",
    answerId: Answer.monthsLeftOnExistingLoans,
    stage: "extra",
    inputType: "number",
    unit: "months",
    prompt: "Roughly how many months are left on your current EMIs?",
    whyItMatters:
      "It goes on the EMI explanation as a reminder that old EMIs do not disappear the day the new one starts.",
    showWhen: [
      ...AFTER_MUST_QUESTIONS,
      { answer: Answer.existingEmiTotal, isKnown: true },
    ],
    minValue: 0,
    maxValue: 360,
  },
  {
    id: "q-large-expense-soon",
    answerId: Answer.largeExpenseNext6Months,
    stage: "extra",
    inputType: "number",
    unit: "rupees",
    prompt: "Any large expense coming in the next 6 months, such as school fees or surgery?",
    help: "Enter ₹0 if none.",
    whyItMatters:
      "We spread it over six months and take it out of your surplus, because that is when it will hit.",
    showWhen: AFTER_MUST_QUESTIONS,
    minValue: 0,
    maxValue: 5_000_000,
  },
  {
    id: "q-rate-already-offered",
    answerId: Answer.rateAlreadyOfferedPct,
    stage: "extra",
    inputType: "number",
    unit: "percent",
    prompt: "If a lender has already quoted you a rate, what was it?",
    help: "Skip this if nobody has quoted yet.",
    whyItMatters:
      "It never changes our fair band. It simply lets the card put their quote next to ours.",
    showWhen: AFTER_MUST_QUESTIONS,
    minValue: 1,
    maxValue: 48,
  },
];
