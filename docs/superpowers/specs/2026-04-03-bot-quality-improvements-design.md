# Bot Quality Improvements — Design Spec

**Date:** 2026-04-03  
**Scope:** Telegram bot (`apps/telegram-bot`)  
**Status:** Approved  
**Storage:** SQLite via `better-sqlite3`

---

## Overview

Comprehensive improvements to the Solana Glossary Telegram bot, organized in four groups:

1. **Already approved (v1):** Category pagination · Multilingual definitions · Help per language
2. **Engagement:** Quiz mode · Random term · Favorites · Daily streak
3. **Discovery:** "Did you mean?" · History · Paginated navigation via edit
4. **UX polish:** External links · Onboarding tutorial · Term feedback · Persistent sessions

**Rule:** Every user-facing string must be translated in `pt.ftl`, `en.ftl`, and `es.ftl`.

---

## Storage Layer — SQLite

### Why SQLite

In-memory sessions are lost on bot restart. Favorites, history, and streak require persistence. SQLite via `better-sqlite3` is embedded (no server), synchronous, and appropriate for a single-process bot.

### Database location

`data/bot.db` (gitignored, created on first run).

### Schema

```sql
CREATE TABLE IF NOT EXISTS users (
  user_id   INTEGER PRIMARY KEY,
  language  TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id   INTEGER NOT NULL,
  term_id   TEXT    NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, term_id)
);

CREATE TABLE IF NOT EXISTS history (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER NOT NULL,
  term_id   TEXT    NOT NULL,
  viewed_at INTEGER DEFAULT (unixepoch())
);
-- Keep only last 10 per user; enforce via DELETE after INSERT

CREATE TABLE IF NOT EXISTS streaks (
  user_id         INTEGER PRIMARY KEY,
  last_daily_date TEXT,   -- ISO date "2026-04-03"
  streak_count    INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quiz_sessions (
  user_id      INTEGER PRIMARY KEY,
  term_id      TEXT    NOT NULL,
  correct_idx  INTEGER NOT NULL,
  options      TEXT    NOT NULL  -- JSON array of 4 term IDs
);
```

### Access layer

New file: `src/db/index.ts` — initializes DB, exports typed query functions:

```ts
export const db = {
  // Users
  getLanguage(userId: number): string | undefined
  setLanguage(userId: number, lang: string): void

  // Favorites
  addFavorite(userId: number, termId: string): void
  removeFavorite(userId: number, termId: string): void
  getFavorites(userId: number): string[]        // returns term IDs
  isFavorite(userId: number, termId: string): boolean

  // History
  addHistory(userId: number, termId: string): void
  getHistory(userId: number): string[]          // last 10 term IDs

  // Streak
  viewDailyTerm(userId: number): { streak: number; isNew: boolean }

  // Quiz
  saveQuizSession(userId: number, termId: string, correctIdx: number, options: string[]): void
  getQuizSession(userId: number): QuizSession | undefined
  clearQuizSession(userId: number): void
}
```

`db` is initialized in `src/server.ts` before the bot starts.

---

## Group 1 — Already Approved (v1)

### 1a. Category Pagination

**Page size:** 15 terms per page.

**`sendCategoryTerms` signature:**
```ts
export async function sendCategoryTerms(
  ctx: MyContext,
  category: Category,
  page = 1,
  editMessage = false  // true when called from a callback → editMessageText
): Promise<void>
```

- `editMessage = true` → use `ctx.editMessageText` (no new message, cleaner UX)
- `editMessage = false` → use `ctx.reply` (first load from command)

**Callback data:** `cat_page:<category>:<page>`

**Navigation keyboard** (via `buildCategoryPageKeyboard` in `keyboard.ts`):
- Only `Próxima →` on first page
- `← Anterior` · `Pág K/N` · `Próxima →` on middle pages
- Only `← Anterior` on last page
- `Pág K/N` is a no-op button used as label

