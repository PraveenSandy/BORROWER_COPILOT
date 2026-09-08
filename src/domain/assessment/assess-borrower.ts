import { Answer, type BorrowerAnswers } from "../answers";
import { monthlyEmi } from "../loan-math";
import { RULES, tenureOptionsFor } from "../rules";
import { roundToWholeRupee } from "../rupees";
import type { Assessment, TenureOption } from "../types";
import { decideBorrowOrNot } from "./borrow-decision";
import { computeBorrowingCapacity, stressTestNewEmi } from "./borrowing-capacity";
import { assessConfidence } from "./confidence-level";
import { resolveMonthlyCommitments } from "./existing-obligations";
import {
  explainAmount,
  explainDecision,
  explainMonthlyPayment,
  explainRate,
} from "./explanations";
import { resolveIncomeBooks } from "./income-books";
import { quoteInterestRate } from "./interest-rate-quote";
import { selectLoanType } from "./loan-product-selector";
import { buildNegotiationCard, buildProfileLine } from "./negotiation-card";

/** Loan size used only to get a first rate band, before the real size is known. */
const RATE_PROBE_PRINCIPAL = 100_000;
const RATE_PROBE_TENURE_MONTHS = 36;
/** When the whole assessment is uncertain, show a range this wide. */
const WIDE_RANGE_LOW_MULTIPLIER = 0.5;

/**
 * THE ENTRY POINT. Everything the app knows, in one function, in order.
 *
 *   answers -> product -> income -> obligations -> rate probe -> capacity
 *           -> decision -> final rate -> EMI ceiling -> stress -> card
 *
 * The rate is quoted twice on purpose. Sizing a loan needs a rate, and quoting
 * a rate's APR needs a loan size, so the first pass uses a representative
 * ₹1,00,000 to pick a band, and the second pass re-prices the APR against the
 * amount actually recommended.
 *
 * No React, no I/O, no randomness, no clock. The same answers always produce
 * the same assessment, which is what makes the whole thing testable.
 */
