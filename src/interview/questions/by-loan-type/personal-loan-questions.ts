import { Answer } from "../../../domain";
import type { QuestionDefinition, ShowWhenCondition } from "../../question-types";

/** Extras are only offered once every must-question is behind us. */
const AFTER_MUST_QUESTIONS: ShowWhenCondition[] = [
  { answer: Answer.creditScore, wasAnswered: true },
];

/** Personal loan extras. Mostly salaried evidence, which buys a lower rate. */
export const PERSONAL_LOAN_QUESTIONS: QuestionDefinition[] = [
  {
    id: "q-employer-type",
    answerId: Answer.employerType,
    stage: "extra",
    inputType: "choice",
    prompt: "What kind of employer do you have?",
    whyItMatters:
      "An MNC or government profile earns a tighter, lower rate band on a personal loan.",
    showWhen: [
      ...AFTER_MUST_QUESTIONS,
      { answer: Answer.loanType, equals: "personal" },
      { answer: Answer.incomeType, equals: "salaried" },
    ],
    choices: [
      { id: "mnc", label: "Large MNC or listed company" },
      { id: "government", label: "Government or PSU" },
      { id: "private", label: "Private company" },
      { id: "startup", label: "Startup or small firm" },
    ],
  },
  {
    id: "q-years-in-job",
    answerId: Answer.yearsInCurrentJob,
    stage: "extra",
    inputType: "number",
    unit: "years",
    prompt: "How many years have you been in this job?",
    whyItMatters:
      "Under six months, a desk may delay the sanction or add about one percentage point to the rate.",
    showWhen: [
      ...AFTER_MUST_QUESTIONS,
      { answer: Answer.loanType, equals: "personal" },
      { answer: Answer.incomeType, equals: "salaried" },
    ],
    minValue: 0,
    maxValue: 40,
  },
  {
    id: "q-bonus-share",
    answerId: Answer.bonusSharePct,
    stage: "extra",
    inputType: "number",
    unit: "percent",
    prompt: "Roughly what percent of your pay is bonus or variable?",
    whyItMatters:
      "A lender counts only half of variable pay. Your household budget counts none of it, because it may not arrive.",
    showWhen: [
      ...AFTER_MUST_QUESTIONS,
      { answer: Answer.loanType, equals: "personal" },
      { answer: Answer.incomeType, equals: "salaried" },
    ],
    minValue: 0,
    maxValue: 80,
  },
  {
    id: "q-monthly-rent",
    answerId: Answer.monthlyRent,
    stage: "extra",
    inputType: "number",
    unit: "rupees",
    prompt: "How much rent do you pay each month?",
    whyItMatters:
      "Banks often leave rent out of the income ratio. We keep it in your household budget, which is why the two amounts differ.",
    showWhen: [
      ...AFTER_MUST_QUESTIONS,
      { answer: Answer.loanType, isOneOf: ["personal", "home"] },
    ],
    minValue: 0,
    maxValue: 500_000,
  },
  {
    id: "q-card-utilisation",
    answerId: Answer.creditCardUtilisationPct,
    stage: "extra",
    inputType: "number",
    unit: "percent",
    prompt: "If you use credit cards, roughly what percent of the limit is used?",
    whyItMatters:
      "Above 50% used, lenders read it as stress: it adds to the rate band and trims the safe amount.",
    showWhen: [
      ...AFTER_MUST_QUESTIONS,
      { answer: Answer.loanType, equals: "personal" },
    ],
    minValue: 0,
    maxValue: 100,
  },
];
