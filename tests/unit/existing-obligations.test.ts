import { describe, expect, it } from "vitest";
import { Answer, amount, dontKnow, resolveMonthlyCommitments } from "../../src/domain";
import { aSalariedBorrower } from "../helpers/build-answers";

describe("resolveMonthlyCommitments", () => {
  it("never treats an unknown EMI total as zero", () => {
    const commitments = resolveMonthlyCommitments(
      aSalariedBorrower({ [Answer.existingEmiTotal]: dontKnow() }),
      80_000,
    );
    expect(commitments.existingEmiIsUnknown).toBe(true);
    expect(commitments.breakdown.join(" ")).toMatch(/not assumed to be zero/i);
  });

  it("raises understated essentials to 35% of income", () => {
    const commitments = resolveMonthlyCommitments(
      aSalariedBorrower({ [Answer.essentialMonthlySpend]: amount(5_000) }),
      100_000,
    );
    expect(commitments.essentialSpend).toBe(35_000);
  });

  it("adds ₹2,000 of assumed essentials per dependent", () => {
    const commitments = resolveMonthlyCommitments(
      aSalariedBorrower({
        [Answer.essentialMonthlySpend]: amount(5_000),
        [Answer.dependentCount]: amount(3),
      }),
      100_000,
    );
    expect(commitments.essentialSpend).toBe(35_000 + 6_000);
  });

  it("keeps a stated figure that is already above the floor", () => {
    const commitments = resolveMonthlyCommitments(
      aSalariedBorrower({ [Answer.essentialMonthlySpend]: amount(60_000) }),
      100_000,
    );
    expect(commitments.essentialSpend).toBe(60_000);
  });

  it("treats rent as essential even when the borrower forgot to include it", () => {
    const commitments = resolveMonthlyCommitments(
      aSalariedBorrower({
        [Answer.essentialMonthlySpend]: amount(10_000),
        [Answer.monthlyRent]: amount(40_000),
      }),
      50_000,
    );
    expect(commitments.essentialSpend).toBe(40_000);
  });

  it("converts an app-loan balance into about 12% a month of servicing", () => {
    const commitments = resolveMonthlyCommitments(
      aSalariedBorrower({ [Answer.appLoanOutstanding]: amount(35_000) }),
      80_000,
    );
    // ₹5,000 declared EMI plus 12% of ₹35,000.
    expect(commitments.emiAndOtherOutgo).toBeCloseTo(5_000 + 4_200, 0);
  });

  it("spreads a large upcoming expense over six months", () => {
    const commitments = resolveMonthlyCommitments(
      aSalariedBorrower({ [Answer.largeExpenseNext6Months]: amount(60_000) }),
      80_000,
    );
    expect(commitments.emiAndOtherOutgo).toBe(5_000 + 10_000);
  });
});
