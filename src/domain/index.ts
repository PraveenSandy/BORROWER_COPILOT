/**
 * The public face of the domain layer.
 *
 * The UI and the tests import from here and nowhere deeper, so the internals
 * can be reorganised without touching a single React component.
 */

// The one function that produces an answer.
export { assessBorrower } from "./assessment/assess-borrower";

// Recording what the borrower said.
export {
  Answer,
  ANSWER_SCHEMA,
  BorrowerAnswers,
  amount,
  answerDefinition,
  choice,
  dontKnow,
  range,
  skipped,
  yesNo,
} from "./answers";
export type { AnswerDefinition, AnswerId, AnswerValue } from "./answers";

// Rules and formulas, exported so tests can assert against them directly.
export { RULES, RATE_BAND_RULES, foirCapFor, processingFeePctFor } from "./rules";
export { allInAprPct, loanAmountForEmi, monthlyEmi } from "./loan-math";

// Individual steps, for focused unit tests and for reuse.
export { computeBorrowingCapacity, stressTestNewEmi } from "./assessment/borrowing-capacity";
export { decideBorrowOrNot } from "./assessment/borrow-decision";
export { assessConfidence } from "./assessment/confidence-level";
export { resolveMonthlyCommitments } from "./assessment/existing-obligations";
export { resolveIncomeBooks } from "./assessment/income-books";
export { quoteInterestRate } from "./assessment/interest-rate-quote";
export { loanTypeLabel, parseLoanType, selectLoanType } from "./assessment/loan-product-selector";
export { decisionLabel } from "./assessment/explanations";

// Formatting, shared with the UI so rupees look the same everywhere.
export { formatPercent, formatRupees, neverNegative, roundToWholeRupee } from "./rupees";

export type * from "./types";
