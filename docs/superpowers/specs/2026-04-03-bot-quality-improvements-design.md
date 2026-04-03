# Bot Quality Improvements — Design Spec

**Date:** 2026-04-03  
**Scope:** Telegram bot (`apps/telegram-bot`)  
**Status:** Approved

---

## Overview

Three independent improvements to the Solana Glossary Telegram bot:

1. **Category pagination** — paginate term lists with prev/next navigation instead of truncating
2. **Multilingual definitions** — use existing PT/ES translations when rendering term cards
3. **Help message per language** — `/help` shows only commands for the user's chosen language

---

## Item 1 — Category Pagination

### Problem

`getTermsByCategory()` returns 80+ terms for large categories (e.g., DeFi). `formatTermList` truncates at 4000 chars with `…`, silently dropping terms.

### Design

**Page size:** 15 terms per page.

**Entry points** (all route through `sendCategoryTerms`):
- `/categorias` keyboard button click → `handleBrowseCatCallback` → page 1
- `/categoria <name>` command → page 1
- `handleCategoryCallback` (from term card "Ver categoria" button) → page 1
- `handleCatPageCallback` (new) → arbitrary page

**Callback data format:** `cat_page:<category>:<page>` (e.g., `cat_page:defi:2`)

**Navigation keyboard** (rendered below the term list):
- Page 1 of 1: no buttons (single page, no navigation needed)
- Page 1 of N: `Próxima →` only
- Page K of N (middle): `← Anterior` · `Pág K/N` · `Próxima →`
- Page N of N: `← Anterior` only

The center button (`Pág K/N`) is a no-op callback (answers with empty text), used as a label only.

**`sendCategoryTerms` signature change:**
```ts
export async function sendCategoryTerms(
  ctx: MyContext,
  category: Category,
  page = 1
): Promise<void>
```

**New handler:** `handleCatPageCallback` in `src/handlers/callbacks.ts`
```ts
// Parses "cat_page:<category>:<page>" from callback data
// Validates category against VALID_CATEGORIES
// Calls sendCategoryTerms(ctx, category, page)
```

**Bot registration** in `src/bot.ts`:
```ts
bot.callbackQuery(/^cat_page:/, handleCatPageCallback);
```

**i18n keys to add** (all 3 locales):
```
btn-prev = ← Anterior      # pt
btn-next = Próxima →        # pt
btn-page = Pág { $current }/{ $total }
```

**Format change in `sendCategoryTerms`:**
- Compute `totalPages = Math.ceil(terms.length / PAGE_SIZE)`
- Slice `terms` to `terms.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)`
- Build navigation keyboard based on current page and total pages
- Send with `reply_markup` containing the navigation keyboard

---

## Item 2 — Multilingual Definitions

### Problem

`formatTermCard` always uses `term.definition` (English). PT and ES translations already exist at:
- `/data/i18n/pt.json` → `{ [termId]: { term: string, definition: string } }`
- `/data/i18n/es.json` → same shape

These files are never loaded or used by the bot.

### Design

**New export in `@stbr/solana-glossary` package (`src/index.ts`):**
```ts
export function getTermLocalized(
  id: string,
  locale: "pt" | "en" | "es"
): { term: string; definition: string } | undefined
```
- Returns translated `{ term, definition }` if available for the locale
- Falls back to the base `GlossaryTerm` fields (`term.term`, `term.definition`) for `"en"` or missing translations
- Loads `pt.json` / `es.json` at module initialization (same pattern as term JSONs)

**`formatTermCard` signature change:**
```ts
export function formatTermCard(
  term: GlossaryTerm,
  t: MyContext["t"],
  locale?: string
): string
```
- If `locale` is `"pt"` or `"es"`, calls `getTermLocalized(term.id, locale)`
- Uses returned `{ term, definition }` for the card header and body
- Falls back to `term.term` / `term.definition` if no translation found

**All callers of `formatTermCard`** pass `ctx.i18n.locale`:
- `src/commands/daily.ts`
- `src/commands/start.ts` (deep link path)
- `src/handlers/callbacks.ts` (`handleSelectCallback`, `handleRelatedCallback` — term name in header)

**No data changes required.** The translation JSONs already exist.

---

## Item 3 — Help Message Per Language

### Problem

The `help-message` key in each `.ftl` lists all command variants from all three languages, e.g. PT users see `/glossary` and `/glosario` alongside `/glossario`.

### Design

Each locale's `.ftl` file is updated to show **only the commands for that language**.

**`pt.ftl` help section:**
```
🔍 <b>Buscar:</b>
/glossario &lt;termo&gt; — buscar um termo Solana

📂 <b>Explorar:</b>
/categorias — listar as 14 categorias
/categoria &lt;nome&gt; — termos de uma categoria

📅 <b>Aprender:</b>
/termododia — termo do dia

🌐 <b>Idioma:</b>
/idioma pt|en|es — trocar idioma
```

**`en.ftl` help section:**
```
🔍 <b>Search:</b>
/glossary &lt;term&gt; — look up a Solana term

📂 <b>Explore:</b>
/categories — browse 14 categories
/category &lt;name&gt; — terms in a category

📅 <b>Learn:</b>
/termofday — term of the day

🌐 <b>Language:</b>
/language pt|en|es — change language
```

**`es.ftl` help section:**
```
🔍 <b>Buscar:</b>
/glosario &lt;término&gt; — buscar un término Solana

📂 <b>Explorar:</b>
/categorias — listar las 14 categorías
/categoria &lt;nombre&gt; — términos de una categoría

📅 <b>Aprender:</b>
/terminodelhoy — término del día

🌐 <b>Idioma:</b>
/idioma pt|en|es — cambiar idioma
```

The inline mode hint (`💡 tipo @bot_username...`) and bot title/description remain in each locale file, adapted to the language.

---

## Files Changed

| File | Change |
|------|--------|
| `src/index.ts` (package) | Add `getTermLocalized()` export, load pt/es translation JSONs |
| `src/utils/format.ts` | `formatTermCard` accepts optional `locale`, uses `getTermLocalized` |
| `src/commands/categories.ts` | `sendCategoryTerms` accepts `page` param, slices terms, adds nav keyboard |
| `src/handlers/callbacks.ts` | Add `handleCatPageCallback`; pass locale to `formatTermCard` callers |
| `src/commands/daily.ts` | Pass locale to `formatTermCard` |
| `src/commands/start.ts` | Pass locale to `formatTermCard` (deep link path) |
| `src/utils/keyboard.ts` | Add `buildCategoryPageKeyboard(category, page, totalPages, t)` |
| `src/bot.ts` | Register `bot.callbackQuery(/^cat_page:/, handleCatPageCallback)` |
| `src/i18n/locales/pt.ftl` | Add `btn-prev`, `btn-next`, `btn-page`; rewrite `help-message` |
| `src/i18n/locales/en.ftl` | Same |
| `src/i18n/locales/es.ftl` | Same |

---

## Out of Scope

- Examples feature (deferred — requires data sourcing decision)
- Quiz mode
- "Did you mean?" suggestions
