# Audit shifupo-reels → fondasi Shared Animation Production Core

Tanggal: 13 Nov 2026. Cakupan: seluruh repo (commit `0fba885`), output SP01–SP03 di `out/`, dan pembanding Motion Format (REA deep dive).
Belum tersedia: `DOMO_REELS_MASTER_SYSTEM_INSTRUCTIONS.md` (tidak ditemukan di disk) — standar kualitas di dokumen ini disusun dari Motion Format, domo-reels, dan praktik studio; akan diselaraskan begitu file itu ada.

Label: **[O]** terlihat langsung (kode/output), **[I]** inferensi, **[?]** belum diketahui.

---

## 1. Arsitektur yang ada

```
data/episodes/spNN.json ──zod (src/schema.ts, 388 baris)──► calculateMetadata (src/metadata.ts)
        │                                                       │ durasi dari VO + PACING
        ▼                                                       ▼
scripts/tts.ts (ElevenLabs multilingual_v2) ──► public/vo/*.mp3 + sidecar kata
scripts/vo-level.ts · sfx.ts (sintesis) · render.ts · postprocess.ts · transcribe.ts (whisper) · review.ts · stills.ts
        │
        ▼
Komposisi: Reel (format story, 6 scene)  |  PopReel (format popout, 3–5 scene, kamera 3D kecil)
        │                                         │
src/scenes/Scenes.tsx (412 baris)          src/scenes/PopScenes.tsx (1013 baris)
        └──────────────► src/components/* (13 komponen SVG) ◄──────────┘
src/lib: brand (166), motion (76), space (134), timeline (104), text (128), audio (91), mix, sfx, cues, timing, assets
QA: review.ts (contact sheet + review.md), produce.ts (report.md + sheet), tests (schema, assets)
```

Kekuatan **[O]**: data-driven + zod, cue word (bukan detik), durasi dari VO, aturan "anime smooth" tertulis, dunia latar yang tidak pernah dipotong, kamera 3D popout (`space.ts`), review loop + whisper check, dokumentasi langkah (guides 01–08).

## 2. Masalah yang ditemukan

### 2.1 Gerak tidak smooth / terasa slide

| # | Bukti | Dampak |
|---|---|---|
| M1 | [O] `Scenes.tsx` (format story, 6 scene) memakai **7 `prog` + 2 `springAt` total**, 0 `drift`, 0 `breathe`, 0 blur, 0 squash/stretch. | Antar-cue hampir diam → "slide", melanggar aturan PLAN part 6 sendiri ("never a dead-still frame"). |
| M2 | [O] Komponen bergerak 1–10 kanal (`Koi` 0 prog, `Background` 0 prog). Pembanding: logo reveal Motion Format ±30 kanal per objek, masing-masing easing & offset sendiri. | Tidak ada overlapping action / follow-through; gerakan terasa "satu blok". |
| M3 | [O] Easing hanya 5 kurva tetap (`EASE`) + 4 spring. Motion Format men-tune eksponen per kanal (`pout(2..3)`, `backOut(2.3..3.2)`, `elasticOut(1,.36)`). | Semua benda bergerak dengan "rasa" sama; tidak ada bobot berbeda. |
| M4 | [O] Tidak ada motion blur sama sekali (story). Motion Format memberi blur terarah yang meluruh selama gerak cepat. | Gerak cepat di 30 fps terlihat patah/strobing. |
| M5 | [O] Format story tidak punya kamera (hanya `World.lift` 6 kunci). Motion Format: kamera ber-titik fokus (fx, fy, z) yang mengikuti subjek + parallax dengan skala sendiri. | Tidak ada rasa sinematik; mata tidak dipandu. |
| M6 | [I] Fisika tidak dimodelkan: benda jatuh/memantul/berayun memakai ease generik, bukan gravitasi/restitusi/pendulum. | "Tidak sesuai hukum fisika" di mata penonton. |

### 2.2 Gap antar-scene

