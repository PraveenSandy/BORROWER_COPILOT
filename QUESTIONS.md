# QUESTIONS.md — every question, for every loan type

This document is generated from the code. To reproduce it:

```
npm run questions
```

That command walks the real question registry for all six loan types × three
income types × every purpose, so nothing here can drift from what the app
actually asks.

---

## The design in one paragraph

There are **31 question definitions** covering **30 distinct answers**. Nine are
asked of everybody. The other twenty-two are offered along **three axes**:

| Axis | Asks about | Example |
| --- | --- | --- |
| **Loan type** | What security is on offer | Gold value, only for a gold loan |
| **Income type** | How the borrower earns, whatever they are buying | ITR, for any self-employed borrower |
| **Purpose** | Whether the money will create income | Expected extra income, for a shop or a work vehicle |

Plus seven common extras offered to everyone.

**Why three axes rather than one.** An earlier version grouped everything by
loan type, which meant a shop owner applying for a *personal* loan was never
asked for their ITR — they were silently priced on the "no ITR" 30% cut when
they had a return sitting in a drawer. Income evidence follows the borrower, not
the product.

**Every borrower sees between 17 and 22 questions.** Nine are mandatory. The rest
can all be skipped with a single button, which widens the ranges and drops the
confidence level, but still produces all four outputs.

---

## Part 1 — The nine must-questions (everybody, in this order)

Each one waits for the previous answer, which is what makes it feel like a
conversation rather than a form.

| # | Question | Input | Why it is asked |
| --- | --- | --- | --- |
| 1 | What kind of loan are you considering? | 6 choices | Sets the entire question path, the income ratio, the LTV cap, the tenure and the fees |
| 2 | What is the money for? | Choices **that depend on Q1** | Decides borrow vs borrow less vs don't. A wedding and shop stock are different risks |
| 3 | How much do you want to borrow? | ₹ | Compared against both the lender amount and the safe amount |
| 4 | How do you earn your money? | Salaried / Self-employed / Informal | Lenders trust a salary slip, an ITR and cash very differently |
| 5 | What is your net monthly income? | ₹ low–high, or "don't know" | The denominator of the income ratio — the number that drives everything |
| 6 | What do all your current EMIs add up to? | ₹, or "don't know" | Subtracted twice: from the bank's ratio and from the kitchen budget |
| 7 | What do you spend on rent, food, school fees and bills? | ₹, or "don't know" | Separates what a lender will offer from what you can live with |
| 8 | How old are you? | Years | Shortens the tenure so the loan ends before retirement, which raises the EMI |
| 9 | Do you know your credit score? | 300–900, or "don't know" | Unknown widens the rate band instead of inventing a number |

### The purposes offered for each loan type (Q2 adapts)

| Loan type | Purposes offered |
| --- | --- |
| **Personal** | Wedding · Travel/gadgets · Medical emergency · Pay off a costlier loan · Education |
| **Property** | Grow the business · Replace a loan · Home improvement · Education · Emergency |
| **Gold** | Emergency/medical · Working capital · Personal need · Pay off a costlier loan |
| **Two-wheeler** | Buy for work · Buy for personal use |
| **Business** | Stock/equipment/expansion · Delivery vehicle · Replace a business loan |
| **Home** | Buy, build or improve a home |

A gold loan is never offered "for a wedding gadget", and a home loan has exactly
one honest purpose. That is the most visible adaptive behaviour in the app.

**Three of the nine accept "I don't know"** — existing EMIs, essential spend and
credit score. These are the three a borrower most plausibly does not know, and
each has a defined fallback: widen the bands, apply a floor, use the wide rate
band. Income and age do not accept "don't know", because without them there is
no assessment at all.

---

## Part 2 — Extras by loan type

### Personal loan (5 questions)

| Question | Shown when | Effect |
| --- | --- | --- |
| What kind of employer do you have? | Salaried only | MNC or government earns the tightest rate band, 10.5–13.0% |
| How many years in this job? | Salaried only | Under 6 months adds 1 point to the rate |
| What percent of pay is bonus? | Salaried only | Lender counts half; the household counts none |
| How much rent do you pay? | Personal or home loan | **The single biggest cause of the two-book gap** |
| What percent of your card limit is used? | Personal loan | Above 50% adds 1.5 points and trims the safe amount 5% |

The rent question is why Priya's lender number is ₹19,07,518 and her safe number
is ₹8,59,225. A bank's form does not ask; this app does.

### Property loan (1 question)

| Question | Shown when | Effect |
| --- | --- | --- |
| Market value of a property you could pledge? | Property, home, **or business** loan | Caps the loan at 55% of value — and can reroute a borrower to a much cheaper product |

