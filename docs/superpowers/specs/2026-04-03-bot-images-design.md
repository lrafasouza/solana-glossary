---
description: Bot visual images - language picker, welcome banner, menu button
discussion: >
  Images hosted on GitHub (raw.githubusercontent.com) for reliability.
  3 touchpoints: language picker, welcome banner, chat menu button.
  All images should be lightweight (<200KB) for fast loading.
---

# Bot Visual Images Design

## Overview
Add visual elements to the Solana Glossary Bot's onboarding experience to increase engagement and brand recognition. Images will be hosted on GitHub and served via raw URLs.

## Image Assets Required

### 1. Language Picker Image (`assets/language-picker.png`)
- **Dimensions:** 1200x400px
- **Format:** PNG with transparency
- **Content:** Trilingual visual showing "Choose your language" concept
  - Flags or icons: 🇧🇷 🇺🇸 🇪🇸
  - World map or globe graphic
  - Brand colors: Solana purple (#512DA8), gradient
- **Usage:** Shown when new user starts bot without language set
- **Alt text:** "Choose your language - Escolha seu idioma - Elige tu idioma"

### 2. Welcome Banner (`assets/welcome-banner.png`)
- **Dimensions:** 1200x600px
- **Format:** PNG
- **Content:** 
  - Solana Glossary Bot logo/wordmark
  - Book/dictionary iconography
  - "1,001 Solana Terms" tagline
  - Brand gradient (purple to cyan)
- **Usage:** Shown after language selection or to returning users on /start
- **Caption:** Localized welcome message from i18n

### 3. Menu Button Icon (Optional enhancement)
- Configured via `setChatMenuButton` API
- Shows "📖 Open Glossary" button in chat
- No image file needed - uses emoji + text

## Implementation Points

### Language Picker Flow (`src/commands/start.ts`)
```
IF no language set:
  1. Send photo: LANGUAGE_PICKER_URL
  2. Caption: "🌐 Choose your language..."
  3. Keyboard: [🇧🇷 Português] [🇺🇸 English] [🇪🇸 Español]
ELSE:
  1. Send photo: WELCOME_BANNER_URL
  2. Caption: ctx.t("start-welcome")
  3. Send follow-up: ctx.t("onboarding-tips")
```

### Welcome Flow (`sendWelcome` function)
```
IF BANNER_URL configured:
  replyWithPhoto(WELCOME_BANNER_URL, { caption: welcome_text })
ELSE:
  reply(welcome_text)
THEN:
  reply(onboarding_tips)
```

### Menu Button (`src/server.ts`)
Add during bot startup:
```typescript
await bot.api.setChatMenuButton({
  menu_button: {
    type: "web_app",
    text: "📖 Open Glossary",
    web_app: { url: "https://solana.com/docs/terminology" }
  }
})
```

## Image Hosting Strategy

**GitHub Repository:** `solana-glossary` (same repo)
**Path:** `apps/telegram-bot/assets/`
**URLs:** `https://raw.githubusercontent.com/solanabr/solana-glossary/main/apps/telegram-bot/assets/{filename}`

### CDN Benefits
- GitHub CDN is fast and reliable
- Versioned with code
- Free, no additional hosting cost
- Easy to update via PR

## Configuration

Add to `src/config.ts`:
```typescript
export const ASSETS_BASE_URL = "https://raw.githubusercontent.com/solanabr/solana-glossary/main/apps/telegram-bot/assets";

export const IMAGES = {
  languagePicker: `${ASSETS_BASE_URL}/language-picker.png`,
  welcomeBanner: `${ASSETS_BASE_URL}/welcome-banner.png`,
} as const;
```

## Fallback Strategy

If images fail to load (404, network error):
- Bot continues with text-only mode
- No blocking errors
- Log warning for monitoring

## Size Constraints

- Max file size: 200KB per image (Telegram recommendation)
- Total assets: <500KB for all images
- Format: PNG-8 or optimized PNG-24

## Accessibility

- All images have descriptive captions
- No critical info only in images
- Text alternatives provided via i18n

## Testing Checklist

- [ ] Language picker shows image + buttons
- [ ] Welcome banner displays with caption
- [ ] Images load quickly (<2s)
- [ ] Fallback works if image 404s
- [ ] All three languages tested
- [ ] Mobile and desktop Telegram tested
