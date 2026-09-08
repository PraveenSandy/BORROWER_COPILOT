import { useMemo, useState } from "react";
import {
  BorrowerAnswers,
  amount,
  assessBorrower,
  choice,
  dontKnow,
  range,
  yesNo,
  type AnswerValue,
} from "../domain";
import {
  interviewProgress,
  mustQuestionsAreComplete,
  nextQuestion,
  unansweredExtraQuestions,
  type InterviewStage,
  type QuestionDefinition,
} from "../interview";
import { NegotiationCardScreen } from "./screens/NegotiationCardScreen";
import { QuestionScreen } from "./screens/QuestionScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import { WelcomeScreen } from "./screens/WelcomeScreen";

type ScreenName = "welcome" | "question" | "results" | "card";

/**
 * All of the app's state, and none of its lending logic.
 *
 * The only state that matters is `answers`. Which question shows next, and
 * every number on the results screen, is derived from it. `previousAnswers` is
 * a stack of earlier snapshots, which is the entire Back button.
 */
export function App() {
  const [answers, setAnswers] = useState(() => new BorrowerAnswers());
  const [previousAnswers, setPreviousAnswers] = useState<BorrowerAnswers[]>([]);
  const [screen, setScreen] = useState<ScreenName>("welcome");
  const [stage, setStage] = useState<InterviewStage>("must");

  const currentQuestion = useMemo(
    () => (screen === "question" ? nextQuestion(answers, stage) : undefined),
    [answers, stage, screen],
  );

  // Recomputed rather than stored, so it can never drift from the answers.
  const assessment = useMemo(
    () => (screen === "results" || screen === "card" ? assessBorrower(answers) : undefined),
    [answers, screen],
  );

  function recordAnswer(question: QuestionDefinition, value: AnswerValue) {
    const updatedAnswers = answers.set(question.answerId, value);
    setPreviousAnswers((history) => [...history, answers]);
    setAnswers(updatedAnswers);

    if (stage === "must" && !nextQuestion(updatedAnswers, "must")) {
      setStage("extra");
      if (!nextQuestion(updatedAnswers, "extra")) setScreen("results");
      return;
    }
    if (stage === "extra" && !nextQuestion(updatedAnswers, "extra")) {
      setScreen("results");
    }
  }

  function goBack() {
    const earlierAnswers = previousAnswers[previousAnswers.length - 1];
    if (!earlierAnswers) {
      setScreen("welcome");
      setStage("must");
      return;
    }
    setPreviousAnswers((history) => history.slice(0, -1));
    setAnswers(earlierAnswers);
    setScreen("question");
    setStage(mustQuestionsAreComplete(earlierAnswers) ? "extra" : "must");
  }

  function startOver() {
    setAnswers(new BorrowerAnswers());
    setPreviousAnswers([]);
    setStage("must");
    setScreen("welcome");
  }

  function loadSampleBorrower(sampleAnswers: BorrowerAnswers) {
    setAnswers(sampleAnswers);
    setPreviousAnswers([]);
    setStage("extra");
    setScreen("results");
  }

  if (screen === "welcome") {
    return (
      <main className="app">
        <WelcomeScreen
          onStart={() => setScreen("question")}
          onLoadSample={loadSampleBorrower}
        />
      </main>
    );
  }

  if (screen === "results" && assessment) {
    return (
      <main className="app">
        <ResultsScreen
          assessment={assessment}
          onOpenCard={() => setScreen("card")}
          onStartOver={startOver}
        />
      </main>
    );
  }

  if (screen === "card" && assessment) {
    return (
      <main className="app">
        <NegotiationCardScreen
          card={assessment.negotiationCard}
          onBackToResults={() => setScreen("results")}
        />
      </main>
    );
  }

  if (!currentQuestion) {
    return (
      <main className="app">
        <p>There are no further questions on this path.</p>
        <button className="primary" type="button" onClick={() => setScreen("results")}>
          See results
        </button>
      </main>
    );
  }

  const progress = interviewProgress(answers, stage);
  const extrasRemaining = unansweredExtraQuestions(answers).length;

  return (
    <main className="app">
      <QuestionScreen
        question={currentQuestion}
        stageLabel={
          stage === "must"
            ? "Must answer"
            : "Extra — each one tightens a number"
        }
        answeredCount={progress.answeredCount}
        totalCount={progress.totalCount}
        extrasRemaining={extrasRemaining}
        onSkipRemainingExtras={
          stage === "extra" ? () => setScreen("results") : undefined
        }
        onBack={goBack}
        onChoice={(choiceId) => recordAnswer(currentQuestion, choice(choiceId))}
        onNumber={(value) => recordAnswer(currentQuestion, amount(value))}
        onRange={(lowValue, highValue) =>
          recordAnswer(
            currentQuestion,
            lowValue === highValue ? amount(lowValue) : range(lowValue, highValue),
          )
        }
        onYesNo={(value) => recordAnswer(currentQuestion, yesNo(value))}
        onDontKnow={() => recordAnswer(currentQuestion, dontKnow())}
      />
    </main>
  );
}