**Note it is asked of unsecured business-loan applicants too.** That is
deliberate: this is the highest-value question in the app for a self-employed
borrower, because it is what moves Ravi from 14–22% to 10.0–13.5%.

### Gold loan (1 question)

| Question | Shown when | Effect |
| --- | --- | --- |
| What is the jewellery you could pledge worth? | Gold loan | Caps the loan at 75% of value. No valuation means no loan |

### Two-wheeler loan (1 question)

| Question | Shown when | Effect |
| --- | --- | --- |
| On-road price of the two-wheeler? | Two-wheeler loan | Caps the loan at 85%, so the rest is a down payment |

---

## Part 3 — Extras by income type

### Self-employed (4 questions) — asked for **any** loan type

| Question | Shown when | Effect |
| --- | --- | --- |
| What annual income did your last ITR show? | Self-employed | Lender income becomes ITR ÷ 12. With no ITR, stated income is cut 30% |
| What cash do you actually take home? | Self-employed | Sets the **household** budget, at the low end of the range |
| How many years has the business run? | Self-employed | Supports staying in the normal rate band |
| Is the business GST-registered? | Self-employed **and** business or property loan | No GST adds 1 point to an unsecured business loan |

The first two together are the ITR-versus-cash gap. Ravi's ITR says ₹35,000 a
month; his real cash is ₹40,000–₹80,000. The app shows him both numbers and
explains why the lender will only use the first one.

### Informal income (2 questions) — asked for **any** loan type

| Question | Shown when | Effect |
| --- | --- | --- |
| How much do you owe on app, BNPL or payday loans? | Informal income | Converted to 12% a month of servicing. For Anita this is ₹4,200 — the difference between "some room" and "none" |
| Do you have gold you could pledge instead? | Informal **and** personal or business loan | Can move a borrower from a 30% product to a 12% one |

**This is the highest-harm path in the app.** An informal earner refused a
personal loan is one tap away from a 36% app loan, so both questions exist to
find a cheaper way out.

---

## Part 4 — Extras by purpose

### Productive purpose (1 question)

| Question | Shown when | Effect |
| --- | --- | --- |
| How much extra monthly income do you expect this to create? | Purpose is business expansion **or** a work vehicle | The loan must cover its own EMI 1.25× or the verdict becomes borrow less |

Keyed to purpose, not product: a gold loan taken for working capital is just as
productive as a property loan taken for the same reason, and gets the same
question. Never asked for a wedding, which creates no income.

---

## Part 5 — Common extras (7 questions, everybody)

| Question | Effect |
| --- | --- |
| Has any EMI bounced in the last 12 months? | **The single answer most likely to change the verdict to don't borrow** |
| How many months of expenses in emergency savings? | Below 3 months cuts the safe amount 25% |
| How many people depend on this income? | Each dependent raises the assumed essentials floor by ₹2,000 |
| Co-applicant's net monthly income? | Raises both books. Counted at 70% if the borrower is self-employed |
| How many months are left on your current EMIs? | Only asked if the EMI total was **known**. Appears on the EMI explanation |
| Any large expense in the next 6 months? | Spread over 6 months and subtracted from surplus |
| Has a lender already quoted you a rate? | Never changes our band. Puts their quote next to ours on the card |

---

## Part 6 — The exact count for every path

Read as: 9 must-questions, plus this many extras.

### Personal loan

| Income type | Extras | Total | What is asked |
| --- | --- | --- | --- |
| Salaried | 12 | **21** | 5 personal + 7 common |
| Self-employed | 12 | **21** | rent, card use + 3 self-employed (no GST) + 7 common |
| Informal | 11 | **20** | rent, card use + 2 informal + 7 common |

The purpose does not change the count on a personal loan, because none of its
purposes are productive.

### Property loan

| Income type | Purpose | Extras | Total |
| --- | --- | --- | --- |
| Salaried | Business expansion | 9 | **18** |
| Salaried | Anything else | 8 | **17** |
| Self-employed | Business expansion | 13 | **22** |
| Self-employed | Anything else | 12 | **21** |
| Informal | Business expansion | 10 | **19** |
| Informal | Anything else | 9 | **18** |

### Gold loan

| Income type | Purpose | Extras | Total |
| --- | --- | --- | --- |
| Salaried | Working capital | 9 | **18** |
| Salaried | Anything else | 8 | **17** |
| Self-employed | Working capital | 12 | **21** |
| Self-employed | Anything else | 11 | **20** |
| Informal | Working capital | 10 | **19** |
| Informal | Anything else | 9 | **18** |

