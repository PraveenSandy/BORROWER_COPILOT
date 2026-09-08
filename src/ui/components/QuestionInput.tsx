import { formatRupees } from "../../domain";
import type { QuestionDefinition } from "../../interview";

/**
 * Draws whichever input a question needs. It knows nothing about lending —
 * it takes a question definition and reports back what the borrower typed.
 */
export interface QuestionInputProps {
  question: QuestionDefinition;
  onChoice: (choiceId: string) => void;
  onNumber: (value: number) => void;
  onRange: (lowValue: number, highValue: number) => void;
  onYesNo: (value: boolean) => void;
  onDontKnow: () => void;
}

export function QuestionInput({
  question,
  onChoice,
  onNumber,
  onRange,
  onYesNo,
  onDontKnow,
}: QuestionInputProps) {
  const allowsDontKnow =
    question.inputType === "numberOrUnknown" || question.inputType === "rangeOrUnknown";

  if (question.inputType === "choice") {
    return (
      <div className="choices">
        {(question.choices ?? []).map((choice) => (
          <button
            key={choice.id}
            className="choice"
            type="button"
            onClick={() => onChoice(choice.id)}
          >
            {choice.label}
          </button>
        ))}
      </div>
    );
  }

  if (question.inputType === "yesNo") {
    return (
      <div className="choices">
        <button className="choice" type="button" onClick={() => onYesNo(true)}>
          Yes
        </button>
        <button className="choice" type="button" onClick={() => onYesNo(false)}>
          No
        </button>
      </div>
    );
  }

  if (question.inputType === "range" || question.inputType === "rangeOrUnknown") {
    return (
      <RangeField
        question={question}
        allowsDontKnow={allowsDontKnow}
        onSubmit={onRange}
        onDontKnow={onDontKnow}
      />
    );
  }

  return (
    <NumberField
      question={question}
      allowsDontKnow={allowsDontKnow}
      onSubmit={onNumber}
      onDontKnow={onDontKnow}
    />
  );
}

interface FieldProps {
  question: QuestionDefinition;
  allowsDontKnow: boolean;
  onDontKnow: () => void;
}

function NumberField({
  question,
  allowsDontKnow,
  onSubmit,
  onDontKnow,
}: FieldProps & { onSubmit: (value: number) => void }) {
  return (
    <form
      className="choices"
      onSubmit={(event) => {
        event.preventDefault();
        const typedValue = readNumber(event.currentTarget, "value");
        if (typedValue === undefined) return;
        onSubmit(typedValue);
      }}
    >
      <input
        className="field"
        name="value"
        inputMode="numeric"
        required
        min={question.minValue}
        max={question.maxValue}
        placeholder={placeholderFor(question)}
      />
      <button className="primary" type="submit">
        Continue
      </button>
      <DontKnowButton allowsDontKnow={allowsDontKnow} onDontKnow={onDontKnow} />
    </form>
  );
}

function RangeField({
  question,
  allowsDontKnow,
  onSubmit,
  onDontKnow,
}: FieldProps & { onSubmit: (lowValue: number, highValue: number) => void }) {
  return (
    <form
      className="choices"
      onSubmit={(event) => {
        event.preventDefault();
        const lowValue = readNumber(event.currentTarget, "lowValue");
        if (lowValue === undefined) return;
        const highValue = readNumber(event.currentTarget, "highValue") ?? lowValue;
        // Accept the two boxes in either order rather than scolding the user.
        onSubmit(Math.min(lowValue, highValue), Math.max(lowValue, highValue));
      }}
    >
      <div className="row">
        <input
          className="field"
          name="lowValue"
          inputMode="numeric"
          required
          min={question.minValue}
          max={question.maxValue}
          placeholder="Low"
        />
        <input
          className="field"
          name="highValue"
          inputMode="numeric"
          min={question.minValue}
          max={question.maxValue}
          placeholder="High (optional)"
        />
      </div>
      <button className="primary" type="submit">
        Continue
      </button>
      <DontKnowButton allowsDontKnow={allowsDontKnow} onDontKnow={onDontKnow} />
    </form>
  );
}

function DontKnowButton({
  allowsDontKnow,
  onDontKnow,
}: {
  allowsDontKnow: boolean;
  onDontKnow: () => void;
}) {
  if (!allowsDontKnow) return null;
  return (
    <button className="ghost" type="button" onClick={onDontKnow}>
      I don&apos;t know
    </button>
  );
}

/** Reads a form field, tolerating "1,20,000" as well as "120000". */
function readNumber(form: HTMLFormElement, fieldName: string): number | undefined {
  const rawValue = String(new FormData(form).get(fieldName) ?? "").trim();
  if (!rawValue) return undefined;
  const parsed = Number(rawValue.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function placeholderFor(question: QuestionDefinition): string {
  switch (question.unit) {
    case "rupees":
      return `e.g. ${formatRupees(50_000)}`;
    case "percent":
      return "e.g. 20 (percent)";
    case "score":
      return "e.g. 780";
    case "years":
      return "Years";
    case "months":
      return "Months";
    case "count":
      return "How many";
    default:
      return "";
  }
}
