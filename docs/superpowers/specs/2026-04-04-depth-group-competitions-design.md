# Depth + Group Competitions — Design Spec (Spec B)
**Date:** 2026-04-04
**Deadline:** 2026-04-06
**Status:** Approved for implementation
**Depends on:** Spec A (Polish & Compare) — can be developed in parallel

---

## Problem

The bot already has quiz, streak, and leaderboard — but they are all **individual and global**. There is no reason for a Telegram group to feel invested in the bot. A user answers a quiz, sees their own streak, checks a global leaderboard of strangers.

This spec adds the **social learning layer**:
- Quiz difficulty adapts to the user's level
- Leaderboard becomes local to each group
- Streak becomes a shared group objective

Together these transform the bot from "individual quiz tool in a group" into "community learning tool that the group owns."

---

## Delivery Principle

**Make groups feel like teams, not collections of individuals.**

The features in this spec are designed to be experienced together. Depth makes the quiz educational. Group leaderboard makes it competitive. Group streak makes it collective.

---

## Feature 1 — Depth Field (Our Own Version)

### Overview

Add a `depth` field (1–5) to all 1,001 glossary terms, enabling adaptive quiz difficulty. This is our own implementation, not dependent on any external PR merge.

### Type Definition

**File: `apps/telegram-bot/src/glossary/types.ts`**

```ts
export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: Category;
  related?: string[];
  aliases?: string[];
  depth?: 1 | 2 | 3 | 4 | 5;  // add this field
}
```

`depth` is optional with `?` so existing terms without the field remain valid during migration.

### Semantic Scale

| Level | Label | Audience |
|---|---|---|
| 1 | 🟢 Beginner | Anyone in crypto |
| 2 | 🟢 Basic | Solana user |
| 3 | 🟡 Intermediate | Dev getting started |
| 4 | 🔴 Advanced | Experienced dev |
| 5 | 🔴 Expert | Core protocol / researchers |

### Classification Strategy

**Default depth by category:**

| Category | Default Depth |
|---|---|
| `blockchain-general` | 1 |
| `web3` | 1 |
| `solana-ecosystem` | 2 |
| `token-ecosystem` | 2 |
| `defi` | 2 |
| `ai-ml` | 2 |
| `network` | 3 |
| `core-protocol` | 3 |
| `programming-fundamentals` | 3 |
| `infrastructure` | 3 |
| `dev-tools` | 3 |
| `security` | 3 |
| `programming-model` | 4 |
| `zk-compression` | 4 |

**Manual overrides for key terms:**

| Term ID | Depth | Reason |
|---|---|---|
| `proof-of-history` | 3 | Complex but widely discussed |
| `proof-of-stake` | 2 | Fundamental concept |
| `proof-of-work` | 2 | Widely known |
| `account` | 2 | Entry point for Solana devs |
| `wallet` | 1 | Universal crypto concept |
| `transaction` | 2 | Core user concept |
| `validator` | 2 | Widely known |
| `slot` | 3 | Solana-specific timing |
| `epoch` | 3 | Solana-specific |
| `pda` | 4 | Advanced dev concept |
| `cpi` | 4 | Advanced dev concept |
| `compute-units` | 3 | Important for devs |
| `rent` | 3 | Solana-specific model |
| `anchor` | 3 | Common framework |
| `spl-token` | 3 | Common but technical |
| `amm` | 2 | Core DeFi concept |
| `dex` | 2 | Core DeFi concept |
| `liquidity-pool` | 2 | Core DeFi concept |
| `impermanent-loss` | 3 | Important DeFi risk |
| `zk-proof` | 4 | Advanced cryptography |
| `turbine` | 4 | Protocol internals |
| `tower-bft` | 4 | Protocol internals |
| `gulf-stream` | 4 | Protocol internals |

### Classification Script

**File: `scripts/classify-depth.ts`** (new)

A one-time script that:
1. Reads all term JSON files
2. Applies category defaults
3. Applies manual overrides
4. Writes the `depth` field to each term in place
5. Outputs a summary: `{ depth1: N, depth2: N, depth3: N, depth4: N, depth5: N }`

Run once before deployment: `npx ts-node scripts/classify-depth.ts`

