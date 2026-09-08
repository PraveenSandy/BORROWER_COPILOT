# ARCHITECTURE.md — what every module does

Written to be read top to bottom. Each section explains one folder, then each
file inside it, in plain language with the banking reason for its existence.

---

## The one idea that explains the whole layout

The project has **three layers**, and each may only depend on the ones above it:

```
   src/domain/       The brain.   Pure TypeScript. Knows lending, knows nothing about screens.
        ↑
   src/interview/    The mouth.   Decides which question to ask next.
        ↑
   src/ui/           The face.    React components. Contains zero lending logic.
```

**Why this matters.** A rupee threshold appears in exactly one place. If you
want to change the personal-loan income ratio from 50% to 45%, you edit one
number in `src/domain/rules/rule-book.ts`, and the results screen, the
negotiation card and the printed PDF all change together. Nobody has to hunt
through React components looking for a hard-coded `0.5`.

**How to check the rule holds.** Search the UI folder for a rupee amount or a
percentage. You will not find one. Search the domain folder for the word
`React`. You will not find it either.

---

## The complete file map

```
borrower-copilot/
│
├── src/
│   ├── main.tsx                        Browser entry point (5 lines)
│   ├── index.css                       All styling, mobile-first at 360px
│   │
│   ├── domain/                         ── THE BRAIN ──
│   │   ├── index.ts                     The only door in. Everything imports from here.
│   │   ├── types.ts                     Shapes of the four outputs and the card
│   │   ├── rupees.ts                    ₹ formatting and rounding
│   │   ├── loan-math.ts                 EMI, reverse EMI, APR
│   │   │
│   │   ├── answers/                     What the borrower told us
│   │   │   ├── answer-schema.ts          All 30 answers the app can hold
│   │   │   └── borrower-answers.ts       The immutable store
│   │   │
│   │   ├── rules/                        ── EVERY NUMBER LIVES HERE ──
│   │   │   ├── rule-book.ts              Thresholds: FOIR, LTV, tenure, fees, floors
│   │   │   └── interest-rate-bands.ts    The 19 fair-rate bands
│   │   │
│   │   └── assessment/                   The pipeline, one step per file
│   │       ├── loan-product-selector.ts  Should you be buying a different product?
│   │       ├── income-books.ts           Two incomes: lender's and household's
│   │       ├── existing-obligations.ts   What is already spoken for each month
│   │       ├── interest-rate-quote.ts    O3 — the fair rate band
│   │       ├── borrowing-capacity.ts     O2 — the two amounts
│   │       ├── borrow-decision.ts        O1 — borrow / less / don't
│   │       ├── confidence-level.ts       How much to trust our own answer
│   │       ├── explanations.ts           One sentence per output
│   │       ├── negotiation-card.ts       The printable page
│   │       └── assess-borrower.ts        ⭐ THE ENTRY POINT — wires it all together
│   │
│   ├── interview/                      ── THE MOUTH ──
│   │   ├── index.ts                     The only door in
│   │   ├── question-types.ts            Shape of a question and its conditions
│   │   ├── question-registry.ts         All questions in one list + purpose lists
│   │   ├── interview-flow.ts            Which question comes next
│   │   └── questions/
│   │       ├── must-questions.ts             The 9 everybody answers
│   │       ├── common-extra-questions.ts     The 7 everybody is offered
│   │       ├── informal-income-questions.ts  The 2 for cash earners
│   │       └── by-loan-type/
│   │           ├── personal-loan-questions.ts    5 questions
│   │           ├── property-loan-questions.ts    6 questions
│   │           ├── gold-loan-questions.ts        1 question
│   │           └── two-wheeler-questions.ts      2 questions
│   │
│   ├── ui/                             ── THE FACE ──
│   │   ├── App.tsx                      All state, no lending logic
│   │   ├── components/
│   │   │   └── QuestionInput.tsx        Draws whichever input a question needs
│   │   └── screens/
│   │       ├── WelcomeScreen.tsx
│   │       ├── QuestionScreen.tsx
│   │       ├── ResultsScreen.tsx
│   │       └── NegotiationCardScreen.tsx
│   │
│   └── sample-borrowers/               Priya, Ravi, Anita — demo buttons AND test data
│       ├── priya.ts
│       ├── ravi.ts
│       ├── anita.ts
│       └── index.ts
│
├── tests/                              ── ALL TESTS, NEVER BESIDE THE SOURCE ──
│   ├── helpers/build-answers.ts         A baseline borrower for unit tests
│   ├── unit/                            8 files, 54 tests — one rule at a time
│   ├── interview/                       2 files, 21 tests — the question paths
│   └── personas/                        3 files, 21 tests — end-to-end journeys
│
├── tools/
│   └── print-report.ts                 `npm run report` — prints all assessments
│
├── RULES.md                            Every threshold, with worked examples
├── ARCHITECTURE.md                     This file
├── QUESTIONS.md                        Which questions per loan type
├── INSTALL.md                          Setup, step by step
├── DEPLOYMENT.md                       Copying to another laptop
├── RUNTHROUGHS.md                      Real output for the three borrowers
├── README.md                           Start here
│
├── package.json                        Project name, scripts, dependency list
├── tsconfig.json                       TypeScript settings
├── vite.config.ts                      Dev server and test settings
├── index.html                          The single HTML page
└── .gitignore                          What never gets copied or committed
```

