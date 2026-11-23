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
plan: structure, motion rules, assets, checks, and the quality bar); for a
`popout` reel also `docs/sp02/PLAN.md`. For Remotion APIs, load the official
skill `.claude/skills/remotion-best-practices` (project rules win). The
step guides in `docs/guides/` (01 idea … 08 QA) are the detailed rules for
each step below; read the one for the step you are on.

## Phase A: plan (the only stop)

**Director Engine first.** However short the user's prompt is, expand it
yourself into `docs/<id>/production.json` following
`docs/templates/DIRECTOR-TEMPLATE.md` (7 beats; per beat a different camera,
≥ 3 depth layers, ≥ 2 atmosphere elements, key + rim light, physics law for
every moving thing, a handoff object into the next beat, a v3 VO tone, cue
words, SFX per micro-event, assets with tiers). Do not ask the user to fill
these in. Run `npm run direct -- <id>` until it passes; it writes
`docs/<id>/STORYBOARD.md`, which the rest of the plan builds on. Scene `tone`
fields in the episode JSON come from the production script (VO uses
ElevenLabs v3 when `ELEVENLABS_MODEL_ID=eleven_v3`).

Think as the creative director first (roles: `CLAUDE.md`, "Production
roles"). Decide, and write down in the plan, before any copy:

- the viewer, their one problem, and the one promise of the reel;
- the format: `story` (6 scenes, 20–29 s, ink-painting world) or `popout`
  (4 scenes, ~15 s, objects breaking out of the lacquer frame; ask for it
  when the user wants "4D", "3D", "keluar layar" or a short punchy reel);
- the visual idea of every scene in one line, and the one moment per scene
  that should make a viewer stop scrolling.

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
   Validate with `npm run check`. Guides: `01-PLANNING-IDE.md`,
   `02-PLANNING-KONTEN.md`, `03-SCENE-BY-SCENE.md`.
4. Show the user a short summary (topic, hook line, full VO, scene list,
   estimated length, what needs a human) and ask ONE question with
   AskUserQuestion: "Setuju, langsung produksi" / "Revisi dulu". Loop on
   revisions here. Never start Phase B without an explicit yes.

## Phase B: produce (no stops)

After the yes, do not ask between steps. Report progress in one line per
step. Run long commands in the background and wait for them.

1. Build or adapt the scenes. Follow every rule of `docs/PLAN-SP01.md` part 6
   (anime smooth motion) and `docs/guides/07-ANIMASI.md`. New illustration
   components go in `src/components/`, drawn in SVG with brand colors
   (`04-ASET-2D.md`); raster and 3D files go where `06-PENEMPATAN-ASET.md`
   says. 3D is a live React Three Fiber world (`cinema` format with `world`, `05-ASET-3D.md`), never Blender.
2. Visual review loop (`CLAUDE.md`, "Visual review loop"): run
   `npm run review -- <id>`, look at `out/review/<id>_review.jpg` with the image
   reader, open full-size stills (`npm run stills -- <id> <frames> --scale 1`)
   of every text card, break-out moment and transition. Check: text inside
   the safe area, text lands on its word, nothing clipped or overlapping the
   subject, no dead-still frames, transitions read as one continuous move,
   nothing from the previous scene lingering over the next, gold and red stay
   crisp. Fill in the checklist and findings in `out/review/<id>_review.md`
   (full list: `docs/guides/08-QA-HASIL-BERSIH.md`). Fix and review again, at
   most three rounds.
3. Final: `npm run produce -- <id>`. Read `out/qc/<id>_report.md` and look at
   `out/qc/<id>_sheet.jpg`. Fix any problem and resume with `--from <step>`.
   Never report success without having looked at the output.
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
