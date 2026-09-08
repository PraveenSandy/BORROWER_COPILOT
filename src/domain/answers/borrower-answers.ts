import type { AnswerId, AnswerValue } from "./answer-schema";

/**
 * Everything the borrower told us, held in memory for this session only.
 *
 * Nothing is written to localStorage, a cookie or a server: the brief forbids
 * storing personal data. Closing the tab erases it.
 *
 * The class is immutable — `set()` returns a new instance — so React can treat
 * each version as a snapshot and the Back button is just an older snapshot.
 */
export class BorrowerAnswers {
  constructor(private readonly stored: Record<string, AnswerValue> = {}) {}

  set(id: AnswerId, value: AnswerValue): BorrowerAnswers {
    return new BorrowerAnswers({ ...this.stored, [id]: value });
  }

  /** True once the borrower has responded, even if the response was "I don't know". */
  wasAsked(id: AnswerId): boolean {
    return this.stored[id] !== undefined;
  }

  /** True when the borrower explicitly said "I don't know", or skipped an extra. */
  isUnknown(id: AnswerId): boolean {
    const value = this.stored[id];
    return value?.kind === "dontKnow" || value?.kind === "skipped";
  }

  /** True when we hold a usable value. Unknown and skipped are not usable. */
  isKnown(id: AnswerId): boolean {
    const value = this.stored[id];
    return (
      value !== undefined && value.kind !== "dontKnow" && value.kind !== "skipped"
    );
  }

  choice(id: AnswerId): string | undefined {
    const value = this.stored[id];
    return value?.kind === "choice" ? value.value : undefined;
  }

  yesNo(id: AnswerId): boolean | undefined {
    const value = this.stored[id];
    return value?.kind === "yesNo" ? value.value : undefined;
  }

  /** A single known number. Ranges and unknowns deliberately return undefined. */
  amount(id: AnswerId): number | undefined {
    const value = this.stored[id];
    return value?.kind === "amount" ? value.value : undefined;
  }

  range(id: AnswerId): { lowValue: number; highValue: number } | undefined {
    const value = this.stored[id];
    if (value?.kind === "range") {
      return { lowValue: value.lowValue, highValue: value.highValue };
    }
    if (value?.kind === "amount") {
      return { lowValue: value.value, highValue: value.value };
    }
    return undefined;
  }

  /** The low end of a range. This is what the household budget must run on. */
  lowestValue(id: AnswerId): number | undefined {
    return this.range(id)?.lowValue;
  }

  /** The middle of a range. Closer to what a lender tends to accept. */
  middleValue(id: AnswerId): number | undefined {
    const found = this.range(id);
    if (!found) return undefined;
    return (found.lowValue + found.highValue) / 2;
  }

  toRecord(): Record<string, AnswerValue> {
    return { ...this.stored };
  }
}