---

## Layer 1 — `src/domain/` (the brain)

### The rule every file here follows

No React. No network calls. No reading from disk. No `Math.random()`. No clock.
Given the same answers, these functions always return the same result — which is
what makes 96 tests possible.

---

### `domain/index.ts` — the only door in

A single file that re-exports everything the outside world may use. The UI
writes `import { assessBorrower } from "../domain"`, never
`import ... from "../domain/assessment/assess-borrower"`.

**Why:** the internals can be reorganised without touching a React component.
This file is the contract; everything behind it is an implementation detail.

---

### `domain/types.ts` — the shapes of the answers

Defines what an assessment looks like. The brief calls the four outputs O1–O4;
this file names them so nobody has to remember the numbering:

| Brief | This code | Meaning |
| --- | --- | --- |
| O1 | `decision` | `"borrow"` \| `"borrow_less"` \| `"do_not_borrow"` |
| O2 | `amounts` | Lender likely, household safe, recommended |
| O3 | `interestRate` | Headline band, all-in APR band, fee |
| O4 | `monthlyPayment` | EMI ceiling, tenure options, stress result |

It also defines `NegotiationCard`, the printable page.

**Note the `isDoNotBorrow` flag on the card.** Without it, a refused borrower
would see "EMI ceiling: ₹0 / month", which reads like a bug. The flag lets the
card say "Do not take this loan now" instead.

---

### `domain/rupees.ts` — money formatting

Four small functions: `roundToWholeRupee`, `neverNegative`, `formatRupees`,
`formatPercent`.

**Why a whole file for this:** `formatRupees` uses `Intl.NumberFormat("en-IN")`,
which produces Indian digit grouping — ₹19,07,518 rather than ₹1,907,518. Every
amount the borrower sees passes through here, so the grouping is consistent
across the screens and the printed card.

---

### `domain/loan-math.ts` — the arithmetic

Three functions with no judgement in them at all, so they can be checked by hand
against a textbook.

**`monthlyEmi(principal, annualRatePct, tenureMonths)`**

The standard reducing-balance formula:

```
monthlyRate = annualRatePct / 12 / 100
EMI = P × monthlyRate × (1 + monthlyRate)^n / ((1 + monthlyRate)^n − 1)
```

₹1,00,000 at 12% over 12 months = ₹8,885. That exact case is a test.

**`loanAmountForEmi(emiCeiling, annualRatePct, tenureMonths)`**

The same formula run backwards. This is the function that turns "you can afford
₹23,000 a month" into "so borrow at most ₹8,59,225". A test asserts it is the
exact inverse of `monthlyEmi`.

**`allInAprPct(principal, annualRatePct, tenureMonths, processingFeePct)`**

The true cost once the processing fee is deducted up front. The borrower
receives (principal − fee) but repays EMIs on the full principal, so the real
rate is higher than the headline.

The function solves for the monthly internal rate of return by **bisection** —
it guesses a rate, checks whether the EMI stream is worth more or less than the
cash actually received, and halves the search range 80 times. That is far more
precision than the one decimal place displayed.

The result is annualised **nominally** (× 12), not compounded. See rule R23 in
[RULES.md](RULES.md) for why: a lender quotes 12% nominally, so a nominal APR is
directly comparable to their quote.

---

### `domain/answers/answer-schema.ts` — everything the app can ask

Three things live here:

**1. `Answer`** — the list of 30 answer keys, as constants:

```ts
export const Answer = {
  loanType: "loanType",
  monthlyIncome: "monthlyIncome",
  existingEmiTotal: "existingEmiTotal",
  // ...
} as const;
```

**Why constants instead of raw strings:** a typo in `Answer.monthlyIncme` fails
to compile. A typo in `"monthlyIncme"` silently returns `undefined`, and the app
quietly treats an income of ₹1,10,000 as zero.

**2. `AnswerValue`** — the six kinds of response:

```ts
type AnswerValue =
  | { kind: "choice"; value: string }
  | { kind: "amount"; value: number }
  | { kind: "yesNo"; value: boolean }
  | { kind: "range"; lowValue: number; highValue: number }
  | { kind: "dontKnow" }
  | { kind: "skipped" };
```

**`dontKnow` is a separate kind, and this is a banking decision, not a
programming one.** If "I don't know my EMIs" were stored as `0`, every downstream
number would silently inflate. Because it is its own kind, the app can widen its
ranges and drop confidence to low instead.

`range` exists because informal income genuinely is a range. Ravi takes home
₹40,000 to ₹80,000; forcing him to pick one number would either flatter him or
insult him.

**3. `ANSWER_SCHEMA`** — one row per answer, recording which output it moves and
how important it is:

```ts
{ id: Answer.monthlyIncome, label: "Net monthly income", unit: "rupees",
  moves: ["decision", "amount", "monthlyPayment"], importance: "must" }
```

The `importance` field drives the confidence level: unanswered `high` items keep
confidence at medium. The `moves` field is the promise that no question is asked
without a purpose, and a test enforces that every question maps to a schema row.

---

### `domain/answers/borrower-answers.ts` — the store

A class holding everything the borrower said. Two design choices worth knowing:

**It is immutable.** `set()` returns a *new* `BorrowerAnswers` rather than
modifying the existing one. React can therefore treat each version as a
snapshot, and the Back button is simply "restore the previous snapshot" — no
undo logic anywhere.

**It is session-only.** Nothing is written to `localStorage`, a cookie or a
server. Closing the tab erases everything, which is what the brief requires for
a tool asking about someone's finances.

The reader methods encode real distinctions:

| Method | Returns |
| --- | --- |
| `wasAsked(id)` | Did they respond at all, including "I don't know"? |
| `isKnown(id)` | Do we hold a usable value? "I don't know" returns false. |
| `isUnknown(id)` | Did they explicitly say they do not know? |
| `lowestValue(id)` | The bottom of a range — **what the household must live on** |
| `middleValue(id)` | The middle of a range — **closer to what a lender accepts** |

`lowestValue` versus `middleValue` is the two-book model expressed in two method
names. Anita's household plans on ₹26,000 (`lowestValue`); the lender discounts
₹28,000 (`middleValue`).

---

### `domain/rules/rule-book.ts` — every threshold

One object, grouped by concern:

```ts
export const RULES = {
  age:              { minimumToBorrow, maximumAtLoanEnd },
  tenure:           { maximumMonths, optionsMonths },
  foirCap:          { personal: 0.5, property: 0.55, ... },
  loanToValueCap:   { gold: 0.75, property: 0.55, ... },
  processingFeePct: { ... },
  household:        { shareOfSurplusForNewEmi, minimumEssentialShareOfIncome, ... },
  incomeTrust:      { informalIncomeCut, selfEmployedWithoutItrCut, ... },
  obligations:      { appLoanMonthlyShareOfOutstanding, ... },
  creditBehaviour:  { bounceBlocksUnsecured, highCardUtilisationPct, ... },
  stressTest:       { incomeDropPct: 0.2 },
  decision:         { consumptionSafeToWantedRatio, minimumProductiveIncomeCover },
};
```

**This file is the code twin of RULES.md.** Every row there maps to a value
here. Change one, update the other, run `npm test`.

Below the object are accessor functions — `foirCapFor(loanType)`,
`longestTenureMonths(loanType, age)`, `isUnsecured(loanType)` — so no other
module reaches into the nested shape directly. If the shape changes, only this
file changes.

`longestTenureMonths` is worth reading. It takes the smaller of the product cap
and the years remaining before the maximum age at loan end:

```ts
const monthsAllowedByAge = (RULES.age.maximumAtLoanEnd[loanType] - age) * 12;
return Math.min(RULES.tenure.maximumMonths[loanType], monthsAllowedByAge);
```

That single line is why a 58-year-old gets a much larger EMI than a 29-year-old
for the same loan.

---

