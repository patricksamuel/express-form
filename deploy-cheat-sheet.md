# Deploy & Workflow Cheat Sheet

A reference for the VS Code → GitHub → Render workflow and the safe-deploy ritual.

---

## 1. The Big Picture

- **VS Code** = where you write and test code locally.
- **GitHub** = the bridge that stores your code and triggers deploys.
- **Render** = runs your app (the server/instance). Connected to GitHub — **auto-deploys** on push.

```
VS Code (local) ──push──> GitHub (main) ──auto-deploy──> Render (live app)
```

**Key idea:** Code travels left-to-right through a *pipeline*. You push to GitHub; GitHub triggers Render. The push *is* the deploy.

---

## 2. GitHub Is the Bridge

You **never** push code from your laptop straight to the server.

```
Your laptop ──> GitHub ──> Render
```

GitHub sits in the middle. That indirection gives you history, rollback, and a single source of truth.

---

## 3. Production vs. Dev

Two environments, two purposes:

| Environment | Where | Purpose |
|---|---|---|
| Development | Your laptop (`localhost:3000`) | Fast, disposable, break it freely |
| Production | The live Render URL | Real users hit this — keep it stable |

**Config that differs between them** → handled with **environment variables**, never hardcoded.

- Local: a `.env` file (must be **gitignored** so secrets never reach GitHub).
- Production: set the same variables in Render's dashboard.
- Code just reads `process.env.X` and doesn't know which environment it's in.

```js
// Same code, both environments — no hardcoding
const PORT = process.env.PORT || 3000;
```

**Two non-negotiables:**
1. GitHub sits between your laptop and the server.
2. All environment-specific config lives in env vars, not in code.

---

## 4. Render Deploy — First-Time Setup

**Step 1 — Prep code (the two things that break deploys):**

```js
// Use Render's port, never hardcode
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
```

```json
// package.json — must have a start script
"scripts": {
  "start": "node app.js",
  "dev": "node --watch app.js"
}
```
> Replace `app.js` with your real entry file (`index.js`, `server.js`, etc.).

**Step 2 — Create the Render web service:**

- render.com → sign in with GitHub → **New → Web Service**
- Select your repo
- **Branch:** `main`
- **Runtime:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start` (or `node app.js` directly)
- **Instance Type:** Free
- **Create Web Service**

**Step 3 — Visit your app** at `your-app-name.onrender.com`.
> Free tier sleeps after ~15 min idle. First load after sleep takes 30–60s. Normal.

---

## 5. Render Settings Quick Reference

| Setting | What to do |
|---|---|
| **Start Command** | `npm start` *or* `node app.js` — both work (see below) |
| **Pre-Deploy Command** | Leave empty |
| **Auto-Deploy** | `On Commit` — keep it; this is what auto-deploys on push |
| **Deploy Hook** | Ignore — for external triggers, not needed |

### `npm start` vs `node app.js`

They do the **same thing**. `npm start` is just a shortcut that looks up the `"start"` script in `package.json` and runs *that*.

```json
"scripts": { "start": "node app.js" }   // so `npm start` runs `node app.js`
```

- **Missing script: "start"** error → you have no `start` script.
- **Fix A (fastest):** set Render's Start Command directly to `node app.js`.
- **Fix B (cleaner):** add the `start` script to `package.json`, push, keep Start Command as `npm start`.

> The entry filename must match your real file, or you'll get `Cannot find module`.

---

## 6. HTML Structure — Where Things Go

Nothing visible goes *before* `<body>`. The nav bar goes at the **top of** `<body>`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- not visible: metadata, title, CSS links -->
  <meta charset="UTF-8">
  <title>Message Board</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <!-- everything visible lives here -->
  <nav>
    <a href="/">Home</a>
    <a href="/new">New Message</a>
  </nav>

  <h1>Message Board</h1>
  <!-- page content -->
</body>
</html>
```

- `<head>` = metadata, invisible.
- `<body>` = everything users see.
- `<nav>` = top of `<body>` (renders at top because HTML flows top-to-bottom).
- In EJS: put the nav in a shared partial (`views/partials/header.ejs`) so it appears on every page.

---

## 7. The Safe-Deploy Ritual ⭐

Run this for **every** change — features, fixes, styling, all of it.

```bash
git checkout main && git pull origin main   # 1. start fresh off latest main
git checkout -b add-navbar                   # 2. branch (main stays untouched)
   # ...edit in VS Code...                    # 3. make the change
npm run dev                                   # 4. test locally on localhost:3000
git add . && git commit -m "Add navbar"       # 5. commit on the branch
git checkout main && git merge add-navbar     # 6. merge into main
git push origin main                          # 7. push → Render auto-deploys
   # ...verify on live .onrender.com URL...    # 8. confirm it works in prod
git branch -d add-navbar                       # 9. clean up the branch
```

**Mental anchor:** `main` is always deployable. Work happens on branches. You only merge to `main` what you've tested.

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Build fails | Missing dependency, wrong build command | Read build log (Node stack trace) |
| `Missing script: "start"` | No `start` script in `package.json` | Add it, or set Start Command to `node app.js` |
| `Cannot find module` | Start command points at wrong filename | Match the real entry file |
| "No open ports detected" / hangs | Hardcoded port | Use `process.env.PORT` |

**Debugging process:**
1. **On deploy fail** → read the **build logs**, find the stack trace, search the error.
2. **After deploy (error)** → open **application logs**, reload the page, watch in real-time.
3. **Broke after a working deploy** → `git log` to see recent changes, `git checkout` to revert to the last working version.

> Error pages in production are deliberately vague (security + UX). The logs are where the real detail lives.
