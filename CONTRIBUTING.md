# Contributing to Briefly

Thanks for your interest. Briefly is small and focused - contributions that keep it
that way are very welcome.

## Setup

```bash
npm install
cp .env.example .env.local   # add ELEVENLABS_API_KEY
npm run dev
```

## Before you open a PR

```bash
npm run typecheck   # tsc --noEmit
npm test            # unit tests
npm run build       # production build
```

All three must pass. A `pre-push` git hook runs typecheck + tests automatically.

## Guidelines

- Keep changes small and focused; match the existing style.
- The karaoke sync (`lib/karaoke.ts`) and text chunking (`lib/elevenlabs.ts`) are the
  core - add a unit test when you touch them.
- No new dependencies without a clear reason.
- Use plain hyphens in text, not em/en dashes.

## Project layout

| Path | What lives there |
| --- | --- |
| `lib/` | pure logic: karaoke sync, TTS, db, auth, manifest |
| `components/` | React UI (reader, menu, add-book) |
| `app/` | Next.js routes + API |
| `tests/` | Vitest unit tests |
