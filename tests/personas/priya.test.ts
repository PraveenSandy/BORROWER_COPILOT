import { describe, expect, it } from "vitest";
import { assessBorrower } from "../../src/domain";
import { priyaAnswers, priyaMustAnswersOnly } from "../../src/sample-borrowers";

const bandWidth = (rate: { headlineRateLowPct: number; headlineRateHighPct: number }) =>
  rate.headlineRateHighPct - rate.headlineRateLowPct;

/**
 * Priya, 29, salaried at an MNC. Wants ₹8,00,000 for a wedding.
 * Her case exists to prove the two-book split is real and visible.
 */
describe("Priya — salaried personal loan", () => {
  it("keeps her on a personal loan", () => {
    expect(assessBorrower(priyaAnswers()).loanType.pricedLoanType).toBe("personal");
  });

  it("shows a lender amount far above what her rent leaves room for", () => {
    const result = assessBorrower(priyaAnswers());
    expect(result.amounts.lenderLikelyAmount).toBeGreaterThan(
      result.amounts.householdSafeAmount * 2,
    );
  });

  it("recommends no more than the safe amount and does not refuse her outright", () => {
    const result = assessBorrower(priyaAnswers());
    expect(result.amounts.recommendedAmount).toBeLessThanOrEqual(
      result.amounts.householdSafeAmount,
    );
    expect(result.decision).not.toBe("do_not_borrow");
  });

  it("earns her the good rate band her score and employer deserve", () => {
    expect(assessBorrower(priyaAnswers()).interestRate.headlineRateHighPct).toBeLessThanOrEqual(
      14.5,
    );
  });

  it("reminds her that her existing EMIs still run for 24 months", () => {
    const result = assessBorrower(priyaAnswers());
    expect(result.explanations.whyMonthlyPayment).toMatch(/24 more months/i);
  });

  it("puts the recommended amount on the negotiation card, not the lender's number", () => {
    const result = assessBorrower(priyaAnswers());
    expect(result.negotiationCard.amountToAskFor).toBe(result.amounts.recommendedAmount);
    expect(result.negotiationCard.isDoNotBorrow).toBe(false);
  });

  it("still produces all four outputs when she answers only the must-questions", () => {
    const result = assessBorrower(priyaMustAnswersOnly());
    expect(result.decision).toBeTruthy();
    expect(result.amounts.lenderLikelyAmount).toBeGreaterThan(0);
    expect(result.interestRate.widenedForUnknownScore).toBe(true);
    expect(result.monthlyPayment.emiCeiling).toBeGreaterThanOrEqual(0);
    expect(["low", "medium"]).toContain(result.confidence);
  });

  it("tightens her rate band once she answers the extras", () => {
    const withExtras = assessBorrower(priyaAnswers());
    const mustOnly = assessBorrower(priyaMustAnswersOnly());
    expect(bandWidth(withExtras.interestRate)).toBeLessThan(
      bandWidth(mustOnly.interestRate),
    );
    expect(mustOnly.confidence).toBe("low");
  });
});
