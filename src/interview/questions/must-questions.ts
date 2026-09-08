import { Answer } from "../../domain";
import type { QuestionDefinition } from "../question-types";

/**
 * The nine questions everybody answers, in this exact order.
 *
 * Loan type comes first so every later question can adapt to it. Each question
 * waits for the previous one, which is what makes the wizard feel like one
 * question at a time rather than a form.
 */
export const MUST_QUESTIONS: QuestionDefinition[] = [
  {
    id: "q-loan-type",
    answerId: Answer.loanType,
    stage: "must",
    inputType: "choice",
    prompt: "What kind of loan are you considering?",
    help: "This chooses your question path. You can still be steered to a better product later.",
    whyItMatters:
      "The product changes the income ratio, the loan-to-value cap, the tenure, the fees and the extra questions you will see.",
    showWhen: [{ always: true }],
    choices: [
      { id: "personal", label: "Personal loan" },
      { id: "property", label: "Loan against property" },
      { id: "gold", label: "Gold loan" },
      { id: "two_wheeler", label: "Two-wheeler loan" },
      { id: "business", label: "Business loan (no collateral)" },
      { id: "home", label: "Home loan" },
    ],
  },
  {
    id: "q-purpose",
    answerId: Answer.loanPurpose,
    stage: "must",
    inputType: "choice",
    prompt: "What is the money for?",
    whyItMatters:
      "A wedding, shop stock and a scooter are three different risks. This is what decides whether we say borrow, borrow less, or don't borrow.",
    showWhen: [{ answer: Answer.loanType, wasAnswered: true }],
    dynamicChoices: "purposeByLoanType",
  },
  {
    id: "q-amount-wanted",
    answerId: Answer.amountWanted,
    stage: "must",
    inputType: "number",
    unit: "rupees",
    prompt: "How much do you want to borrow?",
    whyItMatters:
      "We compare this against both the amount a lender would give and the amount you can safely carry.",
    showWhen: [{ answer: Answer.loanPurpose, wasAnswered: true }],
    minValue: 1_000,
    maxValue: 50_000_000,
  },
  {
    id: "q-income-type",
    answerId: Answer.incomeType,
    stage: "must",
    inputType: "choice",
    prompt: "How do you earn your money?",
    whyItMatters:
      "Lenders trust a salary slip, an ITR and informal cash very differently. This changes both the amount and the rate.",
    showWhen: [{ answer: Answer.amountWanted, wasAnswered: true }],
    choices: [
      { id: "salaried", label: "Salaried — my salary reaches a bank account" },
      { id: "self_employed", label: "Self-employed, or I run a business" },
      { id: "informal", label: "Informal, gig work, or mostly cash" },
    ],
  },
  {
    id: "q-monthly-income",
    answerId: Answer.monthlyIncome,
    stage: "must",
    inputType: "rangeOrUnknown",
    unit: "rupees",
    prompt: "What is your net monthly income?",
    help: "In-hand, not CTC. If it changes month to month, give a low and a high. Your household budget is built on the lower number.",
    whyItMatters:
      "This is the denominator of the income ratio — the single number that drives everything else.",
    showWhen: [{ answer: Answer.incomeType, wasAnswered: true }],
    minValue: 0,
    maxValue: 10_000_000,
  },
  {
    id: "q-existing-emi",
    answerId: Answer.existingEmiTotal,
    stage: "must",
    inputType: "numberOrUnknown",
    unit: "rupees",
    prompt: "What do all your current EMIs add up to each month?",
    help: "If you genuinely do not know, say so. We will not pretend it is zero.",
    whyItMatters:
      "Existing EMIs are subtracted twice — once from what the bank will lend, and once from your kitchen budget.",
    showWhen: [{ answer: Answer.monthlyIncome, wasAnswered: true }],
    minValue: 0,
    maxValue: 5_000_000,
  },
  {
    id: "q-essential-spend",
    answerId: Answer.essentialMonthlySpend,
    stage: "must",
    inputType: "numberOrUnknown",
    unit: "rupees",
    prompt: "What do you spend in a month on rent, food, school fees and bills?",
    help: "Lenders often ignore this. We do not. If you are unsure we will assume a sensible floor and widen the ranges.",
    whyItMatters:
      "This is what separates the amount a lender will offer from the amount you can actually live with.",
    showWhen: [{ answer: Answer.existingEmiTotal, wasAnswered: true }],
    minValue: 0,
    maxValue: 5_000_000,
  },
  {
    id: "q-age",
    answerId: Answer.age,
    stage: "must",
    inputType: "number",
    unit: "years",
    prompt: "How old are you?",
    whyItMatters:
      "The tenure is shortened so the loan normally finishes before a typical retirement age. A shorter tenure means a bigger EMI.",
    showWhen: [{ answer: Answer.essentialMonthlySpend, wasAnswered: true }],
    minValue: 18,
    maxValue: 80,
  },
  {
    id: "q-credit-score",
    answerId: Answer.creditScore,
    stage: "must",
    inputType: "numberOrUnknown",
    unit: "score",
    prompt: "Do you know your credit score?",
    help: "CIBIL, Experian or CRIF, if you have ever seen it. \u201cI don't know\u201d is not the same as a score of 300.",
    whyItMatters:
      "An unknown score widens the fair-rate band instead of inventing a number you would then believe.",
    showWhen: [{ answer: Answer.age, wasAnswered: true }],
    minValue: 300,
    maxValue: 900,
  },
];
