# RULES.md — every number this app uses, and why

This is the **rule book**. Nothing in the app invents a number. Every threshold
below lives in exactly one source file, `src/domain/rules/rule-book.ts`, and the
rate bands live in `src/domain/rules/interest-rate-bands.ts`.

**How to use this document.** Each rule has four parts:

| Part | Means |
| --- | --- |
| **What** | The rule in one sentence |
| **Value** | The actual number in the code |
| **Why** | The banking reason it exists |
| **Example** | The rule applied to real rupees |

**How to change a rule.** Edit the value in `rule-book.ts`, update the row here,
run `npm test`. The screens follow automatically because no React component
contains a threshold.

> **What this is not.** These are judgement bands based on publicly advertised
> Indian retail lending ranges. They are not any single bank's credit policy and
> not an RBI circular. A real sanction depends on documents nobody has seen here.

---

## Part 1 — The two-book model (read this first)

Everything else makes sense only once you understand this. The app answers
"how much can you borrow?" **twice**, because the honest answer is two numbers.

| Book | The question it answers | Who it protects |
| --- | --- | --- |
| **Lender book** | "What will a bank's desk actually sanction?" | The bank |
| **Household book** | "What can this family carry after rent, food and a bad month?" | The borrower |

The lender book applies **income-trust cuts** — a bank discounts income it
cannot verify. The household book applies **living-cost floors** — rent and
groceries do not disappear because a form ignores them.

**The critical rule: income-trust cuts NEVER touch the household book.**

Anita earns ₹26,000 in cash. A bank discounts that by 40% because she cannot
prove it. But she still has ₹26,000 of actual money for actual groceries. If we
applied the bank's doubt to her kitchen budget, we would be punishing the same
rupee twice — once as the bank's suspicion, once as her own poverty. So the
household book uses ₹26,000.

**The recommended amount is always the lower of the two.**

---

## Part 2 — Age and tenure

### R1. Minimum age to borrow

- **What:** Below this age, the app refuses to produce numbers at all.
- **Value:** 21
- **Why:** Standard retail lending floor across Indian banks and NBFCs.
- **Example:** A 17-year-old sees a blocker message, not a loan amount.

### R2. Maximum age when the loan ends

- **What:** The loan should normally be repaid before this age.
- **Value:** Personal 60 · Property 70 · Gold 80 · Two-wheeler 65 · Business 65 · Home 70
- **Why:** A lender wants the loan repaid from earned income, not from a pension.
  Secured products allow higher ages because an asset backs them.
- **Example:** Priya is 29 and wants a personal loan. 60 − 29 = 31 years, so age
  is not her constraint; the 60-month product cap is. A 58-year-old gets
  60 − 58 = 2 years = 24 months, which is **less than** the 60-month cap, so age
  wins and her EMI is much larger for the same loan.

### R3. Maximum tenure by product

- **What:** The longest the product itself runs, regardless of age.
- **Value:** Personal 60 months · Property 180 · Gold 24 · Two-wheeler 48 · Business 60 · Home 240
- **Why:** Matches the market. Gold is short because the pledge is short; home
  loans run 20 years because the asset lasts.
- **Example:** Ravi's property loan gets 180 months, which is why his EMI ceiling
  of ₹11,040 supports ₹8,50,331 of principal. On a 60-month personal loan the
  same EMI would support only about ₹4,80,000.

**The tenure actually used is the smaller of R2 and R3.**

---

## Part 3 — How much a lender will give (the lender book)

### R4. FOIR — the income-ratio cap

- **What:** The share of monthly income that ALL EMIs together may consume.
  FOIR stands for Fixed Obligation to Income Ratio.
- **Value:** Personal 50% · Property 55% · Gold 60% · Two-wheeler 50% · Business 45% · Home 55%
- **Why:** This is the single most common underwriting rule in Indian retail
  lending. Secured products get a higher cap because the lender can recover the
  asset. Unsecured business loans get the lowest cap because business income is
  the most volatile.
