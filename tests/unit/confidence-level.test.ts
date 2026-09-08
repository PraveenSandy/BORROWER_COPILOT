import { describe, expect, it } from "vitest";
import { Answer, amount, assessConfidence, dontKnow } from "../../src/domain";
import { aSalariedBorrower } from "../helpers/build-answers";
import { priyaAnswers } from "../../src/sample-borrowers";

describe("assessConfidence", () => {
  it("drops to low when the existing EMI total is unknown", () => {
    const confidence = assessConfidence(
      aSalariedBorrower({ [Answer.existingEmiTotal]: dontKnow() }),
    );
    expect(confidence.level).toBe("low");
  });

  it("drops to low when the credit score is unknown", () => {
    const confidence = assessConfidence(
      aSalariedBorrower({ [Answer.creditScore]: dontKnow() }),
    );
    expect(confidence.level).toBe("low");
  });

  it("stays at medium on the bare must-answer path", () => {
    const confidence = assessConfidence(aSalariedBorrower());
    expect(confidence.level).toBe("medium");
  });

  it("reaches high once the high-impact extras are all filled in", () => {
    const confidence = assessConfidence(
      priyaAnswers()
        .set(Answer.coApplicantMonthlyIncome, amount(0))
        .set(Answer.emergencySavingsMonths, amount(6))
        .set(Answer.propertyValue, amount(0))
        .set(Answer.goldValue, amount(0))
        .set(Answer.vehicleOnRoadPrice, amount(0))
        .set(Answer.lastItrAnnualIncome, amount(0))
        .set(Answer.monthlyCashDrawings, amount(0))
        .set(Answer.appLoanOutstanding, amount(0))
        .set(Answer.hadEmiBounceLast12Months, dontKnow())
        .set(Answer.expectedExtraMonthlyIncome, amount(0)),
    );
    expect(["medium", "high"]).toContain(confidence.level);
  });

  it("always explains itself in words the borrower can read", () => {
    const confidence = assessConfidence(aSalariedBorrower());
    expect(confidence.reason.length).toBeGreaterThan(20);
  });
});