| # | Bukti | Dampak |
|---|---|---|
| G1 | [O] `Reel.tsx`: scene baru dibuka lewat `inkBlotClip` tepat di `startFrame`, sementara asetnya baru masuk 8–14 frame kemudian (fase "masuk"). Contact sheet SP01 baris 3: frame denah kosong, frame mangkuk koi tanpa koi. | Beberapa frame berisi tinta + latar kosong = terasa putus. |
| G2 | [O] Penghubung (match move) ada di rencana, tapi di kode objek scene lama memudar (`fadeOut`) dan objek scene baru muncul terpisah — tidak ada objek yang **berubah wujud** melewati potongan. Motion Format: balon chat → kepala → garis, tanpa potong. | Kontinuitas hanya di latar, bukan di subjek. |
| G3 | [O] SP02 baris 2 tile 4: jendela gelap kosong di antara scene. | Momen mati di Reels = penonton scroll. |

### 2.3 Aset terlihat kurang bagus / tidak konsisten

| # | Bukti | Dampak |
|---|---|---|
| A1 | [O] Fill warna rata, hampir tanpa gradien, rim light, bayangan lembut, atau tekstur (kecuali luo pan). Bola batu & pendorong = siluet datar. | Level detail tidak merata: luo pan premium, yang lain sketsa. |
| A2 | [O] Figur Shifu Po = siluet placeholder besar (foto belum ada) dan muncul di 3 dari 6 scene SP01. | Bagian terbesar layar adalah aset paling kasar. |
| A3 | [O] Popout: bingkai kecil di tengah, ±60% layar krem kosong (SP02/SP03 sheet). | Subjek terlalu kecil di HP. |
| A4 | [I] Tidak ada standar aset tertulis yang bisa diuji (pencahayaan, jumlah tingkat detail, palet bayangan). | Setiap aset baru kualitasnya tergantung sesi. |

### 2.4 Audio & storytelling

| # | Bukti | Dampak |
|---|---|---|
| S1 | [O] TTS `eleven_multilingual_v2`, tanpa `voice_settings`, tanpa arahan emosi. Tes 13 Nov: `eleven_v3` mendukung tag emosi + timestamp, tapi tidak `previous_text`. | Intonasi datar (keluhan user). |
| S2 | [O] Struktur 6 beat berorientasi "metode + bukti + CTA" (promosi), bukan cerita (masalah → akibat terasa → solusi terlihat → lega). | Terasa iklan/edukasi biasa. |
| S3 | [O] Tidak ada BGM (menunggu lisensi); SFX sintesis per scene, tidak per mikro-kejadian. | Ritme kosong; tidak ada "pukulan" emosional. |
| S4 | [I] Prompt singkat langsung menjadi naskah final tanpa tahap penyutradaraan terstruktur (shot, kamera, fisika, aset per beat). | Hasil bergantung pada seberapa panjang prompt. |

### 2.5 QA

| # | Bukti | Dampak |
|---|---|---|
| Q1 | [O] `out/sp02_review.md` & `sp03_review.md`: checklist tidak dicentang, "Temuan" kosong; `*_report.md` ±300 byte. | Review loop ada di aturan, tidak ditegakkan. |
| Q2 | [O] Tidak ada deteksi otomatis untuk frame mati, lompatan gerak, frame kosong di transisi, atau tabrakan teks. | Masalah M1/G1/G3 lolos ke final. |

## 3. Pembanding: Motion Format (REA deep dive, 13 Nov)

