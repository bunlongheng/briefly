<div align="center">
  <img src="docs/icon.png" alt="Briefly" width="96" height="96" />
  <h1>Briefly</h1>
  <p><em>Paste any text, hear it read aloud, and follow along word by word, karaoke style</em></p>
  <p><a href="https://briefly-bheng.vercel.app">Live</a> &middot; <a href="https://github.com/bunlongheng/briefly">Repo</a> &middot; <a href="https://bunlongheng.com/projects?name=briefly">Portfolio</a></p>
  <img src="docs/social-preview.png" alt="Briefly - preview" width="820" />
</div>

---

# Briefly

Paste any text, hear it read aloud, and follow along word-by-word - karaoke style, with the caret landing on the exact letter being spoken.

![Briefly reader](docs/screenshots/reader.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-149eca?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)
![Tests](https://img.shields.io/badge/tests-28%20passing-3fb950)
![Vulnerabilities](https://img.shields.io/badge/vulns-0-3fb950)

## Contents

- [Features](#features)
- [Why it feels seamless](#why-it-feels-seamless)
- [Architecture](#architecture)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Project layout](#project-layout)
- [License](#license)

## Features

- Real voice narration (ElevenLabs), warm and natural
- Per-character karaoke highlight synced to the exact audio moment - not a word-length guess
- Click any word to jump straight to it - scrub by meaning, not seconds
- Adjustable speed (0.75x-2x), light + dark themes, keyboard control (space / esc / arrows)
- Long text is chunked on sentence boundaries and stitched back into one seamless track
- Mobile-first, installable (PWA), deep-linkable books (`/?b=<id>&t=<seconds>`)

## Why it feels seamless

The highlight is driven by **real per-character timestamps** from the text-to-speech
engine, not an estimate. At any playback moment the reader binary-searches the timing
array for the active character, so the caret sits on the exact letter being spoken.

![Library](docs/screenshots/library.png)

## Architecture

A thin Next.js app: pure logic lives in `lib/` (and is unit-tested), the React reader
lives in `components/`, and the API route synthesizes audio. Audio and per-character
timing are written under `public/` and served as static files, so the deployed app
needs no writable database - it reads a committed `books.json` manifest.

```mermaid
flowchart LR
    R["Reader (React)<br/>karaoke UI"] -->|POST paste / GET list| A["Next API<br/>/api/books"]
    A -->|with-timestamps| E["ElevenLabs<br/>TTS + char timing"]
    A -->|insert / query| S["SQLite<br/>books (local)"]
    A -->|write mp3 + alignment| P["public/ static<br/>mp3 + json + manifest"]
    R -.->|GET audio + books.json| P
```

| Module | Role |
| --- | --- |
| `lib/karaoke.ts` | playback-time -> active char/word model (tested) |
| `lib/elevenlabs.ts` | TTS synth, sentence chunking, audio + timing stitch |
| `lib/db.ts` / `lib/manifest.ts` | sqlite schema + static manifest export |
| `lib/auth.ts` | local/LAN or bearer-token write gate |
| `components/Reader.tsx` + `KaraokeText.tsx` | reader UI + memoized highlight |
| `app/api/books` | create (synthesize) + list + delete |

## How it works

```mermaid
sequenceDiagram
    participant U as You
    participant API as /api/books
    participant EL as ElevenLabs
    participant FS as public/
    U->>API: paste text
    API->>EL: synthesize (chunked, with-timestamps)
    EL-->>API: audio + per-character times
    API->>FS: write {id}.mp3 + {id}.json
    U->>FS: fetch audio + alignment
    Note over U: charIndexAt(starts, t) -> caret on the exact letter
```

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4**
- **better-sqlite3** for local storage; a static `public/books.json` manifest for serverless
- **ElevenLabs** `with-timestamps` TTS for audio + character alignment
- **Vitest** + **Testing Library** for unit, integration, and component-render tests

## Quick start

```bash
git clone https://github.com/bunlongheng/briefly.git
cd briefly
npm install
cp .env.example .env.local   # add your ELEVENLABS_API_KEY
npm run dev                  # http://localhost:9877
```

Open the app, click **+ add**, paste your text, pick a voice, and hit **add + narrate**.
Briefly generates the audio + word timing and opens the reader.

## Configuration

| Env var | Default | Purpose |
| --- | --- | --- |
| `ELEVENLABS_API_KEY` | - | required for audio + per-character timing |
| `BRIEFLY_VOICE_ID` | Rachel | default narrator voice id |
| `BRIEFLY_TOKEN` | (empty) | bearer token required for remote `POST /api/books`; empty = local/LAN only |
| `NEXT_PUBLIC_SITE_URL` | Vercel URL | canonical site URL for OpenGraph/metadata |

## Project layout

```
app/
  api/books/        create (synthesize) + list + delete
  layout.tsx        theme set pre-paint, metadata, PWA
  page.tsx          library <-> reader shell
components/
  Reader.tsx        audio + rAF caret + transport
  KaraokeText.tsx   memoized per-paragraph highlight
  Menu.tsx          book grid + empty-state pitch
  AddBook.tsx       paste -> narrate modal
lib/
  karaoke.ts        playback-time -> active char/word (tested)
  elevenlabs.ts     TTS synth + chunk/stitch
  db.ts manifest.ts sqlite + static manifest
  auth.ts           write gate
tests/              vitest: unit + integration + render (28)
```

## License

[MIT](LICENSE) (c) Bunlong Heng

---

<p align="center">
  <sub>Built by <a href="https://bunlongheng.com">Bunlong Heng</a> &middot; <a href="https://bunlongheng.com/projects/briefly">See it in my portfolio &rarr;</a></sub>
</p>

---

<div align="center">

<a href="https://bunlongheng.com"><img src="https://img.shields.io/badge/-bunlongheng.com-3A3A3C?style=for-the-badge&amp;labelColor=2A2A2C&amp;logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y%2BmAAADAFBMVEXx8vLq6v%2F19fX09PT8%2Ff309PT5%2BfnAwMBMaXHx8vL19fX5%2Bfny8vL09PT39%2Ff6%2Bfn6%2Bvr09PTx8fH4%2BPn%2F8vLy8%2FP09PTz8%2FPy8vL%2F%2F%2F%2Fz9PTz9PP19fby8vP19PXz8%2FT19%2Fb08%2FTx8vLy8vL09vby8%2FL29vf19fTv8PDz9vb7%2Bvn%2F%2Ff%2F9%2Ff3w8vH29fb%2F%2FP339%2Ff5%2Bfn59%2Ff19PT09PR7rao3VF3%2F%2Fv8AKDR6sqsBV1vv8fL4%2BPiux8b8%2Bvq90NDy8%2FR%2BlpppnZyZqrACLTxclZJSkI9en5ssZ2luqaUAeWgqbW4BX1gCfG0%2Fa3QaVG0MN0UKNUKUpKsGpYMAKjoRQ1UDf3AQRloJqIgEm32d0cUBg3ElbnQIln8eVWgrmIdP0KzF5d5s2acdfHwppJCP5MMXl4Tz8%2FLv8%2FP39%2FiewL5%2BqahYf4IrTFZkk5KlxsREiIYAHiqDnKFmnJowc3IdVllvpKK7zc3D2tnk5%2BmuycdwpKKuub2yv8Ly%2B%2FkAMT7z%2Bvjq7e09gH93q6kGdWpGgoJZmJSlw8M7c3WwyceTw76w1M8mYmpFfX8lW2AFOEpGiYhxqqRrqaRb2rdIsZ8AVE91jpU7d3t3saqBoKhako4AWVEcUlg3aWwDupAHb2YwmIkPP1ERSVA7WmZ8tq8HT14oZW%2BYuLsMl3wQT10ROksENUc8Z3MJSGVLh4dqpJ%2BXr7U51awUgHM4v6ad1MkPuJZAiowVd3IEhnZH0aoYrI05p5sDtYwkzZ8EPViYxsRel5USbHAIgmwIM0gQamzU4uF2malQi4oWQFQ1zaYrp4UXlYwfiHoyxqFE1q4qeX4yn5JIxKkdrX1b1rAbWGvd5Oh91sRijpomsJEVc3Ukc34dqIcwuJVKwZIXkoQZcXlNv5g%2BqZUZvpNl2rPG9N0WkIoNqouW4sVPwp%2BM0b6h0ssfq4d%2F1r8hpo%2Fh9e4AamUjnI9avaBixqgklYWSwL4xtItUxplYl5qZ58mq78wMgnYXfnlOmJaR1L%2Bj78ny9fS%2FrXQPAAAAFXRSTlP7Brvx%2FsJhAgD87r4U72C4uGH8vhRDodYHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC6UlEQVQokS2Sd3BUVRSHb0KS3QRCiZw5t%2By9j33zXjZkyUs2uekhEAi9dwRCL4JUEQRFAQUs9A4WOopKU0GpFoqCBZUivaqoFKkWLIS5GX7%2FfnPO78yZj%2Fj8UTViK6HggvNgSGuluEZRKbZqlN9H%2FFWiWUzIFQK5fhjOIRTDoqv4ia86S4q3KSByHdSqIhxofBKr5iNxLMm2bQqWVkorJ%2BAkO46nkQJhceSRmCTDvKJIJBLJzMxMLU6POJ4eBPF1KpNEbdt2Cms4LCcnZ%2FX6D3d%2BsKJJ7VSlNLoqgbjUtmkKKxlVmpf3bsFXW3d1b77gueJAQIPQBCilkMKemNi23Ts9T35%2FaMe2rsvmTypylGUFCSIYWJLXrm2nUwOPfNO5w%2B73Okxnjqe0JigQEL3JizoeONr%2F2u99vju4fd1rdZnyspQmnGvAUBprWNqz348%2FhXN%2F6P1%2By4Uvs%2FJkpRQRwpJBRVn7vf16Dfitz5XevQqWt3yalXtKaRIUQmglWfsu5y7%2BMrDs0TMftWo1ZVy64xioOVpcIdt8%2Fvqvf9%2F859KJsrLmrzA%2BOKC0IkFEtJza7JOfr%2FYd0P9G98tdOxe0Hp9qJrOIBgDuOeEtp%2F%2B4d%2FvWX%2F%2F9u%2B%2FtlaUTmOWZg7SQEEyuFe52%2BML9O3cZO%2F5xl06zn2VcadOJUqJTzt7a82XfP7sx9vmGNm1m1MstV4IHCVAAoTLqL1372ddn%2Fz%2B2v%2FWq12c1fSpsaeQWAZAANntxzuI3e3zbo8XGpm%2FMnNqiXrh%2BljaPd6UUabkjps19tdGnX2zKb9b4pTFDCzOMLmYtpW5h%2BpCRTeYtyV%2BT36zx808OL4xYGoFrkqDTbJpSXLdRgwbPZL%2BQnT129OOPFVEEsAMJpHKdeKMJgJSAiALdjJANQKnRJI4R6boAKEwLCiGoBBegQjBftQo1KQWOlplFKSV9qGaF1NpAE7QQESTlMSy6pp%2F4%2FFFVYxMNRBTaiM0tkImxNaL8vgfDR8gvoYRaxgAAAABJRU5ErkJggg%3D%3D" alt="bunlongheng.com"></a>
<a href="https://www.linkedin.com/in/bunlongheng/"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
<a href="https://www.instagram.com/ibunlong/"><img src="https://img.shields.io/badge/Instagram-C13584?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram"></a>
<a href="mailto:bheng.code@gmail.com"><img src="https://img.shields.io/badge/Email-2E7D32?style=for-the-badge&logo=gmail&logoColor=white" alt="Email"></a>

<br>

Built by **[Bunlong](https://bunlongheng.com)** &nbsp;&middot;&nbsp; [more apps](https://bunlongheng.com/projects)

</div>
