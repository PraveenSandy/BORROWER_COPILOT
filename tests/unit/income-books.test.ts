import { describe, expect, it } from "vitest";
import {
  Answer,
  BorrowerAnswers,
  amount,
  choice,
  range,
  resolveIncomeBooks,
} from "../../src/domain";
import { aSalariedBorrower } from "../helpers/build-answers";

describe("resolveIncomeBooks — the two-book split", () => {
  it("uses net salary for a salaried borrower, not a multiple of CTC", () => {
    const books = resolveIncomeBooks(
      aSalariedBorrower({ [Answer.monthlyIncome]: amount(110_000) }),
    );
    expect(books.lenderBook).toBe(110_000);
  });

  it("counts only half of variable pay in the lender book and none in the household book", () => {
    const books = resolveIncomeBooks(
      aSalariedBorrower({
        [Answer.monthlyIncome]: amount(100_000),
        [Answer.bonusSharePct]: amount(20),
      }),
    );
    // Fixed ₹80,000 plus half of the ₹20,000 bonus.
    expect(books.lenderBook).toBe(90_000);
    // The household plans on the fixed part only.
    expect(books.householdBook).toBe(80_000);
  });

  it("prices a self-employed borrower on ITR divided by twelve, never on cash drawings", () => {
    const books = resolveIncomeBooks(
      new BorrowerAnswers()
        .set(Answer.incomeType, choice("self_employed"))
        .set(Answer.monthlyIncome, range(40_000, 80_000))
        .set(Answer.lastItrAnnualIncome, amount(420_000))
        .set(Answer.monthlyCashDrawings, range(40_000, 80_000)),
    );
    expect(Math.round(books.lenderBook)).toBe(35_000);
    // His own budget runs on real cash at the low end, not the ₹60,000 midpoint.
    expect(Math.round(books.householdBook)).toBe(40_000);
  });

  it("cuts stated income by 30% for a self-employed borrower with no ITR to show", () => {
    const books = resolveIncomeBooks(
      new BorrowerAnswers()
        .set(Answer.incomeType, choice("self_employed"))
        .set(Answer.monthlyIncome, amount(60_000)),
    );
    expect(books.lenderBook).toBe(42_000);
    expect(books.householdBook).toBe(60_000);
  });

  it("keeps the informal-income cut out of the household book entirely", () => {
    const books = resolveIncomeBooks(
      aSalariedBorrower({
        [Answer.incomeType]: choice("informal"),
        [Answer.monthlyIncome]: range(26_000, 30_000),
      }),
    );
    // The household lives on the worst month she reported.
    expect(books.householdBook).toBe(26_000);
    // The lender discounts the ₹28,000 midpoint by 40%.
    expect(books.lenderBook).toBeCloseTo(28_000 * 0.6, 0);
    // This is the point of the split: a desk trusts less than she actually has.
    expect(books.lenderBook).toBeLessThan(books.householdBook);
  });

  it("counts only 70% of a co-applicant's income when the borrower is self-employed", () => {
    const books = resolveIncomeBooks(
      new BorrowerAnswers()
        .set(Answer.incomeType, choice("self_employed"))
        .set(Answer.monthlyIncome, amount(50_000))
        .set(Answer.lastItrAnnualIncome, amount(600_000))
        .set(Answer.coApplicantMonthlyIncome, amount(20_000)),
    );
    expect(books.lenderBook).toBe(50_000 + 14_000);
  });
});
