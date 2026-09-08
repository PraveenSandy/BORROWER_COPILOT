import { Answer, type BorrowerAnswers } from "../answers";
import { loanAmountForEmi } from "../loan-math";
import {
  RULES,
  foirCapFor,
  loanToValueCapFor,
  longestTenureMonths,
  maximumTicketSizeFor,
  requiresSecurity,
  securityAnswerFor,
  tenureOptionsFor,
} from "../rules";
import { roundToWholeRupee } from "../rupees";
import type { LoanType } from "../types";

export interface BorrowingCapacityInput {
  answers: BorrowerAnswers;
  loanType: LoanType;
  lenderBookIncome: number;
  householdBookIncome: number;
  emiVisibleToLender: number;
  emiAndOtherOutgo: number;
  essentialSpend: number;
  /** Lender side is sized at the best rate, household side at the worst. */
  bestCaseRatePct: number;
  worstCaseRatePct: number;
}

export interface BorrowingCapacity {
  /** What a typical desk is likely to sanction. */
  lenderLikelyAmount: number;
  /** What this household can carry through a 20% income drop. */
  householdSafeAmount: number;
  tenureMonths: number;
  safeEmiCeiling: number;
  lenderEmiCeiling: number;
  /** Household income minus essentials minus existing outgo. */
  monthlySurplus: number;
  /** The same surplus if income fell 20%. Negative means already stretched. */
  surplusIfIncomeDrops: number;
}

/**
 * The heart of the app: turn a monthly budget into a rupee loan amount.
 *
 * Worked example (Priya): household income ₹1,00,000, essentials ₹35,000,
 * existing EMIs ₹14,000.
 *   surplus                = 100000 - 35000 - 14000 = ₹51,000
 *   40% of surplus         = ₹20,400
 *   FOIR room (50% - EMIs) = 50000 - 14000 = ₹36,000
 *   safe EMI               = min(20400, 36000) = ₹20,400
 *   stressed surplus       = 80000 - 35000 - 14000 = ₹31,000  (survives)
 *   safe EMI               = min(20400, 31000) = ₹20,400
 * Then run the EMI formula backwards at the worst-case rate and tenure.
 */
export function computeBorrowingCapacity(
  input: BorrowingCapacityInput,
): BorrowingCapacity {
  const { answers, loanType } = input;

  const age = answers.amount(Answer.age) ?? RULES.age.minimumToBorrow;
  const maximumMonths = longestTenureMonths(loanType, age);
  const tenureChoices = tenureOptionsFor(loanType, maximumMonths);
  const tenureMonths = tenureChoices[tenureChoices.length - 1] ?? 0;

  const foirCap = foirCapFor(loanType);

  // --- lender side: FOIR on the income a desk believes ---
  const lenderEmiCeiling = Math.max(
    0,
    foirCap * input.lenderBookIncome - input.emiVisibleToLender,
  );

  // --- household side: what is genuinely left over ---
  const monthlySurplus =
    input.householdBookIncome - input.essentialSpend - input.emiAndOtherOutgo;

  const shareOfSurplus = Math.max(
    0,
    monthlySurplus * RULES.household.shareOfSurplusForNewEmi,
  );
  const foirRoomOnRealIncome = Math.max(
    0,
    foirCap * input.householdBookIncome - input.emiAndOtherOutgo,
  );
  let safeEmiCeiling = Math.min(shareOfSurplus, foirRoomOnRealIncome);

  safeEmiCeiling = reduceForThinSavings(answers, safeEmiCeiling);
  safeEmiCeiling = reduceForConsumption(answers, safeEmiCeiling);
  safeEmiCeiling = reduceForHighCardUtilisation(answers, safeEmiCeiling);

  // The stress case is a SURVIVAL CHECK, not another haircut. The borrower may
  // commit 40% of today's surplus, but never more than a 20% smaller income
  // could still pay. Taking 40% of an already-stressed surplus would cut the
  // same household twice.
  const stressedIncome =
    input.householdBookIncome * (1 - RULES.stressTest.incomeDropPct);
  const surplusIfIncomeDrops =
    stressedIncome - input.essentialSpend - input.emiAndOtherOutgo;
  safeEmiCeiling = Math.min(safeEmiCeiling, Math.max(0, surplusIfIncomeDrops));

  let lenderLikelyAmount = tenureMonths
    ? loanAmountForEmi(lenderEmiCeiling, input.bestCaseRatePct, tenureMonths)
    : 0;
  let householdSafeAmount = tenureMonths
    ? loanAmountForEmi(safeEmiCeiling, input.worstCaseRatePct, tenureMonths)
    : 0;

  lenderLikelyAmount = capByLoanToValue(answers, loanType, lenderLikelyAmount);
  householdSafeAmount = capByLoanToValue(answers, loanType, householdSafeAmount);

  // The safe number can never exceed what anyone would actually lend.
  householdSafeAmount = Math.min(householdSafeAmount, lenderLikelyAmount);

  const ticketCap = maximumTicketSizeFor(loanType);
  lenderLikelyAmount = Math.min(lenderLikelyAmount, ticketCap);
  householdSafeAmount = Math.min(householdSafeAmount, ticketCap);

  return {
    lenderLikelyAmount: roundToWholeRupee(lenderLikelyAmount),
    householdSafeAmount: roundToWholeRupee(householdSafeAmount),
    tenureMonths,
    safeEmiCeiling: roundToWholeRupee(safeEmiCeiling),
    lenderEmiCeiling: roundToWholeRupee(lenderEmiCeiling),
    monthlySurplus: roundToWholeRupee(monthlySurplus),
    surplusIfIncomeDrops: roundToWholeRupee(surplusIfIncomeDrops),
  };
}

