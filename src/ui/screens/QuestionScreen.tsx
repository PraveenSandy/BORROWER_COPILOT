import type { QuestionDefinition } from "../../interview";
import { QuestionInput, type QuestionInputProps } from "../components/QuestionInput";

/**
 * One question, filling the screen. Deliberately never a form of nine fields:
 * a borrower under pressure answers one thing at a time.
 */
export function QuestionScreen({
  question,
  stageLabel,
  answeredCount,
  totalCount,
  extrasRemaining,
  onSkipRemainingExtras,
  onBack,
  ...inputHandlers
}: {
  question: QuestionDefinition;
  stageLabel: string;
  answeredCount: number;
  totalCount: number;
  extrasRemaining?: number;
  onSkipRemainingExtras?: () => void;
  onBack: () => void;
} & Omit<QuestionInputProps, "question">) {
  const percentComplete = totalCount ? (answeredCount / totalCount) * 100 : 0;

  return (
    <>
      <p className="eyebrow">
        {stageLabel} · {answeredCount + 1}/{Math.max(totalCount, 1)}
      </p>
      <div className="progress">
        <span style={{ width: `${percentComplete}%` }} />
      </div>

      <h1>{question.prompt}</h1>
      {question.help ? <p className="help">{question.help}</p> : null}
      <p className="muted">{question.whyItMatters}</p>

      <QuestionInput question={question} {...inputHandlers} />

      {onSkipRemainingExtras ? (
        <button className="ghost" type="button" onClick={onSkipRemainingExtras}>
          Skip the remaining {extrasRemaining} questions — the ranges stay wider
        </button>
      ) : null}

      <button className="ghost" type="button" onClick={onBack}>
        Back
      </button>
    </>
  );
}
