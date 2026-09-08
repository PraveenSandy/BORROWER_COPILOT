import { describe, expect, it } from "vitest";
import { Answer, RULES, amount, assessBorrower, choice } from "../../src/domain";
import { aSalariedBorrower } from "../helpers/build-answers";

describe("Tenure, age and the loan-to-value cap", () => {
  it("gives a 29-year-old a long personal-loan tenure", () => {
    const result = assessBorrower(aSalariedBorrower({ [Answer.age]: amount(29) }));
    expect(result.monthlyPayment.tenureMonths).toBeGreaterThan(24);
  });

  it("shortens the tenure for a 58-year-old so the loan ends before retirement", () => {
    const young = assessBorrower(aSalariedBorrower({ [Answer.age]: amount(29) }));
    const older = assessBorrower(aSalariedBorrower({ [Answer.age]: amount(58) }));
    expect(older.monthlyPayment.tenureMonths).toBeLessThan(
      young.monthlyPayment.tenureMonths,
    );
  });

  it("blocks a borrower below the minimum age instead of quoting them a number", () => {
    const result = assessBorrower(aSalariedBorrower({ [Answer.age]: amount(17) }));
    expect(
      result.blockers.some((blocker) =>
        blocker.includes(String(RULES.age.minimumToBorrow)),
      ),
    ).toBe(true);
  });

  it("caps a gold loan at 75% of the jewellery value however good the income", () => {
    const result = assessBorrower(
      aSalariedBorrower({
        [Answer.loanType]: choice("gold"),
        [Answer.loanPurpose]: choice("emergency"),
        [Answer.goldValue]: amount(200_000),
        [Answer.amountWanted]: amount(500_000),
      }),
    );
    expect(result.amounts.lenderLikelyAmount).toBeLessThanOrEqual(150_000);
  });

  it("refuses a gold loan entirely when no jewellery has been valued", () => {
    const result = assessBorrower(
      aSalariedBorrower({
        [Answer.loanType]: choice("gold"),
        [Answer.loanPurpose]: choice("emergency"),
      }),
    );
    expect(result.amounts.lenderLikelyAmount).toBe(0);
  });
});

describe("The gap between the two books", () => {
  it("splits the lender amount from the safe amount once rent is counted", () => {
    const withRent = assessBorrower(
      aSalariedBorrower({ [Answer.monthlyRent]: amount(28_000) }),
    );
    const withoutRent = assessBorrower(aSalariedBorrower());

    expect(withRent.amounts.lenderLikelyAmount).toBeGreaterThan(0);
    expect(withRent.amounts.householdSafeAmount).toBeLessThanOrEqual(
      withoutRent.amounts.householdSafeAmount,
    );
    expect(withRent.amounts.lenderLikelyAmount).toBeGreaterThan(
      withRent.amounts.householdSafeAmount,
    );
  });

  it("cuts the safe amount when there is less than three months of savings", () => {
    const noCushion = assessBorrower(
      aSalariedBorrower({ [Answer.emergencySavingsMonths]: amount(0) }),
    );
    const goodCushion = assessBorrower(
      aSalariedBorrower({ [Answer.emergencySavingsMonths]: amount(6) }),
    );
    expect(noCushion.amounts.householdSafeAmount).toBeLessThan(
      goodCushion.amounts.householdSafeAmount,
    );
  });

  it("never lets the safe amount exceed what a lender would actually give", () => {
    const result = assessBorrower(
      aSalariedBorrower({ [Answer.monthlyIncome]: amount(300_000) }),
    );
    expect(result.amounts.householdSafeAmount).toBeLessThanOrEqual(
      result.amounts.lenderLikelyAmount,
    );
  });

  it("stresses income by 20% and reports whether the surplus survives", () => {
    const result = assessBorrower(aSalariedBorrower());
    expect(result.monthlyPayment.incomeDropStress.incomeDropPct).toBe(20);
    expect(result.monthlyPayment.incomeDropStress.survivesDrop).toBe(true);
  });
});
