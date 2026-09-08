import { Answer, BorrowerAnswers, amount, choice, dontKnow, range, yesNo } from "../domain";

/**
 * Anita, 35, informal income of ₹26,000 to ₹30,000. Wants ₹1,50,000.
 *
 * She has an EMI bounce on record, ₹35,000 owed on app loans, and three
 * dependents. This is the case the app exists to catch: the honest answer is
 * "don't borrow", and it has to be reachable.
 */
export function anitaAnswers(): BorrowerAnswers {
  return new BorrowerAnswers()
    .set(Answer.loanType, choice("personal"))
    .set(Answer.loanPurpose, choice("vehicle"))
    .set(Answer.amountWanted, amount(150_000))
    .set(Answer.incomeType, choice("informal"))
    .set(Answer.monthlyIncome, range(26_000, 30_000))
    .set(Answer.existingEmiTotal, amount(7_000))
    .set(Answer.essentialMonthlySpend, amount(18_000))
    .set(Answer.age, amount(35))
    .set(Answer.creditScore, dontKnow())
    .set(Answer.hadEmiBounceLast12Months, yesNo(true))
    .set(Answer.appLoanOutstanding, amount(35_000))
    .set(Answer.dependentCount, amount(3))
    .set(Answer.emergencySavingsMonths, amount(0))
    .set(Answer.expectedExtraMonthlyIncome, amount(8_000));
}

/** Anita asking for a two-wheeler loan instead, which is secured. */
export function anitaTwoWheelerAnswers(): BorrowerAnswers {
  return anitaAnswers().set(Answer.loanType, choice("two_wheeler"));
}