- **Example:** Priya earns ₹1,10,000 and pays ₹14,000 of existing EMIs on a
  personal loan.

  ```
  FOIR room = 50% × 1,10,000 − 14,000
            = 55,000 − 14,000
            = ₹41,000 per month available for a new EMI
  ```

  At 10.5% over 60 months, ₹41,000 a month supports about **₹19,07,518** — which
  is exactly the lender number the app shows her.

### R5. Loan-to-value — the security cap

- **What:** The share of a pledged asset's value a lender will fund.
- **Value:** Gold 75% · Property 55% · Home 80% · Two-wheeler 85%
- **Why:** The lender needs headroom to recover the loan if it must sell the
  asset, allowing for price falls and sale costs. Gold is liquid but its price
  moves; property is stable but slow and expensive to sell.
- **Example:** Ravi's shop is worth ₹45,00,000. 55% × 45,00,000 = **₹24,75,000**
  is his hard ceiling, no matter how good his income is. The app shows
  ₹24,36,244, which is his FOIR limit landing just under the LTV cap.

**No valuation means no loan** for gold, property and home loans — a lender
cannot lend against an asset nobody has valued. For a two-wheeler the LTV is
simply skipped if the price is unknown.

### R6. Income-trust cuts (lender book only)

- **What:** How much of stated income a lender will actually count.
- **Value:**
  - Informal or cash income: **40% cut** (60% counted)
  - Self-employed with no ITR: **30% cut** (70% counted)
  - Bonus or variable pay: **50% counted**
  - Co-applicant income when the borrower is self-employed: **70% counted**
- **Why:** A desk underwrites what it can document. Cash cannot be verified, a
  bonus may not repeat, and a co-applicant tied to the same volatile business is
  not independent security.
- **Example:** Anita states ₹26,000–₹30,000. The midpoint is ₹28,000, and
  ₹28,000 × 60% = **₹16,800** in the lender book. Her household book uses the
  full **₹26,000**.

### R7. Self-employed income is ITR ÷ 12

- **What:** When an ITR exists, the lender book uses it and ignores cash drawings.
- **Value:** Annual ITR income ÷ 12
- **Why:** No desk in India will lend on verbal cash flow. Showing this gap is
  half the point of the app — it explains a rejection before it happens.
- **Example:** Ravi's ITR shows ₹4,20,000 a year, so his lender income is
  **₹35,000 a month**, even though he really takes home ₹40,000–₹80,000. His
  household book uses ₹40,000 (the low end of real cash) plus 70% of his wife's
  ₹18,000, which is why his safe amount is not tiny.

### R8. Maximum ticket size

- **What:** Product caps regardless of income.
- **Value:** Personal ₹20,00,000 · Two-wheeler ₹2,50,000
- **Why:** Market reality. Unsecured personal lending rarely exceeds ₹20 lakh at
  a retail desk, and a two-wheeler loan is bounded by what a two-wheeler costs.

---

## Part 4 — How much you can safely carry (the household book)

### R9. Only 40% of surplus goes to a new EMI

- **What:** After essentials and existing EMIs, a new EMI may use at most 40% of
  what is left.
- **Value:** 40%
- **Why:** The other 60% absorbs the things a monthly budget cannot predict — a
  medical bill, a festival, a month of lost work. Committing all of the surplus
  is how a borrower with a "comfortable" EMI ends up on an app loan in month
  four.
- **Example:** Priya's household book:

  ```
  Income                              1,10,000
  Essentials (see R11)                − 38,500
  Existing EMIs                       − 14,000
  ────────────────────────────────────────────
  Monthly surplus                       57,500
  40% available for a new EMI        =  23,000
  ```

### R10. Also capped by FOIR on real income

- **What:** The safe EMI also respects the same FOIR cap, applied to the
  household book rather than the lender book.
- **Value:** Same percentages as R4
- **Why:** Prevents an odd case: someone with very low stated essentials could
  otherwise get a huge safe EMI from R9 alone.
- **Example:** Priya's cap is min(₹23,000 from R9, 50% × 1,10,000 − 14,000 =
  ₹41,000) = **₹23,000**. R9 binds.

### R11. The essentials floor — 35% of income, plus ₹2,000 per dependent

