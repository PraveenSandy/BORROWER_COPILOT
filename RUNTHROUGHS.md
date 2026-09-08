# RUNTHROUGHS.md — real output for three borrowers

Everything below is the actual output of the code, not an illustration.
Reproduce it with:

```
npm run report
```

The three borrowers live in `src/sample-borrowers/` and are used by both the
welcome-screen buttons and the golden tests, so a demo can never drift from
what is verified.

---

## 1. Priya — the two-book gap

**Profile:** 29, Bengaluru, salaried at an MNC. Net income ₹1,10,000. Existing
EMIs ₹14,000 with 24 months left. Rent ₹28,000. Stated essentials ₹28,000.
Credit score 780. Wants **₹8,00,000** for a wedding.

**Path:** 9 must-questions + 12 extras. Personal loan, kept as a personal loan.

| Output | Result |
| --- | --- |
| **O1 Decision** | **Borrow** |
| **O2 Amount** | Lender may offer **₹19,07,518** · Household can carry **₹8,59,225** · **Use ₹8,00,000** |
| **O3 Rate** | Headline **10.5–13.0%** · All-in APR **11.4–13.9%** · Fee 2.0% |
| **O4 EMI ceiling** | **₹18,202** a month over 60 months |
| Stress at −20% income | ₹17,298 left over — **survives** |
| Confidence | Medium |

**Why the amount:**

> A lending desk may go up to ₹19,07,518 using your net monthly salary after
> your existing EMIs. You should not carry more than ₹8,59,225, because that
> number starts from your net monthly salary, keeps rent and essentials of
> ₹38,500 inside your budget, and still survives a 20% drop in income.

**Why the EMI ceiling:**

> Do not agree to more than ₹18,202 a month over 60 months. Even if your income
> drops 20%, your surplus stays at or above zero at this ceiling. Your current
> EMIs still run for about 24 more months — they do not disappear on day one.

**Card walk-away line:**

> If they quote an all-in APR above 13.9%, or an EMI above ₹18,202 a month, walk
> away.

### What this case demonstrates

**The ₹11 lakh gap is her rent.** A bank's income ratio sees ₹41,000 a month of
room; her kitchen sees ₹23,000. Both are correct answers to different questions.

**Note the essentials figure: ₹38,500, not the ₹28,000 she stated.** The floor
in rule R11 raised it to 35% of income. The app is deliberately less optimistic
than she was about her own spending.

**She still gets a "borrow".** Her ask of ₹8,00,000 sits just under her safe
ceiling of ₹8,59,225, so the honest answer is yes. The app is not reflexively
cautious — it is arithmetic.

---

## 2. Priya again — with only the nine must-questions

Same borrower, but she skipped every extra and marked her credit score unknown.
This exists to prove the app still produces all four outputs on the minimum
path.

| Output | Result | Change from the full path |
| --- | --- | --- |
| **O1 Decision** | **Borrow less** | Was borrow |
| **O2 Amount** | Lender **₹18,85,714** · Safe **₹7,69,884** · **Use ₹7,69,884** | Safe amount ₹89,341 lower |
| **O3 Rate** | Headline **11.0–18.0%** · APR **11.9–18.9%** | Band widened from 2.5 to **7.0 points** |
| **O4 EMI ceiling** | **₹19,550** over 60 months | Higher, because no rent was declared |
| Confidence | **Low** | Was medium |

**Why the rate:**

> A fair headline rate is 11.0% to 18.0%. The all-in APR, including the 2.0%
> processing fee, is 11.9% to 18.9%. We are pricing the personal loan you chose.
> Your credit score is unknown, so this is the wide band for the product — not a
> 300 and not a 750.

**Why the confidence:**

> You marked credit score as unknown, so the ranges stay wide on purpose.

### What this case demonstrates

**Answering one question halved her uncertainty.** Telling the app her score was
780 and her employer an MNC moved the band from 11.0–18.0% to 10.5–13.0%. On
₹8,00,000 over 5 years, the difference between 13% and 18% is roughly ₹1,15,000
of interest.

**An unknown score is not punished.** The low end stays at 11.0%. Assuming 300
would frighten a good borrower into a worse product; assuming 750 would set her
up for a rejection.

**The verdict flipped to "borrow less" for an honest reason.** Without the
rent question the safe ceiling fell slightly below her ask, so the app says take
less. It did not soften the answer because the data was thin — it widened the
range and said so.

---

## 3. Ravi — moved to a cheaper product

**Profile:** 42, Mysuru, runs a kirana shop for 14 years. Last ITR ₹4,20,000 a
year. Real cash drawings ₹40,000–₹80,000 a month. Owns an unencumbered shop
worth ₹45,00,000. Wife earns ₹18,000. Credit score unknown. Wants **₹15,00,000**
to expand — and asked for an **unsecured business loan**.

**Path:** 9 must-questions + 13 extras — the longest path in the app.

| Output | Result |
| --- | --- |
| **Product** | Requested **business** → priced **property** |
| **O1 Decision** | **Borrow less** |
| **O2 Amount** | Lender may offer **₹24,36,244** · Household can carry **₹8,50,331** · **Use ₹8,50,331** |
| **O3 Rate** | Headline **10.0–13.5%** · All-in APR **10.2–13.7%** · Fee 1.0% |
| **O4 EMI ceiling** | **₹11,040** a month over 180 months |
| Stress at −20% income | ₹6,040 left over — **survives** |
| Confidence | Low (score unknown) |

**Why the product changed:**

