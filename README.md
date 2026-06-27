# My Financial Calendar

Track your insurance Policies, FDs, RDs, and Mutual Funds in one place — with maturity dates,
upcoming payment reminders, a calendar view, Excel import, and AI-assisted extraction from
uploaded receipts/PDFs.

This is a real web app (not a Claude artifact). It needs to be deployed once, after which you
can open it from any device — phone, laptop, tablet — and your data stays in sync.

---

## What you're setting up

- **Supabase** — free database + login system. This is where your data actually lives.
- **Vercel** — free hosting. This gives the app a real URL you can open and bookmark.
- **GitHub** — free code hosting that connects the two above.
- *(Optional)* **Your own Anthropic API key** — only needed if you want the "upload a receipt/PDF
  and auto-fill the form" feature. Everything else works without it.

Total cost: **₹0**, all on free tiers, unless your usage becomes very heavy.

---

## Step 1 — Create a Supabase project

1. Go to supabase.com and sign up (you can use your Google account).
2. Click **New Project**.
   - Name: anything, e.g. `finance-tracker`
   - Database password: generate one and **save it somewhere** (a password manager is fine) —
     you won't need it day-to-day, but keep it safe.
   - Region: pick one close to you (e.g. Mumbai/Singapore for India).
3. Wait ~2 minutes for the project to spin up.
4. Once it's ready, go to **Project Settings (gear icon) -> API**.
   - Copy the **Project URL** — looks like `https://xxxxx.supabase.co`
   - Copy the **anon public** key — a long string starting with `eyJ...`
   - Keep these two values handy — you'll paste them into Vercel in Step 3.

### Run the database setup script

1. In the Supabase dashboard, go to **SQL Editor** (left sidebar) -> **New Query**.
2. Open the file `supabase/schema.sql` from this project, copy its entire contents, and paste
   it into the query editor.
3. Click **Run**. You should see "Success. No rows returned."
   - This creates your data table, sets up security rules so only you can see your own data,
     and creates a storage folder for uploaded receipts/PDFs.

### Enable email sign-in

1. Go to **Authentication -> Providers** in Supabase.
2. Make sure **Email** is enabled (it usually is by default).
3. Go to **Authentication -> URL Configuration** and add your future Vercel URL once you have it
   (you can come back to this after Step 3) — e.g. `https://your-app.vercel.app/**` under
   "Redirect URLs".

---

## Step 2 — Push this code to GitHub

If you don't already have a GitHub account, create one free at github.com.

From your computer, in this project folder:

```bash
git init
git add .
git commit -m "Initial commit"
```

Then create a new repository on GitHub (click the **+** in the top right -> **New repository**),
name it `finance-tracker`, leave it empty (no README/license), and follow the instructions
GitHub shows you under "...or push an existing repository":

```bash
git remote add origin https://github.com/YOUR-USERNAME/finance-tracker.git
git branch -M main
git push -u origin main
```

---

## Step 3 — Deploy on Vercel

1. Go to vercel.com and sign up using your GitHub account (easiest option).
2. Click **Add New -> Project**, then select the `finance-tracker` repo you just pushed.
3. Before clicking Deploy, expand **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | (the Project URL you copied from Supabase) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (the anon public key you copied from Supabase) |

4. Click **Deploy**. Wait ~2 minutes.
5. You'll get a URL like `https://finance-tracker-yourname.vercel.app` — this is your app's
   permanent address. Bookmark it / add to your phone's home screen.

### Finish linking Supabase + Vercel

Go back to Supabase -> **Authentication -> URL Configuration** and make sure your real Vercel URL
is added under both **Site URL** and **Redirect URLs** (e.g. `https://finance-tracker-yourname.vercel.app/**`).
This lets the sign-in email links work correctly.

---

## Step 4 — Sign in and start using it

1. Open your Vercel URL.
2. Enter your email — you'll get a magic sign-in link (no password to remember).
3. Click the link from your email on the same device, and you're in.
4. Sign in with the **same email** on any other device (phone, laptop) to see the same data.

---

## Optional — Enable receipt/PDF auto-extraction

1. Get an API key from console.anthropic.com -> **API Keys**.
   (Note: this uses paid API credits, separate from any Claude subscription — typically a few
   paise per document, but check current pricing.)
2. In the app, click the **gear/settings icon** -> paste your key -> Save.
3. Now when adding an item, you can upload a PDF or photo of a receipt/policy, and it'll try to
   pre-fill the form. You always get to review and edit before saving.

If you skip this, the app works exactly the same — you just type details in manually or use the
Excel import instead.

---

## Using Excel import

Click **Import Excel** on the main screen, choose your `.xlsx`/`.xls`/`.csv` file, and map your
spreadsheet's columns to the app's fields (Name, Maturity Date, etc.). Rows missing a name or any
date will be skipped automatically so one bad row doesn't break the whole import.

---

## Project structure (for reference)

```
app/                  -> Pages and API routes
  page.tsx             -> Main app entry
  login/               -> Sign-in page
  api/extract-document/ -> AI extraction endpoint
components/           -> All UI pieces (dashboard, list, calendar, modals)
lib/
  supabase/           -> Database client setup
  actions/            -> All create/read/update/delete logic
  excel/              -> Spreadsheet parsing
  types/              -> Shared TypeScript types
supabase/schema.sql   -> Run this once in Supabase's SQL editor
```

## Updating the app later

Any time you want to change something (ask Claude to modify the code), just push the updated
files to the same GitHub repo:

```bash
git add .
git commit -m "Describe your change"
git push
```

Vercel automatically redeploys within a minute or two — no need to repeat the setup steps.
