import { Answer, BorrowerAnswers, amount, choice, dontKnow, range } from "../domain";

/**
 * Ravi, 42, runs a kirana shop. Wants ₹15,00,000 to expand.
 *
 * His ITR shows ₹4,20,000 a year while he actually takes home ₹40,000 to
 * ₹80,000 a month in cash. He also owns an unencumbered shop worth ₹45,00,000,
 * which is why the app moves him off an unsecured business loan and onto a
 * loan against property at roughly half the rate.
 */
export function raviAnswers(): BorrowerAnswers {
  return new BorrowerAnswers()
    .set(Answer.loanType, choice("business"))
    .set(Answer.loanPurpose, choice("business_expansion"))
    .set(Answer.amountWanted, amount(1_500_000))
    .set(Answer.incomeType, choice("self_employed"))
    .set(Answer.monthlyIncome, range(40_000, 80_000))
    .set(Answer.existingEmiTotal, amount(0))
    .set(Answer.essentialMonthlySpend, amount(25_000))
    .set(Answer.age, amount(42))
    .set(Answer.creditScore, dontKnow())
    .set(Answer.lastItrAnnualIncome, amount(420_000))
    .set(Answer.monthlyCashDrawings, range(40_000, 80_000))
    .set(Answer.propertyValue, amount(4_500_000))
    .set(Answer.coApplicantMonthlyIncome, amount(18_000))
    .set(Answer.businessAgeYears, amount(14))
    .set(Answer.expectedExtraMonthlyIncome, amount(25_000));
}