**New handler:** `handleCatPageCallback` — validates category, calls `sendCategoryTerms(..., editMessage: true)`

**i18n keys (all 3 locales):**
```
btn-prev = ← Anterior          # pt
btn-next = Próxima →            # pt
btn-page = Pág { $current }/{ $total }
```

---

### 1b. Multilingual Definitions

**New export in `@stbr/solana-glossary`:**
```ts
export function getTermLocalized(
  id: string,
  locale: "pt" | "en" | "es"
): { term: string; definition: string }
```
Loads `data/i18n/pt.json` and `data/i18n/es.json` at module init. Falls back to English fields.

**`formatTermCard` updated:**
```ts
export function formatTermCard(
  term: GlossaryTerm,
  t: MyContext["t"],
  locale?: string
): string
```
Looks up localized `{ term, definition }` when locale is `"pt"` or `"es"`.

All callers pass `ctx.i18n.locale`.

---

### 1c. Help Per Language

Each `.ftl` shows only its language's commands. No cross-language listing.

**`pt.ftl`:**
```
/glossario &lt;termo&gt; — buscar um termo Solana
/aleatorio — termo aleatório
/termododia — termo do dia
/categorias — ver as 14 categorias
/categoria &lt;nome&gt; — termos de uma categoria
/quiz — iniciar quiz
/favoritos — meus termos salvos
/historico — últimos termos vistos
/idioma pt|en|es — trocar idioma
```

**`en.ftl`:**
```
/glossary &lt;term&gt; — look up a Solana term
/random — random term
/termofday — term of the day
/categories — browse 14 categories
/category &lt;name&gt; — terms in a category
/quiz — start a quiz
/favorites — saved terms
/history — recently viewed terms
/language pt|en|es — change language
```

**`es.ftl`:**
```
/glosario &lt;término&gt; — buscar un término Solana
/aleatorio — término aleatorio
/terminodelhoy — término del día
/categorias — ver las 14 categorías
/categoria &lt;nombre&gt; — términos de una categoría
/quiz — iniciar quiz
/favoritos — mis términos guardados
/historial — términos vistos recientemente
/idioma pt|en|es — cambiar idioma
```

---

## Group 2 — Engagement

### 2a. Random Term (`/aleatorio` / `/random`)

**Distinction from `/termofday`:**
- `/termofday` — date-seeded, same term for **all users** today, community feature
- `/random` — `Math.random()`, different every call, personal discovery

**Command registration:**
```ts
bot.command(["aleatorio", "random"], randomTermCommand);
```

**Implementation (`src/commands/random.ts`):**
```ts
import { allTerms } from "@stbr/solana-glossary";

export async function randomTermCommand(ctx: MyContext): Promise<void> {
  const term = allTerms[Math.floor(Math.random() * allTerms.length)];
  // format card, add to history, reply
}
```

Adds term to user's history. Reuses `formatTermCard` + `buildTermKeyboard`.

**i18n keys:**
```
random-term-header = Termo aleatório     # pt
random-term-header = Random term         # en
random-term-header = Término aleatorio   # es
```

---

### 2b. Quiz Mode (`/quiz`)

**Flow:**
1. User sends `/quiz`
2. Bot picks a random term with a non-empty definition
3. Bot builds 4 options: the correct term name + 3 other terms from the **same category**
4. Shows definition snippet (first 200 chars) + 4 inline buttons labeled A/B/C/D
5. Saves quiz session to SQLite (`quiz_sessions` table)
6. User taps an option → `handleQuizAnswerCallback`
7. If correct: ✅ message + card of the term + streak increment
8. If wrong: ❌ message revealing the correct answer + card

**Callback data:** `quiz_answer:<optionIdx>` (0-3)

**Command registration:**
```ts
bot.command(["quiz"], quizCommand);
bot.callbackQuery(/^quiz_answer:/, handleQuizAnswerCallback);
```

