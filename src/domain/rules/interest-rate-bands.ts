import type { IncomeType, LoanType } from "../types";

export type EmployerType = "mnc" | "government" | "private" | "startup";

/**
 * Fair headline-rate bands. Every row is a judgement based on publicly
 * advertised Indian retail ranges — see RULES.md for the reasoning.
 *
 * A row with no `minScore` and no `employer` is the product's WIDE band. That
 * is what an unknown credit score falls back to: never a 300, never a 750.
 */
export interface RateBandRule {
  id: string;
  loanType: LoanType;
  incomeType?: IncomeType;
  employer?: EmployerType;
  minScore?: number;
  maxScore?: number;
  lowRatePct: number;
  highRatePct: number;
}

export const RATE_BAND_RULES: RateBandRule[] = [
  // Personal loan — the tightest bands need the most evidence.
  { id: "personal-salaried-mnc-750plus", loanType: "personal", incomeType: "salaried", employer: "mnc", minScore: 750, lowRatePct: 10.5, highRatePct: 13 },
  { id: "personal-salaried-govt-750plus", loanType: "personal", incomeType: "salaried", employer: "government", minScore: 750, lowRatePct: 10.5, highRatePct: 13 },
  { id: "personal-salaried-750plus", loanType: "personal", incomeType: "salaried", minScore: 750, lowRatePct: 11, highRatePct: 14 },
  { id: "personal-salaried-700to749", loanType: "personal", incomeType: "salaried", minScore: 700, maxScore: 749, lowRatePct: 12.5, highRatePct: 16 },
  { id: "personal-salaried-650to699", loanType: "personal", incomeType: "salaried", minScore: 650, maxScore: 699, lowRatePct: 16, highRatePct: 22 },
  { id: "personal-salaried-wide", loanType: "personal", incomeType: "salaried", lowRatePct: 11, highRatePct: 18 },
  { id: "personal-self-employed-wide", loanType: "personal", incomeType: "self_employed", lowRatePct: 14, highRatePct: 22 },
  { id: "personal-informal-wide", loanType: "personal", incomeType: "informal", lowRatePct: 24, highRatePct: 36 },
  { id: "personal-wide", loanType: "personal", lowRatePct: 11, highRatePct: 24 },

  // Loan against property — secured, so a thin credit file hurts far less.
  { id: "property-700plus", loanType: "property", minScore: 700, lowRatePct: 10, highRatePct: 12.5 },
  { id: "property-wide", loanType: "property", lowRatePct: 10, highRatePct: 13.5 },

  { id: "gold-wide", loanType: "gold", lowRatePct: 8.5, highRatePct: 14 },

  { id: "two-wheeler-salaried", loanType: "two_wheeler", incomeType: "salaried", lowRatePct: 10, highRatePct: 16 },
  { id: "two-wheeler-informal", loanType: "two_wheeler", incomeType: "informal", lowRatePct: 14, highRatePct: 20 },
  { id: "two-wheeler-wide", loanType: "two_wheeler", lowRatePct: 10, highRatePct: 20 },

  { id: "business-self-employed", loanType: "business", incomeType: "self_employed", lowRatePct: 14, highRatePct: 22 },
  { id: "business-wide", loanType: "business", lowRatePct: 16, highRatePct: 24 },

  { id: "home-750plus", loanType: "home", minScore: 750, lowRatePct: 8, highRatePct: 9.5 },
  { id: "home-wide", loanType: "home", lowRatePct: 8, highRatePct: 10.5 },
];

/** The product-wide band, used when we do not know the credit score. */
export function wideBandFor(loanType: LoanType): { lowRatePct: number; highRatePct: number } {
  const catchAll = RATE_BAND_RULES.find(
    (rule) =>
      rule.loanType === loanType &&
      rule.minScore === undefined &&
      rule.employer === undefined &&
      rule.incomeType === undefined,
  );
  const anyRuleForProduct = RATE_BAND_RULES.find((rule) => rule.loanType === loanType);
  const chosen = catchAll ?? anyRuleForProduct;
  return {
    lowRatePct: chosen?.lowRatePct ?? 12,
    highRatePct: chosen?.highRatePct ?? 24,
  };
}

/** The wide band for a product plus income type, when the score is unknown. */
export function wideBandForIncomeType(
  loanType: LoanType,
  incomeType: IncomeType | undefined,
): { lowRatePct: number; highRatePct: number } | undefined {
  if (!incomeType) return undefined;
  const rule = RATE_BAND_RULES.find(
    (candidate) =>
      candidate.loanType === loanType &&
      candidate.incomeType === incomeType &&
      candidate.minScore === undefined &&
      candidate.employer === undefined,
  );
  if (!rule) return undefined;
  return { lowRatePct: rule.lowRatePct, highRatePct: rule.highRatePct };
}

/**
 * The most specific band that fits this borrower. Employer evidence counts for
 * more than a score, which counts for more than income type alone.
 */
export function bestMatchingBand(
  loanType: LoanType,
  creditScore: number | undefined,
  incomeType: IncomeType | undefined,
  employer: EmployerType | undefined,
): RateBandRule | undefined {
  const rankedRules = RATE_BAND_RULES.filter((rule) => rule.loanType === loanType).sort(
    (left, right) => specificityOf(right) - specificityOf(left),
  );

  return rankedRules.find((rule) => {
    if (rule.incomeType && rule.incomeType !== incomeType) return false;
    if (rule.employer && rule.employer !== employer) return false;
    if (creditScore === undefined) {
      return rule.minScore === undefined && rule.maxScore === undefined;
    }
    if (rule.minScore !== undefined && creditScore < rule.minScore) return false;
    if (rule.maxScore !== undefined && creditScore > rule.maxScore) return false;
    return true;
  });
}

function specificityOf(rule: RateBandRule): number {
  return (
    (rule.employer ? 4 : 0) +
    (rule.minScore !== undefined ? 2 : 0) +
    (rule.incomeType ? 1 : 0)
  );
}
