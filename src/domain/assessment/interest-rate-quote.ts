import { Answer, type BorrowerAnswers } from "../answers";
import { allInAprPct } from "../loan-math";
import {
  RULES,
  bestMatchingBand,
  processingFeePctFor,
  wideBandFor,
  wideBandForIncomeType,
  type EmployerType,
} from "../rules";
import type { IncomeType, InterestRateAdvice, LoanType } from "../types";

export interface InterestRateQuoteInput {
  answers: BorrowerAnswers;
  loanType: LoanType;
  /** A representative loan size, only used to convert the fee into APR. */
  samplePrincipal: number;
  tenureMonths: number;
}

/**
 * Always a band, never a single rate.
 *
 * A borrower who is told "your rate is 14.2%" will believe it and stop
 * negotiating. A band says "anything inside this is fair, anything above it is
 * worth arguing about", which is the only honest thing a self-assessment can
 * say. An unknown credit score widens the band rather than guessing a number.
 */
export function quoteInterestRate(input: InterestRateQuoteInput): InterestRateAdvice {
  const { answers, loanType } = input;

  const creditScoreIsUnknown =
    answers.isUnknown(Answer.creditScore) || !answers.wasAsked(Answer.creditScore);
  const creditScore = answers.amount(Answer.creditScore);
  const incomeType = answers.choice(Answer.incomeType) as IncomeType | undefined;
  const employerType = answers.choice(Answer.employerType) as EmployerType | undefined;

  let band = creditScoreIsUnknown
    ? (wideBandForIncomeType(loanType, incomeType) ?? wideBandFor(loanType))
    : (matchedBand(loanType, creditScore, incomeType, employerType) ??
      wideBandFor(loanType));

  const riskPremiumPct = riskPremiumFor(answers, loanType);
  band = {
    lowRatePct: band.lowRatePct + riskPremiumPct,
    highRatePct: band.highRatePct + riskPremiumPct,
  };

  const processingFeePct = processingFeePctFor(loanType);
  // Guard rails so APR stays meaningful for a tiny or zero sample loan.
  const principal = Math.max(10_000, input.samplePrincipal);
  const tenureMonths = Math.max(6, input.tenureMonths);

  return {
    headlineRateLowPct: toOneDecimal(band.lowRatePct),
    headlineRateHighPct: toOneDecimal(band.highRatePct),
    allInAprLowPct: toOneDecimal(
      allInAprPct(principal, band.lowRatePct, tenureMonths, processingFeePct),
    ),
    allInAprHighPct: toOneDecimal(
      allInAprPct(principal, band.highRatePct, tenureMonths, processingFeePct),
    ),
    processingFeePct,
    widenedForUnknownScore: creditScoreIsUnknown,
  };
}

function matchedBand(
  loanType: LoanType,
  creditScore: number | undefined,
  incomeType: IncomeType | undefined,
  employerType: EmployerType | undefined,
): { lowRatePct: number; highRatePct: number } | undefined {
  const rule = bestMatchingBand(loanType, creditScore, incomeType, employerType);
  if (!rule) return undefined;
  return { lowRatePct: rule.lowRatePct, highRatePct: rule.highRatePct };
}

/**
 * Extra percentage points a lender will realistically add for observable risk.
 * Each one is a separate documented rule so a borrower can see what it costs.
 */
function riskPremiumFor(answers: BorrowerAnswers, loanType: LoanType): number {
  let premiumPct = 0;

  const cardUtilisationPct = answers.amount(Answer.creditCardUtilisationPct) ?? 0;
  if (cardUtilisationPct > RULES.creditBehaviour.highCardUtilisationPct) {
    premiumPct += RULES.creditBehaviour.highUtilisationAddsToRatePct;
  }

  const hadBounce = answers.yesNo(Answer.hadEmiBounceLast12Months) === true;
  const isSecuredProduct =
    loanType === "property" || loanType === "gold" || loanType === "home";
  if (hadBounce && isSecuredProduct) {
    premiumPct += RULES.creditBehaviour.bounceAddsToSecuredRatePct;
  }

  const yearsInJob = answers.amount(Answer.yearsInCurrentJob);
  if (
    loanType === "personal" &&
    yearsInJob !== undefined &&
    yearsInJob < RULES.creditBehaviour.shortJobTenureYears
  ) {
    premiumPct += RULES.creditBehaviour.shortJobTenureAddsToRatePct;
  }

  if (loanType === "business" && answers.yesNo(Answer.isGstRegistered) === false) {
    premiumPct += RULES.creditBehaviour.noGstAddsToRatePct;
  }

  return premiumPct;
}

function toOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