/** Does the household still breathe after adding this EMI and losing 20% of income? */
export function stressTestNewEmi(args: {
  householdBookIncome: number;
  essentialSpend: number;
  emiAndOtherOutgo: number;
  newEmi: number;
}): { surplusAfterEmi: number; survivesDrop: boolean } {
  const stressedIncome =
    args.householdBookIncome * (1 - RULES.stressTest.incomeDropPct);
  const surplusAfterEmi =
    stressedIncome - args.essentialSpend - args.emiAndOtherOutgo - args.newEmi;
  return { surplusAfterEmi, survivesDrop: surplusAfterEmi >= 0 };
}

function reduceForThinSavings(answers: BorrowerAnswers, emiCeiling: number): number {
  const savingsMonths = answers.amount(Answer.emergencySavingsMonths);
  if (savingsMonths === undefined) return emiCeiling;
  if (savingsMonths >= RULES.household.thinSavingsMonths) return emiCeiling;
  return emiCeiling * (1 - RULES.household.thinSavingsReduction);
}

function reduceForConsumption(answers: BorrowerAnswers, emiCeiling: number): number {
  if (!isConsumptionPurpose(answers)) return emiCeiling;
  return emiCeiling * (1 - RULES.household.consumptionReduction);
}

function reduceForHighCardUtilisation(
  answers: BorrowerAnswers,
  emiCeiling: number,
): number {
  const utilisationPct = answers.amount(Answer.creditCardUtilisationPct) ?? 0;
  if (utilisationPct <= RULES.creditBehaviour.highCardUtilisationPct) return emiCeiling;
  return emiCeiling * (1 - RULES.creditBehaviour.highUtilisationAmountReduction);
}

/** Spending that leaves no asset behind and produces no income. */
export function isConsumptionPurpose(answers: BorrowerAnswers): boolean {
  const purpose = answers.choice(Answer.loanPurpose) ?? "";
  return purpose === "wedding" || purpose === "consumption";
}

/**
 * A secured loan cannot exceed a share of the asset's value. For gold,
 * property and home loans, no valuation means no loan at all.
 */
function capByLoanToValue(
  answers: BorrowerAnswers,
  loanType: LoanType,
  proposedAmount: number,
): number {
  const cap = loanToValueCapFor(loanType);
  const securityAnswer = securityAnswerFor(loanType);
  if (cap === undefined || !securityAnswer) return proposedAmount;

  const assetValue = answers.amount(Answer[securityAnswer]) ?? 0;
  if (assetValue <= 0) {
    return requiresSecurity(loanType) ? 0 : proposedAmount;
  }
  return Math.min(proposedAmount, assetValue * cap);
}
