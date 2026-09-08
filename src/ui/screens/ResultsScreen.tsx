import { decisionLabel, formatPercent, formatRupees, type Assessment } from "../../domain";

/** The four outputs, in the order the brief asks for them. */
export function ResultsScreen({
  assessment,
  onOpenCard,
  onStartOver,
}: {
  assessment: Assessment;
  onOpenCard: () => void;
  onStartOver: () => void;
}) {
  const { decision, amounts, interestRate, monthlyPayment, explanations } = assessment;
  const isDoNotBorrow = decision === "do_not_borrow";
  const decisionPillClass =
    decision === "borrow" ? "ok" : decision === "borrow_less" ? "warn" : "bad";

  return (
    <div>
      <p className="eyebrow">Your self-assessment</p>
      <span className={`pill ${decisionPillClass}`}>{decisionLabel(decision)}</span>
      <h1>Four answers before you walk in</h1>
      <p className="why">{explanations.whyDecision}</p>

      <div className="stat-grid">
        <div className="stat">
          <div className="label">A lender may offer</div>
          <div className="value">{formatRupees(amounts.lenderLikelyAmount)}</div>
        </div>
        <div className={isDoNotBorrow ? "stat bad" : "stat use"}>
          <div className="label">{isDoNotBorrow ? "You should carry" : "You should use"}</div>
          <div className="value">
            {isDoNotBorrow ? "Nothing yet" : formatRupees(amounts.recommendedAmount)}
          </div>
        </div>
      </div>
      <p className="muted">{explanations.whyAmount}</p>
      {amounts.isWideGuess ? (
        <p className="muted">
          Your existing EMIs were unknown, so treat these as a wide range rather than a
          tight number. A lender could land anywhere from{" "}
          {formatRupees(amounts.wideRange?.lenderLowAmount ?? 0)} to{" "}
          {formatRupees(amounts.wideRange?.lenderHighAmount ?? 0)}.
        </p>
      ) : null}

      <div className="panel">
        <h2>Fair rate — a band, not a single number</h2>
        <p>
          {formatPercent(interestRate.headlineRateLowPct)} to{" "}
          {formatPercent(interestRate.headlineRateHighPct)} headline
        </p>
        <p className="muted">{explanations.whyRate}</p>
      </div>

      <div className="panel">
        <h2>EMI ceiling</h2>
        <p>
          Do not agree above{" "}
          <strong>{formatRupees(monthlyPayment.emiCeiling)}</strong> a month over{" "}
          {monthlyPayment.tenureMonths} months.
        </p>
        {monthlyPayment.shorterTenureOption && monthlyPayment.longerTenureOption ? (
          <p className="muted">
            Shorter tenure ({monthlyPayment.shorterTenureOption.tenureMonths} months):{" "}
            {formatRupees(monthlyPayment.shorterTenureOption.emi)} a month. Longer tenure (
            {monthlyPayment.longerTenureOption.tenureMonths} months):{" "}
            {formatRupees(monthlyPayment.longerTenureOption.emi)} a month, but far more
            total interest.
          </p>
        ) : null}
        <p className="muted">
          Stress test: if income falls {monthlyPayment.incomeDropStress.incomeDropPct}%,
          your surplus after this EMI is{" "}
          {formatRupees(monthlyPayment.incomeDropStress.surplusAfterEmi)} —{" "}
          {monthlyPayment.incomeDropStress.survivesDrop
            ? "still at or above zero"
            : "below zero"}
          .
        </p>
        <p className="muted">{explanations.whyMonthlyPayment}</p>
      </div>

      <p className="muted">
        Confidence: {assessment.confidence}. {assessment.confidenceReason}
      </p>
      <p className="muted">{assessment.loanType.reason}</p>

      <div className="toolbar">
        <button className="primary" type="button" onClick={onOpenCard}>
          Open negotiation card
        </button>
        <button className="ghost" type="button" onClick={onStartOver}>
          Start over
        </button>
      </div>
    </div>
  );
}