### `domain/rules/interest-rate-bands.ts` — the fair-rate table

Nineteen rows, each a judgement about what a product should cost for a given
profile. A row with no score, employer or income type is that product's **wide
band** — the one used when the credit score is unknown.

`bestMatchingBand()` sorts candidate rows by **specificity** and takes the first
match:

```ts
specificity = (employer ? 4 : 0) + (score ? 2 : 0) + (incomeType ? 1 : 0)
```

**Why specificity weighting:** employer evidence is stronger than a score, which
is stronger than income type alone. An MNC employee with a 780 score should get
10.5–13.0%, not the generic salaried 11.0–14.0%, because the more specific row
exists and fits.

---

### `domain/assessment/` — the pipeline

Ten files, each doing exactly one thing, in the order `assess-borrower.ts` calls
them.

#### 1. `loan-product-selector.ts` — should you be buying something else?

The borrower picks a product; this decides whether to point at a better one.

**This is where most real borrower harm is prevented.** Three reroutes:

| Situation | Moved to | Why |
| --- | --- | --- |
| Wants unsecured, owns property ≥ ₹10L, productive purpose or self-employed | Property loan | About half the rate |
| Wants personal, has a bounce, has gold | Gold loan | Unsecured will be refused |
| Wants personal, informal income, has gold | Gold loan | Informal rarely gets a fair unsecured rate |

A home loan is never overridden — someone who asked for a home loan means it.

This is the Ravi case. He asked for an unsecured business loan at 14–22%. He owns
a ₹45,00,000 shop, so the app prices a property loan at 10.0–13.5% instead.

#### 2. `income-books.ts` — two incomes, one borrower

Returns four things: `lenderBook`, `householdBook`, and a plain-English basis
sentence for each. Three paths — salaried, self-employed, informal.

**The single most important comment in the codebase is in this file:** income
trust cuts apply to the lender book only. The household book uses real money.
Discounting Anita's cash by 40% in her own budget would model the bank's doubt as
if it reduced the groceries in her kitchen.

The `basis` strings are why the results screen can say *"using your ITR divided
by 12 (a desk will not lend on verbal cash)"* rather than just showing a number.

#### 3. `existing-obligations.ts` — what is already committed

Produces `emiVisibleToLender` (what shows on a credit report, used for FOIR) and
`emiAndOtherOutgo` (everything that really leaves the account, used for the
household book).

Two rules matter here:

- **Unknown EMIs are never zero.** The `existingEmiIsUnknown` flag travels
  onward and widens every range.
- **Essentials are floored.** A stated ₹5,000 on a ₹1,00,000 income becomes
  ₹35,000. Understating groceries is the most common way a borrower talks
  themselves into an EMI they cannot pay.

It also converts app-loan balances into monthly cost at 12% and spreads a large
upcoming expense over six months.

The `breakdown` array is a human-readable audit trail — the exact lines that
built the numbers, ready to print.

#### 4. `interest-rate-quote.ts` — the fair band

Picks a band, adds risk premiums, converts the fee into an APR. Returns a band,
never a point, because a borrower told "your rate is 14.2%" will believe it and
stop negotiating.

#### 5. `borrowing-capacity.ts` — the heart of the app

Turns a monthly budget into a rupee loan amount. Read the worked example in the
file's own comment; it walks Priya's numbers line by line.

The order of operations matters:

```
1. lender EMI ceiling  = FOIR × lender income − visible EMIs
2. monthly surplus     = household income − essentials − real outgo
3. safe EMI ceiling    = min(40% of surplus, FOIR room on real income)
4. reduce for thin savings, consumption purpose, high card use
5. cap at what a 20% smaller income could still pay        ← survival check
6. run the EMI formula backwards to get both rupee amounts
7. cap both by loan-to-value, then by product ticket size
8. the safe amount can never exceed the lender amount
```

**Step 5 is a survival check, not a second haircut.** An earlier version took 40%
of the *already stressed* surplus, which cut the same household twice for the
same risk and produced absurdly small numbers for self-employed borrowers.

#### 6. `borrow-decision.ts` — O1

Seven rules checked in severity order; the first that fires wins. See R24–R30 in
[RULES.md](RULES.md). "Don't borrow" is reachable four different ways, which is
deliberate — a tool that can never say no is a sales funnel.

#### 7. `confidence-level.ts` — how much to trust ourselves

