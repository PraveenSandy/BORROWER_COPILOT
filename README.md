# Borrower Copilot

A self-assessment tool that tells an Indian borrower four things **before** they
walk into a lender:

1. **Should you borrow at all?** — including a real "don't borrow"
2. **How much?** — two numbers: what a lender will offer, and what you can carry
3. **At what rate?** — a fair band, plus the all-in APR once fees are counted
4. **Which EMI to refuse?** — a monthly ceiling, stress-tested against a 20% income drop

Then it prints a one-page **negotiation card** you can hold up at the counter.

No login. No database. Nothing stored. Everything runs in your browser and
disappears when you close the tab.

---

## Start here

| I want to... | Read |
| --- | --- |
| Install and run it | **[INSTALL.md](INSTALL.md)** |
| Understand the code | **[ARCHITECTURE.md](ARCHITECTURE.md)** |
| Know which questions are asked, and why | **[QUESTIONS.md](QUESTIONS.md)** |
| Know where every number comes from | **[RULES.md](RULES.md)** |
| Copy it to another laptop | **[DEPLOYMENT.md](DEPLOYMENT.md)** |
| See real output for three borrowers | **[RUNTHROUGHS.md](RUNTHROUGHS.md)** |

---

## Two minutes to running

```powershell
cd borrower-copilot
npm install
npm test          # expect: 96 passed
npm run dev       # open http://localhost:5173/
```

If `npm` is not recognised, install Node.js first —
[INSTALL.md Step 1](INSTALL.md) covers three ways to do it, including a portable
option that needs no admin rights.

---

## The idea in one example

Priya is 29, salaried at an MNC, earns ₹1,10,000 a month, pays ₹14,000 of
existing EMIs and ₹28,000 of rent. She wants ₹8,00,000 for a wedding.

**What a bank's form computes:**

```
50% of ₹1,10,000 = ₹55,000, minus ₹14,000 of EMIs
→ ₹41,000 a month available
→ a sanction of about ₹19,07,518
```

Her rent never enters that calculation. Most bank forms do not ask for it.

**What this app computes as well:**

```
₹1,10,000 income
− ₹38,500 essentials  (her stated ₹28,000, floored at 35% of income)
− ₹14,000 existing EMIs
─────────────────────
  ₹57,500 surplus, of which 40% may go to a new EMI = ₹23,000
Survives a 20% income drop? Yes — ₹35,500 would still be left
→ a safe amount of ₹8,59,225
```

**The app shows her both numbers, and tells her to use the smaller one.**

The ₹11 lakh gap between them is her rent. A bank is not lying to her, and it is
not being reckless — it is answering a different question. This app answers the
one she actually needs answered.

Ravi asked for an unsecured business loan at 14–22%; he owns a ₹45,00,000 shop,
so the app prices a property loan at 10.0–13.5% instead. Anita has a bounce on
record and ₹35,000 of app loans, so the app tells her not to borrow at all — and
means it.

---

## How the code is arranged

Three layers. Each may only depend on the ones above it.

```
   src/domain/       The brain.  Pure TypeScript. Knows lending, knows nothing about screens.
        ↑
   src/interview/    The mouth.  Decides which question to ask next.
        ↑
   src/ui/           The face.   React components. Contains zero lending logic.
```

**Every threshold lives in one file:** `src/domain/rules/rule-book.ts`. Change
the personal-loan income ratio from 50% to 45% there, and the results screen,
the negotiation card and the printed PDF all move together. No React component
contains a rupee amount or a percentage.

The one function that produces an answer is
`assessBorrower(answers): Assessment` in
`src/domain/assessment/assess-borrower.ts`. It is pure — no network, no clock,
no randomness — which is what makes 96 tests possible.

[ARCHITECTURE.md](ARCHITECTURE.md) explains every file.

---

## What the app deliberately does

| Choice | Why |
| --- | --- |
| Shows **two** amounts, not one | "How much can I borrow?" honestly has two answers |
| Can say **don't borrow** | A tool that can never say no is a sales funnel |
| A rate **band**, never a single rate | "Your rate is 14.2%" makes people stop negotiating |
| Treats **"I don't know" as its own answer** | Storing an unknown EMI as ₹0 would silently inflate everything |
| **Floors** essential spending | Understating groceries is how borrowers talk themselves into bad EMIs |
| Counts **app and BNPL debt** | It rarely looks like an EMI but it consumes cash every month |
| Prices the EMI ceiling at the **top** of the band | If you negotiate a better rate you gain room, never lose it |
| Reports its own **confidence** | The screens must never look more certain than the inputs justify |
| Stores **nothing** | It asks about someone's finances. It has no business keeping the answers. |

---

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Download the libraries. Run once. |
| `npm run dev` | Start the app at `http://localhost:5173/` |
| `npm test` | Run all 96 tests |
| `npm run test:watch` | Re-run tests as you edit |
| `npm run typecheck` | Check types without building |
| `npm run build` | Production files in `dist/` (about 210 KB) |
| `npm run preview` | Serve the built `dist/` folder |
| `npm run report` | Print every sample borrower's full assessment |
| `npm run questions` | Print which questions are asked for every loan type |

---

## Tests

96 tests in 13 files, all under `tests/`, never beside the source.

```
tests/
├── helpers/       A baseline borrower for the unit tests
├── unit/          54 tests — one rule at a time
├── interview/     21 tests — the adaptive question paths
└── personas/      21 tests — Priya, Ravi and Anita end to end
```

Test names are sentences, so a failure reads as a broken banking rule rather
than a broken function: *"keeps the informal-income cut out of the household
book entirely"*.

---

## Technology

| Piece | Choice | Why |
| --- | --- | --- |
| Language | TypeScript, `strict` on | A typo in an answer key fails to compile instead of silently becoming zero |
| UI | React 18 | Component model fits a one-question-per-screen wizard |
| Build | Vite 6 | Instant dev server, 210 KB production bundle |
| Tests | Vitest 2 | Same config as the build; the domain layer needs no browser |
| Styling | Plain CSS, mobile-first at 360px | The borrower who needs this most is on a cheap phone |
| Backend | None | Nothing to store, so nothing to secure |

---

## Limits, stated plainly

1. **This is not a sanction.** No documents were seen; everything is
   self-reported.
2. **The rate bands are judgement**, based on publicly advertised Indian retail
   ranges. No bank has approved them.
3. **Informal income is discounted, not verified.**
4. **Essential-spend floors are national, not city-specific.** Bengaluru is not
   Hubballi, and the app does not yet know the difference.
5. **One stress case only** — a 20% income drop. Not a rate rise, not a job
   loss, not a medical event.

Each limit is a deliberate scope decision, not an oversight. [RULES.md](RULES.md)
records the reasoning for every one.

---

## What would come next

- **City-specific essential floors.** The 35%-of-income floor is the crudest
  rule in the app.
- **Kannada and Hindi card copy.** The negotiation card is the part that most
  needs to be in the borrower's own language.
- **Paste a sanction letter and compare it to the card.** Turning the tool from
  preparation into verification.
- **An optional insurance toggle in the APR.** Bundled insurance is a common
  hidden cost the app currently ignores.

Explicitly out of scope: login, a database, an ML score, live credit-bureau
integration, a chat interface, and full home-loan origination.
