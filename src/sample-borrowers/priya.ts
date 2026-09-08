import { Answer, BorrowerAnswers, amount, choice, dontKnow } from "../domain";

/**
 * Priya, 29, salaried at an MNC in Pune. Wants ₹8,00,000 for a wedding.
 *
 * Her case is the classic gap between the two books: her salary supports a
 * large sanction, but ₹28,000 of rent that no lender counts means the amount
 * she can safely carry is much smaller.
 */
export function priyaAnswers(): BorrowerAnswers {
  return new BorrowerAnswers()
    .set(Answer.loanType, choice("personal"))
    .set(Answer.loanPurpose, choice("wedding"))
    .set(Answer.amountWanted, amount(800_000))
    .set(Answer.incomeType, choice("salaried"))
    .set(Answer.monthlyIncome, amount(110_000))
    .set(Answer.existingEmiTotal, amount(14_000))
    .set(Answer.essentialMonthlySpend, amount(28_000))
    .set(Answer.age, amount(29))
    .set(Answer.creditScore, amount(780))
    .set(Answer.employerType, choice("mnc"))
    .set(Answer.yearsInCurrentJob, amount(5))
    .set(Answer.monthlyRent, amount(28_000))
    .set(Answer.monthsLeftOnExistingLoans, amount(24));
}

/**
 * The same borrower having answered only the nine must-questions, with an
 * unknown credit score. Used to prove the app still produces all four outputs
 * on the minimum path, just with wider bands.
 */
export function priyaMustAnswersOnly(): BorrowerAnswers {
  return new BorrowerAnswers()
    .set(Answer.loanType, choice("personal"))
    .set(Answer.loanPurpose, choice("wedding"))
    .set(Answer.amountWanted, amount(800_000))
    .set(Answer.incomeType, choice("salaried"))
    .set(Answer.monthlyIncome, amount(110_000))
    .set(Answer.existingEmiTotal, amount(14_000))
    .set(Answer.essentialMonthlySpend, amount(28_000))
    .set(Answer.age, amount(29))
    .set(Answer.creditScore, dontKnow());
}
