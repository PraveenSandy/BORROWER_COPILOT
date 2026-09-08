import { describe, expect, it } from "vitest";
import { Answer, amount, assessBorrower, choice, yesNo } from "../../src/domain";
import { aSalariedBorrower } from "../helpers/build-answers";

describe("The borrow / borrow less / don't borrow decision", () => {
  it("says don't borrow after a bounce on an unsecured product", () => {
    const result = assessBorrower(
      aSalariedBorrower({ [Answer.hadEmiBounceLast12Months]: yesNo(true) }),
    );
    expect(result.decision).toBe("do_not_borrow");
    expect(result.amounts.recommendedAmount).toBe(0);
    expect(result.explanations.whyDecision.toLowerCase()).toMatch(/bounce/);
  });

  it("says don't borrow when essentials and existing EMIs leave no surplus", () => {
    const result = assessBorrower(
      aSalariedBorrower({
        [Answer.monthlyIncome]: amount(30_000),
        [Answer.essentialMonthlySpend]: amount(25_000),
        [Answer.existingEmiTotal]: amount(8_000),
      }),
    );
    expect(result.decision).toBe("do_not_borrow");
  });

  it("says borrow for a modest amount with a strong surplus and no bounce", () => {
    const result = assessBorrower(
      aSalariedBorrower({
        [Answer.amountWanted]: amount(80_000),
        [Answer.emergencySavingsMonths]: amount(6),
      }),
    );
    expect(result.decision).toBe("borrow");
    expect(result.amounts.recommendedAmount).toBe(80_000);
  });

  it("says borrow less when a lender would offer more than the household can carry", () => {
    const result = assessBorrower(
      aSalariedBorrower({
        [Answer.amountWanted]: amount(1_500_000),
        [Answer.emergencySavingsMonths]: amount(6),
      }),
    );
    expect(result.decision).toBe("borrow_less");
    expect(result.amounts.recommendedAmount).toBeLessThan(1_500_000);
    expect(result.amounts.recommendedAmount).toBeGreaterThan(0);
  });

  it("recommends no more than the safe amount whenever it says borrow less", () => {
    const result = assessBorrower(
      aSalariedBorrower({ [Answer.amountWanted]: amount(1_500_000) }),
    );
    expect(result.amounts.recommendedAmount).toBeLessThanOrEqual(
      result.amounts.householdSafeAmount,
    );
  });

  it("refuses a wedding loan when savings are thin and the safe amount is far below the ask", () => {
    const result = assessBorrower(
      aSalariedBorrower({
        [Answer.loanPurpose]: choice("wedding"),
        [Answer.amountWanted]: amount(2_000_000),
        [Answer.emergencySavingsMonths]: amount(0),
      }),
    );
    expect(result.decision).toBe("do_not_borrow");
    expect(result.explanations.whyDecision.toLowerCase()).toMatch(/consumption/);
  });
});
