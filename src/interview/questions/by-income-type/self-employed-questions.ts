import { Answer } from "../../../domain";
import type { QuestionDefinition, ShowWhenCondition } from "../../question-types";

const AFTER_MUST_QUESTIONS: ShowWhenCondition[] = [
  { answer: Answer.creditScore, wasAnswered: true },
];

/**
 * Asked of any self-employed borrower, whatever product they chose.
 *
 * These are keyed to how the borrower EARNS, not to what they are buying,
 * because the ITR-versus-cash gap exists whether they walk in asking for a
 * property loan or a personal loan. Attaching them to a product would leave a
 * shop owner applying for a personal loan silently priced on the no-ITR cut.
 */
export const SELF_EMPLOYED_QUESTIONS: QuestionDefinition[] = [
  {
    id: "q-last-itr",
    answerId: Answer.lastItrAnnualIncome,
    stage: "extra",
    inputType: "number",
    unit: "rupees",
    prompt: "What annual income did your last ITR show?",
    help: "Enter ₹0 if you have not filed a return.",
    whyItMatters:
      "A desk works from the ITR divided by twelve, not the cash you take from the till. With no ITR to show, a lender cuts your stated income by 30%.",
    showWhen: [
      ...AFTER_MUST_QUESTIONS,
      { answer: Answer.incomeType, equals: "self_employed" },
    ],
    minValue: 0,
    maxValue: 50_000_000,
  },
  {
    id: "q-cash-drawings",
    answerId: Answer.monthlyCashDrawings,
    stage: "extra",
    inputType: "range",
    unit: "rupees",
    prompt: "What cash do you actually take home in a typical month?",
    help: "Give a low and a high. We still price on the ITR if you gave one.",
    whyItMatters:
      "This is your real household budget. Showing the gap against the ITR is the point — it explains why cash drawings do not raise the lender's number.",
    showWhen: [
      ...AFTER_MUST_QUESTIONS,
      { answer: Answer.incomeType, equals: "self_employed" },
    ],
    minValue: 0,
    maxValue: 5_000_000,
  },
  {
    id: "q-business-age",
    answerId: Answer.businessAgeYears,
    stage: "extra",
    inputType: "number",
    unit: "years",
    prompt: "How many years has this business been running?",
    whyItMatters:
      "A longer track record supports staying inside the normal rate band instead of a penalty rate.",
    showWhen: [
      ...AFTER_MUST_QUESTIONS,
      { answer: Answer.incomeType, equals: "self_employed" },
    ],
    minValue: 0,
    maxValue: 50,
  },
  {
    id: "q-gst-registered",
    answerId: Answer.isGstRegistered,
    stage: "extra",
    inputType: "yesNo",
    prompt: "Is the business registered for GST?",
    whyItMatters:
      "Without GST registration an unsecured business loan usually costs about one percentage point more.",
    showWhen: [
      ...AFTER_MUST_QUESTIONS,
      { answer: Answer.incomeType, equals: "self_employed" },
      { answer: Answer.loanType, isOneOf: ["business", "property"] },
    ],
  },
];
