import { formatRupees, type NegotiationCard } from "../../domain";

/** The printable page a borrower can hold up at a bank counter. */
export function NegotiationCardScreen({
  card,
  onBackToResults,
}: {
  card: NegotiationCard;
  onBackToResults: () => void;
}) {
  return (
    <div>
      <p className="eyebrow no-print">Hold this up in the branch</p>

      <div className="card-sheet">
        <p className="eyebrow">Borrower Copilot · Negotiation card</p>
        <h1>{card.decisionLabel}</h1>
        <p className="muted">{card.profileLine}</p>

        {card.isDoNotBorrow ? (
          <>
            <p>
              <strong>Do not take this loan now.</strong>
            </p>
            <p className="muted">
              Even a lender would stop near {formatRupees(card.lenderMayOfferUpTo)} on this
              profile, and your household cannot carry an EMI on top of what you already pay.
            </p>
            <p className="muted">
              If anyone does quote you, expect {card.fairRateLine.toLowerCase()} — that is
              the price of borrowing while a bounce is on record.
            </p>
          </>
        ) : (
          <>
            <p>
              <strong>Walk in and ask for {formatRupees(card.amountToAskFor)}</strong>
            </p>
            <p className="muted">
              A lender may talk you up to {formatRupees(card.lenderMayOfferUpTo)}. Use the
              lower number.
            </p>
            <p>{card.fairRateLine}</p>
            <p>{card.allInAprLine}</p>
            <p>
              EMI ceiling: <strong>{formatRupees(card.emiCeiling)}</strong> a month
            </p>
          </>
        )}

        <p>
          <strong>Because</strong>
        </p>
        <ol className="why">
          {card.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ol>

        <p>
          <strong>{card.walkAwayLine}</strong>
        </p>
        <p className="muted">
          Confidence: {card.confidence}. This is not a bank sanction, and no data was stored.
        </p>
      </div>

      <div className="toolbar no-print">
        <button className="primary" type="button" onClick={() => window.print()}>
          Print or save as PDF
        </button>
        <button className="ghost" type="button" onClick={onBackToResults}>
          Back to results
        </button>
      </div>
    </div>
  );
}
