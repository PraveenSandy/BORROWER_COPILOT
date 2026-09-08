# INSTALL.md — how to install and run Borrower Copilot

Written for someone who has never run a JavaScript project before. Follow the
steps in order and do not skip the checks — each one tells you whether the
previous step worked.

---

## What you are installing, in plain words

This app is a **website that runs on your own laptop**. There is no server, no
database and no login. Three things are involved:

| Thing | What it is | Why you need it |
| --- | --- | --- |
| **Node.js** | A program that runs JavaScript outside a browser | The build tools are written in JavaScript |
| **npm** | Node's package manager, installed with Node | Downloads the libraries this project uses |
| **Vite** | A development server and bundler | Turns the source code into a page your browser can open |

You install Node once. Everything else is downloaded automatically by one
command.

---

## Step 0 — Check what you already have

Open a terminal:

- **Windows** — press `Win`, type `powershell`, press Enter
- **macOS** — press `Cmd + Space`, type `terminal`, press Enter
- **Linux** — `Ctrl + Alt + T`

Type this and press Enter:

```
node --version
```

**If you see a version number of `v18.0.0` or higher** (for example `v24.19.0`),
Node is already installed. Skip to Step 2.

**If you see "command not found" or "not recognized"**, continue to Step 1.

---

## Step 1 — Install Node.js

Pick **one** of the three options below.

### Option A — The normal installer (needs admin rights)

1. Go to <https://nodejs.org>
2. Download the **LTS** version (the left-hand green button). LTS means Long
   Term Support — the stable one.
3. Run the downloaded installer and click Next through every screen. The
   defaults are correct.
4. **Close your terminal completely and open a new one.** This matters: a
   terminal only reads the list of installed programs when it starts, so an old
   terminal will not find Node.
5. Check it worked:

   ```
   node --version
   npm --version
   ```

   Both must print a version number.

### Option B — Portable Node, no admin rights needed (Windows)

Use this if your company laptop blocks installers or shows a User Account
Control prompt you cannot approve. Nothing is installed system-wide; Node lives
in a folder you can delete later.

```powershell
# 1. Create a folder to hold it
mkdir "$HOME\Desktop\Personal\praveen\.node-portable"
cd "$HOME\Desktop\Personal\praveen\.node-portable"

# 2. Download the portable ZIP (about 30 MB)
Invoke-WebRequest -Uri "https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip" -OutFile "node.zip"

# 3. Unzip it
Expand-Archive -Path "node.zip" -DestinationPath "." -Force
Remove-Item "node.zip"

# 4. Check it works
.\node-v24.19.0-win-x64\node.exe --version
```

You should see `v24.19.0`.

**Important:** with portable Node you must add it to your `PATH` in **every new
terminal** before using `npm`. Run this each time you open a terminal:

```powershell
$env:PATH = "$HOME\Desktop\Personal\praveen\.node-portable\node-v24.19.0-win-x64;" + $env:PATH
```

`PATH` is simply the list of folders your terminal searches for programs. This
line puts the portable Node folder at the front of that list, for this terminal
session only.

To avoid retyping it, add the same line to your PowerShell profile:

```powershell
notepad $PROFILE
```

Paste the line, save, close, and open a new terminal.

### Option C — A version manager (macOS and Linux)

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Reload your shell configuration
source ~/.bashrc      # or ~/.zshrc on macOS

# Install and use Node 24
nvm install 24
nvm use 24
node --version
```

---

## Step 2 — Go to the project folder

```powershell
cd "C:\Users\rameshp\Desktop\Personal\praveen\borrower-copilot"
```

On macOS or Linux, use forward slashes:

```bash
cd ~/Desktop/Personal/praveen/borrower-copilot
```

**Check you are in the right place.** This must list `package.json`:

```
ls
```

If you do not see `package.json`, you are in the wrong folder. `package.json` is
the file that tells npm what this project is and what it needs.

---

## Step 3 — Download the libraries

```
npm install
```

**What this does.** npm reads `package.json`, downloads React, Vite, TypeScript,
Vitest and everything those depend on, and puts them in a new folder called
`node_modules`.

**What to expect.** It takes 30 seconds to 3 minutes depending on your internet
connection, and prints something like:

```
added 187 packages in 42s
```

**Warnings are normal.** Messages starting with `npm warn` are safe to ignore.
Only a line starting with `npm ERR!` means something actually failed.

**Check it worked.** A `node_modules` folder now exists:

```
ls node_modules
```

You will see hundreds of folders. That is correct — a modern JavaScript project
has many small dependencies. You never edit anything in there.

---

## Step 4 — Run the tests

Do this **before** starting the app. If the tests pass, the lending logic is
sound and any problem you hit afterwards is in your setup, not the code.

```
npm test
```

Expected output:

```
 ✓ tests/unit/loan-math.test.ts (9 tests)
 ✓ tests/unit/income-books.test.ts (6 tests)
 ✓ tests/unit/existing-obligations.test.ts (7 tests)
 ✓ tests/unit/borrowing-capacity.test.ts (9 tests)
 ✓ tests/unit/borrow-decision.test.ts (6 tests)
 ✓ tests/unit/interest-rate-quote.test.ts (6 tests)
 ✓ tests/unit/loan-product-selector.test.ts (6 tests)
 ✓ tests/unit/confidence-level.test.ts (5 tests)
 ✓ tests/interview/question-registry.test.ts (9 tests)
 ✓ tests/interview/adaptive-question-paths.test.ts (12 tests)
 ✓ tests/personas/priya.test.ts (8 tests)
 ✓ tests/personas/ravi.test.ts (7 tests)
 ✓ tests/personas/anita.test.ts (6 tests)

 Test Files  13 passed (13)
      Tests  96 passed (96)
