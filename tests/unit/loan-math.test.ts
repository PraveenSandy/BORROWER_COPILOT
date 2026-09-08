import { describe, expect, it } from "vitest";
import { allInAprPct, loanAmountForEmi, monthlyEmi } from "../../src/domain";

describe("monthlyEmi", () => {
  it("matches a hand-calculated EMI: ₹1,00,000 at 12% over 12 months is ₹8,885", () => {
    expect(Math.round(monthlyEmi(100_000, 12, 12))).toBe(8885);
  });

  it("splits the principal evenly when the rate is zero", () => {
    expect(monthlyEmi(120_000, 0, 12)).toBe(10_000);
  });

  it("returns zero for a zero or negative principal instead of throwing", () => {
    expect(monthlyEmi(0, 12, 12)).toBe(0);
    expect(monthlyEmi(-5_000, 12, 12)).toBe(0);
  });

  it("refuses a tenure of zero months, because that loan cannot exist", () => {
    expect(() => monthlyEmi(100_000, 12, 0)).toThrow();
  });
});

describe("loanAmountForEmi", () => {
  it("is the exact inverse of monthlyEmi", () => {
    const emi = monthlyEmi(500_000, 14, 48);
    expect(Math.round(loanAmountForEmi(emi, 14, 48))).toBe(500_000);
  });

  it("returns zero when there is no room for any EMI", () => {
    expect(loanAmountForEmi(0, 14, 48)).toBe(0);
  });
});

describe("allInAprPct", () => {
  it("equals the headline rate when there is no processing fee", () => {
    expect(allInAprPct(500_000, 12, 36, 0)).toBeCloseTo(12, 1);
  });

  it("rises above the headline once a fee is deducted up front", () => {
    const withFee = allInAprPct(500_000, 12, 36, 2);
    expect(withFee).toBeGreaterThan(12);
    // A 2% fee on a 3-year loan is worth a little over one extra point.
    expect(withFee).toBeLessThan(15);
  });

  it("charges a short loan more for the same fee, because there is less time to spread it", () => {
    const overOneYear = allInAprPct(500_000, 12, 12, 2);
    const overFiveYears = allInAprPct(500_000, 12, 60, 2);
    expect(overOneYear).toBeGreaterThan(overFiveYears);
  });
});
