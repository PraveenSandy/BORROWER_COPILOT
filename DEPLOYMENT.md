# DEPLOYMENT.md — running this on another laptop

Three ways to do it, from simplest to most portable. Read Part 1 first — it
explains the one mistake that causes almost every failed copy.

---

## The one rule: never copy `node_modules`

This is the mistake to avoid, so it comes first.

`node_modules` is the folder holding all the downloaded libraries. It contains
**tens of thousands of files, about 200 MB**, and some of them are compiled for
the exact operating system and CPU that downloaded them.

| Copying it | Result |
| --- | --- |
| Windows → Windows | Slow (10+ minutes) and often silently broken |
| Windows → macOS | Fails with cryptic native-module errors |
| Any laptop → any laptop | You could have just run `npm install` in 40 seconds |

**Instead:** copy the source (about 400 KB) and run `npm install` on the new
laptop. npm re-downloads exactly the right versions, because
`package-lock.json` records them precisely.

The same applies to `dist/` (build output — regenerate it) and `.tmp/`
(scratch space).

---

## Part 1 — What to copy (the definitive list)

### Copy these

| Item | Size | Why |
| --- | --- | --- |
| `src/` | ~180 KB | All the application code |
| `tests/` | ~40 KB | All 96 tests |
| `tools/` | ~8 KB | The report scripts |
| `package.json` | 1 KB | **Essential** — tells npm what to download |
| `package-lock.json` | ~200 KB | **Essential** — pins exact versions so the new laptop gets identical libraries |
| `tsconfig.json` | 1 KB | TypeScript settings |
| `vite.config.ts` | 1 KB | Dev server and test settings |
| `index.html` | 1 KB | The single HTML page |
| `.gitignore` | 1 KB | Keeps the next person from copying `node_modules` |
| `README.md` | | Start-here document |
| `RULES.md` | | Every threshold, with examples |
| `ARCHITECTURE.md` | | What each module does |
| `QUESTIONS.md` | | Questions per loan type |
| `INSTALL.md` | | Setup instructions |
| `DEPLOYMENT.md` | | This file |
| `RUNTHROUGHS.md` | | Real sample output |

**Total: under 500 KB.** It fits on any USB stick, in an email, or in a chat
message as a ZIP.

### Do NOT copy these

| Item | Size | Why not |
| --- | --- | --- |
| `node_modules/` | ~200 MB | Regenerate with `npm install`. See the rule above. |
| `dist/` | ~200 KB | Regenerate with `npm run build` |
| `.tmp/` | small | Scratch output from `npm run report` |

---

## Part 2 — Method A: ZIP it (simplest, no tools needed)

### On the old laptop

**Windows PowerShell:**

```powershell
cd "C:\Users\rameshp\Desktop\Personal\praveen"

# Create a clean copy, excluding the three folders that must not travel
$source = "borrower-copilot"
$staging = "borrower-copilot-to-copy"

Remove-Item -Recurse -Force $staging -ErrorAction SilentlyContinue
robocopy $source $staging /E /XD node_modules dist .tmp .git

Compress-Archive -Path $staging -DestinationPath "borrower-copilot.zip" -Force
Remove-Item -Recurse -Force $staging

# Confirm the size — it should be well under 1 MB
Get-Item "borrower-copilot.zip" | Select-Object Name, @{N="MB";E={[math]::Round($_.Length/1MB,2)}}
```

**macOS or Linux:**

```bash
cd ~/Desktop/Personal/praveen

zip -r borrower-copilot.zip borrower-copilot \
  -x "*/node_modules/*" "*/dist/*" "*/.tmp/*" "*/.git/*"

du -h borrower-copilot.zip
```

**If the ZIP is larger than about 2 MB, `node_modules` got in.** Delete it and
retry with the exclusions.

### On the new laptop