- **What:** If stated essentials look too low, assume at least this much.
- **Value:** 35% of household income, plus ₹2,000 per dependent. Rent is also a
  floor on its own.
- **Why:** Understating groceries is the most common way a borrower talks
  themselves into an unaffordable EMI. Nobody in India runs a household on 5% of
  their income.
- **Example:** Priya stated ₹28,000 of essentials on ₹1,10,000 of income.
  35% × 1,10,000 = ₹38,500, which is higher, so the app uses **₹38,500**. This is
  why her surplus is ₹57,500 rather than ₹68,000 — the app is deliberately less
  optimistic than she was.

  Anita stated ₹18,000 on ₹26,000. The floor is
  35% × 26,000 + 3 × 2,000 = ₹15,100, which is lower, so her stated ₹18,000
  stands.

### R12. The stress test — a 20% income drop

- **What:** The safe EMI can never exceed what the household could still pay if
  income fell 20%.
- **Value:** 20% income drop
- **Why:** One shock, not a menu of them. A 20% fall is a realistic bad quarter
  for a salaried person (lost bonus, unpaid leave) and an ordinary month for a
  shop.
- **Example:** Priya at −20%:

  ```
  Stressed income   1,10,000 × 0.8 =  88,000
  Essentials                        − 38,500
  Existing EMIs                     − 14,000
  ──────────────────────────────────────────
  Surplus if income drops             35,500
  ```

  ₹35,500 is more than the ₹23,000 from R9, so the stress test does not bind and
  her safe EMI stays ₹23,000.

  Anita at −20%: 26,000 × 0.8 = ₹20,800, minus ₹18,000 essentials, minus
  ₹7,000 EMIs, minus ₹4,200 of app-loan servicing = **−₹8,400**. She is already
  underwater before any new loan, so her safe EMI is **₹0**.

> **This is a survival check, not a second haircut.** The app takes 40% of
> *today's* surplus and then caps it at what a *stressed* income could pay. It
> does not take 40% of the stressed surplus — that would cut the same household
> twice for the same risk.

### R13. Thin savings cut the safe amount by 25%

- **What:** Fewer than 3 months of expenses saved reduces the safe EMI by 25%.
- **Value:** Below 3 months → 25% reduction
- **Why:** Emergency savings are what stop a missed month from becoming a
  default. Without them the first shock goes straight to the EMI.
- **Example:** A safe EMI ceiling of ₹20,000 becomes ₹15,000.

### R14. Consumption borrowing gets 15% less

- **What:** A wedding or general-spending loan gets a 15% smaller safe EMI than
  a productive one.
- **Value:** 15% reduction for `wedding` and `consumption` purposes
- **Why:** A shop's stock generates income to service its own EMI. A wedding
  does not. Same rupee of debt, different risk.

### R15. Debt that does not look like an EMI still counts

- **What:** App, BNPL and payday balances are converted into a monthly cost.
- **Value:** 12% of the outstanding balance per month
- **Why:** These loans rarely present as a clean EMI, but they consume cash
  every month at a punishing rate. Ignoring them is how the app would miss the
  exact borrower it exists to help.
- **Example:** Anita owes ₹35,000 on app loans. 12% × 35,000 = **₹4,200 a month**
  added to her outgo — the difference between "she has a little room" and "she
  has none".

### R16. A large upcoming expense is spread over 6 months

- **What:** School fees or a planned surgery in the next 6 months are divided by
  6 and subtracted from monthly surplus.
- **Value:** ÷ 6 months
- **Why:** The money will actually leave the account during the loan's first
  months, which is exactly when a new EMI is most fragile.
- **Example:** ₹60,000 of school fees becomes ₹10,000 a month of reduced surplus.

### R17. High card use trims the safe amount by 5%

- **What:** Above 50% of the card limit used, the safe amount drops 5%.
- **Value:** Above 50% utilisation → 5% reduction
- **Why:** High revolving use is a live signal of cash-flow stress, separate from
  the score.

---

## Part 5 — The fair rate band

### R18. Always a band, never a single rate

