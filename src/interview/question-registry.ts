import { Answer, type BorrowerAnswers } from "../domain";
import type { QuestionChoice, QuestionDefinition } from "./question-types";
import { COMMON_EXTRA_QUESTIONS } from "./questions/common-extra-questions";
import { GOLD_LOAN_QUESTIONS } from "./questions/by-loan-type/gold-loan-questions";
import { INFORMAL_INCOME_QUESTIONS } from "./questions/by-income-type/informal-income-questions";
import { MUST_QUESTIONS } from "./questions/must-questions";
import { PERSONAL_LOAN_QUESTIONS } from "./questions/by-loan-type/personal-loan-questions";
import { PRODUCTIVE_PURPOSE_QUESTIONS } from "./questions/by-purpose/productive-purpose-questions";
import { PROPERTY_LOAN_QUESTIONS } from "./questions/by-loan-type/property-loan-questions";
import { SELF_EMPLOYED_QUESTIONS } from "./questions/by-income-type/self-employed-questions";
import { TWO_WHEELER_QUESTIONS } from "./questions/by-loan-type/two-wheeler-questions";

/**
 * Every question in the app, in the order it can be asked.
 *
 * Extras are grouped along three axes, because that is genuinely how lending
 * evidence works:
 *   - by LOAN TYPE   — what security is on offer
 *   - by INCOME TYPE — how the borrower earns, whatever they are buying
 *   - by PURPOSE     — whether the money will create income
 *
 * TO ADD A QUESTION: put it in the right file above and it appears here. The
 * order below is the priority order, so a product-specific question is offered
 * before a generic one. Nothing else needs to change.
 */
export const ALL_QUESTIONS: QuestionDefinition[] = [
  ...MUST_QUESTIONS,
  ...PERSONAL_LOAN_QUESTIONS,
  ...PROPERTY_LOAN_QUESTIONS,
  ...GOLD_LOAN_QUESTIONS,
  ...TWO_WHEELER_QUESTIONS,
  ...SELF_EMPLOYED_QUESTIONS,
  ...INFORMAL_INCOME_QUESTIONS,
  ...PRODUCTIVE_PURPOSE_QUESTIONS,
  ...COMMON_EXTRA_QUESTIONS,
];

export function findQuestionById(questionId: string): QuestionDefinition | undefined {
  return ALL_QUESTIONS.find((question) => question.id === questionId);
}

/**
 * Purposes offered for each loan type.
 *
 * The purpose list is the clearest piece of adaptive behaviour in the app: a
 * gold loan is never "for a wedding gadget", and a home loan has exactly one
 * honest purpose.
 */
const PURPOSES_BY_LOAN_TYPE: Record<string, QuestionChoice[]> = {
  personal: [
    { id: "wedding", label: "Wedding or ceremony" },
    { id: "consumption", label: "Travel, gadgets or other spending" },
    { id: "emergency", label: "Medical or family emergency" },
    { id: "refinance", label: "Pay off a costlier loan" },
    { id: "education", label: "Education" },
  ],
  property: [
    { id: "business_expansion", label: "Grow the business, add stock or equipment" },
    { id: "refinance", label: "Replace an existing loan" },
    { id: "home", label: "Home improvement" },
    { id: "education", label: "Education" },
    { id: "emergency", label: "Emergency" },
  ],
  gold: [
    { id: "emergency", label: "Emergency or medical" },
    { id: "business_expansion", label: "Working capital for the business" },
    { id: "consumption", label: "Personal need" },
    { id: "refinance", label: "Pay off a costlier loan" },
  ],
  two_wheeler: [
    { id: "vehicle", label: "Buy a two-wheeler for work" },
    { id: "consumption", label: "Buy a two-wheeler for personal use" },
  ],
  business: [
    { id: "business_expansion", label: "Stock, equipment or expansion" },
    { id: "vehicle", label: "A delivery or work vehicle" },
    { id: "refinance", label: "Replace an existing business loan" },
  ],
  home: [{ id: "home", label: "Buy, build or improve a home" }],
};

export function purposeChoicesFor(answers: BorrowerAnswers): QuestionChoice[] {
  const loanType = answers.choice(Answer.loanType) ?? "personal";
  return PURPOSES_BY_LOAN_TYPE[loanType] ?? PURPOSES_BY_LOAN_TYPE.personal;
}

/** Resolves a `dynamicChoices` marker into the actual list for this borrower. */
export function resolveDynamicChoices(
  dynamicChoices: QuestionDefinition["dynamicChoices"],
  answers: BorrowerAnswers,
): QuestionChoice[] | undefined {
  if (dynamicChoices === "purposeByLoanType") return purposeChoicesFor(answers);
  return undefined;
}
