import { neverNegative } from "./rupees";

/**
 * The arithmetic of a loan. No rules, no judgement — only formulas that would
 * appear the same way in a textbook, so they can be checked by hand.
 */

/**
 * Standard reducing-balance EMI.
 *
 *   monthlyRate = annualRatePct / 12 / 100
 *   EMI = P x monthlyRate x (1 + monthlyRate)^n / ((1 + monthlyRate)^n - 1)
 *
 * Worked example: ₹1,00,000 at 12% for 12 months gives an EMI of ₹8,885.
 */
export function monthlyEmi(
  principal: number,
  annualRatePct: number,
  tenureMonths: number,
): number {
  const loanAmount = neverNegative(principal);
  if (loanAmount === 0) return 0;
  if (tenureMonths <= 0) {
    throw new Error("Tenure months must be greater than 0");
  }
  if (annualRatePct === 0) return loanAmount / tenureMonths;

  const monthlyRate = annualRatePct / 12 / 100;
  const growth = (1 + monthlyRate) ** tenureMonths;
  return (loanAmount * monthlyRate * growth) / (growth - 1);
}

/**
 * The EMI formula run backwards: the largest loan whose EMI stays within a
 * monthly ceiling. This is how the app turns "you can afford ₹20,000 a month"
 * into "so borrow at most ₹8,50,000".
 */
export function loanAmountForEmi(
  emiCeiling: number,
  annualRatePct: number,
  tenureMonths: number,
): number {
  const ceiling = neverNegative(emiCeiling);
  if (ceiling === 0 || tenureMonths <= 0) return 0;
  if (annualRatePct === 0) return ceiling * tenureMonths;

  const monthlyRate = annualRatePct / 12 / 100;
  const growth = (1 + monthlyRate) ** tenureMonths;
  return (ceiling * (growth - 1)) / (monthlyRate * growth);
}

/**
 * All-in APR: the true cost once the processing fee is deducted up front.
 *
 * The borrower receives (principal - fee) but repays EMIs on the full
 * principal, so the effective rate is higher than the headline. We solve for
 * the monthly internal rate of return by bisection, then annualise it
 * NOMINALLY (monthly x 12).
 *
 * Nominal, not compounded, on purpose: a lender quotes "12%" nominally, so a
 * nominal APR is directly comparable. With a zero fee the APR equals the
 * headline exactly, and every basis point above the quote is a real charge the
 * borrower can point at. Compounding would show 12.68% on a fee-free 12% loan
 * and derail the conversation.
 */
export function allInAprPct(
  principal: number,
  annualRatePct: number,
  tenureMonths: number,
  processingFeePct: number,
): number {
  if (principal <= 0 || tenureMonths <= 0) return annualRatePct;

  const processingFee = principal * (processingFeePct / 100);
  const cashInHand = principal - processingFee;
  if (cashInHand <= 0) return 100;

  const emi = monthlyEmi(principal, annualRatePct, tenureMonths);

  // Bisection: find the monthly rate at which the EMI stream is worth exactly
  // the cash actually received. 80 iterations is far more precision than the
  // one decimal place we display.
  let lowRate = 1e-8;
  let highRate = 2;
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const midRate = (lowRate + highRate) / 2;
    if (presentValueOfEmiStream(emi, midRate, tenureMonths) > cashInHand) {
      lowRate = midRate;
    } else {
      highRate = midRate;
    }
  }

  const monthlyRate = (lowRate + highRate) / 2;
  return monthlyRate * 12 * 100;
}

/** What a stream of equal monthly payments is worth today. */
function presentValueOfEmiStream(
  payment: number,
  monthlyRate: number,
  tenureMonths: number,
): number {
  if (monthlyRate === 0) return payment * tenureMonths;
  return (payment * (1 - (1 + monthlyRate) ** -tenureMonths)) / monthlyRate;
}
