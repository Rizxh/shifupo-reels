# Rancangan: Shared Animation Production Core (reference implementation: shifupo-reels)

Status: **disetujui (fase 0–6), sedang dikerjakan.** Audit pendukung: `docs/core/AUDIT.md`.

| Fase | Status (13 Nov 2026) |
|---|---|
| 0 Jaring pengaman | Selesai: `npm run golden -- record/check` (PSNR, acuan lokal di `tests/golden/`) |
| 1 Ekstrak core | Selesai: `src/core/{motion,text,timeline,audio,assets,camera}` + `src/products/shifupo/{brand,sfx,space}`; `src/lib/*` = re-export; golden identik |
| 2 Motion & kamera | Selesai untuk core (`tracks`, `physics`, `acting`, `camera/follow`, 11 tes); dipakai di Hook SP01 + semua teks slam. Scene lain belum di-upgrade |
| 3 Kontinuitas | Selesai: `core/timeline/continuity` (pre-roll), wipe tinta mulai dari ukuran subjek + scene lama tetap utuh; gap transisi SP01/SP02 hilang (diukur) |
| 4 Director + VO v3 | Selesai: `core/director/schema.ts`, `npm run direct`, template, skill; `tone` di episode + tts v3 (tag dibuang dari caption). VO Shifu Po menunggu key (`env.txt` belum ditemukan) |
| 5 Standar aset | Sebagian: `docs/core/ASSET-STANDARD.md`, atmosfer 2D di dunia `story`; 3D kini React Three Fiber live (`src/core/three/*`, dunia `office` untuk sp05); pipeline Blender dihentikan 13 Nov atas permintaan pengguna |
| 6 QC otomatis | Sebagian: `npm run qc-motion` (frame mati, diam, energi, jerk, frame kosong); belum dipasang ke `produce`/`review` |

## 1. Prinsip

1. Shifupo tetap bisa produksi di setiap fase (SP01–SP03 dirender ulang dan dibandingkan sebelum/sesudah).
2. Core = mesin yang dapat dipakai ulang; product = identitas (brand, pack aset, gaya cerita, voice, format).
3. Domo **tidak** dibuat sekarang; core dirancang supaya Domo cukup menambah folder product.
4. Prompt singkat → **Director** mengembangkannya menjadi naskah produksi lengkap; kualitas tidak boleh bergantung pada panjang prompt.

## 2. Arsitektur usulan

```
src/core/                         ← reusable, tanpa copy/brand
  director/    schema naskah produksi + validator (beat, shot, kamera, fisika, aset, VO tone, cue)
  motion/      tracks per kanal (K), easing ber-parameter, spring, physics (gravitasi, pantul,
               pendulum, damper), squash-stretch, secondary motion, motion blur terarah
  camera/      kamera fokus-ikut (fx, fy, z) + parallax berlapis; space.ts popout jadi salah satu rig;
               rig 2.5D perspektif (lorong/dolly)
  continuity/  aturan "tidak ada frame kosong": overlap masuk/keluar, morph/match-move antar scene
  fx/          DOF, bloom, vignette, grain, kantong teks (latar di belakang teks diredam otomatis)
  type/        judul, caption, stempel, tombol (dibentuk oleh tokens product)
  audio/       VO (ElevenLabs v3 + tag emosi, voice per product), level, ducking, SFX per mikro-kejadian,
               musik (lisensi atau komposer kode)
  assets/      registry + standar kualitas aset yang bisa diuji (pencahayaan, LOD, palet bayangan)
  timeline/    durasi dari VO, cue word, beat
  qc/          deteksi otomatis: frame mati, lompatan gerak, frame kosong saat transisi, teks keluar
               area aman/menabrak subjek, loudness, whisper VO, typo
src/products/shifupo/              ← identitas Shifu Po
  brand.ts (tokens) · formats/ (story, popout) · pack/ (komponen SVG feng shui) · director.style.ts
  (nada "Anda", topik layanan resmi, rumus cerita) · voice.ts
src/products/domo/                 ← nanti (tidak dibuat di tahap ini)
scripts/                           ← memanggil core dengan product dari `episode.product`
```

Kompatibilitas: `src/lib/*` dan `src/components/*` tetap ada sebagai **re-export** ke lokasi baru selama migrasi, sehingga scene lama tidak rusak.

## 3. Director Engine (prompt singkat → naskah kompleks)

Input: "bikin video soal pintu sejajar". Output: `data/episodes/<id>.json` versi produksi:

| Bagian | Isi yang wajib diisi Director | Divalidasi oleh |
|---|---|---|
| Brief | penonton, satu masalah, satu janji, format | schema |
| Beat (7) | hook → konteks → sebab → akibat → solusi → payoff → CTA | urutan & jumlah |
| Shot per beat | jenis kamera (macro/crane/dolly/topdown/impact/…), subjek, aksi | daftar rig yang ada |
| Fisika | benda & hukumnya (jatuh = gravitasi + restitusi, kain/lampion = pendulum, uang = proyektil + hambatan udara) | preset physics |
| Penghubung | objek yang berubah wujud ke shot berikutnya | wajib di tiap potongan |
| Aset | dari pack, atau "aset baru" + standar kualitasnya | registry |
| VO | kalimat, `tone` (tag v3), `stress`, cue word | cue tepat sekali, angka = huruf |
| Suara | SFX per mikro-kejadian, mode musik | daftar SFX |