**i18n keys:**
```
quiz-question = 🧠 <b>Qual termo descreve isso?</b>\n\n<i>{ $definition }</i>   # pt
quiz-correct = ✅ <b>Correto!</b> Era <b>{ $term }</b>.                          # pt
quiz-wrong = ❌ <b>Errado.</b> A resposta era <b>{ $term }</b>.                  # pt
quiz-option-a = A) { $term }
quiz-option-b = B) { $term }
quiz-option-c = C) { $term }
quiz-option-d = D) { $term }
quiz-no-session = ❌ Nenhum quiz ativo. Use /quiz para começar.                  # pt

# en
quiz-question = 🧠 <b>Which term is described below?</b>\n\n<i>{ $definition }</i>
quiz-correct = ✅ <b>Correct!</b> It was <b>{ $term }</b>.
quiz-wrong = ❌ <b>Wrong.</b> The answer was <b>{ $term }</b>.
quiz-no-session = ❌ No active quiz. Use /quiz to start.

# es
quiz-question = 🧠 <b>¿Qué término describe esto?</b>\n\n<i>{ $definition }</i>
quiz-correct = ✅ <b>¡Correcto!</b> Era <b>{ $term }</b>.
quiz-wrong = ❌ <b>Incorrecto.</b> La respuesta era <b>{ $term }</b>.
quiz-no-session = ❌ No hay quiz activo. Usa /quiz para comenzar.
```

---

### 2c. Favorites (`/favoritos` / `/favorites`)

**Commands:**
```ts
bot.command(["favoritos", "favorites"], favoritesCommand);    // list
bot.callbackQuery(/^fav_add:/, handleFavAddCallback);
bot.callbackQuery(/^fav_remove:/, handleFavRemoveCallback);
```

**Term card keyboard** updated — `buildTermKeyboard` checks `db.isFavorite(userId, termId)`:
- If not favorited: shows `⭐ Salvar` button (`fav_add:<termId>`)
- If favorited: shows `★ Remover` button (`fav_remove:<termId>`)

When favorite is added/removed: `ctx.answerCallbackQuery()` with inline toast + edit the message keyboard to reflect new state.

**`/favoritos` command:** lists saved terms as inline buttons (same as select keyboard). If empty, shows `favorites-empty` message.

**Limit:** 50 favorites per user (enforced in `db.addFavorite`).

**i18n keys:**
```
btn-fav-add = ⭐ Salvar          # pt
btn-fav-remove = ★ Remover        # pt
favorite-added = ⭐ Salvo!         # pt (callback toast)
favorite-removed = Removido.       # pt (callback toast)
favorites-header = ⭐ <b>Seus favoritos</b> — { $count } termos   # pt
favorites-empty = Você ainda não salvou nenhum termo. Use ⭐ no card de qualquer termo.  # pt

btn-fav-add = ⭐ Save             # en
btn-fav-remove = ★ Remove          # en
favorite-added = ⭐ Saved!          # en
favorite-removed = Removed.         # en
favorites-header = ⭐ <b>Your favorites</b> — { $count } terms
favorites-empty = No saved terms yet. Tap ⭐ on any term card.

btn-fav-add = ⭐ Guardar          # es
btn-fav-remove = ★ Quitar          # es
favorite-added = ⭐ ¡Guardado!     # es
favorite-removed = Quitado.         # es
favorites-header = ⭐ <b>Tus favoritos</b> — { $count } términos
favorites-empty = Aún no tienes términos guardados. Toca ⭐ en cualquier término.
```

---

### 2d. Daily Streak

**Logic:** When user views the daily term (`/termododia`), call `db.viewDailyTerm(userId)`:
- If `last_daily_date` is yesterday → increment streak
- If `last_daily_date` is today → no change (already viewed)
- Otherwise → reset streak to 1

**Display:** Streak badge appended to the daily term header:

```
📅 Termo do dia  🔥 5 dias seguidos
```