- **What:** The app reports a low and a high rate, never one number.
- **Why:** A borrower told "your rate is 14.2%" will believe it and stop
  negotiating. A band says "inside this is fair, above it is worth arguing
  about", which is the only honest thing a self-assessment can say.

### R19. The bands

Headline rates, in percent per year, from
`src/domain/rules/interest-rate-bands.ts`:

| Product | Condition | Band |
| --- | --- | --- |
| Personal | Salaried, MNC or government, score 750+ | 10.5–13.0 |
| Personal | Salaried, score 750+ | 11.0–14.0 |
| Personal | Salaried, score 700–749 | 12.5–16.0 |
| Personal | Salaried, score 650–699 | 16.0–22.0 |
| Personal | Salaried, score unknown | 11.0–18.0 |
| Personal | Self-employed | 14.0–22.0 |
| Personal | Informal income | 24.0–36.0 |
| Property | Score 700+ | 10.0–12.5 |
| Property | Score unknown | 10.0–13.5 |
| Gold | Any | 8.5–14.0 |
| Two-wheeler | Salaried | 10.0–16.0 |
| Two-wheeler | Informal | 14.0–20.0 |
| Business unsecured | Self-employed | 14.0–22.0 |
| Home | Score 750+ | 8.0–9.5 |
| Home | Score unknown | 8.0–10.5 |

The **most specific** matching row wins. Employer evidence outranks a score,
which outranks income type alone.

### R20. An unknown score widens the band; it never assumes the worst

- **What:** "I don't know my score" selects the product-wide band.
- **Why:** Assuming 300 would frighten a good borrower into a bad product;
  assuming 750 would set them up for a rejection. The wide band is the truth.
- **Example:** Priya with a 780 score and MNC employer gets 10.5–13.0%, a band
  2.5 points wide. The same Priya with an unknown score gets 11.0–18.0%, a band
  7 points wide. Answering one question halved her uncertainty.

### R21. Risk premiums added to the band

| Signal | Added to both ends |
| --- | --- |
| Card utilisation above 50% | +1.5 points |
| A bounce, on a secured product | +3.0 points |
| Under 6 months in the current job (personal loan) | +1.0 point |
| No GST registration (unsecured business loan) | +1.0 point |

**Why:** Each is a documented, observable signal a real desk prices for. Keeping
them separate and listed means a borrower can see what each one costs them.

### R22. Processing fees

- **Value:** Personal 2% · Property 1% · Gold 1% · Two-wheeler 1.5% · Business 2% · Home 0.5%
- **Why:** Typical advertised ranges. Secured products charge less because the
  security does the work.

### R23. All-in APR, annualised nominally

- **What:** The true cost once the processing fee is deducted from the money
  actually received.
- **Method:** The borrower receives (principal − fee) but repays EMIs on the full
  principal. The app solves for the monthly internal rate of return that makes
  the EMI stream worth the cash in hand, then multiplies by 12.
- **Why nominal (× 12) rather than compounded:** A lender quotes "12%"
  nominally. A nominal APR is directly comparable to that quote, so with a zero
  fee the APR equals the headline exactly and **every basis point above the quote
  is a real charge the borrower can point at**. Compounding would report 12.68%
  on a fee-free 12% loan and derail the conversation before it started.
- **Example:** Priya's band is 10.5–13.0% headline. With the 2% personal-loan fee
  over 60 months, her all-in APR is **11.4–13.9%**. That ~0.9-point gap is the
  fee, made visible.

---

## Part 6 — The borrow / borrow less / don't borrow decision

Checked in this order. The first rule that fires wins.

### R24. A bounce plus an unsecured loan is a hard stop

- **Verdict:** Don't borrow
- **Why:** A desk will rarely sanction it, and the borrower's realistic
  alternative is a 36% app loan. Saying "don't" is the only useful answer.
- **Example:** This is Anita. It fires before any arithmetic about her surplus.

### R25. No monthly room at all

- **Verdict:** Don't borrow
- **Trigger:** Surplus ≤ 0, or safe EMI ≤ 0, or safe amount ≤ 0
- **Why:** Borrowing here means the new EMI is paid out of groceries.

### R26. Consumption, thin savings, and a safe amount far below the ask