Director dijalankan oleh Claude di skill `/buat-video` dengan template + rubrik; validator menolak naskah yang tidak lengkap sebelum produksi.

## 4. File yang diubah / ditambah (shifupo-reels)

| File | Perubahan |
|---|---|
| `src/lib/motion.ts` | Pindah ke `core/motion/`, ditambah tracks, physics, squash, blur; file lama jadi re-export |
| `src/lib/space.ts` | Ke `core/camera/` sebagai rig `popout`; tambah rig fokus-ikut + 2.5D |
| `src/lib/brand.ts` | Dipecah: tokens generik (core) vs `products/shifupo/brand.ts` |
| `src/lib/timeline.ts`, `cues.ts`, `timing.ts`, `audio.ts`, `mix.ts`, `sfx.ts`, `text.ts` | Ke core, re-export |
| `src/schema.ts` | Dipecah: schema core (beat, shot, VO tone, physics) + schema format product |
| `src/compositions/Reel.tsx`, `PopReel.tsx` | Memakai core/continuity (overlap, morph) + kamera; perilaku lama sebagai default |
| `src/scenes/Scenes.tsx` | Upgrade gerak bertahap per scene (tracks, secondary, blur), dibandingkan golden frame |
| `src/components/*` | Ke `products/shifupo/pack/`, ditingkatkan sesuai standar aset |
| `scripts/tts.ts` | v3 + tag emosi + voice per product; tag dibuang dari caption |
| `scripts/review.ts`, `produce.ts` | QC otomatis (core/qc), review.md wajib terisi, laporan lengkap |
| `tests/*` | Golden frame SP01–SP03, tes core/motion & physics, tes director schema |
| `.claude/skills/buat-video/SKILL.md`, `CLAUDE.md`, `docs/guides/*` | Alur Director, standar aset, QC baru |

## 5. Dependency

| Paket | Untuk | Wajib? |
|---|---|---|
| `@remotion/motion-blur` | Blur kamera/objek cepat | Ya (fase 2) |
| `@remotion/transitions` | Primitif transisi (ditambah morph sendiri) | Opsional |
| `@remotion/rive` | Karakter berrig artis (jika nanti ada file .riv) | Opsional |
| `@remotion/three` | Untuk Domo (3D realtime) — tidak dipasang sekarang | Nanti |
| React Three Fiber (`@remotion/three`, drei, postprocessing) | 3D live untuk Shifu Po dan nanti Domo (Blender tidak dipakai) | Terpasang 13 Nov |
| ElevenLabs `eleven_v3` | VO ekspresif (tanpa paket baru) | Ya (fase 4) |

Versi Remotion dipin sama dengan yang ada (`4.0.541` dan paket `@remotion/*` setara).

## 6. Risiko migrasi

| Risiko | Mitigasi |
|---|---|
| Render SP01–SP03 berubah tanpa sengaja | Fase 0: golden frame (frame cue & transisi) + diff piksel di tes; setiap fase wajib lolos |
| Import rusak saat file dipindah | Re-export di lokasi lama; hapus hanya setelah semua lulus |
| Motion blur memperlambat render | Diaktifkan per objek cepat, bukan global; ukur waktu render per fase |
| v3 lebih boros kuota & belum mendukung konteks antar kalimat | Cache per hash; tag dari daftar tetap; whisper check |
| Render kadang mati di tengah (pernah terjadi) | Retry + log tersimpan (sudah ada di produce) |
| Repo GitHub publik | Tidak ada key/env di commit; gitleaks sebelum commit |

## 7. Fase implementasi

| Fase | Isi | Gerbang |
|---|---|---|
| 0. Jaring pengaman | Golden frame SP01–SP03, baseline tes & waktu render | `npm run check` + golden lulus |
| 1. Ekstrak core | `src/core/*` + `src/products/shifupo/*`, re-export, tanpa perubahan visual | Golden identik |
| 2. Motion & kamera | Tracks, physics, squash, secondary, motion blur, kamera fokus-ikut; pilot di 1 scene SP01 | Review sheet + video pilot disetujui |
| 3. Kontinuitas | Aturan tanpa frame kosong + morph/match-move; detektor frame kosong | 0 frame kosong di SP01–SP03 |
| 4. Director + VO v3 | Schema naskah produksi, rubrik, skill; tts v3 + tone | Prompt 1 kalimat → naskah lengkap lolos validator |
| 5. Standar aset | Spesifikasi pencahayaan/LOD + upgrade aset terlemah (pendorong, bola, koi, siluet) | Review visual |
| 6. QC otomatis | Frame mati, lompatan, tabrakan teks, area aman, loudness, whisper, typo → report | Report lengkap tiap produce |
| 7. (setelah persetujuan terpisah) Domo | `products/domo` + dunia R3F otomotif | — |

Estimasi biaya/waktu dilaporkan per fase; tiap fase diakhiri video/still sebagai bukti.
