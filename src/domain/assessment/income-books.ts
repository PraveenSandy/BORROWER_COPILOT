import { Answer, type BorrowerAnswers } from "../answers";
import { RULES } from "../rules";
import type { IncomeType } from "../types";

/**
 * Two books, because "how much do you earn?" has two honest answers.
 */
export interface IncomeBooks {
  /** What a lending desk will believe and underwrite on. */
  lenderBook: number;
  /** What the household actually has in hand, taken at the low end. */
  householdBook: number;
  /** Plain-English basis, printed in the explanation for each number. */
  lenderBasis: string;
  householdBasis: string;
}

/**
 * Lender book answers "what will they believe?", so income-quality cuts
 * (informal cash, no ITR, bonus counted at half) belong here.
 *
 * Household book answers "what does this family actually have?", so it uses
 * the low end of real money and NEVER a lender-trust cut. Discounting Anita's
 * grocery money by 40% would model the bank's doubt as if it reduced the cash
 * in her hand — the same rupee punished twice.
 */
export function resolveIncomeBooks(answers: BorrowerAnswers): IncomeBooks {
  const incomeType = (answers.choice(Answer.incomeType) ?? "salaried") as IncomeType;
  const coApplicantIncome = countedCoApplicantIncome(answers, incomeType);

  if (incomeType === "self_employed") {
    return selfEmployedBooks(answers, coApplicantIncome);
  }
  if (incomeType === "informal") {
    return informalBooks(answers, coApplicantIncome);
  }
  return salariedBooks(answers, coApplicantIncome);
}

function salariedBooks(answers: BorrowerAnswers, coApplicantIncome: number): IncomeBooks {
  const middleOfStatedIncome = answers.middleValue(Answer.monthlyIncome) ?? 0;
  const lowestStatedIncome =
    answers.lowestValue(Answer.monthlyIncome) ?? middleOfStatedIncome;
  const bonusShare = (answers.amount(Answer.bonusSharePct) ?? 0) / 100;

  const fixedPay = middleOfStatedIncome * (1 - bonusShare);
  const bonusPay = middleOfStatedIncome * bonusShare;

  return {
    lenderBook:
      fixedPay + bonusPay * RULES.incomeTrust.bonusCountedByLender + coApplicantIncome,
    householdBook: lowestStatedIncome * (1 - bonusShare) + coApplicantIncome,
    lenderBasis: bonusShare
      ? "your net salary with bonus counted at half"
      : "your net monthly salary",
    householdBasis: bonusShare
      ? "your fixed salary only, with no bonus"
      : "your net monthly salary",
  };
}

function selfEmployedBooks(
  answers: BorrowerAnswers,
  coApplicantIncome: number,
): IncomeBooks {
  const itrAnnualIncome = answers.amount(Answer.lastItrAnnualIncome);
  const realCashFloor =
    answers.lowestValue(Answer.monthlyCashDrawings) ??
    answers.lowestValue(Answer.monthlyIncome);
  const middleOfStatedIncome =
    answers.middleValue(Answer.monthlyIncome) ??
    answers.middleValue(Answer.monthlyCashDrawings) ??
    0;

  if (itrAnnualIncome !== undefined) {
    const itrMonthlyIncome = itrAnnualIncome / 12;
    return {
      lenderBook: itrMonthlyIncome + coApplicantIncome,
      householdBook: (realCashFloor ?? itrMonthlyIncome) + coApplicantIncome,
      lenderBasis: "your ITR divided by 12 (a desk will not lend on verbal cash)",
      householdBasis: "the low end of the cash you actually take home",
    };
  }

  const trustedShare = 1 - RULES.incomeTrust.selfEmployedWithoutItrCut;
  return {
    lenderBook: middleOfStatedIncome * trustedShare + coApplicantIncome,
    householdBook: (realCashFloor ?? middleOfStatedIncome) + coApplicantIncome,
    lenderBasis: "your stated income cut by 30% (there is no ITR to show)",
    householdBasis: "the low end of the cash you actually take home",
  };
}

function informalBooks(answers: BorrowerAnswers, coApplicantIncome: number): IncomeBooks {
  const middleOfStatedIncome = answers.middleValue(Answer.monthlyIncome) ?? 0;
  const lowestStatedIncome =
    answers.lowestValue(Answer.monthlyIncome) ?? middleOfStatedIncome;
  const trustedShare = 1 - RULES.incomeTrust.informalIncomeCut;

  return {
    lenderBook: middleOfStatedIncome * trustedShare + coApplicantIncome,
    householdBook: lowestStatedIncome + coApplicantIncome,
    lenderBasis: "your stated income cut by 40% (informal income is hard to prove)",
    householdBasis: "the lowest month you told us about",
  };
}

/** A self-employed co-applicant's income is itself discounted by the desk. */
function countedCoApplicantIncome(
  answers: BorrowerAnswers,
  incomeType: IncomeType,
): number {
  const stated = answers.amount(Answer.coApplicantMonthlyIncome) ?? 0;
  if (stated <= 0) return 0;
  if (incomeType === "self_employed") {
    return stated * RULES.incomeTrust.coApplicantShareWhenSelfEmployed;
  }
  return stated;
}
