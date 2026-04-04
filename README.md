# Solana Glossary Bot

A Telegram-native onboarding and learning companion for Solana communities.

Instead of sending people out to docs or static glossary pages, the bot explains terms inside Telegram, guides users through curated learning paths, and reinforces recall with quizzes, streaks, and daily discovery.

## Problem

Solana communities already live in Telegram, but onboarding still breaks the conversation:

- newcomers see unfamiliar terms in live chats and leave the thread to search elsewhere
- community members repeat the same explanations over and over
- traditional glossaries are useful as references, but weak as in-context learning tools

## Solution

This bot turns the Solana Glossary into a community learning surface:

- `/explain` explains Solana terms from a replied message inside a group
- `/path` delivers guided learning sequences with saved progress
- `/glossary` and free-text DM search provide direct lookup
- `/quiz`, `/termofday`, streaks, favorites, and history create retention loops
- multilingual support in Portuguese, English, and Spanish lowers onboarding friction

## Why Telegram

- that is where Solana communities already talk, ask questions, and onboard users
- terms appear in context during real conversations, not in isolation
- inline replies and reply-based commands make discovery visible to the whole group

## What It Does Today

- Explain Solana terms from replied messages with `/explain` or `/explicar`
- Search directly with `/glossary`, `/glossario`, `/glosario`
- Accept free-text search in DMs
- Browse glossary categories with inline navigation
- Explore guided learning paths with progress tracking
- Run quizzes, streaks, and leaderboard loops
- Save favorites and revisit recent history
- Use inline mode in any Telegram chat
- Show live network context for selected protocol terms
- Show live SOL price context for selected DeFi terms

## Core Flows

### Reply-to-Explain

1. Someone mentions a Solana concept in a group chat.
2. Another user replies with `/explain`.
3. The bot detects up to 3 glossary terms in the replied message.
4. It returns glossary cards with related navigation and live context when relevant.

### Learning Paths

`/path` opens guided learning tracks instead of a flat category dump:

- Solana Basics
- DeFi Foundations
- Builder's Path

Each path saves the user’s current step and can be resumed later.

### Daily Learning

- `/termofday` creates a lightweight daily learning habit
- `/quiz` turns recall into an active loop
- streaks and leaderboard add gentle social motivation

## Live Demo

- Telegram bot: `https://t.me/SolanaGlossaryBot`
- Health endpoint: `https://solana-glossary-production.up.railway.app/`

## Screenshots

### Onboarding

![Start Flow](./Imagens/Come%C3%A7ar.png)
![Choose Language](./Imagens/Choose%20Language.png)
![Start](./Imagens/start.png)

### Search

![Glossary Search](./Imagens/glossario.png)

### Categories

![Category Browser](./Imagens/categorias.png)

### Quiz

![Quiz](./Imagens/quiz.png)

### Favorites

![Favorites](./Imagens/favorites.png)

### Random

![Random](./Imagens/random.png)

### Related

![Related](./Imagens/relacionados.png)

### Term of the Day

![Term of the Day](./Imagens/termododia.png)

### Streak and Leaderboard

![Streak and Leaderboard](./Imagens/streakEleaderboard.png)

## Architecture

Main app path:

- `apps/telegram-bot`

Key modules:

- `apps/telegram-bot/src/bot.ts`
- `apps/telegram-bot/src/server.ts`
- `apps/telegram-bot/src/commands/explain.ts`
- `apps/telegram-bot/src/commands/path.ts`
- `apps/telegram-bot/src/data/paths.ts`
- `apps/telegram-bot/src/utils/search.ts`
- `apps/telegram-bot/src/utils/solana-rpc.ts`
- `apps/telegram-bot/src/utils/coingecko.ts`
- `apps/telegram-bot/src/db/index.ts`

High-level stack:

- TypeScript
- Node.js
- grammY
- @grammyjs/i18n
- Express
- better-sqlite3
- SQLite
- Railway

## Data Layer

The bot is powered by the Solana Glossary dataset vendored into the Telegram app for reliable deployment:

- `data/terms/*.json`
- `apps/telegram-bot/src/glossary/data/`
- `apps/telegram-bot/src/glossary/index.ts`

Localized glossary content is served from:

- `apps/telegram-bot/src/glossary/data/i18n/pt.json`
- `apps/telegram-bot/src/glossary/data/i18n/es.json`

## Commands

### English

- `/start`
- `/glossary <term>`
- `/explain`
- `/path`
- `/random`
- `/categories`
- `/termofday`
- `/quiz`
- `/favorites`
- `/history`
- `/streak`
- `/leaderboard`
- `/rank`
- `/language pt|en|es`
- `/help`

### Portuguese

- `/start`
- `/glossario <termo>`
- `/explicar`
- `/path`
- `/trilha`
- `/aleatorio`
- `/categorias`
- `/termododia`
- `/quiz`
- `/favoritos`
- `/historico`
- `/streak`
- `/leaderboard`
- `/posicao`
- `/idioma pt|en|es`
- `/help`

### Spanish

- `/start`
- `/glosario <término>`
- `/explicar`
- `/path`
- `/aleatorio`
- `/categorias`
- `/terminodelhoy`
- `/quiz`
- `/favoritos`
- `/historial`
- `/streak`
- `/leaderboard`
- `/idioma pt|en|es`
- `/help`

## Local Development

Requirements:

- Node.js 22+
- Telegram bot token from BotFather

Reference env file:

- `apps/telegram-bot/.env.example`

Example:

```env
BOT_TOKEN=your_bot_token
WEBHOOK_DOMAIN=
PORT=3000
```

Run locally:

```bash
cd apps/telegram-bot
npm install
npm run dev
```

Build:

```bash
npm run build
```

Test:

```bash
npm test
```

## Deployment

Recommended Railway setup:

- Root Directory: `apps/telegram-bot`
- Build Command: `npm install && npm run build`
- Start Command: `node dist/server.js`
- Healthcheck Path: `/`

Required environment variables:

```env
BOT_TOKEN=your_telegram_bot_token
WEBHOOK_DOMAIN=https://your-service.up.railway.app
```

## Why This Stands Out

- It explains Solana concepts where community onboarding actually happens
- It combines reference, habit, and progression in a single Telegram-native product
- It supports multilingual onboarding for LATAM and global audiences
- It goes beyond a glossary wrapper by adding contextual explanation, guided paths, and live protocol context

## Repository

- GitHub: `https://github.com/lrafasouza/solana-glossary`
- Bot: `https://t.me/SolanaGlossaryBot`