export function assessBorrower(answers: BorrowerAnswers): Assessment {
  const blockers = findBlockers(answers);
  const loanType = selectLoanType(answers);
  const incomeBooks = resolveIncomeBooks(answers);
  const commitments = resolveMonthlyCommitments(answers, incomeBooks.householdBook);

  const rateProbe = quoteInterestRate({
    answers,
    loanType: loanType.pricedLoanType,
    samplePrincipal: answers.amount(Answer.amountWanted) ?? RATE_PROBE_PRINCIPAL,
    tenureMonths: RATE_PROBE_TENURE_MONTHS,
  });

  const capacity = computeBorrowingCapacity({
    answers,
    loanType: loanType.pricedLoanType,
    lenderBookIncome: incomeBooks.lenderBook,
    householdBookIncome: incomeBooks.householdBook,
    emiVisibleToLender: commitments.emiVisibleToLender,
    emiAndOtherOutgo: commitments.emiAndOtherOutgo,
    essentialSpend: commitments.essentialSpend,
    bestCaseRatePct: rateProbe.headlineRateLowPct,
    worstCaseRatePct: rateProbe.headlineRateHighPct,
  });

  const amountWanted = answers.amount(Answer.amountWanted) ?? 0;
  const decision = decideBorrowOrNot({
    answers,
    loanType: loanType.pricedLoanType,
    amountWanted,
    lenderLikelyAmount: capacity.lenderLikelyAmount,
    householdSafeAmount: capacity.householdSafeAmount,
    safeEmiCeiling: capacity.safeEmiCeiling,
    monthlySurplus: capacity.monthlySurplus,
  });

  const recommendedAmount = decision.recommendedAmount;
  const tenureMonths = capacity.tenureMonths || 12;

  const interestRate = quoteInterestRate({
    answers,
    loanType: loanType.pricedLoanType,
    samplePrincipal: Math.max(recommendedAmount, 50_000),
    tenureMonths,
  });

  // The ceiling is priced at the TOP of the band. If the borrower ends up with
  // the better rate, they simply have more room than the card promises.
  const emiCeiling = roundToWholeRupee(
    monthlyEmi(recommendedAmount, interestRate.headlineRateHighPct, tenureMonths),
  );

  const stress = stressTestNewEmi({
    householdBookIncome: incomeBooks.householdBook,
    essentialSpend: commitments.essentialSpend,
    emiAndOtherOutgo: commitments.emiAndOtherOutgo,
    newEmi: emiCeiling,
  });

  const tenureChoices = tenureOptionsFor(loanType.pricedLoanType, capacity.tenureMonths);
  const shorterTenureOption = buildTenureOption(
    tenureChoices[0],
    recommendedAmount,
    interestRate.headlineRateHighPct,
  );
  const longerTenureOption = buildTenureOption(
    tenureChoices[tenureChoices.length - 1],
    recommendedAmount,
    interestRate.headlineRateHighPct,
  );

  const confidence = assessConfidence(answers);
  const isWideGuess = commitments.existingEmiIsUnknown;

  const rateAlreadyOffered = answers.amount(Answer.rateAlreadyOfferedPct);
  const rateExplanation = explainRate(interestRate, loanType.reason);

  const assessmentWithoutCard: Omit<Assessment, "negotiationCard"> = {
    decision: decision.decision,
    loanType,
    amounts: {
      lenderLikelyAmount: capacity.lenderLikelyAmount,
      householdSafeAmount: capacity.householdSafeAmount,
      recommendedAmount,
      isWideGuess,
      wideRange: isWideGuess
        ? {
            lenderLowAmount: roundToWholeRupee(
              capacity.lenderLikelyAmount * WIDE_RANGE_LOW_MULTIPLIER,
            ),
            lenderHighAmount: capacity.lenderLikelyAmount,
            safeLowAmount: 0,
            safeHighAmount: capacity.householdSafeAmount,
          }
        : undefined,
    },
    interestRate,
    monthlyPayment: {
      emiCeiling,
      tenureMonths: capacity.tenureMonths,
      shorterTenureOption,
      longerTenureOption,
      incomeDropStress: {
        incomeDropPct: RULES.stressTest.incomeDropPct * 100,
        surplusAfterEmi: roundToWholeRupee(stress.surplusAfterEmi),
        survivesDrop: stress.survivesDrop,
      },
    },
    confidence: confidence.level,
    confidenceReason: confidence.reason,
    explanations: {
      whyDecision: explainDecision(decision),
      whyAmount: explainAmount({ incomeBooks, capacity, commitments }),
      whyRate:
        rateAlreadyOffered !== undefined
          ? `${rateExplanation} A quote you have already received is ${rateAlreadyOffered}% — compare it against the all-in APR band, not the headline.`
          : rateExplanation,
      whyMonthlyPayment: explainMonthlyPayment({
        emiCeiling,
        tenureMonths: capacity.tenureMonths,
        survivesIncomeDrop: stress.survivesDrop,
        surplusAfterEmi: stress.surplusAfterEmi,
        monthsLeftOnExistingLoans: answers.amount(Answer.monthsLeftOnExistingLoans),
      }),
    },
    blockers,
  };

  return {
    ...assessmentWithoutCard,
    negotiationCard: buildNegotiationCard({
      profileLine: buildProfileLine({
        age: answers.amount(Answer.age),
        incomeType: answers.choice(Answer.incomeType),
        loanType: loanType.pricedLoanType,
      }),
      assessment: assessmentWithoutCard,
    }),
  };
}

function buildTenureOption(
  months: number | undefined,
  principal: number,
  ratePct: number,
): TenureOption | undefined {
  if (!months || principal <= 0) return undefined;
  return { tenureMonths: months, emi: roundToWholeRupee(monthlyEmi(principal, ratePct, months)) };
}

/** Reasons the app cannot answer at all. Shown instead of numbers. */
function findBlockers(answers: BorrowerAnswers): string[] {
  const blockers: string[] = [];

  const age = answers.amount(Answer.age);
  if (age !== undefined && age < RULES.age.minimumToBorrow) {
    blockers.push(`The minimum age to borrow is ${RULES.age.minimumToBorrow}.`);
  }
  if (!answers.wasAsked(Answer.loanType)) blockers.push("Choose a loan type.");
  if (!answers.wasAsked(Answer.loanPurpose)) blockers.push("Choose a purpose.");
  if (!answers.wasAsked(Answer.amountWanted)) blockers.push("Enter the amount you want.");
  if (!answers.wasAsked(Answer.incomeType)) blockers.push("Choose how you earn.");
  if (!answers.isKnown(Answer.monthlyIncome)) {
    blockers.push("Monthly income is required to compute the income ratio.");
  }
  if (!answers.wasAsked(Answer.age)) blockers.push("Age is required to set the tenure.");

  return blockers;
}
