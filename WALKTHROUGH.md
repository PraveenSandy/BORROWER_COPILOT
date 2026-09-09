# Walkthrough — Borrower Copilot

## What this is

A borrower answers a few questions and gets four things back: should they
borrow at all, how much they can really get (two different numbers, not
one), what a fair interest rate looks like for them, and what monthly EMI
they should actually agree to. All of it gets summarised into a one-page
card they can carry into a branch and use to push back on a bad quote.
Nothing is stored anywhere. No login, no bureau pull. It only knows what
you tell it in that session.

## Taking Priya as an example

She's 29, works at an MNC, takes home ₹1,10,000 a month. She has a car loan
with ₹14,000 EMI and two years left on it, pays ₹28,000 rent, and has a
credit score of 780. She's asking for ₹8,00,000 to cover a wedding.

The app asks her about 9 questions to get a usable answer at all (income,
existing EMIs, purpose, age, credit score and a few more), then a handful
of extra ones that narrow things down further, like card usage and how many
months of savings she has sitting around.

Here's what it tells her:

She should borrow. Her surplus is real and her repayment history is clean.

On amount, a lender would probably sanction her up to around ₹19,07,518
based on her income alone. But that's not what she can actually afford to
carry. Once you subtract her essential spending, knock 15% off because a
wedding is a consumption expense rather than something that pays for
itself, and check she'd survive a 20% income drop, her safe number comes
out closer to ₹8,59,225. Since what she's asking for is under both figures,
the app just tells her to go ahead and ask for the ₹8,00,000.

The rate she should expect is somewhere between 10.5% and 13%, and once you
fold in the processing fee, the real all-in cost works out to about
11.4–13.9%. That number matters because if a lender comes back quoting her
14%, she now has something concrete to argue with.

Her EMI ceiling comes out to ₹18,202 a month over five years, and even if
her income dropped 20% tomorrow, she'd still have about ₹17,298 left over
each month. So the number holds up under some pressure, not just on paper
today.

The reason the lender's number and her own safe number are shown
separately instead of averaged into one figure is because they answer two
different questions. A lender's number tells you what you could get
approved for. It doesn't tell you what you should actually take.

The other two personas behave the same way for different reasons. Ravi
owns his shop outright but has no formal credit history, so instead of
pricing him as an unsecured personal loan, the app reroutes him toward a
loan against that property, since that's what he'd actually qualify for on
better terms. Anita had an EMI bounce last month and is asking for an
unsecured loan on informal income, so the app just says don't borrow right
now, with a safe amount of zero, rather than trying to price around it.

## How it's put together

The code is split into three layers, and each one is only allowed to talk
to the layer below it.

The domain layer holds every rule, threshold and formula. It's plain
TypeScript with no React in it anywhere, which means the whole thing (99
tests across unit tests and the three persona scenarios) runs in under two
seconds without needing a browser at all.

Above that sits the interview layer, which decides what question to ask
next and skips whatever doesn't apply. A salaried employee at an MNC and a
kirana shop owner end up seeing completely different sets of questions.

The UI layer sits on top and just displays whatever the domain layer
already worked out. No screen has a rupee amount or a percentage typed
directly into it.

Every threshold used anywhere in the app, FOIR caps, loan-to-value limits,
age cutoffs, risk premiums, all live in one file called rule-book.ts, and
each one is written up in RULES.md with what it is, what value it uses, and
why. Nothing else in the codebase is allowed to just hardcode a number.

## What I'd build next

Right now if someone skips a question and wants to go back and answer it
later to tighten their range, they have to restart. I'd want that to just
update live instead.

I also kept the loan types to what the three personas actually needed
(personal, property, gold). Education loans and loans against securities
would be the obvious next additions.

And it'd be worth giving people a way to actually save or share the
negotiation card, maybe as an image, so they've got something on their
phone when they're standing in a branch without a laptop open.

## What I'd probably cut

The wide-range mode that kicks in when someone answers very few questions
adds a fair bit of complexity to the amount calculation for something that
isn't the main use case. If I had less time, I'd simplify that down to a
single conservative number with a prompt to answer more questions, instead
of computing and showing a full low-high band on very little information.

## Being upfront about what this isn't

The FOIR caps, spend floors and rate bands in here are my own judgement
calls, not numbers pulled from any specific bank's actual underwriting
policy. RULES.md marks each one honestly as either my judgement or backed
by a real source where I had one. This is meant to help someone reason
about their own situation, not to replace an actual credit decision.
