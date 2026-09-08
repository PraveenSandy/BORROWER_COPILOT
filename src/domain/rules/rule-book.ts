import type { LoanType } from "../types";

/**
 * THE RULE BOOK — every threshold the app uses, in one object.
 *
 * This file is the code twin of RULES.md. If you change a number here, change
 * the matching row there, run `npm test`, and the screens follow automatically.
 * No React component is allowed to contain a rupee threshold or a percentage.
 */
export const RULES = {
  age: {
    minimumToBorrow: 21,
    /** The loan should normally finish before these ages. */
    maximumAtLoanEnd: {
      personal: 60,
      property: 70,
      gold: 80,
      two_wheeler: 65,
      business: 65,
      home: 70,
    } satisfies Record<LoanType, number>,
  },

  tenure: {
    maximumMonths: {
      personal: 60,
      property: 180,
      gold: 24,
      two_wheeler: 48,
      business: 60,
      home: 240,
    } satisfies Record<LoanType, number>,
    /** Tenures we offer as the trade-off choices for each product. */
    optionsMonths: {
      personal: [12, 24, 36, 48, 60],
      property: [36, 60, 84, 120, 180],
      gold: [6, 12, 18, 24],
      two_wheeler: [12, 24, 36, 48],
      business: [12, 24, 36, 48, 60],
      home: [60, 120, 180, 240],
    } satisfies Record<LoanType, number[]>,
  },

  /** FOIR: the share of monthly income a lender lets all EMIs consume. */
  foirCap: {
    personal: 0.5,
    property: 0.55,
    gold: 0.6,
    two_wheeler: 0.5,
    business: 0.45,
    home: 0.55,
  } satisfies Record<LoanType, number>,

  /** Loan-to-value: the share of the pledged asset a lender will fund. */
  loanToValueCap: {
    gold: 0.75,
    property: 0.55,
    home: 0.8,
    two_wheeler: 0.85,
  } as Partial<Record<LoanType, number>>,

  processingFeePct: {
    personal: 2,
    property: 1,
    gold: 1,
    two_wheeler: 1.5,
    business: 2,
    home: 0.5,
  } satisfies Record<LoanType, number>,

  household: {
    /** Share of leftover money (after essentials and old EMIs) a new EMI may use. */
    shareOfSurplusForNewEmi: 0.4,
    /** If stated essentials look too low, assume at least this share of income. */
    minimumEssentialShareOfIncome: 0.35,
    extraEssentialsPerDependent: 2000,
    /** Below this many months of savings, cut the safe amount. */
    thinSavingsMonths: 3,
    thinSavingsReduction: 0.25,
    /** Borrowing for consumption gets a smaller safe amount than a productive loan. */
    consumptionReduction: 0.15,
  },

  incomeTrust: {
    /** Lender book only. Never applied to the household budget. */
    informalIncomeCut: 0.4,
    selfEmployedWithoutItrCut: 0.3,
    bonusCountedByLender: 0.5,
    coApplicantShareWhenSelfEmployed: 0.7,
  },

  obligations: {
    /** Monthly servicing assumed for app / BNPL debt, as a share of what is owed. */
    appLoanMonthlyShareOfOutstanding: 0.12,
    creditCardMinimumPaymentShare: 0.05,
    monthsToAbsorbLargeExpense: 6,
  },

  creditBehaviour: {
    /** A bounce plus an unsecured product is a hard stop. */
    bounceBlocksUnsecured: true,
    bounceAddsToSecuredRatePct: 3,
    highCardUtilisationPct: 50,
    highUtilisationAddsToRatePct: 1.5,
    highUtilisationAmountReduction: 0.05,
    shortJobTenureYears: 0.5,
    shortJobTenureAddsToRatePct: 1,
    noGstAddsToRatePct: 1,
  },

  stressTest: {
    /** The one shock the brief asks for: income falls by this much. */
    incomeDropPct: 0.2,
  },

  decision: {
    /** Consumption with no buffer: refuse if the safe amount is this small a share of the ask. */
    consumptionSafeToWantedRatio: 0.4,
    /** A productive loan should earn at least this multiple of its EMI. */
    minimumProductiveIncomeCover: 1.25,
  },

  maximumTicketSize: {
    personal: 2_000_000,
    two_wheeler: 250_000,
  } as Partial<Record<LoanType, number>>,
} as const;

// --- accessors, so no other module reaches into the nested shape directly ---

export function foirCapFor(loanType: LoanType): number {
  return RULES.foirCap[loanType];
}

export function processingFeePctFor(loanType: LoanType): number {
  return RULES.processingFeePct[loanType];
}

export function loanToValueCapFor(loanType: LoanType): number | undefined {
  return RULES.loanToValueCap[loanType];
}

export function maximumTicketSizeFor(loanType: LoanType): number {
  return RULES.maximumTicketSize[loanType] ?? Number.POSITIVE_INFINITY;
}

/**
 * The longest tenure this borrower may take: capped by the product and by the
 * age at which the loan must be repaid.
 */
export function longestTenureMonths(loanType: LoanType, age: number): number {
  const yearsLeftToBorrow = RULES.age.maximumAtLoanEnd[loanType] - age;
  const monthsAllowedByAge = Math.max(0, yearsLeftToBorrow * 12);
  return Math.min(RULES.tenure.maximumMonths[loanType], monthsAllowedByAge);
}

/** The tenure choices to show, never longer than this borrower is allowed. */
export function tenureOptionsFor(loanType: LoanType, maximumMonths: number): number[] {
  const allowed = RULES.tenure.optionsMonths[loanType].filter(
    (months) => months <= maximumMonths,
  );
  if (allowed.length > 0) return allowed;
  return maximumMonths > 0 ? [maximumMonths] : [];
}

/** Unsecured products carry no asset, so a bounce is far more serious. */
export function isUnsecured(loanType: LoanType): boolean {
  return loanType === "personal" || loanType === "business";
}

/** Which answer holds the value of the asset backing this product. */
export function securityAnswerFor(
  loanType: LoanType,
): "goldValue" | "propertyValue" | "vehicleOnRoadPrice" | undefined {
  switch (loanType) {
    case "gold":
      return "goldValue";
    case "property":
    case "home":
      return "propertyValue";
    case "two_wheeler":
      return "vehicleOnRoadPrice";
    default:
      return undefined;
  }
}

/** Products where a lender will not lend at all without the asset valued. */
export function requiresSecurity(loanType: LoanType): boolean {
  return loanType === "gold" || loanType === "property" || loanType === "home";
}