**i18n keys:**
```
streak-day = 🔥 { $count } dia seguido       # pt (count = 1)
streak-days = 🔥 { $count } dias seguidos    # pt (count > 1)
streak-first = 🔥 Primeiro dia!              # pt (streak = 1, first time)

streak-day = 🔥 { $count } day streak        # en
streak-days = 🔥 { $count } day streak       # en
streak-first = 🔥 First day!                 # en

streak-day = 🔥 { $count } día seguido       # es
streak-days = 🔥 { $count } días seguidos    # es
streak-first = 🔥 ¡Primer día!               # es
```

---

## Group 3 — Discovery

### 3a. "Você quis dizer?" (Did you mean?)

**When:** `lookupTerm` returns `type: "not_found"`.

**Algorithm:** Compute Levenshtein distance between the query and all term IDs + aliases. Return the closest match if distance ≤ 3.

**Implementation:** New function `findClosest(query: string): GlossaryTerm | undefined` in `src/utils/search.ts`.

**Display:**
```
❌ Nenhum resultado para <b>proog-of-history</b>.

Você quis dizer: <code>proof-of-history</code>?
```
With an inline button `[Sim, mostrar →]` → callback `select:<termId>`.

**i18n keys:**
```
did-you-mean = Você quis dizer: <code>{ $term }</code>?   # pt
btn-did-you-mean = Sim, mostrar →                          # pt

did-you-mean = Did you mean: <code>{ $term }</code>?       # en
btn-did-you-mean = Yes, show →                              # en

did-you-mean = ¿Quisiste decir: <code>{ $term }</code>?   # es
btn-did-you-mean = Sí, mostrar →                            # es
```

---

### 3b. History (`/historico` / `/history` / `/historial`)

**When a term card is shown** (via any path): call `db.addHistory(userId, termId)`. Keeps last 10 entries, oldest deleted automatically.

**Command:**
```ts
bot.command(["historico", "history", "historial"], historyCommand);
```

Shows last 10 terms as inline buttons (same select keyboard). If empty, shows `history-empty`.

**i18n keys:**
```
history-header = 🕐 <b>Últimos termos vistos</b>      # pt
history-empty = Você ainda não consultou nenhum termo.  # pt

history-header = 🕐 <b>Recently viewed</b>             # en
history-empty = You haven't looked up any terms yet.    # en

history-header = 🕐 <b>Vistos recientemente</b>        # es
history-empty = Aún no has consultado ningún término.   # es
```

---

### 3c. External Links in Term Card

Add a `🔗 Ver mais` section at the bottom of each term card with links to:
- Solana Docs search: `https://solana.com/docs` (generic, no per-term URL available)
- Solana FM: `https://solana.fm` (for infrastructure/network terms)

**Implementation:** `formatTermCard` appends a plain-text line with HTML anchor tags when `term.category` is one of `["core-protocol", "infrastructure", "network", "defi"]`.

Since Telegram HTML mode doesn't support arbitrary `<a>` tags in messages (only inline URLs via `parse_mode: "HTML"` with `<a href="...">text</a>`), this renders as a clickable link inside the message body.

**i18n keys:**
```
term-read-more = 🔗 <a href="{ $url }">Ver na documentação Solana</a>   # pt
term-read-more = 🔗 <a href="{ $url }">Read Solana docs</a>              # en
term-read-more = 🔗 <a href="{ $url }">Ver documentación Solana</a>      # es
```

---

## Group 4 — UX Polish

### 4a. Onboarding Tutorial (3 steps after language selection)

After `sendWelcome`, send one additional message showing the 3 most useful features:

```
💡 Dicas rápidas:

🔍 Busque qualquer termo: /glossario proof-of-history
📂 Explore por categoria: /categorias
🧠 Teste seus conhecimentos: /quiz
```

Sent as a single message immediately after the welcome. No keyboard. No inline buttons.