Low, medium or high, plus a sentence explaining which answer caused it. Reads
the `importance` field from `ANSWER_SCHEMA` rather than keeping its own list, so
adding an answer automatically affects confidence.

**Why this exists:** the screens must never look more certain than the inputs
justify. A borrower who skipped the credit score deserves to be told the bands
are wide *because* they skipped it.

#### 8. `explanations.ts` — one sentence per output

Four functions producing the "why" text under each number, plus `decisionLabel`
for the pill on the results screen.

**Why the app has this at all:** every number must be traceable back to something
the borrower typed. Otherwise the app is an oracle, and an oracle cannot be
argued with at a bank counter.

#### 9. `negotiation-card.ts` — the printable page

An amount to ask for, a fair rate band, an EMI ceiling, three reasons, and the
line at which to walk away. Deliberately short: anything longer will not survive
a real conversation with a salesman.

#### 10. `assess-borrower.ts` — ⭐ the entry point

**If you read one file, read this one.** It calls every step above in order and
assembles the result:

```
answers → product → income → obligations → rate probe → capacity
        → decision → final rate → EMI ceiling → stress → card
```

**The rate is quoted twice, on purpose.** Sizing a loan needs a rate, and
computing a rate's APR needs a loan size. So the first pass uses a
representative ₹1,00,000 to pick a band, and the second re-prices the APR
against the amount actually recommended.

**The EMI ceiling is priced at the TOP of the band.** If the borrower negotiates
the better rate, they have more room than the card promised. Pricing at the low
end would set a ceiling they could breach by accepting an ordinary rate.

`findBlockers()` at the bottom returns reasons the app cannot answer at all — an
age below 21, a missing income — and the screens show those instead of numbers.

---

## Layer 2 — `src/interview/` (the mouth)

### `question-types.ts` — the shape of a question

```ts
interface QuestionDefinition {
  id: string;                     // stable, used as the React key
  answerId: AnswerId;             // which answer it fills — exactly one
  stage: "must" | "extra";
  inputType: "choice" | "number" | "range" | "yesNo"
           | "numberOrUnknown" | "rangeOrUnknown";
  prompt: string;                 // as the borrower reads it
  help?: string;                  // how to answer
  whyItMatters: string;           // required — every question must justify itself
  choices?: QuestionChoice[];
  dynamicChoices?: "purposeByLoanType";
  showWhen: ShowWhenCondition[];  // ← the entire adaptive logic
}
```

**`whyItMatters` is not optional, and a test enforces it.** A borrower being
asked about their card utilisation is entitled to know it is because above 50%
adds 1.5 points to their rate.

`ShowWhenCondition` has five forms:

| Condition | Meaning |
| --- | --- |
| `{ always: true }` | Always shown. Only the first question uses this. |
| `{ answer, wasAnswered: true }` | Responded at all, "I don't know" included |
| `{ answer, isKnown: true }` | Responded with a usable value |
| `{ answer, equals: value }` | Exact match |
| `{ answer, isOneOf: [...] }` | Any of several values |

### `question-registry.ts` — all questions in one list

Concatenates the seven question files in priority order, so a product-specific
question is offered before a generic one.

It also holds `PURPOSES_BY_LOAN_TYPE`. This is the most visible adaptive
behaviour in the app: a gold loan is never "for a wedding gadget", and a home
loan has exactly one honest purpose.

**To add a question:** put it in the right file, and it appears here
automatically. Nothing else needs to change.

### `interview-flow.ts` — which question comes next

The adaptive engine, and it is smaller than most people expect. There is no state
machine. Which question comes next is **derived from the answers, every time**.

`applicableQuestions(answers)` walks the registry and keeps a question when
every one of its `showWhen` conditions holds. If two questions fill the same
answer — the gold value is asked both on the gold path and on the informal path —
only the first applicable one is kept, so nobody is asked the same thing twice.

**Why derived rather than stored:** the Back button becomes trivial. Restore an
older `BorrowerAnswers` and the entire question path recomputes. Change your
loan type from personal to gold and the extras change immediately, with no
cleanup code.

---

## Layer 3 — `src/ui/` (the face)

### `App.tsx` — all state, no lending logic

Four pieces of state:

```ts
const [answers, setAnswers]                 // the only thing that matters
const [previousAnswers, setPreviousAnswers] // a stack — this IS the Back button
const [screen, setScreen]                   // welcome | question | results | card
const [stage, setStage]                     // must | extra | done
```

The assessment is computed with `useMemo` from `answers`, never stored in state,
so it can never drift from the answers that produced it.