```powershell
# 1. Unzip wherever you like
Expand-Archive -Path "$HOME\Downloads\borrower-copilot.zip" -DestinationPath "$HOME\Desktop"
cd "$HOME\Desktop\borrower-copilot"

# 2. Confirm the essentials arrived
ls package.json, package-lock.json, src, tests

# 3. Install Node if it is not already there — see INSTALL.md Step 1
node --version

# 4. Download the libraries
npm install

# 5. Prove it works before trusting it
npm test

# 6. Run it
npm run dev
```

Open <http://localhost:5173/>. Total time: about two minutes, most of it
`npm install`.

---

## Part 3 — Method B: Git (best if you will keep working on it)

Git gives you history, and cloning is a single command on the other side.

### On the old laptop, one time

```powershell
cd "C:\Users\rameshp\Desktop\Personal\praveen\borrower-copilot"

git init
git add .
git commit -m "Borrower Copilot: domain, interview and UI layers with 96 tests"
```

`.gitignore` already excludes `node_modules`, `dist` and `.tmp`, so those cannot
be committed by accident. Verify:

```powershell
git status --short
```

You should see no `node_modules` entries at all.

Then push to a remote — GitHub, GitLab, Azure DevOps or a company server:

```powershell
git remote add origin <your-repository-url>
git push -u origin main
```

### On the new laptop

```powershell
git clone <your-repository-url>
cd borrower-copilot
npm install
npm test
npm run dev
```

### Later, to pick up changes

```powershell
git pull
npm install     # only needed if package.json changed
npm test
```

---

## Part 4 — Method C: a fully self-contained folder (no internet on the target)

Use this for an air-gapped laptop, a demo machine, or a locked-down corporate
device where you cannot install anything or reach npm.

### On a laptop that does have internet

```powershell
cd "C:\Users\rameshp\Desktop\Personal\praveen"
mkdir borrower-copilot-portable
cd borrower-copilot-portable

# 1. Download portable Node (about 30 MB, no installer, no admin rights)
Invoke-WebRequest `
  -Uri "https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip" `
  -OutFile "node.zip"
Expand-Archive -Path "node.zip" -DestinationPath "." -Force
Remove-Item "node.zip"

# 2. Copy the project source
robocopy "..\borrower-copilot" ".\app" /E /XD node_modules dist .tmp .git

# 3. Install the libraries HERE, using the portable Node
$env:PATH = "$PWD\node-v24.19.0-win-x64;" + $env:PATH
cd app
npm install
cd ..
```

Now create a one-click launcher. Save this as `START-APP.bat` in
`borrower-copilot-portable`:

```bat
@echo off
setlocal
set "PATH=%~dp0node-v24.19.0-win-x64;%PATH%"
cd /d "%~dp0app"
echo Starting Borrower Copilot...
echo Open http://localhost:5173/ in your browser.
echo Press Ctrl+C in this window to stop.
echo.
call npm run dev
pause
```

And `RUN-TESTS.bat`:

```bat
@echo off
setlocal
set "PATH=%~dp0node-v24.19.0-win-x64;%PATH%"
cd /d "%~dp0app"
call npm test
pause
```

### The result

```
borrower-copilot-portable/          about 250 MB total
├── node-v24.19.0-win-x64/          portable Node — no installation
├── app/                            the project, with node_modules already inside
├── START-APP.bat                   double-click to run
└── RUN-TESTS.bat                   double-click to verify
```

Copy the whole `borrower-copilot-portable` folder to a USB stick. On the target
laptop, double-click `START-APP.bat`. **No installation, no admin rights, no
internet.**

This is the only situation in which copying `node_modules` is correct — and it
only works because the target is also Windows x64.

---

## Part 5 — Method D: static hosting (share with people who will not run code)

`npm run build` produces a `dist/` folder of plain HTML, CSS and JavaScript. It
needs no Node at runtime, because everything runs in the browser.

```powershell
npm run build
```

You get:

```
dist/index.html                   0.48 kB
dist/assets/index-*.css           3.10 kB
dist/assets/index-*.js          199.51 kB   (62 kB compressed)
```

Under 210 KB. Upload `dist/` to any static host — Netlify, Vercel, GitHub
Pages, Azure Static Web Apps, S3, or a plain internal web server.

To check the build locally before uploading:

```powershell
npm run preview
```

**One caveat.** Vite assumes the app is served from the site root. If you host it
in a subfolder such as `example.com/borrower-copilot/`, add this to
`vite.config.ts`:

```ts
export default defineConfig({
  base: "/borrower-copilot/",
  // ...the rest unchanged
});
```

Then rebuild. Without it you will get a blank page and 404s for the asset files.

**Privacy note:** the app has no backend and stores nothing, so hosting it
publicly does not create a data-protection problem. Every calculation happens in
the visitor's browser and disappears when they close the tab.

---

## Part 6 — Which method to choose

| Your situation | Method |
| --- | --- |
| Just want it running on a second laptop | **A — ZIP** |
| Will keep editing the code | **B — Git** |
| Target laptop has no internet, or you cannot install anything | **C — Portable folder** |
| Sharing with reviewers who will not run commands | **D — Static hosting** |

---

## Part 7 — Verify the copy actually worked

Run all four checks on the new laptop. Anything less and you do not know it
works.

### 1. The tests pass

```
npm test
```

Expect `Test Files 13 passed (13)` and `Tests 96 passed (96)`.

### 2. The types are clean

```
npm run typecheck
```

Expect no output at all. TypeScript prints nothing when it is happy.

### 3. The production build succeeds

```
npm run build
```

Expect `✓ built in ...ms`.

### 4. The app behaves correctly in the browser

```
npm run dev
```

Open <http://localhost:5173/> and confirm:

- **Priya** shows a lender amount of **₹19,07,518** and a recommended amount of
  **₹8,00,000**
- **Ravi** shows *"requested business → priced property"* in the reason line
- **Anita** shows **Don't borrow**, and her card reads "Do not take this loan
  now" rather than an EMI of ₹0

If those three numbers match, the copy is byte-identical in behaviour.

---

## Part 8 — Troubleshooting a copy

### `npm install` fails with network or proxy errors

You are behind a corporate proxy.

```powershell
npm config set proxy http://your-proxy-address:port
npm config set https-proxy http://your-proxy-address:port
npm install
```

If your company runs an internal npm registry:

```powershell
npm config set registry https://your-internal-registry/
```

### `Cannot find module` after copying

`node_modules` came along and is now stale or platform-wrong. Remove it and
start clean:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### `EPERM`, `EBUSY` or `access denied` on Windows

Something is holding the files open.

1. Close your editor and every terminal inside the project folder.
2. Pause OneDrive, Dropbox or Google Drive sync. **Sync clients and
   `node_modules` conflict constantly** — this is the most common cause.
3. If possible, move the project out of the synced folder entirely.

### The tests pass but the browser shows a blank page

1. Press `F12` and read the **Console** tab.
2. Confirm the URL is `http://` and not `https://` — there is no certificate.
3. Try a different port: `npm run dev -- --port 5174`

### The numbers differ from the ones in Part 7

The rules were edited. Compare `src/domain/rules/rule-book.ts` between the two
copies, or run `npm run report` on both and diff the output.

---

## Appendix — the complete folder structure after a correct copy

```
borrower-copilot/
├── src/                    ✓ copied      (~180 KB)
├── tests/                  ✓ copied      (~40 KB)
├── tools/                  ✓ copied      (~8 KB)
├── node_modules/           ✗ regenerated by npm install   (~200 MB)
├── dist/                   ✗ regenerated by npm run build (~210 KB)
├── .tmp/                   ✗ regenerated by npm run report
├── package.json            ✓ copied — ESSENTIAL
├── package-lock.json       ✓ copied — ESSENTIAL
├── tsconfig.json           ✓ copied
├── vite.config.ts          ✓ copied
├── index.html              ✓ copied
├── .gitignore              ✓ copied
├── README.md               ✓ copied
├── RULES.md                ✓ copied
├── ARCHITECTURE.md         ✓ copied
├── QUESTIONS.md            ✓ copied
├── INSTALL.md              ✓ copied
├── DEPLOYMENT.md           ✓ copied
└── RUNTHROUGHS.md          ✓ copied
```