### Two-wheeler loan

| Income type | Purpose | Extras | Total |
| --- | --- | --- | --- |
| Salaried | For work | 9 | **18** |
| Salaried | Personal use | 8 | **17** |
| Self-employed | For work | 12 | **21** |
| Self-employed | Personal use | 11 | **20** |
| Informal | For work | 10 | **19** |
| Informal | Personal use | 9 | **18** |

### Business loan (unsecured)

| Income type | Purpose | Extras | Total |
| --- | --- | --- | --- |
| Salaried | Expansion or vehicle | 9 | **18** |
| Salaried | Refinance | 8 | **17** |
| Self-employed | Expansion or vehicle | 13 | **22** |
| Self-employed | Refinance | 12 | **21** |
| Informal | Expansion or vehicle | 11 | **20** |
| Informal | Refinance | 10 | **19** |

### Home loan

| Income type | Extras | Total |
| --- | --- | --- |
| Salaried | 9 | **18** |
| Self-employed | 12 | **21** |
| Informal | 10 | **19** |

**The longest path is 22 questions** (self-employed, business or property loan,
for expansion). **The shortest is 17.** Only nine are mandatory.

---

## Part 7 — The three sample borrowers

### Priya — personal loan, salaried

**9 must + 12 extras = 21 questions**

`employerType, yearsInCurrentJob, bonusSharePct, monthlyRent,
creditCardUtilisationPct, hadEmiBounceLast12Months, emergencySavingsMonths,
dependentCount, coApplicantMonthlyIncome, monthsLeftOnExistingLoans,
largeExpenseNext6Months, rateAlreadyOfferedPct`

Never asked about an ITR, gold, property or app loans. She is salaried and
buying nothing secured.

### Ravi — business loan, self-employed, expansion

**9 must + 13 extras = 22 questions** — the longest path in the app

`propertyValue, lastItrAnnualIncome, monthlyCashDrawings, businessAgeYears,
isGstRegistered, expectedExtraMonthlyIncome, hadEmiBounceLast12Months,
emergencySavingsMonths, dependentCount, coApplicantMonthlyIncome,
monthsLeftOnExistingLoans, largeExpenseNext6Months, rateAlreadyOfferedPct`

Never asked about an employer type or a bonus. Those questions do not exist for
someone who owns their own shop.

### Anita — personal loan, informal income

**9 must + 11 extras = 20 questions**

`monthlyRent, creditCardUtilisationPct, appLoanOutstanding, goldValue,
hadEmiBounceLast12Months, emergencySavingsMonths, dependentCount,
coApplicantMonthlyIncome, monthsLeftOnExistingLoans, largeExpenseNext6Months,
rateAlreadyOfferedPct`

She gets the two informal questions and no salaried-evidence questions. The gold
question is the one designed to give her an alternative to a 36% app loan.

---

## Part 8 — How to add a question

Five steps. A test fails if you skip any of the first two.

**1.** Add a key to `Answer` in `src/domain/answers/answer-schema.ts`:

```ts
monthlySchoolFees: "monthlySchoolFees",
```

**2.** Add a schema row in the same file, declaring which output it moves:

```ts
{ id: Answer.monthlySchoolFees, label: "School fees", unit: "rupees",
  moves: ["amount", "monthlyPayment"], importance: "medium" },
```

**3.** Add the question to the right file, choosing the axis that fits:

| If it depends on... | Put it in |
| --- | --- |
| The product | `src/interview/questions/by-loan-type/` |
| How they earn | `src/interview/questions/by-income-type/` |
| What the money is for | `src/interview/questions/by-purpose/` |
| Nothing — ask everyone | `src/interview/questions/common-extra-questions.ts` |

```ts
{
  id: "q-school-fees",
  answerId: Answer.monthlySchoolFees,
  stage: "extra",
  inputType: "number",
  unit: "rupees",
  prompt: "How much do you pay in school fees each month?",
  whyItMatters: "School fees are essential spending a lender will not count.",
  showWhen: [
    { answer: Answer.creditScore, wasAnswered: true },
    { answer: Answer.dependentCount, isKnown: true },
  ],
  minValue: 0,
  maxValue: 200_000,
}
```

**4.** Read it in exactly one domain module — for this example,
`src/domain/assessment/existing-obligations.ts`.

**5.** Document the threshold in [RULES.md](RULES.md) and run:

```
npm test
npm run questions
```

The registry test verifies the schema row exists, the id is unique, the choices
have no duplicate ids, and `whyItMatters` is filled in. The UI needs no change
at all — `QuestionInput.tsx` already knows how to draw a rupee field.
