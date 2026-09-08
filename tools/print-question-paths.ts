/**
 * Prints exactly which questions are asked for every loan type and income type.
 *
 *   npm run questions
 *
 * This is how QUESTIONS.md is produced, so the documented taxonomy can never
 * drift from the actual question registry.
 */
import { Answer, BorrowerAnswers, amount, choice } from "../src/domain";
import { applicableQuestions, purposeChoicesFor } from "../src/interview";

const LOAN_TYPES = ["personal", "property", "gold", "two_wheeler", "business", "home"];
const INCOME_TYPES = ["salaried", "self_employed", "informal"];

/** A borrower who has answered all nine must-questions, so extras are unlocked. */
function borrowerOn(loanType: string, incomeType: string, purpose: string) {
  return new BorrowerAnswers()
    .set(Answer.loanType, choice(loanType))
    .set(Answer.loanPurpose, choice(purpose))
    .set(Answer.amountWanted, amount(500_000))
    .set(Answer.incomeType, choice(incomeType))
    .set(Answer.monthlyIncome, amount(80_000))
    .set(Answer.existingEmiTotal, amount(5_000))
    .set(Answer.essentialMonthlySpend, amount(20_000))
    .set(Answer.age, amount(35))
    .set(Answer.creditScore, amount(750));
}

for (const loanType of LOAN_TYPES) {
  const purposes = purposeChoicesFor(
    new BorrowerAnswers().set(Answer.loanType, choice(loanType)),
  );

  console.log(`\n================ ${loanType.toUpperCase()} ================`);
  console.log(`Purposes offered: ${purposes.map((p) => p.id).join(", ")}`);

  for (const incomeType of INCOME_TYPES) {
    for (const purpose of purposes) {
      const questions = applicableQuestions(
        borrowerOn(loanType, incomeType, purpose.id),
      );
      const extras = questions.filter((question) => question.stage === "extra");
      console.log(
        `  ${incomeType.padEnd(14)} / ${purpose.id.padEnd(20)} -> 9 must + ${String(extras.length).padStart(2)} extras: ${extras
          .map((question) => question.answerId)
          .join(", ")}`,
      );
    }
  }
}
