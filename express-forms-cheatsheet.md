# Express Forms & Validation — Cheat Sheet

Based on the Odin "Forms and Data Handling" lesson and the bugs we worked through.

---

## 1. GET vs POST — which route does what

The verb signals **intent**, not just "which function":

| Verb | Means | Typical action |
|------|-------|----------------|
| **GET** | "give me something to look at" (read/fetch) | render a page, show a form, show a list |
| **POST** | "here's data, do something" (change state) | save, update, delete |

- GET is safe to repeat / bookmark / refresh — nothing changes.
- POST changes data → not safe to blindly repeat → that's why we redirect after it (PRG, below).

**Why a feature needs two routes (e.g. `/create`):**

```js
router.get("/create", ...)   // SHOW the empty form
router.post("/create", ...)  // RECEIVE the filled-in form
```

Same URL, different verb, different handler. Express routes on **method + URL together**, so they never collide.

---

## 2. The PRG pattern (Post / Redirect / Get)

After a successful POST, **redirect** instead of rendering:

```js
usersStorage.addUser({ firstName, lastName });
res.redirect("/");   // don't render — redirect
```

Why: if you render the result of a POST, hitting **refresh re-sends the POST** → duplicate user. Redirecting to a GET route makes refresh a harmless re-fetch.

---

## 3. The `name` → `req.body` chain (must match exactly)

The HTML `name` attribute becomes the key in `req.body`:

```html
<input name="firstName">   <!-- HTML -->
```
```js
req.body.firstName          // Express
const { firstName } = ...   // your code
```

**Case-sensitive at every link.** `lastName` ≠ `LastName`. A mismatch gives `undefined` silently — no error. (This caused several of our bugs.)

Requires the urlencoded middleware in `app.js`, or `req.body` is always `{}`:

```js
app.use(express.urlencoded({ extended: true }));
```

---

## 4. When to validate — the real rule

**Not** "all POSTs validate." The test is:

> Does the handler read **user-typed form fields** from `req.body`?

| Route | Reads typed fields? | Validate? |
|-------|--------------------|-----------|
| `usersListGet` | no (renders page) | no |
| `usersCreateGet` | no (shows form) | no |
| `usersCreatePost` | **yes** (firstName, lastName) | **yes** |
| `usersUpdateGet` | no (shows form) | no |
| `usersUpdatePost` | **yes** (firstName, lastName) | **yes** |
| `usersDeletePost` | **no** (only `req.params.id`) | **no** |

**Delete is a POST but does NOT validate** — it acts on an id from the URL, not on typed input. That's the counterexample that kills "POST = validate."

---

## 5. The three express-validator imports

```js
const { body, validationResult, matchedData } = require("express-validator");
```

| Function | Role | When |
|----------|------|------|
| `body` | **defines + runs** the rules (the rulebook) | in the chain, runs first |
| `validationResult` | reads **pass/fail** (the verdict) | in the handler |
| `matchedData` | returns the **cleaned** values | in the handler, last |

Order is fixed: rules run → check results → collect clean data. `matchedData` is the *output* of validation, so it can never come first.

---

## 6. The validation chain

```js
const validateUser = [
  body("firstName").trim()
    .isAlpha().withMessage(`First name ${alphaErr}`)
    .isLength({ min: 1, max: 10 }).withMessage(`First name ${lengthErr}`),
  body("lastName").trim()
    .isAlpha().withMessage(`Last name ${alphaErr}`)
    .isLength({ min: 1, max: 10 }).withMessage(`Last name ${lengthErr}`),
];
```

- `body("firstName")` — targets that field; **creates the chain** the methods attach to.
- `.trim()` — **sanitizer** (transforms; runs first so checks judge the cleaned value).
- `.isAlpha()` — **validator** (checks letters-only; pass/fail, no change).
- `.isLength({ min, max })` — **validator** (length bounds).
- `.withMessage(...)` — message for **the check right before it** (so one per validator).

**Validator vs sanitizer:** validator *checks* (no change), sanitizer *transforms*. `.isAlpha`/`.isLength` are validators; `.trim` is a sanitizer.

> Note: `.isAlpha()` etc. only exist **on a chain built by `body()`** — they can't be called on a plain object like `matchedData(req)`.

For the assignment:
- `.optional({ values: "falsy" })` — skip validation when the value is falsy (for optional Age/Bio).
- `.isEmail()` — required, properly-formatted email.
- `.isInt({ min: 18, max: 120 })` — number in range (Age).
- `.isLength({ max: 200 })` — max length (Bio).

---

## 7. The validated controller (array pattern)

```js
exports.usersCreatePost = [
  validateUser,                        // 1st: runs rules, records failures on req
  (req, res) => {                      // 2nd: reads the verdict
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("createUser", {
        title: "Create user",
        errors: errors.array(),
      });
    }
    const { firstName, lastName } = matchedData(req);  // clean values
    usersStorage.addUser({ firstName, lastName });
    res.redirect("/");
  }
];
```