The script is idempotent — re-running it does not change terms that already have `depth` set.

### Glossary Index Update

**File: `apps/telegram-bot/src/glossary/index.ts`**

Export a new function:
```ts
export function getTermsByDepth(
  min: number,
  max: number,
): GlossaryTerm[] {
  return allTerms.filter(
    (t) => t.depth !== undefined && t.depth >= min && t.depth <= max,
  );
}
```

Fallback: if no terms match the depth filter (e.g. field not populated), return all terms. This prevents the quiz from breaking during migration.

### Adaptive Quiz Command

**File: `apps/telegram-bot/src/commands/quiz.ts`**

Parse the command argument:

| Input | Pool |
|---|---|
| `/quiz` (no arg) | all terms |
| `/quiz easy` / `/quiz fácil` / `/quiz fácil` | depth 1–2 |
| `/quiz medium` / `/quiz medio` / `/quiz medio` | depth 3 |
| `/quiz hard` / `/quiz difícil` / `/quiz difícil` | depth 4–5 |
| `/quiz 1` … `/quiz 5` | exact depth level |

If the filtered pool has fewer than 4 terms, fall back to all terms and notify the user once: `⚠️ Not enough terms at that level — showing random.`

**Quiz card with difficulty badge:**

```
🧠 Which term is described below?   🟡 Intermediate

<definition snippet>

A) ...
B) ...
C) ...
D) ...
```

The badge appears inline on the first line of the quiz question. Localized labels per locale (EN/PT/ES).

**New i18n keys:**
- `quiz-difficulty-beginner` = `🟢 Beginner`
- `quiz-difficulty-intermediate` = `🟡 Intermediate`
- `quiz-difficulty-advanced` = `🔴 Advanced`
- `quiz-difficulty-expert` = `🔴 Expert`
- `quiz-difficulty-fallback` = `⚠️ Not enough terms at that level — showing random.`
- `usage-quiz` = `💡 Usage: /quiz · /quiz easy · /quiz medium · /quiz hard`

---

## Feature 2 — Group Leaderboard

### Overview

`/leaderboard` in a group shows the **top members of that group** by max streak — not the global top 10. This creates local competition within each Solana community.

In DM, `/leaderboard` continues to show the global top 10 (existing behavior unchanged).

### DB Changes

**File: `apps/telegram-bot/src/db/index.ts`**

New table — tracks which users have participated in quizzes within each group:

```sql
CREATE TABLE IF NOT EXISTS group_members (
  chat_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  last_seen INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (chat_id, user_id)
);
```

**When to write:** every time a user answers a quiz (correct or wrong) in a group or supergroup chat, upsert their record:
```sql
INSERT OR REPLACE INTO group_members (chat_id, user_id, last_seen)
VALUES (?, ?, unixepoch())
```

**New DB methods:**
```ts
recordGroupMember(chatId: number, userId: number): void

getGroupTop10(chatId: number): {
  user_id: number;
  max_streak: number;
  first_name: string;
}[]

getGroupRank(chatId: number, userId: number): {
  rank: number;
  total: number;
  max_streak: number;
} | null
```

`getGroupTop10` query:
```sql
SELECT s.user_id, s.max_streak, u.first_name
FROM streaks s
JOIN group_members gm ON s.user_id = gm.user_id
LEFT JOIN users u ON s.user_id = u.user_id
WHERE gm.chat_id = ? AND s.max_streak > 0
ORDER BY s.max_streak DESC, s.updated_at ASC
LIMIT 10
```

### Command Behavior

**File: `apps/telegram-bot/src/commands/leaderboard.ts`**

```ts
const isGroup = ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";
const chatId = ctx.chat?.id;

if (isGroup && chatId) {
  // show group leaderboard
} else {
  // show global leaderboard (existing)
}
```

**Group leaderboard UI:**
```
🏆 Top deste grupo

🥇 @alice — 12 dias
🥈 @bob — 9 dias
→ 🥉 Você — 7 dias
4. @charlie — 5 dias
5. @diana — 3 dias

📊 Sua posição: #3 de 8 membros
Faça /quiz para subir no ranking!
```

Arrow `→` marks the current user's row if they appear in the top 10.