### `components/QuestionInput.tsx`

Draws whichever input a question needs. Knows nothing about lending — it takes a
question definition and reports back what the borrower typed.

Two small kindnesses: `readNumber` accepts `"1,20,000"` as well as `"120000"`,
and the range form accepts the two boxes in either order instead of scolding the
user.

### `screens/`

| File | Shows |
| --- | --- |
| `WelcomeScreen.tsx` | The pitch, the Start button, three sample borrowers |
| `QuestionScreen.tsx` | One question, filling the screen, with a progress bar |
| `ResultsScreen.tsx` | The four outputs with their explanations |
| `NegotiationCardScreen.tsx` | The printable card |

**One question per screen is a deliberate design choice.** A borrower under
financial pressure answers one thing at a time. A form of nine fields gets
abandoned.

`NegotiationCardScreen` branches on `card.isDoNotBorrow`, which is why a refused
borrower reads "Do not take this loan now" instead of "EMI above ₹0 / month".

---

## `src/sample-borrowers/` — demo data and test data, deliberately the same

Priya, Ravi and Anita are used by both the welcome-screen buttons and the golden
tests.

**Why share them:** a demo can never drift from what is tested. If a rule change
breaks Ravi's rerouting, `tests/personas/ravi.test.ts` fails before anyone
clicks the button.

| Borrower | Profile | Proves |
| --- | --- | --- |
| **Priya**, 29 | Salaried MNC, ₹1,10,000, wants ₹8,00,000 for a wedding | The two-book gap is real and visible |
| **Ravi**, 42 | Kirana shop, ITR ₹4.2L vs cash ₹40–80k, owns ₹45L shop | The app moves borrowers to cheaper products |
| **Anita**, 35 | Informal ₹26–30k, a bounce, ₹35k of app loans, 3 dependents | "Don't borrow" is genuinely reachable |

---

## `tests/` — all tests, never beside the source

```
tests/
├── helpers/build-answers.ts    aSalariedBorrower() — the baseline
├── unit/                        54 tests — one rule at a time
├── interview/                   21 tests — the question paths
└── personas/                   21 tests — end-to-end journeys
```

**Why a separate folder rather than `*.test.ts` next to each file:**

1. `src/` is exactly what ships. Nothing needs excluding from the build.
2. The three kinds of test are visibly separate. A failure in `unit/` is a broken
   formula; a failure in `personas/` is a broken outcome.
3. Tests import through `src/domain` — the same public door the UI uses — so they
   prove the public surface works, not just the internals.

`tests/helpers/build-answers.ts` provides `aSalariedBorrower()`: income ₹80,000,
existing EMIs ₹5,000, essentials ₹20,000, age 30, score 760. Each test overrides
only the answer it is actually about, so a failure points straight at the rule
that broke.

**Test names are sentences.** `"keeps the informal-income cut out of the
household book entirely"` tells you the banking rule. `"TC-INC-03"` does not.

---

## Configuration files

| File | What it controls |
| --- | --- |
| `package.json` | Project name, the npm scripts, the dependency list |
| `tsconfig.json` | TypeScript strictness. `strict`, `noUnusedLocals` and `noUnusedParameters` are all on. |
| `vite.config.ts` | Dev server, path aliases, and `include: ["tests/**/*.test.ts"]` |
| `index.html` | The single HTML page. One `<div id="root">`. |
| `.gitignore` | `node_modules`, `dist`, `.tmp` — never copied, never committed |

---

## How to make a change, by type of change

| I want to... | Edit | Then |
| --- | --- | --- |
| Change a threshold | `src/domain/rules/rule-book.ts` | Update RULES.md, `npm test` |
| Change a rate band | `src/domain/rules/interest-rate-bands.ts` | Update RULES.md table, `npm test` |
| Add a question | The right file in `src/interview/questions/` + a row in `answer-schema.ts` | Read it in one domain module, update QUESTIONS.md |
| Add a loan product | `LoanType` in `types.ts`, then every `Record<LoanType, ...>` in `rule-book.ts` | TypeScript lists the places you missed |
| Change a decision rule | `src/domain/assessment/borrow-decision.ts` | Update RULES.md, add a test |
| Change wording on screen | `src/ui/screens/` or `src/domain/assessment/explanations.ts` | Nothing else |
| Restyle | `src/index.css` | Nothing else |

The middle column is never a React component when the change is a lending
decision. That is the architecture doing its job.
