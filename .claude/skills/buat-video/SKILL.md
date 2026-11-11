---
name: buat-video
description: Plan, then produce a Shifu Po (Feng Shui & BaZi) promotional Instagram Reel in smooth 2D animation in this project (shifupo-reels). Use when the user asks to make a video, reel or konten video for Shifu Po ("buat video", "bikin reels", "/buat-video <topik>"), gives a topic for a new episode, or asks to continue producing an approved episode.
---

# /buat-video: plan once, then produce without stopping

The user (often a manager, not a developer) gives a topic. You plan the
reel, get ONE approval, then produce the finished video on your own. Talk to
the user in casual Bahasa Indonesia; on-screen text and VO use "Anda". Code,
comments and commits stay in English (CLAUDE.md).

Before anything else, read `CLAUDE.md` and `docs/PLAN-SP01.md` (the reference
plan: structure, motion rules, assets, checks, and the quality bar).

## Phase A: plan (the only stop)

1. Pick the next free id (`data/episodes/spNN.json`). Topics come from Shifu
   Po's services (website `../shifupo-home-v2`): BaZi, Feng Shui rumah,
   kantor & bisnis, jodoh (peach blossom), garis tangan, Yin Zhai, simbol
   Feng Shui. Use only official numbers (3.000+ klien, 850+ properti, 10+
   tahun, laporan 3–7 hari kerja).
2. Write `docs/<id>/PLAN.md` from `docs/templates/PLAN-TEMPLATE.md`: hook,
   VO lines (20 to 29 s at about 2.05 words per second), on-screen text,
   storyboard per scene with its connecting object (match move), assets with
   their motion, sound, claims to verify, risks.
3. Write `data/episodes/<id>.json`. If the scene types differ from sp01, add
   the new scene schema in `src/schema.ts` and its scene in
   `src/scenes/Scenes.tsx`, reusing the components in `src/components/`.
   Validate with `npm test` and `npx tsc --noEmit`.
4. Show the user a short summary (topic, hook line, full VO, scene list,
   estimated length, what needs a human) and ask ONE question with
   AskUserQuestion: "Setuju, langsung produksi" / "Revisi dulu". Loop on
   revisions here. Never start Phase B without an explicit yes.

## Phase B: produce (no stops)

After the yes, do not ask between steps. Report progress in one line per
step. Run long commands in the background and wait for them.

1. Build or adapt the scenes. Follow every rule of `docs/PLAN-SP01.md` part 6
   (anime smooth motion). New illustration components go in
   `src/components/`, drawn in SVG with brand colors.
2. Draft loop: `npm run produce -- <id> --draft`, then look at
   `out/<id>_draft_sheet.jpg` and full-size stills (`npm run stills -- <id>
   <frames> --scale 1`) of every text card and transition. Check: text inside
   the safe area, text lands on its word, nothing clipped or overlapping the
   subject, no dead-still frames, transitions read as one continuous move,
   gold and red stay crisp. Fix and repeat, at most three rounds.
3. Final: `npm run produce -- <id>`. Read `out/<id>_report.md`. Fix any
   problem and resume with `--from <step>`.
4. Deliver with SendUserFile: final mp4, frame sheet, report. Summarize in
   Indonesian what was made and what still needs a human (claims with
   `reviewed: false`, BGM license, missing assets).

## When you may stop in Phase B

Only for: an asset only the user has (Shifu Po photo, logo, handle), a
missing ElevenLabs key or voice (`.env`), or a check that still fails after
three fixes. Say exactly what is needed, then wait. Without `.env`, finish
the reel without VO and say so instead of stopping.

## Never

- Commit, push or publish without being asked.
- Read or print `.env`.
- Use music, sound or images without a commercial license.
- Recreate another studio's characters or art; all art is original.
- Write episode copy inside components: copy lives only in `data/episodes/<id>.json`.