If the user is outside the top 10, append their position at the bottom:
```
...
📊 Sua posição: #14 de 22 membros
```

**New i18n keys:**
- `group-leaderboard-title` = `🏆 Top deste grupo`
- `group-leaderboard-empty` = `🏆 Nenhum membro fez quiz ainda. Seja o primeiro!`
- `group-rank-position` = `📊 Sua posição: #{ $rank } de { $total } membros`
- `group-rank-cta` = `Faça /quiz para subir no ranking!`

---

## Feature 3 — Group Streak

### Overview

Groups accumulate a collective streak. When at least **2 unique members** answer a quiz correctly on the same day, the group streak advances. This creates shared accountability — members know that others are counting on them.

### DB Changes

**File: `apps/telegram-bot/src/db/index.ts`**

Two new tables:

```sql
CREATE TABLE IF NOT EXISTS group_streaks (
  chat_id INTEGER PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  last_active_date TEXT,
  last_broken_announcement_date TEXT,
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS group_daily_participants (
  chat_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  PRIMARY KEY (chat_id, user_id, date)
);
```

**Group streak threshold:** 2 unique members with a correct quiz answer on the same calendar day (UTC-3 / America/Sao_Paulo). The threshold is a constant `GROUP_STREAK_THRESHOLD = 2` in `db/index.ts`.

**New DB methods:**
```ts
recordGroupParticipant(chatId: number, userId: number): {
  participantsToday: number;
  alreadyParticipated: boolean;
}

getOrCreateGroupStreak(chatId: number): {
  current_streak: number;
  max_streak: number;
  last_active_date: string | null;
}

incrementGroupStreak(chatId: number): {
  newStreak: number;
  newMax: number;
  isNewRecord: boolean;
  justCrossedThreshold: boolean; // true only when count reaches exactly threshold
}

getGroupDailyParticipants(chatId: number, date: string): number

getGroupStreakCalendar(chatId: number): boolean[] // last 7 days, true = active
```

### Integration with Quiz Answer

**File: `apps/telegram-bot/src/handlers/callbacks.ts`**

When a user answers a quiz **correctly** in a group:

1. `recordGroupMember(chatId, userId)` — upsert membership
2. `recordGroupParticipant(chatId, userId)` — log today's participation
3. `count = getGroupDailyParticipants(chatId, today)`
4. If `count >= GROUP_STREAK_THRESHOLD` AND group streak `last_active_date !== today`:
   - `incrementGroupStreak(chatId)`
   - Send group streak announcement (see below)
5. Existing individual streak logic runs unchanged

### Group Streak Announcements

Sent as a **new message to the group** (not ephemeral) when triggered:

| Event | Message |
|---|---|
| First ever streak (streak = 1) | `🔥 Streak de grupo iniciado! Façam /quiz todo dia para manter.` |
| Streak maintained today (threshold just reached) | `✅ Streak do grupo mantido! { $count } membros participaram hoje.` |
| Milestone: 3 days | `🔥 3 dias seguidos! O grupo está aquecendo.` |
| Milestone: 7 days | `🎉 Uma semana de streak em grupo! Vocês são constantes.` |
| Milestone: 14 days | `🔥 14 dias! Este grupo é imbatível.` |
| Milestone: 30 days | `🏆 30 dias de streak em grupo! Lendários.` |

**Streak broken:** Detected lazily when a new participant triggers the check and `last_active_date` is more than 1 day ago. Send once:
```
💔 O streak do grupo foi perdido. Façam /quiz hoje para reiniciar.
```

Broken streak announcement fires at most **once per day per group** (store `last_broken_announcement_date` in `group_streaks`).

### `/streak` in Group

**File: `apps/telegram-bot/src/commands/streak.ts`**

When called in a group, append the group streak section below the individual streak:

```
🔥 Seu Streak: 5 dias
🏆 Recorde pessoal: 8 dias

---

👥 Streak do Grupo
🔥 Atual: 3 dias seguidos
🏆 Recorde do grupo: 8 dias
👤 Hoje: 1/2 membros participaram

📅 Últimos 7 dias:
✅ ✅ ❌ ✅ ✅ ✅ ✅

Faça /quiz para contribuir!
```

