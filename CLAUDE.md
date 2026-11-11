# CLAUDE.md: shifupo-reels

Remotion project for **Shifu Po (Feng Shui & BaZi consultant)** promotional Instagram Reels, in smooth 2D "anime-style" animation. The plan for the first reel, and the quality bar for every later one, is `docs/PLAN-SP01.md`. Read it before starting any phase.

## Output spec

- 1080x1920, 30 fps, 15 to 30 seconds, H.264 + AAC, at most 30 MB.
- Every on-screen text stays inside `SAFE_AREA` in `src/lib/brand.ts` (x 64, y 314, w 792, h 1122).

## Hard rules

1. Frame-driven animation only (`useCurrentFrame`, `interpolate`, `spring`, helpers in `src/lib/motion.ts`). Never `Date.now()`, `setTimeout`, CSS animations or transitions, or `Math.random()`. Randomness: `random(seed)` or `@remotion/noise`.
2. "Anime smooth" motion rules in `docs/PLAN-SP01.md` part 6: no linear moves, anticipation and overshoot, follow-through, stagger, never a dead-still frame, at least three parallax depths, ink-wipe plus match-move transitions.
3. No hardcoded scene durations. Durations come from the voice over via `calculateMetadata`; events are tied to cue words, never to seconds.
4. No magic numbers: colors, fonts, sizes, safe zones in `src/lib/brand.ts`; timing in `src/lib/timing.ts`; motion curves in `src/lib/motion.ts`.
5. Content lives in `data/episodes/*.json`, validated by `src/schema.ts` (cues spoken exactly once, numbers match the VO). Components never contain episode copy.
6. Secrets only in `.env` (gitignored). Never read, print or log API keys. Keep `.env.example` updated.
7. Licensing: only commercially licensed BGM, recorded in `public/audio/bgm/LICENSES.md`. Sound effects are synthesized by `npm run sfx`.
8. Brand comes from the Shifu Po website (`../shifupo-home-v2`): ink, paper, gold, seal red; Plus Jakarta Sans, Cinzel, Noto Serif SC; "Anda".

## Brand

- Ink `#12100E`, paper `#F8F4EC`, gold `#C9A45C` / `#9C7A35` / `#F1DDA8`, seal red `#A8161D`.
- Motifs: cream paper, sumi-e mountains, gold luo pan, bamboo, red seals, koi, gold coins, blueprints, lattice corners.
- Shifu Po figure: `public/assets/shifu/shifu.png` (spec in that folder). Until it exists, an ink silhouette stands in.

## Commands

- `npm run studio`: preview in Remotion Studio
- `npm run produce -- sp01 [--draft] [--from <step>]`: whole pipeline (TTS, VO levels, SFX, render, loudness, whisper check) to `out/sp01_final.mp4` plus `out/sp01_report.md` and a frame sheet. Without `.env` it renders without VO on estimated timing.
- `npm run tts -- sp01`, `npm run vo-level -- sp01`, `npm run sfx`, `npm run render -- sp01 [--draft]`, `npm run postprocess -- sp01`
- `npm run stills -- sp01 40 165 385 --scale 1`: full-size frames for checks
- `npm test`, `npm run lint`

## New episodes

Use the `/buat-video` skill (`.claude/skills/buat-video/SKILL.md`): plan with `docs/templates/PLAN-TEMPLATE.md`, get one approval, then produce without stopping. Laptop setup: `docs/setup/SETUP-LAPTOP.md`.

## Language

Code, comments, and commit messages in English. On-screen text and voice over in Bahasa Indonesia with "Anda".
