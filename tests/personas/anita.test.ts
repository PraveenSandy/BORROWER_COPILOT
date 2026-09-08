import { describe, expect, it } from "vitest";
import { assessBorrower } from "../../src/domain";
import { anitaAnswers, anitaTwoWheelerAnswers } from "../../src/sample-borrowers";

/**
 * Anita, 35, informal income with a bounce on record.
 * Her case exists to prove "don't borrow" is genuinely reachable.
 */
describe("Anita — informal income after a bounce", () => {
  it("refuses the unsecured loan outright", () => {
    const result = assessBorrower(anitaAnswers());
    expect(result.decision).toBe("do_not_borrow");
    expect(result.amounts.recommendedAmount).toBe(0);
    expect(result.explanations.whyDecision.toLowerCase()).toMatch(/bounce/);
  });

  it("builds her household budget on the ₹26,000 month, not the ₹30,000 one", () => {
    const result = assessBorrower(anitaAnswers());
    expect(result.amounts.householdSafeAmount).toBe(0);
    expect(result.monthlyPayment.incomeDropStress.survivesDrop).toBe(false);
  });

  it("writes a card that says do not borrow instead of quoting an EMI of ₹0", () => {
    const card = assessBorrower(anitaAnswers()).negotiationCard;
    expect(card.isDoNotBorrow).toBe(true);
    expect(card.walkAwayLine).not.toMatch(/₹0/);
    expect(card.walkAwayLine.toLowerCase()).toMatch(/sign nothing/);
  });

  it("warns her about the spiral rather than sending her to another app loan", () => {
    const card = assessBorrower(anitaAnswers()).negotiationCard;
    expect(card.walkAwayLine.toLowerCase()).toMatch(/app loan|top-up/);
  });

  it("gives three reasons on the card, so the refusal is arguable", () => {
    expect(assessBorrower(anitaAnswers()).negotiationCard.reasons).toHaveLength(3);
  });

  it("still refuses a two-wheeler loan, because the money simply is not there", () => {
    const result = assessBorrower(anitaTwoWheelerAnswers());
    expect(result.decision).toBe("do_not_borrow");
  });
});