If the user has not participated in any quiz in this group, the group streak section shows "Faça /quiz neste grupo para ver o streak do grupo."

### Combined Quiz Correct Announcement in Group (Updating Spec A)

When a user answers correctly in a group, the public announcement now includes the group streak:

```
✅ @alice acertou! Era Proof of History.
🔥 Streak pessoal: 5 dias  ·  👥 Streak do grupo: 3 dias
```

If the group streak was just advanced by this answer:
```
✅ @alice acertou! Era Proof of History.
🔥 Streak pessoal: 5 dias  ·  👥 Streak do grupo: 3 dias ✅
```

**New i18n keys:**
- `group-streak-message` — full display (individual + group combined)
- `group-streak-started` = `🔥 Streak de grupo iniciado! Façam /quiz todo dia para manter.`
- `group-streak-maintained` = `✅ Streak do grupo mantido! { $count } membros participaram hoje.`
- `group-streak-milestone` = `{ $emoji } { $days } dias de streak em grupo! { $celebration }`
- `group-streak-broken` = `💔 O streak do grupo foi perdido. Façam /quiz hoje para reiniciar.`
- `group-streak-no-participation` = `Faça /quiz neste grupo para ver o streak do grupo.`
- `group-streak-today-progress` = `👤 Hoje: { $count }/{ $threshold } membros participaram`
- `quiz-correct-group-with-streak` = `✅ { $name } acertou! Era <b>{ $term }</b>.\n🔥 Streak pessoal: <b>{ $personal }</b> dias · 👥 Streak do grupo: <b>{ $group }</b> dias`

---

## DB Migration Summary

All new tables are created with `CREATE TABLE IF NOT EXISTS` in `initSchema()`. No destructive migrations. Existing data untouched.

New columns added to `group_streaks` if needed via `PRAGMA table_info` migration pattern (same as existing streak migrations).

---

## Files Changed

| File | Change |
|---|---|
| `apps/telegram-bot/src/glossary/types.ts` | Add `depth?: 1\|2\|3\|4\|5` |
| `apps/telegram-bot/src/glossary/data/terms/*.json` | Populate `depth` field (all 14 files, 1001 terms via script) |
| `apps/telegram-bot/src/glossary/index.ts` | Export `getTermsByDepth(min, max)` |
| `apps/telegram-bot/src/db/index.ts` | 4 new tables + 7 new methods |
| `apps/telegram-bot/src/commands/quiz.ts` | Parse difficulty arg, show badge, use `getTermsByDepth` |
| `apps/telegram-bot/src/commands/leaderboard.ts` | Group-aware routing |
| `apps/telegram-bot/src/commands/streak.ts` | Append group streak section when in group |
| `apps/telegram-bot/src/handlers/callbacks.ts` | Record group membership + participant + group streak logic |
| `scripts/classify-depth.ts` | One-time depth classification script (new) |
| `apps/telegram-bot/src/i18n/locales/en.ftl` | All new keys (depth badges + group competition) |
| `apps/telegram-bot/src/i18n/locales/pt.ftl` | Same in Portuguese |
| `apps/telegram-bot/src/i18n/locales/es.ftl` | Same in Spanish |

---

## Success Criteria

1. `/quiz hard` returns only depth 4–5 terms. If fewer than 4 such terms exist (pre-migration), falls back gracefully.
2. Quiz card shows correct difficulty badge localized in EN/PT/ES.
3. `/leaderboard` in a group shows only members of that group, ordered by max streak.
4. After 2 unique members answer correctly on the same day, the group streak advances and the bot announces it.
5. `/streak` in a group displays both individual and group streak with 7-day calendar.
6. Group streak broken announcement fires at most once per day per group.
7. All features degrade gracefully in DM (no group logic runs outside group/supergroup chats).

---

## Demo Extension (appending to Spec A demo)

After step 9 of the Spec A demo:

10. `/quiz hard` → user gets a depth 4 question with `🔴 Avançado` badge
11. Second group member also answers correctly → `✅ @bob acertou! Streak do grupo: 2 dias ✅`
12. `/streak` in group → shows group streak progress with 7-day calendar
13. `/leaderboard` in group → shows local top 5 with `→` pointing to current user
