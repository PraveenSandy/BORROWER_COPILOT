import type { AnswerId, BorrowerAnswers } from "../domain";
import { ALL_QUESTIONS, resolveDynamicChoices } from "./question-registry";
import type {
  InterviewStage,
  QuestionDefinition,
  ShowWhenCondition,
} from "./question-types";

/**
 * The adaptive interview, in one place.
 *
 * There is no state machine and no hard-coded question order beyond the array
 * in the registry. Which question comes next is derived from the answers so
 * far, every time. That is why the Back button is trivial: restore an older
 * `BorrowerAnswers` and the whole path recomputes.
 */

/** True only when every condition holds. */
export function conditionsAreMet(
  conditions: ShowWhenCondition[],
  answers: BorrowerAnswers,
): boolean {
  return conditions.every((condition) => conditionIsMet(condition, answers));
}

function conditionIsMet(
  condition: ShowWhenCondition,
  answers: BorrowerAnswers,
): boolean {
  if ("always" in condition) return true;

  if ("wasAnswered" in condition) return answers.wasAsked(condition.answer);
  if ("isKnown" in condition) return answers.isKnown(condition.answer);

  if ("isOneOf" in condition) {
    const currentValue = currentComparableValue(condition.answer, answers);
    return currentValue !== undefined && condition.isOneOf.includes(currentValue);
  }

  if ("equals" in condition) {
    const { equals } = condition;
    if (typeof equals === "boolean") {
      return answers.yesNo(condition.answer) === equals;
    }
    return currentComparableValue(condition.answer, answers) === equals;
  }

  return false;
}

function currentComparableValue(
  answerId: AnswerId,
  answers: BorrowerAnswers,
): string | number | undefined {
  return answers.choice(answerId) ?? answers.amount(answerId);
}

/**
 * Every question that currently applies, with dynamic choices filled in.
 *
 * If two questions fill the same answer — gold value is asked both on the gold
 * path and on the informal path — only the first one that applies is kept, so
 * nobody is ever asked the same thing twice.
 */
export function applicableQuestions(answers: BorrowerAnswers): QuestionDefinition[] {
  const answerIdsAlreadyCovered = new Set<string>();
  const questions: QuestionDefinition[] = [];

  for (const question of ALL_QUESTIONS) {
    if (!conditionsAreMet(question.showWhen, answers)) continue;
    if (answerIdsAlreadyCovered.has(question.answerId)) continue;
    answerIdsAlreadyCovered.add(question.answerId);
    questions.push(withResolvedChoices(question, answers));
  }

  return questions;
}

/** The next unanswered question for this stage, or undefined when finished. */
export function nextQuestion(
  answers: BorrowerAnswers,
  stage: InterviewStage,
): QuestionDefinition | undefined {
  return questionsForStage(answers, stage).find(
    (question) => !answers.wasAsked(question.answerId),
  );
}

/** True when all nine must-questions have a response, "I don't know" included. */
export function mustQuestionsAreComplete(answers: BorrowerAnswers): boolean {
  return questionsForStage(answers, "must").every((question) =>
    answers.wasAsked(question.answerId),
  );
}

export function unansweredExtraQuestions(
  answers: BorrowerAnswers,
): QuestionDefinition[] {
  return questionsForStage(answers, "extra").filter(
    (question) => !answers.wasAsked(question.answerId),
  );
}

/** For the progress bar: how many of this stage's questions are done. */
export function interviewProgress(
  answers: BorrowerAnswers,
  stage: InterviewStage,
): { answeredCount: number; totalCount: number } {
  const questions = questionsForStage(answers, stage);
  return {
    answeredCount: questions.filter((question) => answers.wasAsked(question.answerId))
      .length,
    totalCount: questions.length,
  };
}

function questionsForStage(
  answers: BorrowerAnswers,
  stage: InterviewStage,
): QuestionDefinition[] {
  if (stage === "done") return [];
  return applicableQuestions(answers).filter((question) => question.stage === stage);
}

function withResolvedChoices(
  question: QuestionDefinition,
  answers: BorrowerAnswers,
): QuestionDefinition {
  const choices = resolveDynamicChoices(question.dynamicChoices, answers);
  if (!choices) return question;
  return { ...question, choices };
}
