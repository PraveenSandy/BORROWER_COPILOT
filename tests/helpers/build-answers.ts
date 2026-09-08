import {
  Answer,
  BorrowerAnswers,
  amount,
  choice,
  type AnswerId,
  type AnswerValue,
} from "../../src/domain";

/**
 * A deliberately ordinary salaried borrower, used as the starting point for
 * most unit tests.
 *
 * Income ₹80,000, existing EMIs ₹5,000, essentials ₹20,000, age 30, score 760.
 * Each test overrides only the answer it is actually about, so a failure points
 * straight at the rule that broke.
 */
export function aSalariedBorrower(
  overrides: Partial<Record<AnswerId, AnswerValue>> = {},
): BorrowerAnswers {
  let answers = new BorrowerAnswers()
    .set(Answer.loanType, choice("personal"))
    .set(Answer.loanPurpose, choice("consumption"))
    .set(Answer.amountWanted, amount(200_000))
    .set(Answer.incomeType, choice("salaried"))
    .set(Answer.monthlyIncome, amount(80_000))
    .set(Answer.existingEmiTotal, amount(5_000))
    .set(Answer.essentialMonthlySpend, amount(20_000))
    .set(Answer.age, amount(30))
    .set(Answer.creditScore, amount(760));

  for (const [answerId, value] of Object.entries(overrides)) {
    answers = answers.set(answerId as AnswerId, value as AnswerValue);
  }
  return answers;
}