```

**All 96 must pass.** If any fail, stop and read the failure message before
continuing — the test names describe the banking rule that broke.

---

## Step 5 — Start the app

```
npm run dev
```

You will see:

```
  VITE v6.4.3  ready in 412 ms

  ➜  Local:   http://localhost:5173/
```

Open <http://localhost:5173/> in your browser.

**What "localhost:5173" means.** `localhost` is your own laptop, and `5173` is
the door number Vite is listening on. Nothing leaves your machine, and nobody
else can reach this address.

**To stop the server:** click in the terminal and press `Ctrl + C`.

---

## Step 6 — Verify the app actually works

Do all four checks. Together they prove the adaptive questions, the two-book
split, the product rerouting and the refusal path are all live.

### Check 1 — The questions adapt to the loan type

1. Click **Start**.
2. Choose **Gold loan**. Look at the purposes offered: emergency, working
   capital, personal need, pay off a costlier loan. There is no "wedding".
3. Click **Back**, choose **Personal loan** instead. The purpose list now
   includes "Wedding or ceremony".

That list changed because it is computed from your answer, not hard-coded.

### Check 2 — Priya shows two different amounts

1. Go back to the welcome screen (**Start over** if needed).
2. Click **Priya — salaried, personal loan for a wedding**.
3. You should see:
   - A lender may offer **₹19,07,518**
   - You should use **₹8,00,000**
   - Verdict pill: **Borrow**
   - EMI ceiling **₹18,202** over 60 months

The gap between ₹19 lakh and ₹8 lakh is the entire point of the app. Her rent of
₹28,000 is why.

### Check 3 — Ravi gets moved to a cheaper product

1. Start over, click **Ravi — shop owner, rerouted to a property loan**.
2. Read the reason line: *"You have unencumbered property and a productive
   purpose. A lender is far more likely to price a loan against property than an
   unsecured loan, and at a much lower rate."*
3. His rate band is **10.0–13.5%**, not the 14–22% an unsecured business loan
   would have cost.

### Check 4 — Anita is told not to borrow

1. Start over, click **Anita — informal income, recent bounce**.
2. Verdict: **Don't borrow**. Safe amount: **₹0**.
3. Click **Open negotiation card**. It reads "Do not take this loan now", not
   "EMI above ₹0 / month".
4. Click **Print or save as PDF** to confirm the card prints cleanly.

If all four checks pass, your installation is correct and complete.

---

## Step 7 — Optional: print the full assessments to the terminal

```
npm run report
```

This runs all three sample borrowers through the domain layer and prints every
output, including the explanation sentences. It is how `RUNTHROUGHS.md` is
generated, and it is the fastest way to see the effect of changing a rule.

---

## Every command, in one table

| Command | What it does |
| --- | --- |
| `npm install` | Download the libraries. Run once after copying the project. |
| `npm run dev` | Start the app at `http://localhost:5173/` |
| `npm test` | Run all 96 tests once |
| `npm run test:watch` | Re-run the tests automatically as you edit |
| `npm run typecheck` | Check the TypeScript types without building |
| `npm run build` | Produce the production files in `dist/` |
| `npm run preview` | Serve the built `dist/` folder, to check the build |
| `npm run report` | Print all sample borrower assessments to the terminal |

---

## When something goes wrong

### `npm: command not found` / `'npm' is not recognized`

Node is not installed, or your terminal has not noticed it yet.

- Close every terminal window and open a fresh one.
- If you used portable Node (Option B), you must set `PATH` in this terminal
  before `npm` will work.

### `Cannot find module` or `Failed to resolve import`

`node_modules` is missing or incomplete. This is the usual symptom of copying a
project between laptops with `node_modules` included.

```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

### `Port 5173 is already in use`

Another copy of the dev server is still running.

```
npm run dev -- --port 5174
```

Then open <http://localhost:5174/> instead.

### `EPERM` or `access denied` during `npm install`

Windows antivirus or file indexing is holding a file open.

- Close your editor and any terminal that is inside the project folder.
- Retry `npm install`.
- If it persists, move the project out of a synced folder (OneDrive, Dropbox,
  Google Drive). Sync clients and `node_modules` conflict constantly.

### The browser shows a blank white page

1. Press `F12` to open developer tools and read the **Console** tab.
2. Check the terminal running `npm run dev` for a red error.
3. Confirm the URL is `http://localhost:5173/` and not `https://`. There is no
   certificate, so `https` will fail.

### Tests fail immediately with import errors

You are probably running an old Node version.

```
node --version
```

If it is below `v18`, install a newer one using Step 1.

---

## What to read next

| Document | Answers |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | What does each file and module do? |
| [QUESTIONS.md](QUESTIONS.md) | Which questions are asked for each loan type? |
| [RULES.md](RULES.md) | Where does every number come from? |
| [DEPLOYMENT.md](DEPLOYMENT.md) | How do I copy this to another laptop? |
| [RUNTHROUGHS.md](RUNTHROUGHS.md) | What does the real output look like? |
