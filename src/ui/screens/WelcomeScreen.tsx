import type { BorrowerAnswers } from "../../domain";
import { anitaAnswers } from "../../sample-borrowers/anita";
import { priyaAnswers } from "../../sample-borrowers/priya";
import { raviAnswers } from "../../sample-borrowers/ravi";

export function WelcomeScreen({
  onStart,
  onLoadSample,
}: {
  onStart: () => void;
  onLoadSample: (answers: BorrowerAnswers) => void;
}) {
  return (
    <>
      <p className="eyebrow">India · rupees · no login</p>
      <h1>Borrower Copilot</h1>
      <p>
        Answer a few questions and get four honest answers before you walk into a
        lender: whether to borrow, how much, at what rate, and which EMI to refuse.
      </p>
      <p className="muted">
        This is a self-assessment, not a sanction. Nothing is stored anywhere. The
        questions change with the loan type you pick.
      </p>
      <button className="primary" type="button" onClick={onStart}>
        Start
      </button>

      <div className="samples">
        <p className="eyebrow">Sample borrowers</p>
        <button className="secondary" type="button" onClick={() => onLoadSample(priyaAnswers())}>
          Priya — salaried, personal loan for a wedding
        </button>
        <button className="secondary" type="button" onClick={() => onLoadSample(raviAnswers())}>
          Ravi — shop owner, rerouted to a property loan
        </button>
        <button className="secondary" type="button" onClick={() => onLoadSample(anitaAnswers())}>
          Anita — informal income, recent bounce
        </button>
      </div>

      <p className="footer-note">
        Every threshold lives in <code>src/domain/rules</code> and is documented in{" "}
        <code>RULES.md</code>. Change a number there and these screens follow.
      </p>
    </>
  );
}
