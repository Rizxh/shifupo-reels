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

## Production roles

Work as a small studio, not as a programmer who stops when the code compiles. For every episode, switch through these roles in order:

| Role | Owns | Output |
|---|---|---|
| Creative director | Audience, one problem, one promise, format (`story` or `popout`), visual direction | Plan parts 1–2 |
| Scriptwriter | VO lines, cue words, on-screen text, claims | `data/episodes/<id>.json` |
| Storyboard artist | Scene actions, connecting objects, camera, sound per beat | Plan part 5 |
| Asset designer | Reuse first; new SVG components; raster/3D only per `docs/guides/04`–`06` | `src/components/`, `public/assets/` |
| Motion developer | Scenes, timing on cue words, transitions | `src/scenes/` |
| Visual QA director | The review loop below | `out/<id>_review.md` filled in |
| Finisher | Final render, loudness, report | `out/<id>_final.mp4`, `out/<id>_report.md` |

Never invent facts, numbers, logos or assets. Use only official numbers and real files.

## Visual review loop (mandatory)

Valid code is not a good video. A render that finishes is not a finished reel.

1. `npm run review -- <id>`: draft render plus `out/<id>_review.jpg`, the frames that matter for every scene (start, wipe middle, every cue word and a beat after it, middle, end), and `out/<id>_review.md` listing them.
2. Look at the sheet with the image reader. Open full-size frames (`npm run stills -- <id> <frame> --scale 1`) for every text card, every break-out moment and every transition.
3. Fill in the checklist and findings in `out/<id>_review.md`; fix the source; run the review again. At most three rounds, then report what still fails.
4. Only then `npm run produce -- <id>`. Read `out/<id>_report.md` and the final frame sheet before saying it is done.

Never claim a render, a fix or a check succeeded without having looked at its output.

## Official Remotion skill

`.claude/skills/remotion-best-practices` is Remotion's official agent skill (router to all sub-skills: markup, timing, transitions, audio, captions, rendering, docs). Load it before using a Remotion API you have not used in this project. Update it with `npm run skills:update`.

Where it differs from this file, this file wins:

- `/buat-video` renders without asking (the user approved autonomous production); the skill's "only render when explicitly asked" applies to ad-hoc requests.
- Keep the motion helpers in `src/lib/motion.ts` and the `transform` strings already in use; do not rewrite working scenes to the skill's Studio-editable style.
- Captions stay the project's own `Caption` component; VO is ElevenLabs, not the skill's defaults.

## Brand

- Ink `#12100E`, paper `#F8F4EC`, gold `#C9A45C` / `#9C7A35` / `#F1DDA8`, seal red `#A8161D`.
- Motifs: cream paper, sumi-e mountains, gold luo pan, bamboo, red seals, koi, gold coins, blueprints, lattice corners.
- Shifu Po figure: `public/assets/shifu/shifu.png` (spec in that folder). Until it exists, an ink silhouette stands in.

## Commands

- `npm run setup`: first-run check (Node, ffmpeg, `.env` filled or not, SFX, Shifu photo); creates `.env` from `.env.example` if missing
- `npm run studio`: preview in Remotion Studio
- `npm run produce -- sp01 [--draft] [--from <step>]`: whole pipeline (TTS, VO levels, SFX, render, loudness, whisper check) to `out/sp01_final.mp4` plus `out/sp01_report.md` and a frame sheet. Without `.env` it renders without VO on estimated timing.
- `npm run tts -- sp01`, `npm run vo-level -- sp01`, `npm run sfx`, `npm run render -- sp01 [--draft]`, `npm run postprocess -- sp01`
- `npm run stills -- sp01 40 165 385 --scale 1`: full-size frames for checks
- `npm run review -- <id> [--no-render]`: draft + scene-aware review sheet and notes (the visual review loop)
- `npm run skills:update`: install/update the official Remotion agent skill
- `npm test`, `npm run lint`, `npm run check` (test + lint + typecheck; must pass before a commit)

## Episode formats

`format` in the episode JSON picks the schema and composition (`FORMATS` in `src/schema.ts`; scripts call `compositionFor`):

- `story` (default, sp01): `Reel`, scenes in `src/scenes/Scenes.tsx`.
- `popout` (sp02): `PopReel`, scenes in `src/scenes/PopScenes.tsx`. A lacquer frame on the plane z = 0 and objects that break out of it. Every position goes through the camera in `src/lib/space.ts`; rules in `docs/sp02/PLAN.md` part 6. Minimum length is enforced by stretching the final hold (`POP_PACING`).
  - Scene order is a rule, not a list: opens with `chart` or `leap`, ends with its only `cta`, 3–5 scenes, each type once.
  - Any popout scene may set `photo` (a real photo inside the window instead of the drawn world); the CTA may set `figure: "none"` when that photo already shows Shifu Po.
  - `brand.logo` (any format) points at the official logo; the popout CTA shows it instead of the typed name.

## Real brand assets

From the brand's own site (`public/assets/2d/common/site/SOURCES.md`): official logo `public/assets/brand/logo-shifupo-red.png`, consultation photos and service cards. Crop per episode into `public/assets/2d/<id>/` (window aspect about 1.45:1). Never use the client logos, client testimonial photos or reels from that site. `tests/assets.test.ts` fails on any episode path that does not exist.

## Guides

Step-by-step guides (Indonesian) in `docs/guides/`; follow the one for the step you are on:

| Step | Guide |
|---|---|
| Idea | `01-PLANNING-IDE.md` |
| Content, episode JSON | `02-PLANNING-KONTEN.md` |
| Scene by scene, adding a scene type | `03-SCENE-BY-SCENE.md` |
| 2D assets | `04-ASET-2D.md` |
| 3D assets (pre-rendered PNG sequences only) | `05-ASET-3D.md` |
| Asset folders and frame placement | `06-PENEMPATAN-ASET.md` |
| Animation | `07-ANIMASI.md` |
| QA, clean and precise result | `08-QA-HASIL-BERSIH.md` |

Asset folders: `public/assets/shifu/`, `brand/`, `2d/common/`, `2d/<id>/`, `3d/<name>/`.

## New episodes

Use the `/buat-video` skill (`.claude/skills/buat-video/SKILL.md`): plan with `docs/templates/PLAN-TEMPLATE.md`, get one approval, then produce without stopping. Laptop setup: `docs/setup/SETUP-LAPTOP.md`.

## Language

Code, comments, and commit messages in English. On-screen text and voice over in Bahasa Indonesia with "Anda".
