import type { AnswerId } from "../domain";

/**
 * "must" questions are asked of everybody and gate the results screen.
 * "extra" questions only tighten the answer, and every one can be skipped.
 */
export type QuestionStage = "must" | "extra";

/** How the question is drawn on screen. */
export type QuestionInputType =
  | "choice"
  | "number"
  | "range"
  | "yesNo"
  /** A number with an explicit "I don't know" button. */
  | "numberOrUnknown"
  /** A low-high range with an explicit "I don't know" button. */
  | "rangeOrUnknown";

/**
 * A condition on the answers collected so far. A question appears only when
 * EVERY condition in its `showWhen` list is true, which is the whole of the
 * adaptive logic — there is no hidden branching anywhere else.
 */
export type ShowWhenCondition =
  | { always: true }
  | { answer: AnswerId; equals: string | number | boolean }
  | { answer: AnswerId; isOneOf: Array<string | number> }
  /** Answered at all, including "I don't know". Used to order the must path. */
  | { answer: AnswerId; wasAnswered: true }
  /** Answered with a usable value. "I don't know" does not satisfy this. */
  | { answer: AnswerId; isKnown: true };

export interface QuestionDefinition {
  /** Stable id, used as the React key and in tests. */
  id: string;
  /** Which answer this question fills in. One answer per question. */
  answerId: AnswerId;
  stage: QuestionStage;
  inputType: QuestionInputType;
  /** The question as the borrower reads it. */
  prompt: string;
  /** Optional second line: how to answer, or what not to include. */
  help?: string;
  /** Shown on demand. Every question must justify itself to the borrower. */
  whyItMatters: string;
  /** Fixed choices for `choice` questions. */
  choices?: QuestionChoice[];
  /** Choices computed from earlier answers, e.g. purpose depends on loan type. */
  dynamicChoices?: "purposeByLoanType";
  unit?: "rupees" | "percent" | "years" | "months" | "score" | "count";
  minValue?: number;
  maxValue?: number;
  showWhen: ShowWhenCondition[];
}

export interface QuestionChoice {
  id: string;
  label: string;
}

/** Which part of the interview the borrower is in. */
export type InterviewStage = "must" | "extra" | "done";
