/**
 * The shapes the app hands to the screens.
 *
 * The brief asks for four outputs (O1..O4) plus a negotiation card. Those are
 * named `decision`, `amounts`, `interestRate` and `monthlyPayment` here so a
 * reader does not have to remember what "O2" meant.
 */

/** O1. "Don't borrow" is a legitimate answer and must be reachable. */
export type BorrowDecision = "borrow" | "borrow_less" | "do_not_borrow";

/** How much the app trusts its own numbers. Fewer answers means lower. */
export type ConfidenceLevel = "low" | "medium" | "high";

export type LoanType =
  | "personal"
  | "property"
  | "gold"
  | "two_wheeler"
  | "business"
  | "home";

export type IncomeType = "salaried" | "self_employed" | "informal";

/** O2. Two numbers that are usually different, plus the one to actually use. */
export interface AmountAdvice {
  /** What a typical Indian retail desk is likely to sanction. */
  lenderLikelyAmount: number;
  /** What this household can carry after rent, food and a 20% income drop. */
  householdSafeAmount: number;
  /** The number to walk into the branch with. Zero when the answer is "don't". */
  recommendedAmount: number;
  /** True when a high-leverage answer was unknown, so these are wide guesses. */
  isWideGuess: boolean;
  /** Only present when `isWideGuess` is true: show a range, not a point. */
  wideRange?: {
    lenderLowAmount: number;
    lenderHighAmount: number;
    safeLowAmount: number;
    safeHighAmount: number;
  };
}

/** O3. A band, never a single rate, plus the all-in cost including fees. */
export interface InterestRateAdvice {
  headlineRateLowPct: number;
  headlineRateHighPct: number;
  allInAprLowPct: number;
  allInAprHighPct: number;
  processingFeePct: number;
  /** Set when the credit score was unknown, so the band was deliberately wide. */
  widenedForUnknownScore: boolean;
}

/** O4. The monthly ceiling, the tenure trade-off, and one stress case. */
export interface MonthlyPaymentAdvice {
  /** Do not agree to an EMI above this. */
  emiCeiling: number;
  tenureMonths: number;
  shorterTenureOption?: TenureOption;
  longerTenureOption?: TenureOption;
  incomeDropStress: IncomeDropStress;
}

export interface TenureOption {
  tenureMonths: number;
  emi: number;
}

export interface IncomeDropStress {
  incomeDropPct: number;
  /** Money left each month after essentials, old EMIs and the new EMI. */
  surplusAfterEmi: number;
  survivesDrop: boolean;
}

/** Which product the borrower picked, and which one we actually priced. */
export interface LoanTypeAdvice {
  requestedLoanType: LoanType;
  pricedLoanType: LoanType;
  reason: string;
}

/** One sentence per output, so every number is traceable to an answer. */
export interface Explanations {
  whyDecision: string;
  whyAmount: string;
  whyRate: string;
  whyMonthlyPayment: string;
}

/** The single object the UI renders. Produced by `assessBorrower()`. */
export interface Assessment {
  decision: BorrowDecision;
  loanType: LoanTypeAdvice;
  amounts: AmountAdvice;
  interestRate: InterestRateAdvice;
  monthlyPayment: MonthlyPaymentAdvice;
  confidence: ConfidenceLevel;
  confidenceReason: string;
  explanations: Explanations;
  negotiationCard: NegotiationCard;
  /** Reasons the app cannot answer at all, e.g. below the minimum age. */
  blockers: string[];
}

/** The one screen a borrower can hold up to a lender. */
export interface NegotiationCard {
  profileLine: string;
  decisionLabel: string;
  /** Zero when `isDoNotBorrow` is true. Check that flag before showing this. */
  amountToAskFor: number;
  isDoNotBorrow: boolean;
  lenderMayOfferUpTo: number;
  fairRateLine: string;
  allInAprLine: string;
  emiCeiling: number;
  reasons: string[];
  walkAwayLine: string;
  confidence: ConfidenceLevel;
}