- **Controller is an array** → Express runs items left-to-right: validation, then handler.
- `!errors.isEmpty()` → something failed → **400** + re-render the same form with errors.
- **`return` is essential** — stops execution so bad input doesn't fall through and save.
- **`matchedData(req)` not `req.body`** → saves the trimmed value, not raw input.

---

## 8. `req.body` vs `matchedData(req)`

| | Holds | Use when |
|--|-------|----------|
| `req.body` | **raw** input as typed (`"  John  "`) | no validation chain ran |
| `matchedData(req)` | **cleaned** values after sanitizers (`"John"`) | a validation chain ran |

`.trim()` does **not** mutate `req.body` — it produces a separate cleaned copy that `matchedData` returns. So `req.body` stays raw even after the chain.

**Consistency rule:**
- With a chain → use `matchedData`.
- Without a chain → use `req.body` (the message-board style).
- You can't keep `matchedData` while removing the chain → it returns `{}` → fields become `undefined`.

---

## 9. Escaping & XSS (EJS output tags)

| Tag | Output | Use for |
|-----|--------|---------|
| `<%= value %>` | **escaped** (`<` → `&lt;`) | user data, text — the safe default |
| `<%- value %>` | **unescaped** (raw HTML) | trusted HTML you generated (e.g. `include`) |
| `<% code %>` | runs JS, prints nothing | loops, ifs |

- Unescaped output of user input = **XSS risk** (injected `<script>` runs).
- **Don't `.escape()` on input.** Store raw, escape at **output** with `<%=`. Dangerous chars are only dangerous at the point of use, and differ by context (HTML vs SQL).
- `<%- include("partials/errors.ejs") %>` uses `<%-` on purpose (partial outputs real HTML); inside it, `<%= error.msg %>` uses `<%=` (message is text).

---

## 10. Route parameters (`:id`)

```js
router.get("/:id/update", ...)   // :id is a placeholder
```

- `/3/update` → `req.params.id === "3"` (always a **string**).
- That's how the server knows **which** record to act on.
- Build dynamic form actions / links from it: `action="/<%= user.id %>/update"`.

---

## 11. Singular vs plural storage methods

```js
getUsers()      // returns ALL — Object.values(this.storage)  → for the list
getUser(id)     // returns ONE — this.storage[id]             → for update/edit
```

| Controller | Calls | Why |
|-----------|-------|-----|
| `usersListGet` | `getUsers()` | needs every user (an array) |
| `usersUpdateGet` / `UpdatePost` | `getUser(req.params.id)` | needs one user (an object) |

**Two methods can't share a name** — a duplicate silently overwrites the first. `getUsers` (plural) and `getUser` (singular) must be distinct names so both survive.

---

## 12. Why delete uses a `<form>` but update uses a link

- Update link: `<a href="/x/update">` → fires **GET** → just *shows* the form. Fine.
- Delete: must **change data** → needs **POST** → a plain link can't POST → only a `<form>` can.
- Delete needs **no GET route** (no form to show) and **no validation** (no typed input, just an id).

---

## 13. Gotchas we actually hit

- **`res.render("view"), { title })`** — parenthesis closed too early. The data object must be **inside** the call: `res.render("view", { title })`.
- **`title is not defined`** — controller didn't pass `title`; `<%= title %>` throws on undefined. Pass it in the locals object.
- **`http://update/`** — a link missing its leading `/` and id. Browser reads `update` as a domain. Caused by `user.id` being undefined → `//update`.
- **`Cannot read properties of undefined (reading 'id')`** — `getUser` returned nothing; `user` was undefined in the view.
- **In-memory storage wipes on restart.** `node --watch` restarts on every save → constructor resets `this.storage = {}` → all users gone. Empty list after editing files is expected — just re-create.
- **Duplicate method names / call-site mismatch** — `getUSer` vs `getUser`, `deleteUer` vs `deleteUser`, calling `getUser()` where `getUsers()` was meant. JS never errors — it returns `undefined` or runs the wrong method.

---

## 14. The whole CRUD loop

```
form → (validate) → controller → storage → redirect → render
```

- **Read** (list, show form): GET → render.
- **Create / Update / Delete**: POST → change storage → redirect.
- Validation guards only the POSTs that take **typed input** (create, update).

---

## 15. `variable.method()` — does it mutate?

Depends on the method:

- **Returns a new value (original unchanged):** strings — `.trim()`, `.toUpperCase()`. Must reassign: `name = name.trim()`.
- **Mutates in place:** many arrays — `.sort()`, `.push()`. No reassign needed.

This is why `.trim()` in the chain doesn't change `req.body` — strings are immutable, so it returns a cleaned copy (which `matchedData` collects).