> You have unencumbered property and a productive purpose. A lender is far more
> likely to price a loan against property than an unsecured loan, and at a much
> lower rate.

**Why the amount:**

> A lending desk may go up to ₹24,36,244 using your ITR divided by 12 (a desk
> will not lend on verbal cash) after your existing EMIs. You should not carry
> more than ₹8,50,331, because that number starts from the low end of the cash
> you actually take home, keeps rent and essentials of ₹25,000 inside your
> budget, and still survives a 20% drop in income.

### What this case demonstrates

**The reroute is worth real money.** An unsecured business loan would have been
priced at 14–22%. The property loan is 10.0–13.5%. On ₹8,50,331 that is
thousands of rupees a month.

**Both books are visible and both are honest.** The lender's ₹24,36,244 comes
from his ITR of ₹35,000 a month. His safe ₹8,50,331 comes from his real cash
floor of ₹40,000 plus 70% of his wife's income. The app tells him exactly why
the bank will use the smaller income figure — which is information he can act
on before applying, not after a rejection.

**The 180-month tenure is the point of a secured loan.** The same ₹11,040 EMI
would support only about ₹4,80,000 over a 60-month personal loan.

**His ceiling is the loan-to-value cap, nearly.** 55% of ₹45,00,000 is
₹24,75,000; his income-ratio limit of ₹24,36,244 lands just under it.

---

## 4. Anita — "don't borrow", and it means it

**Profile:** 35, Hubballi, informal income of ₹26,000–₹30,000. Existing EMIs
₹7,000. Owes ₹35,000 on app loans. Essentials ₹18,000. Three dependents. Zero
emergency savings. **An EMI bounce in the last 12 months.** Wants **₹1,50,000**
for a scooter to work with.

**Path:** 9 must-questions + 11 extras.

| Output | Result |
| --- | --- |
| **O1 Decision** | **Don't borrow** |
| **O2 Amount** | Lender might offer ₹48,665 · Household can carry **₹0** · **Use ₹0** |
| **O3 Rate** | Headline **24.0–36.0%** · All-in APR **25.0–37.1%** |
| **O4 EMI ceiling** | **₹0** |
| Stress at −20% income | **−₹8,400** — **breaks before any new loan** |
| Confidence | Low |

**Why the decision:**

> An EMI bounce in the last 12 months plus an unsecured product is a hard stop.
> A desk will rarely sanction it, and you should not add more expensive debt on
> top.

**Why there is no EMI she can take:**

> There is no EMI you can safely add right now. After essentials and the EMIs you
> already pay, a 20% drop in income leaves you short by ₹8,400 before any new
> instalment.

**Card walk-away line:**

> Sign nothing today. If anyone offers a top-up or another app loan on top of
> this, that is exactly the spiral this card exists to stop.

### What this case demonstrates

**Her household budget uses ₹26,000, not ₹28,000 or ₹30,000.** The lender
discounts the ₹28,000 midpoint by 40% down to ₹16,800 because informal income
cannot be verified — but that discount stays on the lender's side of the ledger.
Her own budget runs on the worst month she reported. Applying the bank's doubt to
her groceries would punish the same rupee twice.

**The app finds ₹4,200 a month she was not counting.** Her ₹35,000 of app-loan
balance does not present as a clean EMI, but rule R15 converts it to 12% a
month. That figure is the difference between "she has a little room" and "she
has none":

```
₹26,000 income × 0.8 (stress)   =  ₹20,800
− essentials                       ₹18,000
− existing EMIs                     ₹7,000
− app-loan servicing                ₹4,200
──────────────────────────────────────────
                                   −₹8,400
```

**Two independent rules both say no.** The bounce rule (R24) fires first, but
even without it the no-surplus rule (R25) would refuse. The refusal is not
fragile.

**The card is honest about the alternative.** It quotes her the 24–36% band she
would actually face, so "don't borrow" is not abstract advice — she can see what
the market would charge her.

**And critically, the card does not say "EMI above ₹0 / month".** The
`isDoNotBorrow` flag switches it to "Do not take this loan now" with an
explanation. A refused borrower needs a reason, not a broken-looking number.

---

## What the four cases prove together

| Requirement | Proved by |
| --- | --- |
| Two amounts, and they genuinely differ | Priya — ₹19.07L versus ₹8.59L |
| "Don't borrow" is reachable | Anita |
| The app moves borrowers to better products | Ravi — business → property |
| An unknown score widens rather than punishes | Priya must-only, Ravi |
| Extras visibly tighten the answer | Priya's band: 7.0 points → 2.5 points |
| "I don't know" is never zero | Priya must-only — confidence drops to low |
| Essentials are floored | Priya — ₹28,000 stated becomes ₹38,500 |
| Hidden debt is counted | Anita — ₹35,000 balance becomes ₹4,200 a month |
| Adaptive questions per loan type | 12 / 13 / 11 extras on three different paths |
| The stress test does real work | Anita — −₹8,400 before any new EMI |

---

## Try changing a rule

The fastest way to see the architecture working. Open
`src/domain/rules/rule-book.ts` and change the personal-loan income ratio:

```ts
foirCap: {
  personal: 0.45,   // was 0.5
  ...
}
```

Then:

```
npm run report
```

Priya's lender amount drops from ₹19,07,518 to about ₹17,00,000. No React
component was touched, and the results screen, the negotiation card and the
printed PDF all move together.

Change it back before committing, or update the R4 row in
[RULES.md](RULES.md) to match.