| Aspek | Motion Format | shifupo sekarang |
|---|---|---|
| fps / resolusi | 30 fps 1080p (1 video 60 fps) | 30 fps 1080p — **bukan sumber perbedaan** |
| Engine | HTML + GSAP, semua gambar = fungsi murni waktu `frame(t)` | Remotion, frame murni — setara |
| Kanal gerak per objek | ±30, easing & offset sendiri | 1–10 |
| Squash & stretch | Setiap mendarat (huruf 1,46× lalu memipih) | Hanya di popout (3 tempat) |
| Motion blur | Blur terarah yang meluruh di gerak cepat | Tidak ada (story) |
| Kamera | Titik fokus mengikuti subjek + parallax berskala | Story: tidak ada |
| Kontinuitas | Objek berubah wujud melewati potongan | Latar kontinu, subjek terpotong |
| Gerak sekunder | Ayunan, rotasi kecil, kedip, komet, bintang | Petal & drift latar saja |
| Suara | Per mikro-kejadian (tiap titik melompat) | Per scene |
| Kebersihan teks | Bintang di belakang teks disembunyikan otomatis ("kantong teks") | Tidak ada |

Kesimpulan [I]: kesenjangan bukan di teknologi (Remotion setara GSAP), melainkan di **kerapatan & kualitas animasi per objek, kontinuitas subjek, kamera, aset berpencahayaan, dan naskah bercerita** — semuanya bisa dibakukan di core.

### 3.1 Profil gerak terukur (frame per frame, 13 Nov)

Diukur dengan beda rata-rata antar frame (96 px abu-abu). Skrip: `scripts/motion-profile.py` (fase 6).

| Video | Frame mati | Detik nyaris diam | Energi gerak p90 | Kerataan (jerk median) |
|---|---|---|---|---|
| MF explainer Bulan (16:9) | 10,9% | 13 | 4,8 | 0,095 |
| MF Shorts 3D Sampit | 2,7% | 6 | 6,4 | 0,117 |
| MF Shorts 3D anatomi | 0,8% | 3 | 5,8 | 0,106 |
| SP01 | 0% | 0 | 3,8 | 0,099 |
| SP02 | 1,9% | 3 | 4,8 | 0,143 |
| Referensi WhatsApp (Hong Kong, 89 s) | **13,4%** | **21** | **2,5** | 0,082 |

[I] "Polos" = **energi gerak rendah + banyak detik diam**, bukan gerak patah. Target QC Shorts: frame mati < 3%, detik nyaris diam ≤ 2 (kecuali disengaja), energi p90 ≥ 5, jerk < 0,15, aksen visual/potongan tiap 2–4 detik.

### 3.2 Referensi WhatsApp (yang ditolak user)

[O] Kota 3D low-poly tanpa tekstur/material, satu warna sepia, tanpa langit/awan/matahari/kabut, tanpa bayangan atau pantulan kaca; hook = gedung diam; 89 detik (di luar spec 30 s). Standar 3D Shifu Po wajib: langit HDRI + awan volumetrik, material PBR (kaca, beton, logam), matahari + bayangan, kabut kedalaman, partikel/bokeh, motion blur, hook bergerak di 1 detik pertama.

## 4. OpenToonz

[O] Lisensi Modified BSD, installer Windows dari opentoonz.github.io, untuk animator manusia (gambar tangan, cutout, Plastic tool, Xsheet), otomasi terbatas (ToonzScript di konsol aplikasi, Toonz Farm untuk render). Tidak ada API headless untuk menyusun adegan dari prompt.
Rekomendasi: **bukan** inti sistem otomatis. Boleh dipasang sebagai alat opsional bagi animator manusia yang membuat aset (siklus gerak → ekspor PNG sequence → dikomposit Remotion). Pemasangan butuh persetujuan Anda (installer GUI + UAC).

Alternatif yang cocok untuk otomasi:
- 2D konsisten: rig cutout ber-tulang di kode (hierarki pivot) + opsional Rive (`@remotion/rive`) untuk karakter yang dirig artis.
- 3D realistis (Domo, nanti): **Blender 5.2 LTS sudah terpasang** → skrip Python headless → PNG sequence (EEVEE cepat / Cycles realistis) → komposit Remotion. Catatan: GPU di laptop ini AMD terintegrasi 512 MB; Cycles 1080×1920 bisa berjam-jam per video.
