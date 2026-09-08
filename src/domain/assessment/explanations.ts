import { RULES } from "../rules";
import { formatPercent, formatRupees } from "../rupees";
import type { BorrowDecision, InterestRateAdvice } from "../types";
import type { BorrowingCapacity } from "./borrowing-capacity";
import type { MonthlyCommitments } from "./existing-obligations";
import type { IncomeBooks } from "./income-books";

/**
 * One sentence per output. Every number the app shows must be traceable back
 * to something the borrower actually typed, otherwise it is just an oracle.
 */

const INCOME_DROP_PCT = RULES.stressTest.incomeDropPct * 100;

export function explainDecision(decision: {
  decision: BorrowDecision;
  reason: string;
}): string {
  return decision.reason;
}

export function explainAmount(args: {
  incomeBooks: IncomeBooks;
  capacity: BorrowingCapacity;
  commitments: MonthlyCommitments;
}): string {
  return [
    `A lending desk may go up to ${formatRupees(args.capacity.lenderLikelyAmount)} using ${args.incomeBooks.lenderBasis} after your existing EMIs.`,
    `You should not carry more than ${formatRupees(args.capacity.householdSafeAmount)}, because that number starts from ${args.incomeBooks.householdBasis},`,
    `keeps rent and essentials of ${formatRupees(args.commitments.essentialSpend)} inside your budget,`,
    `and still survives a ${INCOME_DROP_PCT}% drop in income.`,
  ].join(" ");
}

export function explainRate(rate: InterestRateAdvice, loanTypeReason: string): string {
  const unknownScoreNote = rate.widenedForUnknownScore
    ? " Your credit score is unknown, so this is the wide band for the product — not a 300 and not a 750."
    : "";
  return [
    `A fair headline rate is ${formatPercent(rate.headlineRateLowPct)} to ${formatPercent(rate.headlineRateHighPct)}.`,
    `The all-in APR, including the ${formatPercent(rate.processingFeePct)} processing fee, is ${formatPercent(rate.allInAprLowPct)} to ${formatPercent(rate.allInAprHighPct)}.`,
    loanTypeReason + unknownScoreNote,
  ].join(" ");
}

export function explainMonthlyPayment(args: {
  emiCeiling: number;
  tenureMonths: number;
  survivesIncomeDrop: boolean;
  surplusAfterEmi: number;
  monthsLeftOnExistingLoans?: number;
}): string {
  const existingLoansNote = args.monthsLeftOnExistingLoans
    ? ` Your current EMIs still run for about ${args.monthsLeftOnExistingLoans} more months — they do not disappear on day one.`
    : "";

  if (args.emiCeiling <= 0) {
    return `There is no EMI you can safely add right now. After essentials and the EMIs you already pay, a ${INCOME_DROP_PCT}% drop in income leaves you short by ${formatRupees(Math.abs(args.surplusAfterEmi))} before any new instalment.${existingLoansNote}`;
  }

  const stressNote = args.survivesIncomeDrop
    ? `Even if your income drops ${INCOME_DROP_PCT}%, your surplus stays at or above zero at this ceiling.`
    : `If your income drops ${INCOME_DROP_PCT}%, your surplus goes to zero or below — that is exactly why the ceiling is this low.`;

  return `Do not agree to more than ${formatRupees(args.emiCeiling)} a month over ${args.tenureMonths} months. ${stressNote}${existingLoansNote}`;
}

export function decisionLabel(decision: BorrowDecision): string {
  if (decision === "borrow") return "Borrow";
  if (decision === "borrow_less") return "Borrow less";
  return "Don't borrow";
}
