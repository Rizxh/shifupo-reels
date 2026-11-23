---
name: buat-toon
description: Plan, then produce a Shifu Po Reel in the toon format (2D characters in a 3D world, Shifu Po brand) following docs/toon/FORMULA.md: case story (hook → problem → false hope → feng shui/BaZi principle for laymen → Shifu Po reads → 3 tips → result → CTA "Konsultasi via WhatsApp"). Use when the user asks for a toon / 3D-cartoon Shifu Po reel, "/buat-toon <topik>", or picks a theme from docs/toon/TEMA.md. Other formats (story, popout, cinema, shio, parade, mv) keep using /buat-video.
---

# /buat-toon (Shifu Po)

Talk in casual Bahasa Indonesia with "Anda" on screen and in the VO. Code in English.

Read first:
- `CLAUDE.md` (project rules and the review loop).
- `docs/toon/FORMULA.md`, `docs/toon/TEMA.md`.
- `src/toon/brand.ts`.
- `src/toon/shifu/` (starter story sh00: client office → feng shui studio with the luo pan → studio front with the official logo + CTA).

The approved reference episode of this format is domo-reels EP13 (`C:\Portofolio\domo-reels\src\toon\ac\`): labels, process animations, x-ray, ad CTA.

## Phase A: plan (the only stop)

1. **Topic.** Pick or offer a topic and its premise (the most urgent desire: rezeki, relationship, health of the home).
2. **Script.** Pattern A, 105–130 words, "Anda".
   - False hope is mandatory.
   - Feng shui/BaZi claims are phrased as practice principles; no "dijamin".
   - Only official numbers.
3. **Layman visual plan.**
   - Floor-plan or arrow insert for door, desk and bed directions.
   - Real objects with labels: luo pan, bagua, BaZi element cards.
   - Shifu Po reading as an action.
4. **Files.**
   - `docs/<id>/PLAN.md`.
   - `data/episodes/<id>.json` (`format: "toon"`, `narration.model: "eleven_multilingual_v2"` (the user's choice for the cloned voice), `cta {line, line2, eyebrow, at}`, `claims` with `reviewed: false`).
5. **Approval.** Ask ONE question: "Setuju, langsung produksi" / "Revisi dulu".

## Phase B: produce

1. **Voice.** `npx tsx scripts/toon/voice.ts <id> --all`. It uses this project's `.env`; never read or print it.
2. **Story code.** Copy `src/toon/shifu/` to `src/toon/<story>/`, point `cues.ts` at the episode, and register the composition in `src/toon/entry.tsx`.
3. **Look loop.**
   - Command: `REMOTION_TMP=C:/Portofolio/.remotion-tmp TOON_COMP=<Comp> node scripts/toon/stills.mjs out/look/<id>/vN_ <frames> 0.5`.
   - Run it in a retry loop.
   - Check: medium shots, nothing cut at the frame edge, labels in frame, no empty horizon or set edge, gold keywords, CTA layout.
4. **Audio.** Copy `scripts/toon/_audio-template.ts` to `scripts/toon/<id>-audio.ts` and set the cue words. This project's own `public/audio/sfx/*` (gong, chime, coin, stamp) fit the brand best.
5. **Render.** `node scripts/toon/render.mjs <id> "<Judul>"` in a retry loop.
6. **QA.** `python scripts/toon/qa.py "out/video/<id> - <Judul>.mp4" out/qc/<id>`: pops and whips must be empty, then look at the frame sheet.
7. **Deliver.**

## Never

- Commit unasked.
- Read `.env`.
- Invent numbers, testimonials or client logos.
- Promise guaranteed results.
- Show @handles.