- **Verdict:** Don't borrow
- **Trigger:** Purpose is a wedding or general spending, **and** savings are
  under 3 months or unknown, **and** the safe amount is below 40% of the amount
  wanted.
- **Why:** All three at once means the borrower is about to fund something
  optional with money they do not have and no cushion to absorb it. Borrowing a
  third of what they asked for usually will not achieve the goal anyway.

### R27. A productive loan must cover its own EMI 1.25×

- **Verdict:** Borrow less
- **Trigger:** Purpose is business expansion, expected extra income is under
  1.25× the safe EMI, and they asked for more than the safe amount.
- **Why:** If the new income barely covers the instalment, any delay means the
  household subsidises the business.

### R28. The lender would give more than you should take

- **Verdict:** Borrow less, at the safe amount
- **Why:** This is the app's whole reason for existing. A sanction letter is not
  a recommendation.
- **Example:** Priya's must-only run — a lender may offer ₹18,85,714, she can
  carry ₹7,69,884, so the app says borrow less and use ₹7,69,884.

### R29. You want more than a lender would give

- **Verdict:** Borrow less, at the lower of the two ceilings
- **Why:** Better to know the FOIR or LTV limit before the application than
  after a rejection lands on the credit file.

### R30. Otherwise, borrow

- **Verdict:** Borrow, at the amount requested
- **Trigger:** The amount fits both books and survives the stress test.
- **Example:** Priya's full run — she wants ₹8,00,000, she can safely carry
  ₹8,59,225, so the answer is a clean yes.

---

## Part 7 — The EMI ceiling and confidence

### R31. The ceiling is priced at the TOP of the rate band

- **What:** The EMI ceiling on the card uses the high end of the fair band.
- **Why:** If the borrower negotiates the better rate, they have more room than
  the card promised. Pricing at the low end would set a ceiling they could
  breach by accepting a normal rate.

### R32. Confidence is reported, not hidden

- **Value:**
  - **Low** — existing EMIs or credit score marked unknown
  - **Medium** — must-answers complete, 1–3 high-impact extras missing
  - **High** — must-answers plus all high-impact extras answered
- **Why:** The screens must never look more certain than the inputs justify.
- **Example:** Priya's full run is medium. Her must-only run is low, and the app
  says so in words: "You marked credit score as unknown, so the ranges stay wide
  on purpose."

### R33. "I don't know" is never zero

- **What:** An unknown EMI total is carried as unknown, not treated as ₹0.
- **Why:** Treating it as zero would silently inflate every number. Instead the
  ranges widen and confidence drops to low.

---

## Where each rule lives in the code

| Rules | File |
| --- | --- |
| R1–R3, R8 | `src/domain/rules/rule-book.ts` (`age`, `tenure`, `maximumTicketSize`) |
| R4, R5 | `src/domain/rules/rule-book.ts` (`foirCap`, `loanToValueCap`) |
| R6, R7 | `src/domain/rules/rule-book.ts` (`incomeTrust`) → `src/domain/assessment/income-books.ts` |
| R9–R14, R17 | `src/domain/rules/rule-book.ts` (`household`) → `src/domain/assessment/borrowing-capacity.ts` |
| R15, R16 | `src/domain/rules/rule-book.ts` (`obligations`) → `src/domain/assessment/existing-obligations.ts` |
| R18–R22 | `src/domain/rules/interest-rate-bands.ts` → `src/domain/assessment/interest-rate-quote.ts` |
| R23 | `src/domain/loan-math.ts` (`allInAprPct`) |
| R24–R30 | `src/domain/assessment/borrow-decision.ts` |
| R31 | `src/domain/assessment/assess-borrower.ts` |
| R32, R33 | `src/domain/assessment/confidence-level.ts` |

---

## Known limits

1. Rate bands are judgement, not a rate card. No bank has approved them.
2. No documents were seen. Everything is self-reported.
3. Informal income is discounted, not verified.
4. Essential-spend floors are national, not city-specific. Bengaluru is not
   Hubballi, and the app does not yet know the difference.
5. One stress case only: a 20% income drop. Not a rate rise, not a job loss.
