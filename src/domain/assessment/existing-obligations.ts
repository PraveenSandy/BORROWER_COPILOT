import { Answer, type BorrowerAnswers } from "../answers";
import { RULES } from "../rules";
import { formatRupees } from "../rupees";

/**
 * Money that is already spoken for every month, before any new loan.
 */
export interface MonthlyCommitments {
  /** EMIs a lender can see on a credit report. Used for FOIR. */
  emiVisibleToLender: number;
  /** Everything that really leaves the account monthly: EMIs, app loans, a
   *  large expense smoothed over six months. Used for the household book. */
  emiAndOtherOutgo: number;
  /** Rent, food, school fees, transport — with a floor applied. */
  essentialSpend: number;
  monthlyRent: number;
  existingEmiIsUnknown: boolean;
  essentialSpendIsUnknown: boolean;
  /** Human-readable lines showing exactly how the numbers were built. */
  breakdown: string[];
}

/**
 * Two rules matter here.
 *
 * 1. "I don't know my EMIs" is never treated as zero. It is carried as unknown
 *    so confidence drops and the ranges widen.
 * 2. Stated essentials are floored: if someone claims ₹5,000 of essentials on
 *    a ₹1,00,000 income, we use 35% of income instead, plus ₹2,000 per
 *    dependent. Understating groceries is the most common way a borrower talks
 *    themselves into an EMI they cannot pay.
 */
export function resolveMonthlyCommitments(
  answers: BorrowerAnswers,
  householdIncome: number,
): MonthlyCommitments {
  const existingEmiIsUnknown =
    answers.isUnknown(Answer.existingEmiTotal) || !answers.wasAsked(Answer.existingEmiTotal);
  const declaredEmi = existingEmiIsUnknown
    ? 0
    : (answers.amount(Answer.existingEmiTotal) ?? 0);

  const appLoanOutstanding = answers.amount(Answer.appLoanOutstanding) ?? 0;
  const appLoanMonthly =
    appLoanOutstanding * RULES.obligations.appLoanMonthlyShareOfOutstanding;

  const monthlyRent = answers.amount(Answer.monthlyRent) ?? 0;
  const essentialSpendIsUnknown = answers.isUnknown(Answer.essentialMonthlySpend);
  const statedEssentials = essentialSpendIsUnknown
    ? 0
    : (answers.amount(Answer.essentialMonthlySpend) ?? 0);
  const dependentCount = answers.amount(Answer.dependentCount) ?? 0;

  const essentialsFloor =
    householdIncome * RULES.household.minimumEssentialShareOfIncome +
    dependentCount * RULES.household.extraEssentialsPerDependent;
  const essentialSpend = Math.max(statedEssentials, monthlyRent, essentialsFloor);

  const largeExpenseSmoothed =
    (answers.amount(Answer.largeExpenseNext6Months) ?? 0) /
    RULES.obligations.monthsToAbsorbLargeExpense;

  // A lender only sees reported credit lines. If nothing is declared but app
  // loans exist, they usually do show up, so count them once.
  const emiVisibleToLender =
    declaredEmi + (appLoanMonthly > 0 && declaredEmi === 0 ? appLoanMonthly : 0);
  const emiAndOtherOutgo = declaredEmi + appLoanMonthly + largeExpenseSmoothed;

  const cardUtilisationPct = answers.amount(Answer.creditCardUtilisationPct);
  const breakdown = [
    existingEmiIsUnknown
      ? "Declared EMIs: unknown — not assumed to be zero, so confidence drops"
      : `Declared EMIs: ${formatRupees(declaredEmi)}`,
    `Essentials used: ${formatRupees(essentialSpend)} (rent is inside the household budget)`,
  ];
  if (appLoanMonthly > 0) {
    breakdown.push(`App / BNPL servicing: about ${formatRupees(appLoanMonthly)} a month`);
  }
  if (largeExpenseSmoothed > 0) {
    breakdown.push(
      `Upcoming large expense spread over 6 months: ${formatRupees(largeExpenseSmoothed)} a month`,
    );
  }
  if (cardUtilisationPct !== undefined) {
    breakdown.push(`Card utilisation: ${cardUtilisationPct}% (affects the rate, not FOIR rupees)`);
  }

  return {
    emiVisibleToLender,
    emiAndOtherOutgo,
    essentialSpend,
    monthlyRent,
    existingEmiIsUnknown,
    essentialSpendIsUnknown,
    breakdown,
  };
}
