import { Answer, type BorrowerAnswers } from "../answers";
import { RULES, isUnsecured } from "../rules";
import type { BorrowDecision, LoanType } from "../types";
import { isConsumptionPurpose } from "./borrowing-capacity";

export interface BorrowDecisionInput {
  answers: BorrowerAnswers;
  loanType: LoanType;
  amountWanted: number;
  lenderLikelyAmount: number;
  householdSafeAmount: number;
  safeEmiCeiling: number;
  monthlySurplus: number;
}

export interface BorrowDecisionResult {
  decision: BorrowDecision;
  reason: string;
  /** Zero for "do not borrow". This is the number to walk into the branch with. */
  recommendedAmount: number;
}

/**
 * O1: borrow, borrow less, or don't borrow.
 *
 * "Don't borrow" must be genuinely reachable, in order of severity:
 *   1. a recent bounce plus an unsecured product — a hard stop,
 *   2. no monthly room at all after essentials and existing EMIs,
 *   3. consumption spending with thin savings and a safe amount far below the ask,
 *   4. even the lender's own ceiling is not survivable.
 */
export function decideBorrowOrNot(input: BorrowDecisionInput): BorrowDecisionResult {
  const { answers } = input;
  const hadBounce = answers.yesNo(Answer.hadEmiBounceLast12Months) === true;
  const savingsMonths = answers.amount(Answer.emergencySavingsMonths);
  const purpose = answers.choice(Answer.loanPurpose) ?? "";
  const expectedExtraIncome = answers.amount(Answer.expectedExtraMonthlyIncome) ?? 0;

  if (
    hadBounce &&
    isUnsecured(input.loanType) &&
    RULES.creditBehaviour.bounceBlocksUnsecured
  ) {
    return {
      decision: "do_not_borrow",
      reason:
        "An EMI bounce in the last 12 months plus an unsecured product is a hard stop. A desk will rarely sanction it, and you should not add more expensive debt on top.",
      recommendedAmount: 0,
    };
  }

  if (
    input.monthlySurplus <= 0 ||
    input.safeEmiCeiling <= 0 ||
    input.householdSafeAmount <= 0
  ) {
    return {
      decision: "do_not_borrow",
      reason:
        "After rent, food and the EMIs you already pay there is no room for a new instalment. Borrowing now would crowd out essentials.",
      recommendedAmount: 0,
    };
  }

  const savingsAreThinOrUnknown =
    savingsMonths === undefined || savingsMonths < RULES.household.thinSavingsMonths;
  if (
    isConsumptionPurpose(answers) &&
    savingsAreThinOrUnknown &&
    input.householdSafeAmount <
      input.amountWanted * RULES.decision.consumptionSafeToWantedRatio
  ) {
    return {
      decision: "do_not_borrow",
      reason:
        "This is consumption, not an income-producing asset. Savings are thin or unknown, and the amount you could safely carry is far below what you asked for.",
      recommendedAmount: 0,
    };
  }

  // A productive loan should service itself. If the extra income it creates
  // barely covers the EMI, the borrower is taking the risk with no cushion.
  if (purpose === "business_expansion" && expectedExtraIncome > 0) {
    const incomeCoverOfEmi = expectedExtraIncome / Math.max(1, input.safeEmiCeiling);
    if (
      incomeCoverOfEmi < RULES.decision.minimumProductiveIncomeCover &&
      input.amountWanted > input.householdSafeAmount
    ) {
      return borrowLess(
        input.householdSafeAmount,
        `The extra income you expect does not comfortably cover the EMI — it needs to be at least ${RULES.decision.minimumProductiveIncomeCover}x the instalment.`,
      );
    }
  }

  if (
    input.amountWanted > input.householdSafeAmount &&
    input.amountWanted <= input.lenderLikelyAmount
  ) {
    return borrowLess(
      input.householdSafeAmount,
      "A lender may well sanction more than you should carry. Use the lower, safe number.",
    );
  }

  if (input.amountWanted > input.lenderLikelyAmount) {
    const bothCeilings = Math.min(input.lenderLikelyAmount, input.householdSafeAmount);
    if (bothCeilings <= 0) {
      return {
        decision: "do_not_borrow",
        reason:
          "Even the amount a lender might consider is not survivable on your cash flows.",
        recommendedAmount: 0,
      };
    }
    return {
      decision: "borrow_less",
      reason:
        "The amount you want is above what a lender is likely to sanction, because of either the income ratio or the value of the security. Walk in with the lower number.",
      recommendedAmount: bothCeilings,
    };
  }

  return {
    decision: "borrow",
    reason:
      "The amount you want fits both a typical lending desk and your household surplus, and it still survives a 20% drop in income.",
    recommendedAmount: input.amountWanted,
  };
}

function borrowLess(safeAmount: number, reason: string): BorrowDecisionResult {
  return { decision: "borrow_less", reason, recommendedAmount: safeAmount };
}
