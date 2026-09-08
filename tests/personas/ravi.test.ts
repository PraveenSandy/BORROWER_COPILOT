import { describe, expect, it } from "vitest";
import { assessBorrower } from "../../src/domain";
import { raviAnswers } from "../../src/sample-borrowers";

/**
 * Ravi, 42, kirana shop owner. Wants ₹15,00,000 to expand.
 * His case exists to prove the app will move a borrower to a cheaper product.
 */
describe("Ravi — self-employed, rerouted to a property loan", () => {
  it("moves him off the unsecured business loan he asked for", () => {
    const result = assessBorrower(raviAnswers());
    expect(result.loanType.requestedLoanType).toBe("business");
    expect(result.loanType.pricedLoanType).toBe("property");
  });

  it("prices him far below an unsecured business rate because the shop is security", () => {
    expect(assessBorrower(raviAnswers()).interestRate.headlineRateHighPct).toBeLessThan(18);
  });

  it("treats his unknown credit score as a wide band rather than a penalty", () => {
    const result = assessBorrower(raviAnswers());
    expect(result.interestRate.widenedForUnknownScore).toBe(true);
    expect(result.interestRate.headlineRateLowPct).toBeLessThan(13);
  });

  it("tells him plainly that the lender's number comes from his ITR", () => {
    expect(assessBorrower(raviAnswers()).explanations.whyAmount.toLowerCase()).toMatch(/itr/);
  });

  it("still offers him a real amount, because a productive loan is worth doing", () => {
    const result = assessBorrower(raviAnswers());
    expect(result.amounts.lenderLikelyAmount).toBeGreaterThan(0);
    expect(result.amounts.householdSafeAmount).toBeGreaterThan(0);
    expect(result.decision).not.toBe("do_not_borrow");
  });

  it("caps him at 55% of the ₹45,00,000 shop value", () => {
    expect(assessBorrower(raviAnswers()).amounts.lenderLikelyAmount).toBeLessThanOrEqual(
      4_500_000 * 0.55,
    );
  });

  it("gives him a long tenure, which is the point of a secured loan", () => {
    expect(assessBorrower(raviAnswers()).monthlyPayment.tenureMonths).toBeGreaterThan(60);
  });
});