**i18n keys:**
```
onboarding-tips =
    💡 <b>Dicas rápidas:</b>

    🔍 Busque qualquer termo: <code>/glossario proof-of-history</code>
    📂 Explore por categoria: /categorias
    🧠 Teste seus conhecimentos: /quiz    # pt

onboarding-tips =
    💡 <b>Quick tips:</b>

    🔍 Look up any term: <code>/glossary proof-of-history</code>
    📂 Browse by category: /categories
    🧠 Test your knowledge: /quiz         # en

onboarding-tips =
    💡 <b>Consejos rápidos:</b>

    🔍 Busca cualquier término: <code>/glosario proof-of-history</code>
    📂 Explora por categoría: /categorias
    🧠 Pon a prueba tus conocimientos: /quiz   # es
```

---

### 4b. Term Feedback (👍 / 👎)

Add two buttons at the bottom of every term card keyboard (second row after share):

```
[🔍 Relacionados] [📂 Ver categoria]
[📤 Compartilhar]
[👍] [👎]
```

When tapped: `ctx.answerCallbackQuery({ text: t("feedback-thanks") })` — no storage needed. Simple signal.

**Callback data:** `feedback:<termId>:up` / `feedback:<termId>:down`

**i18n keys:**
```
btn-feedback-up = 👍
btn-feedback-down = 👎
feedback-thanks = Obrigado pelo feedback!   # pt
feedback-thanks = Thanks for your feedback! # en
feedback-thanks = ¡Gracias por tu opinión!  # es
```

---

## Files Changed (Complete List)

### New files
| File | Purpose |
|------|---------|
| `src/db/index.ts` | SQLite access layer (better-sqlite3) |
| `src/db/schema.sql` | SQL schema (reference only) |
| `src/commands/random.ts` | `/random` command |
| `src/commands/quiz.ts` | `/quiz` command |
| `src/commands/favorites.ts` | `/favoritos` command |
| `src/commands/history.ts` | `/historico` command |

### Modified files
| File | Change |
|------|--------|
| `src/index.ts` (package) | `getTermLocalized()`, load pt/es JSONs |
| `src/utils/format.ts` | `formatTermCard` with locale + external links |
| `src/utils/search.ts` | `findClosest()` for "did you mean" |
| `src/utils/keyboard.ts` | `buildTermKeyboard` with fav + feedback buttons; `buildCategoryPageKeyboard` |
| `src/commands/categories.ts` | `sendCategoryTerms(ctx, category, page, editMessage)` |
| `src/commands/start.ts` | Send onboarding tips after welcome |
| `src/commands/daily.ts` | Call `db.viewDailyTerm`, show streak badge |
| `src/handlers/callbacks.ts` | `handleCatPageCallback`, `handleFavAddCallback`, `handleFavRemoveCallback`, `handleQuizAnswerCallback`, `handleFeedbackCallback`, `handleBrowseCatCallback` + validation |
| `src/bot.ts` | Register all new commands + callbacks; init DB |
| `src/server.ts` | Init SQLite DB before bot starts |
| `src/i18n/locales/pt.ftl` | All new keys |
| `src/i18n/locales/en.ftl` | All new keys |
| `src/i18n/locales/es.ftl` | All new keys |

---

## Command Registration Summary

```ts
bot.command(["aleatorio", "random"], randomTermCommand);
bot.command(["quiz"], quizCommand);
bot.command(["favoritos", "favorites"], favoritesCommand);
bot.command(["historico", "history", "historial"], historyCommand);

bot.callbackQuery(/^cat_page:/, handleCatPageCallback);
bot.callbackQuery(/^fav_add:/, handleFavAddCallback);
bot.callbackQuery(/^fav_remove:/, handleFavRemoveCallback);
bot.callbackQuery(/^quiz_answer:/, handleQuizAnswerCallback);
bot.callbackQuery(/^feedback:/, handleFeedbackCallback);
```

---

## Out of Scope

- Examples (deferred — AI API decision pending)
- Quiz leaderboard (requires user display names, privacy considerations)
- Group/channel mode (daily term in groups — future phase)
- Term comparison side-by-side
- Difficulty level badges (requires data changes across all 1001 terms)
