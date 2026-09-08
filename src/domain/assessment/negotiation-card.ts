import { formatPercent, formatRupees } from "../rupees";
import type { Assessment, NegotiationCard } from "../types";
import { decisionLabel } from "./explanations";
import { loanTypeLabel } from "./loan-product-selector";

/**
 * The one screen a borrower can hold up at a bank counter.
 *
 * It is deliberately printable and deliberately short: an amount to ask for, a
 * fair rate band, an EMI ceiling, three reasons, and the line at which to walk
 * away. Anything longer will not survive a real conversation with a salesman.
 */
export function buildNegotiationCard(args: {
  profileLine: string;
  assessment: Omit<Assessment, "negotiationCard">;
}): NegotiationCard {
  const result = args.assessment;
  const isDoNotBorrow = result.decision === "do_not_borrow";

  const reasons = [
    result.explanations.whyDecision,
    result.explanations.whyAmount,
    result.loanType.reason,
  ].slice(0, 3);

  return {
    profileLine: args.profileLine,
    decisionLabel: decisionLabel(result.decision),
    amountToAskFor: result.amounts.recommendedAmount,
    isDoNotBorrow,
    lenderMayOfferUpTo: result.amounts.lenderLikelyAmount,
    fairRateLine: `Fair headline rate ${formatPercent(result.interestRate.headlineRateLowPct)}–${formatPercent(result.interestRate.headlineRateHighPct)}`,
    allInAprLine: `All-in APR ${formatPercent(result.interestRate.allInAprLowPct)}–${formatPercent(result.interestRate.allInAprHighPct)}, including the ${formatPercent(result.interestRate.processingFeePct)} processing fee`,
    emiCeiling: result.monthlyPayment.emiCeiling,
    reasons,
    walkAwayLine: isDoNotBorrow
      ? "Sign nothing today. If anyone offers a top-up or another app loan on top of this, that is exactly the spiral this card exists to stop."
      : `If they quote an all-in APR above ${formatPercent(result.interestRate.allInAprHighPct)}, or an EMI above ${formatRupees(result.monthlyPayment.emiCeiling)} a month, walk away.`,
    confidence: result.confidence,
  };
}

/** "34 · salaried · pricing a personal loan" */
export function buildProfileLine(args: {
  age?: number;
  incomeType?: string;
  loanType: Parameters<typeof loanTypeLabel>[0];
}): string {
  const age = args.age ? `${args.age}` : "age unknown";
  const incomeType = args.incomeType?.replace(/_/g, " ") ?? "income type set";
  return `${age} · ${incomeType} · pricing a ${loanTypeLabel(args.loanType)}`;
}
