import { describe, expect, it } from "vitest";
import { Answer, amount, assessBorrower, choice, dontKnow } from "../../src/domain";
import { aSalariedBorrower } from "../helpers/build-answers";

const bandWidth = (rate: { headlineRateLowPct: number; headlineRateHighPct: number }) =>
  rate.headlineRateHighPct - rate.headlineRateLowPct;

describe("Fair rate band", () => {
  it("treats an unknown credit score as a wide band, not as a 300", () => {
    const unknownScore = assessBorrower(
      aSalariedBorrower({ [Answer.creditScore]: dontKnow() }),
    );
    const knownGoodScore = assessBorrower(
      aSalariedBorrower({
        [Answer.creditScore]: amount(780),
        [Answer.employerType]: choice("mnc"),
      }),
    );

    expect(unknownScore.interestRate.widenedForUnknownScore).toBe(true);
    expect(bandWidth(unknownScore.interestRate)).toBeGreaterThanOrEqual(
      bandWidth(knownGoodScore.interestRate),
    );
    // And not a punitive rate either — the low end stays realistic.
    expect(unknownScore.interestRate.headlineRateLowPct).toBeGreaterThan(5);
    expect(unknownScore.interestRate.headlineRateLowPct).toBeLessThan(15);
  });

  it("gives an MNC employee with a 780 score the tightest band available", () => {
    const result = assessBorrower(
      aSalariedBorrower({
        [Answer.creditScore]: amount(780),
        [Answer.employerType]: choice("mnc"),
      }),
    );
    expect(result.interestRate.headlineRateLowPct).toBe(10.5);
    expect(result.interestRate.headlineRateHighPct).toBe(13);
  });

  it("prices a thin credit file higher on an unsecured loan", () => {
    const strong = assessBorrower(
      aSalariedBorrower({ [Answer.creditScore]: amount(780) }),
    );
    const weak = assessBorrower(aSalariedBorrower({ [Answer.creditScore]: amount(660) }));
    expect(weak.interestRate.headlineRateHighPct).toBeGreaterThan(
      strong.interestRate.headlineRateHighPct,
    );
  });

  it("adds a premium when more than half the card limit is used", () => {
    const lowUse = assessBorrower(
      aSalariedBorrower({ [Answer.creditCardUtilisationPct]: amount(10) }),
    );
    const highUse = assessBorrower(
      aSalariedBorrower({ [Answer.creditCardUtilisationPct]: amount(80) }),
    );
    expect(highUse.interestRate.headlineRateLowPct).toBeCloseTo(
      lowUse.interestRate.headlineRateLowPct + 1.5,
      1,
    );
  });

  it("always reports an all-in APR at or above the headline rate", () => {
    const result = assessBorrower(aSalariedBorrower());
    expect(result.interestRate.allInAprLowPct).toBeGreaterThanOrEqual(
      result.interestRate.headlineRateLowPct,
    );
    expect(result.interestRate.processingFeePct).toBeGreaterThan(0);
  });

  it("charges a lower rate on a secured product than an unsecured one", () => {
    const personal = assessBorrower(aSalariedBorrower());
    const gold = assessBorrower(
      aSalariedBorrower({
        [Answer.loanType]: choice("gold"),
        [Answer.loanPurpose]: choice("emergency"),
        [Answer.goldValue]: amount(500_000),
      }),
    );
    expect(gold.interestRate.headlineRateLowPct).toBeLessThan(
      personal.interestRate.headlineRateLowPct,
    );
  });
});
