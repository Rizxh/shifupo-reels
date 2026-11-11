# Audio licenses

Every music or sound file used in a render is listed here with its source and
license. Only audio whose license allows commercial use is allowed.

## Background music (BGM)

None yet. Add one row per track before it is used:

| File | Title / author | Source | License | Proof of license |
|---|---|---|---|---|

## Sound effects

All files in `public/audio/sfx/` (gong, chime1–4, whoosh, tick, lock, thump,
stamp, coin, pop, shimmer) are synthesized by `scripts/sfx.ts` from
oscillators and seeded noise: original work, no third-party material.
Regenerate with `npm run sfx`; the output is identical on every run.

## Voice over

Generated with ElevenLabs (`npm run tts`). Commercial use needs a paid
ElevenLabs plan: confirm the account's plan before publishing. Files live in
`public/audio/<episode>/` (gitignored).
