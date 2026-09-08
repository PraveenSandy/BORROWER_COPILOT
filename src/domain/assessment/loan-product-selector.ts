import { Answer, type BorrowerAnswers } from "../answers";
import type { LoanType, LoanTypeAdvice } from "../types";

const ALL_LOAN_TYPES: LoanType[] = [
  "personal",
  "property",
  "gold",
  "two_wheeler",
  "business",
  "home",
];

const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  personal: "personal loan",
  property: "loan against property",
  gold: "gold loan",
  two_wheeler: "two-wheeler loan",
  business: "unsecured business loan",
  home: "home loan",
};

export function loanTypeLabel(loanType: LoanType): string {
  return LOAN_TYPE_LABELS[loanType];
}

/** Anything unrecognised falls back to a personal loan, the default retail product. */
export function parseLoanType(rawValue: string | undefined): LoanType {
  if (rawValue && (ALL_LOAN_TYPES as string[]).includes(rawValue)) {
    return rawValue as LoanType;
  }
  return "personal";
}

/** Minimum property value at which a loan against property is worth suggesting. */
const PROPERTY_VALUE_WORTH_PLEDGING = 1_000_000;

/**
 * The borrower picks a product; we may still point at a better one.
 *
 * This is where most real borrower harm gets prevented. Someone with a shop
 * and an unencumbered house who taps "personal loan" is about to pay 18% for
 * money available at 11% against the property. Someone with a recent bounce
 * will be refused unsecured and pushed toward an app loan at 36% — a gold
 * loan is the honest alternative.
 */
export function selectLoanType(answers: BorrowerAnswers): LoanTypeAdvice {
  const requestedLoanType = parseLoanType(answers.choice(Answer.loanType));
  const purpose = answers.choice(Answer.loanPurpose) ?? "";
  const incomeType = answers.choice(Answer.incomeType);
  const propertyValue = answers.amount(Answer.propertyValue) ?? 0;
  const goldValue = answers.amount(Answer.goldValue) ?? 0;
  const hadBounce = answers.yesNo(Answer.hadEmiBounceLast12Months) === true;

  const isProductivePurpose =
    purpose === "business_expansion" || purpose === "vehicle" || purpose === "home";

  if (requestedLoanType === "home") {
    return {
      requestedLoanType,
      pricedLoanType: "home",
      reason: "You chose a home loan — we keep that product and price it as such.",
    };
  }

  const wantsUnsecured =
    requestedLoanType === "personal" || requestedLoanType === "business";

  if (
    wantsUnsecured &&
    propertyValue >= PROPERTY_VALUE_WORTH_PLEDGING &&
    (isProductivePurpose || incomeType === "self_employed")
  ) {
    return {
      requestedLoanType,
      pricedLoanType: "property",
      reason:
        "You have unencumbered property and a productive purpose. A lender is far more likely to price a loan against property than an unsecured loan, and at a much lower rate.",
    };
  }

  if (requestedLoanType === "personal" && hadBounce && goldValue > 0) {
    return {
      requestedLoanType,
      pricedLoanType: "gold",
      reason:
        "A recent bounce makes an unsecured personal loan unlikely. Gold, if you can pledge it, is the product a desk can still discuss.",
    };
  }

  if (requestedLoanType === "personal" && incomeType === "informal" && goldValue > 0) {
    return {
      requestedLoanType,
      pricedLoanType: "gold",
      reason:
        "Informal income rarely gets a fair unsecured personal loan. Gold is the honest product path.",
    };
  }

  return {
    requestedLoanType,
    pricedLoanType: requestedLoanType,
    reason: `We are pricing the ${LOAN_TYPE_LABELS[requestedLoanType]} you chose.`,
  };
}
