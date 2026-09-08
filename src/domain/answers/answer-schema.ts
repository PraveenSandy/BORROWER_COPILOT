/**
 * Every piece of information the app can ask for, in one place.
 *
 * To add a new input later:
 *   1. add a key to `Answer` below,
 *   2. add a row to `ANSWER_SCHEMA` (the `moves` list is enforced by a test),
 *   3. add a question in `src/interview/questions/`,
 *   4. read it inside one domain module,
 *   5. document the threshold in RULES.md.
 */

export const Answer = {
  // --- the nine must-answer questions ---
  loanType: "loanType",
  loanPurpose: "loanPurpose",
  amountWanted: "amountWanted",
  incomeType: "incomeType",
  monthlyIncome: "monthlyIncome",
  existingEmiTotal: "existingEmiTotal",
  essentialMonthlySpend: "essentialMonthlySpend",
  age: "age",
  creditScore: "creditScore",

  // --- salaried path ---
  employerType: "employerType",
  yearsInCurrentJob: "yearsInCurrentJob",
  bonusSharePct: "bonusSharePct",
  monthlyRent: "monthlyRent",

  // --- self-employed path ---
  lastItrAnnualIncome: "lastItrAnnualIncome",
  monthlyCashDrawings: "monthlyCashDrawings",
  businessAgeYears: "businessAgeYears",
  isGstRegistered: "isGstRegistered",

  // --- household ---
  coApplicantMonthlyIncome: "coApplicantMonthlyIncome",
  dependentCount: "dependentCount",
  emergencySavingsMonths: "emergencySavingsMonths",
  largeExpenseNext6Months: "largeExpenseNext6Months",

  // --- credit behaviour ---
  hadEmiBounceLast12Months: "hadEmiBounceLast12Months",
  creditCardUtilisationPct: "creditCardUtilisationPct",
  monthsLeftOnExistingLoans: "monthsLeftOnExistingLoans",
  appLoanOutstanding: "appLoanOutstanding",

  // --- security offered ---
  propertyValue: "propertyValue",
  goldValue: "goldValue",
  vehicleOnRoadPrice: "vehicleOnRoadPrice",

  // --- productive loans and existing quotes ---
  expectedExtraMonthlyIncome: "expectedExtraMonthlyIncome",
  rateAlreadyOfferedPct: "rateAlreadyOfferedPct",
} as const;

export type AnswerId = (typeof Answer)[keyof typeof Answer];

/**
 * A stored answer. "I don't know" is its own kind so the engine can never
 * mistake it for zero, and a skipped extra question is distinct again.
 */
export type AnswerValue =
  | { kind: "choice"; value: string }
  | { kind: "amount"; value: number }
  | { kind: "yesNo"; value: boolean }
  | { kind: "range"; lowValue: number; highValue: number }
  | { kind: "dontKnow" }
  | { kind: "skipped" };

// Short constructors so fixtures and tests read like sentences.
export const choice = (value: string): AnswerValue => ({ kind: "choice", value });
export const amount = (value: number): AnswerValue => ({ kind: "amount", value });
export const yesNo = (value: boolean): AnswerValue => ({ kind: "yesNo", value });
export const range = (lowValue: number, highValue: number): AnswerValue => ({
  kind: "range",
  lowValue,
  highValue,
});
export const dontKnow = (): AnswerValue => ({ kind: "dontKnow" });
export const skipped = (): AnswerValue => ({ kind: "skipped" });

/** Which output an answer is allowed to move. Enforced by a registry test. */
export type MovesOutput =
  | "decision"
  | "amount"
  | "rate"
  | "monthlyPayment"
  | "loanType"
  | "confidence";

/**
 * How much a missing answer should widen the bands.
 * `must` answers are always asked; `high` answers widen the most when skipped.
 */
export type AnswerImportance = "must" | "high" | "medium" | "low";

export interface AnswerDefinition {
  id: AnswerId;
  label: string;
  unit?: "rupees" | "percent" | "years" | "months" | "score" | "count";
  moves: MovesOutput[];
  importance: AnswerImportance;
}

