/**
 * Prints the full assessment for each sample borrower to the terminal.
 *
 *   npm run report
 *
 * This is how RUNTHROUGHS.md is produced. It imports exactly the same domain
 * code the app does, so the documented output can never drift from reality.
 */
import {
  assessBorrower,
  formatPercent,
  formatRupees,
  type BorrowerAnswers,
} from "../src/domain";
import { applicableQuestions } from "../src/interview";
import {
  anitaAnswers,
  priyaAnswers,
  priyaMustAnswersOnly,
  raviAnswers,
} from "../src/sample-borrowers";

const sampleBorrowers: { name: string; answers: BorrowerAnswers }[] = [
  { name: "Priya, 29 — Bengaluru, salaried", answers: priyaAnswers() },
  {
    name: "Priya — must-questions only, credit score unknown",
    answers: priyaMustAnswersOnly(),
  },
  { name: "Ravi, 42 — Mysuru, self-employed", answers: raviAnswers() },
  { name: "Anita, 35 — Hubballi, informal income", answers: anitaAnswers() },
];

for (const borrower of sampleBorrowers) {
  const result = assessBorrower(borrower.answers);
  const questionsAsked = applicableQuestions(borrower.answers);
  const mustQuestions = questionsAsked.filter((question) => question.stage === "must");
  const extraQuestions = questionsAsked.filter((question) => question.stage === "extra");

  const lines = [
    ``,
    `## ${borrower.name}`,
    ``,
    `Questions on this path: ${mustQuestions.length} must + ${extraQuestions.length} extras`,
    `Extras asked: ${extraQuestions.map((question) => question.answerId).join(", ")}`,
    `Product: requested ${result.loanType.requestedLoanType} -> priced ${result.loanType.pricedLoanType}`,
    ``,
    `O1 Decision: ${result.decision}`,
    `   ${result.explanations.whyDecision}`,
    ``,
    `O2 Amount: a lender may offer ${formatRupees(result.amounts.lenderLikelyAmount)}, ` +
      `the household can safely carry ${formatRupees(result.amounts.householdSafeAmount)}, ` +
      `use ${formatRupees(result.amounts.recommendedAmount)}`,
    `   ${result.explanations.whyAmount}`,
    ``,
    `O3 Rate: headline ${formatPercent(result.interestRate.headlineRateLowPct)}–${formatPercent(result.interestRate.headlineRateHighPct)}, ` +
      `all-in APR ${formatPercent(result.interestRate.allInAprLowPct)}–${formatPercent(result.interestRate.allInAprHighPct)} ` +
      `(processing fee ${formatPercent(result.interestRate.processingFeePct)})`,
    `   ${result.explanations.whyRate}`,
    ``,
    `O4 EMI ceiling: ${formatRupees(result.monthlyPayment.emiCeiling)} over ${result.monthlyPayment.tenureMonths} months. ` +
      `Stress at -${result.monthlyPayment.incomeDropStress.incomeDropPct}% income leaves ` +
      `${formatRupees(result.monthlyPayment.incomeDropStress.surplusAfterEmi)} ` +
      `(${result.monthlyPayment.incomeDropStress.survivesDrop ? "survives" : "breaks"})`,
    `   ${result.explanations.whyMonthlyPayment}`,
    ``,
    `Confidence: ${result.confidence} — ${result.confidenceReason}`,
    `Card walk-away line: ${result.negotiationCard.walkAwayLine}`,
  ];

  if (result.blockers.length > 0) {
    lines.push(`Blockers: ${result.blockers.join(" ")}`);
  }

  console.log(lines.join("\n"));
}
