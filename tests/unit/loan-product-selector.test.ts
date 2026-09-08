import { describe, expect, it } from "vitest";
import {
  Answer,
  BorrowerAnswers,
  amount,
  choice,
  parseLoanType,
  selectLoanType,
  yesNo,
} from "../../src/domain";

describe("selectLoanType — steering a borrower to a better product", () => {
  it("moves a self-employed borrower with property from unsecured to a property loan", () => {
    const advice = selectLoanType(
      new BorrowerAnswers()
        .set(Answer.loanType, choice("personal"))
        .set(Answer.loanPurpose, choice("business_expansion"))
        .set(Answer.incomeType, choice("self_employed"))
        .set(Answer.propertyValue, amount(4_500_000)),
    );
    expect(advice.requestedLoanType).toBe("personal");
    expect(advice.pricedLoanType).toBe("property");
  });

  it("leaves the product alone when the property is too small to be worth pledging", () => {
    const advice = selectLoanType(
      new BorrowerAnswers()
        .set(Answer.loanType, choice("personal"))
        .set(Answer.loanPurpose, choice("business_expansion"))
        .set(Answer.incomeType, choice("self_employed"))
        .set(Answer.propertyValue, amount(300_000)),
    );
    expect(advice.pricedLoanType).toBe("personal");
  });

  it("suggests gold rather than unsecured after a bounce", () => {
    const advice = selectLoanType(
      new BorrowerAnswers()
        .set(Answer.loanType, choice("personal"))
        .set(Answer.loanPurpose, choice("emergency"))
        .set(Answer.hadEmiBounceLast12Months, yesNo(true))
        .set(Answer.goldValue, amount(300_000)),
    );
    expect(advice.pricedLoanType).toBe("gold");
  });

  it("suggests gold for an informal earner who has jewellery to pledge", () => {
    const advice = selectLoanType(
      new BorrowerAnswers()
        .set(Answer.loanType, choice("personal"))
        .set(Answer.incomeType, choice("informal"))
        .set(Answer.goldValue, amount(200_000)),
    );
    expect(advice.pricedLoanType).toBe("gold");
  });

  it("never overrides a home loan, whatever else the borrower owns", () => {
    const advice = selectLoanType(
      new BorrowerAnswers()
        .set(Answer.loanType, choice("home"))
        .set(Answer.incomeType, choice("self_employed"))
        .set(Answer.propertyValue, amount(9_000_000)),
    );
    expect(advice.pricedLoanType).toBe("home");
  });

  it("falls back to a personal loan for an unrecognised loan type", () => {
    expect(parseLoanType(undefined)).toBe("personal");
    expect(parseLoanType("crypto-backed")).toBe("personal");
    expect(parseLoanType("gold")).toBe("gold");
  });
});