export const ANSWER_SCHEMA: AnswerDefinition[] = [
  { id: Answer.loanType, label: "Loan type", moves: ["loanType", "amount", "rate"], importance: "must" },
  { id: Answer.loanPurpose, label: "Purpose", moves: ["decision", "loanType"], importance: "must" },
  { id: Answer.amountWanted, label: "Amount wanted", unit: "rupees", moves: ["decision", "amount", "monthlyPayment"], importance: "must" },
  { id: Answer.incomeType, label: "How you earn", moves: ["amount", "rate", "loanType"], importance: "must" },
  { id: Answer.monthlyIncome, label: "Net monthly income", unit: "rupees", moves: ["decision", "amount", "monthlyPayment"], importance: "must" },
  { id: Answer.existingEmiTotal, label: "Existing EMIs", unit: "rupees", moves: ["decision", "amount", "monthlyPayment", "confidence"], importance: "must" },
  { id: Answer.essentialMonthlySpend, label: "Essential monthly spend", unit: "rupees", moves: ["decision", "amount", "monthlyPayment"], importance: "must" },
  { id: Answer.age, label: "Age", unit: "years", moves: ["amount", "monthlyPayment"], importance: "must" },
  { id: Answer.creditScore, label: "Credit score", unit: "score", moves: ["rate", "confidence"], importance: "must" },

  { id: Answer.employerType, label: "Employer type", moves: ["rate"], importance: "high" },
  { id: Answer.yearsInCurrentJob, label: "Years in current job", unit: "years", moves: ["rate"], importance: "medium" },
  { id: Answer.bonusSharePct, label: "Bonus share of pay", unit: "percent", moves: ["amount"], importance: "medium" },
  { id: Answer.monthlyRent, label: "Monthly rent", unit: "rupees", moves: ["amount", "monthlyPayment"], importance: "high" },

  { id: Answer.lastItrAnnualIncome, label: "Last ITR income", unit: "rupees", moves: ["amount", "rate"], importance: "high" },
  { id: Answer.monthlyCashDrawings, label: "Monthly cash drawings", unit: "rupees", moves: ["amount", "confidence"], importance: "high" },
  { id: Answer.businessAgeYears, label: "Years running the business", unit: "years", moves: ["rate"], importance: "medium" },
  { id: Answer.isGstRegistered, label: "GST registered", moves: ["rate"], importance: "low" },

  { id: Answer.coApplicantMonthlyIncome, label: "Co-applicant income", unit: "rupees", moves: ["amount", "monthlyPayment"], importance: "high" },
  { id: Answer.dependentCount, label: "Dependents", unit: "count", moves: ["amount", "monthlyPayment"], importance: "medium" },
  { id: Answer.emergencySavingsMonths, label: "Emergency savings", unit: "months", moves: ["decision", "amount", "monthlyPayment"], importance: "high" },
  { id: Answer.largeExpenseNext6Months, label: "Large expense soon", unit: "rupees", moves: ["amount", "monthlyPayment"], importance: "medium" },

  { id: Answer.hadEmiBounceLast12Months, label: "EMI bounce in last 12 months", moves: ["decision", "rate"], importance: "high" },
  { id: Answer.creditCardUtilisationPct, label: "Card utilisation", unit: "percent", moves: ["rate", "amount"], importance: "medium" },
  { id: Answer.monthsLeftOnExistingLoans, label: "Months left on current EMIs", unit: "months", moves: ["monthlyPayment"], importance: "low" },
  { id: Answer.appLoanOutstanding, label: "App / BNPL outstanding", unit: "rupees", moves: ["decision", "amount", "monthlyPayment"], importance: "high" },

  { id: Answer.propertyValue, label: "Property value", unit: "rupees", moves: ["amount", "loanType"], importance: "high" },
  { id: Answer.goldValue, label: "Gold value", unit: "rupees", moves: ["amount", "loanType"], importance: "high" },
  { id: Answer.vehicleOnRoadPrice, label: "Vehicle on-road price", unit: "rupees", moves: ["amount"], importance: "high" },

  { id: Answer.expectedExtraMonthlyIncome, label: "Extra income this loan should create", unit: "rupees", moves: ["decision"], importance: "high" },
  { id: Answer.rateAlreadyOfferedPct, label: "Rate already offered", unit: "percent", moves: ["rate"], importance: "low" },
];

export function answerDefinition(id: AnswerId): AnswerDefinition {
  const definition = ANSWER_SCHEMA.find((row) => row.id === id);
  if (!definition) {
    throw new Error(`No schema row for answer "${id}". Add it to ANSWER_SCHEMA.`);
  }
  return definition;
}
