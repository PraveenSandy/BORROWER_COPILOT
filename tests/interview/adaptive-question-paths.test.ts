import { describe, expect, it } from "vitest";
import { Answer, BorrowerAnswers, amount, choice } from "../../src/domain";
import {
  applicableQuestions,
  mustQuestionsAreComplete,
  nextQuestion,
} from "../../src/interview";
import { anitaAnswers, priyaAnswers, raviAnswers } from "../../src/sample-borrowers";

const answerIdsAskedOf = (answers: BorrowerAnswers) =>
  applicableQuestions(answers).map((question) => question.answerId);

describe("The question path adapts to the loan type", () => {
  it("asks a salaried personal-loan borrower about their employer, never about an ITR", () => {
    const asked = answerIdsAskedOf(priyaAnswers());
    expect(asked).toContain(Answer.employerType);
    expect(asked).not.toContain(Answer.lastItrAnnualIncome);
  });

  it("asks a self-employed business borrower for both the ITR and the real cash", () => {
    const asked = answerIdsAskedOf(raviAnswers());
    expect(asked).toContain(Answer.lastItrAnnualIncome);
    expect(asked).toContain(Answer.monthlyCashDrawings);
    expect(asked).toContain(Answer.propertyValue);
  });

  it("asks an informal earner about app loans, never about an MNC employer", () => {
    const asked = answerIdsAskedOf(anitaAnswers());
    expect(asked).toContain(Answer.appLoanOutstanding);
    expect(asked).not.toContain(Answer.employerType);
  });

  it("asks a gold borrower only for the jewellery value", () => {
    const asked = answerIdsAskedOf(
      anitaAnswers().set(Answer.loanType, choice("gold")),
    );
    expect(asked).toContain(Answer.goldValue);
    expect(asked).not.toContain(Answer.employerType);
    expect(asked).not.toContain(Answer.propertyValue);
  });

  it("asks a two-wheeler borrower for the on-road price", () => {
    const asked = answerIdsAskedOf(
      anitaAnswers().set(Answer.loanType, choice("two_wheeler")),
    );
    expect(asked).toContain(Answer.vehicleOnRoadPrice);
  });

  it("asks a self-employed borrower for their ITR even on a personal loan", () => {
    const asked = answerIdsAskedOf(
      raviAnswers().set(Answer.loanType, choice("personal")),
    );
    expect(asked).toContain(Answer.lastItrAnnualIncome);
    expect(asked).toContain(Answer.monthlyCashDrawings);
  });

  it("asks about expected extra income for any productive purpose, not just business loans", () => {
    const goldForWorkingCapital = raviAnswers()
      .set(Answer.loanType, choice("gold"))
      .set(Answer.loanPurpose, choice("business_expansion"));
    expect(answerIdsAskedOf(goldForWorkingCapital)).toContain(
      Answer.expectedExtraMonthlyIncome,
    );
  });

  it("does not ask about extra income for a wedding, which creates none", () => {
    const asked = answerIdsAskedOf(priyaAnswers());
    expect(asked).not.toContain(Answer.expectedExtraMonthlyIncome);
  });

  it("asks every borrower about a bounce, savings and dependents", () => {
    for (const answers of [priyaAnswers(), raviAnswers(), anitaAnswers()]) {
      const asked = answerIdsAskedOf(answers);
      expect(asked).toContain(Answer.hadEmiBounceLast12Months);
      expect(asked).toContain(Answer.emergencySavingsMonths);
      expect(asked).toContain(Answer.dependentCount);
    }
  });

  it("never asks the same thing twice, even when two paths want the gold value", () => {
    const asked = answerIdsAskedOf(
      anitaAnswers().set(Answer.loanType, choice("gold")),
    );
    const goldValueCount = asked.filter((id) => id === Answer.goldValue).length;
    expect(goldValueCount).toBe(1);
  });
});

describe("The must-question sequence", () => {
  it("starts by asking for the loan type and nothing else", () => {
    const first = nextQuestion(new BorrowerAnswers(), "must");
    expect(first?.answerId).toBe(Answer.loanType);
    expect(applicableQuestions(new BorrowerAnswers())).toHaveLength(1);
  });

  it("unlocks the purpose question only after the loan type is chosen", () => {
    const answers = new BorrowerAnswers().set(Answer.loanType, choice("gold"));
    expect(nextQuestion(answers, "must")?.answerId).toBe(Answer.loanPurpose);
  });

  it("offers no extras until every must-question has a response", () => {
    const answers = new BorrowerAnswers()
      .set(Answer.loanType, choice("personal"))
      .set(Answer.loanPurpose, choice("wedding"));
    expect(mustQuestionsAreComplete(answers)).toBe(false);
    expect(nextQuestion(answers, "extra")).toBeUndefined();
  });

  it("reports the must-questions as complete for a full sample borrower", () => {
    expect(mustQuestionsAreComplete(priyaAnswers())).toBe(true);
  });

  it("treats \u201cI don't know\u201d as a valid response that lets the path continue", () => {
    const answers = new BorrowerAnswers()
      .set(Answer.loanType, choice("personal"))
      .set(Answer.loanPurpose, choice("wedding"))
      .set(Answer.amountWanted, amount(500_000))
      .set(Answer.incomeType, choice("salaried"))
      .set(Answer.monthlyIncome, amount(60_000))
      .set(Answer.existingEmiTotal, amount(0))
      .set(Answer.essentialMonthlySpend, amount(20_000))
      .set(Answer.age, amount(30));
    expect(nextQuestion(answers, "must")?.answerId).toBe(Answer.creditScore);
  });
});
