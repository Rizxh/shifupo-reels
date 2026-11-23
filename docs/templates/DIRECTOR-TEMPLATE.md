# Template: Director Engine (prompt singkat → naskah produksi)

Dipakai di `/buat-video` **sebelum** menulis episode JSON. Hasilnya `docs/<id>/production.json`, divalidasi `npm run direct -- <id>` (skema: `src/core/director/schema.ts`). Contoh lengkap: `docs/sp04/production.json`.

Prompt user boleh satu kalimat. Tugas sutradara adalah mengisi semua yang tidak disebut user dengan keputusan terbaik, bukan bertanya.

## 1. Dari prompt ke brief

| Isi | Pertanyaan yang dijawab sendiri |
|---|---|
| `viewer` | Siapa yang menonton dan berhenti scroll? |
| `problem` | Rasa sakit/penasaran apa yang mereka kenali dalam 1 detik? |
| `promise` | Apa yang mereka bawa pulang? |
| `format` | `story` (2D tinta), `popout` (bingkai lak), atau cinematic 3D (render Blender) |

## 2. Rumus 7 beat

`hook → context → cause → effect → fix → payoff → cta` (minimal hook, cause, fix, cta; 5–8 beat).

- **Hook** ≤ 8 kata, sudah bergerak di frame 0 (kamera atau benda), tanpa jualan.
- Satu ide per beat; teks layar merangkum, tidak menyalin VO.
- Total durasi 20–29 s (≈ 2,05 kata/detik).

## 3. Isi wajib setiap beat (anti-polos)

| Field | Aturan | Contoh |
|---|---|---|
| `shot.camera` | Beda dari beat sebelumnya; ≥ 3 jenis per video | crane-down → dolly-in → orbit → push-in → low-angle → pull-back → crane-up |
| `shot.secondary` | Gerak sekunder yang menjaga diam tetap hidup | awan bergeser, lampu berkedip, kain berayun |
| `environment.layers` | ≥ 3 lapis kedalaman | langit, gedung, air, awan depan kamera |
| `environment.atmosphere` | ≥ 2 dari: clouds, fog, haze, light-rays, particles, bokeh, dust, petals, rain, sparks, steam, water-ripples, stars | clouds + haze + light-rays |
| `environment.lighting` | key + rim + mood | matahari rendah + pantulan langit di kaca |
| `physics` | Setiap benda bergerak + hukumnya | feri: sliding-friction; derek: spring-settle; kabel: pendulum |
| `handoff` | Objek yang berubah wujud ke beat berikutnya (kecuali beat terakhir) | puncak menara → dolly ke fasad |
| `vo.tone` | Tag ElevenLabs v3; ≥ 3 nada per video | curious → thoughtful → serious → whispers → confident → calm → warm |
| `vo.cueWords` | Diucapkan tepat 1× di kalimat beat itu | "pisau" |
| `sfx` | Per mikro-kejadian, diikat ke cue | desing bilah di "pisau" |
| `assets` | Nama + tier (hero/support/texture) + baru/ada | menara Bank of China (hero, baru) |

## 4. Fisika & realisme

- Benda jatuh: gravitasi + pantulan berkurang (`gravity-bounce`), squash saat mendarat.
- Lempar/terbang: `projectile` (+ hambatan udara untuk kertas/uang).
- Gantung (lampion, kabel, tanda): `pendulum` meluruh.
- Berhenti/terkunci: `spring-settle` (sedikit overshoot).
- Air/asap/kabut: `fluid-flow`; tumbuhan/kain: `wind-sway`.
- Implementasi: `src/core/motion/physics.ts`, `acting.ts` (squash, blur dari kecepatan nyata).

## 5. Setelah lolos

1. `npm run direct -- <id>` → `docs/<id>/STORYBOARD.md`.
2. Scriptwriter menurunkan `data/episodes/<id>.json` (VO + `tone` + cue) dari naskah ini.
3. Aset baru dibuat sesuai `docs/core/ASSET-STANDARD.md`.
4. Setelah render: `npm run qc-motion -- <id>` harus lolos target gerak.
