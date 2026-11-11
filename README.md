# shifupo-reels

Pabrik Reels Instagram promosi **Shifu Po (Feng Shui & BaZi consultant)**: animasi 2D bergaya lukisan tinta yang halus seperti anime, dengan suara ElevenLabs, dibuat dengan [Remotion](https://www.remotion.dev).

Isi naskah, teks layar, dan angka ada di satu file JSON per episode. Satu perintah mengubahnya menjadi video final siap unggah, lengkap dengan laporan QA.

| Hasil | Spesifikasi |
|---|---|
| Video | 1080×1920, 30 fps, 15–30 detik, H.264 + AAC, maksimal 30 MB |
| Audio | VO ElevenLabs, SFX sintesis sendiri, akhir −14 LUFS, true peak ≤ −1,5 dB |
| Teks | Selalu di dalam area aman Instagram (tidak tertutup tombol dan caption IG) |

Ada dua format episode, dipilih lewat field `format` di JSON episode:

| Episode | Format | Isi |
|---|---|---|
| SP01 "Kerja Keras Punya Arah" | `story` (default), komposisi `Reel` | 6 scene, 28 detik, animasi tinta 2D. Planning `docs/PLAN-SP01.md` |
| SP03 "Usaha Jalan, Pelanggan Sepi" | `popout` + foto asli | 4 scene, 19 detik, Feng Shui Bisnis. Pertama kali memakai logo dan foto asli dari shifupofengshui.com di dalam bingkai. Planning `docs/sp03/PLAN.md` |
| SP02 "Rezeki Lewat" | `popout`, komposisi `PopReel` | 4 scene, 15 detik, ilusi 4D / keluar layar: koi, luo pan, koin, Shifu Po, dan tombol menembus bingkai lak ke arah penonton. Planning `docs/sp02/PLAN.md` |

---

## Mulai cepat

### 1. Yang harus terpasang

| Alat | Cek | Catatan |
|---|---|---|
| Node.js 20 atau lebih baru | `node -v` | [nodejs.org](https://nodejs.org) (LTS) |
| ffmpeg dan ffprobe | `ffmpeg -version` | Windows: `winget install Gyan.FFmpeg`, macOS: `brew install ffmpeg`. Buka ulang terminal setelah install |
| Git | `git --version` | |
| Claude Code (opsional) | | Untuk membuat episode baru dengan satu prompt |

### 2. Ambil proyek dan siapkan

```bash
git clone https://github.com/Rizxh/shifupo-reels.git
cd shifupo-reels
npm install
npm run setup
```

`npm run setup` mengecek Node dan ffmpeg, membuat `.env` dari `.env.example` kalau belum ada, membuat semua SFX, lalu memberi tahu apa yang masih kurang (kunci ElevenLabs, foto Shifu Po).

### 3. Isi `.env` (kunci ElevenLabs)

Kalau `.env` belum ada, buat dari template:

```powershell
Copy-Item .env.example .env
```

```bash
cp .env.example .env
```

Lalu buka `.env` dengan editor teks dan isi:

| Variabel | Wajib | Isi |
|---|---|---|
| `ELEVENLABS_API_KEY` | Ya | API key dari dashboard ElevenLabs (menu API Keys) |
| `ELEVENLABS_VOICE_ID` | Ya | ID voice untuk Shifu Po (Voices → pilih voice → Copy voice ID). Sebaiknya pria dewasa, tenang, berwibawa |
| `ELEVENLABS_MODEL_ID` | Tidak | Kosong = `eleven_multilingual_v2` |
| `ELEVENLABS_BASE_URL` | Tidak | Hanya untuk host regional, misalnya `https://api.eu.residency.elevenlabs.io` |

Aturan `.env`:

- Jangan pernah commit `.env` (sudah diabaikan oleh `.gitignore`) dan jangan menempel isinya di chat.
- Tanpa kunci, video tetap dibuat tanpa VO dengan timing perkiraan. Cocok untuk mengecek animasi.
- Cek apakah sudah terisi, tanpa menampilkan nilainya: `npm run setup`.
- Paket ElevenLabs harus berbayar untuk konten komersial.

### 4. Foto Shifu Po

Taruh potongan foto (PNG transparan) di `public/assets/shifu/shifu.png`. Spesifikasinya ada di [public/assets/shifu/README.md](public/assets/shifu/README.md). Selama belum ada, siluet tinta yang dipakai. Kode tidak perlu diubah.

### 5. Buat videonya

```bash
npm run produce -- sp01
```

Hasilnya:

- `out/sp01_final.mp4`: video siap unggah
- `out/sp01_report.md`: laporan QA (durasi, ukuran, loudness, cek VO dengan whisper)
- `out/sp01_sheet.jpg`: lembar frame untuk dicek sekilas

---

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run setup` | Setup pertama dan cek kesehatan (Node, ffmpeg, `.env`, SFX, foto) |
| `npm run studio` | Preview interaktif di Remotion Studio (overlay area aman aktif) |
| `npm run produce -- <id>` | Seluruh pipeline: TTS → level VO → SFX → render → loudness → verifikasi → laporan |
| `npm run produce -- <id> --draft` | Render setengah ukuran untuk cek cepat, tanpa final |
| `npm run produce -- <id> --from <step>` | Lanjut dari satu langkah: `tts`, `vo-level`, `sfx`, `render`, `postprocess`, `verify` |
| `npm run tts -- <id>` | Hanya membuat VO ElevenLabs per kalimat (berikut timing per kata) |
| `npm run vo-level -- <id>` | Menyamakan volume tiap kalimat VO |
| `npm run sfx` | Membuat ulang semua SFX dengan ffmpeg |
| `npm run render -- <id> [--draft]` | Hanya render video |
| `npm run postprocess -- <id>` | Normalisasi loudness dan kompres sampai ≤ 30 MB |
| `npm run stills -- <id> 40 165 385 --scale 1` | Render frame tertentu dalam ukuran penuh untuk dicek |
| `npm run stills -- <id> --every 15` | Lembar frame tiap 15 frame |
| `npm run review -- <id> [--no-render]` | Review visual: render draft, lalu lembar frame penting per scene (awal, transisi, setiap kata cue, akhir) + catatan checklist di `out/<id>_review.md` |
| `npm run skills:update` | Pasang / perbarui skill resmi Remotion untuk Claude Code (`.claude/skills/remotion-best-practices`) |
| `npm run transcribe -- <video>` | Transkrip lokal dengan whisper (model diunduh sekali ke `.whisper/`) |
| `npm test` | Validasi episode (cue, angka, highlight) dan test pipeline |
| `npm run check` | Test, lint, dan typecheck sekaligus. Wajib lolos sebelum commit |

---

## Alur kerja satu episode

Setiap langkah punya panduannya sendiri di `docs/guides/`:

| # | Langkah | Panduan | Hasil |
|---|---|---|---|
| 1 | Planning ide | [01-PLANNING-IDE.md](docs/guides/01-PLANNING-IDE.md) | Topik, sudut pandang, hook |
| 2 | Planning konten | [02-PLANNING-KONTEN.md](docs/guides/02-PLANNING-KONTEN.md) | Naskah VO, teks layar, `data/episodes/<id>.json` |
| 3 | Scene per scene | [03-SCENE-BY-SCENE.md](docs/guides/03-SCENE-BY-SCENE.md) | Storyboard dan komponen scene di kode |
| 4a | Aset 2D | [04-ASET-2D.md](docs/guides/04-ASET-2D.md) | Ilustrasi SVG, foto PNG |
| 4b | Aset 3D | [05-ASET-3D.md](docs/guides/05-ASET-3D.md) | Render 3D yang menyatu dengan gaya 2D |
| 5 | Penempatan aset | [06-PENEMPATAN-ASET.md](docs/guides/06-PENEMPATAN-ASET.md) | Folder file dan posisi di frame |
| 6 | Animasi | [07-ANIMASI.md](docs/guides/07-ANIMASI.md) | Gerak "anime smooth" |
| 7 | Hasil bersih dan presisi | [08-QA-HASIL-BERSIH.md](docs/guides/08-QA-HASIL-BERSIH.md) | Video tanpa bug, tidak berantakan |

Dengan Claude Code, semua langkah itu dijalankan dari satu prompt:

```
/buat-video topik: feng shui kamar tidur untuk jodoh
```

Claude bekerja seperti studio kecil: creative director, penulis naskah, storyboard, desainer aset, animator, QA visual, lalu finishing (lihat `CLAUDE.md`). Claude menyusun planning (`docs/<id>/PLAN.md`), bertanya **satu kali** (setuju atau revisi), lalu memproduksi sampai video final tanpa berhenti. Sebelum render final, Claude wajib menjalankan siklus review visual: render draft, melihat frame penting setiap scene, memperbaiki, lalu mengulang (maksimal 3 putaran). Claude hanya berhenti kalau butuh aset dari Anda, kunci ElevenLabs, atau ada cek yang tetap gagal setelah tiga kali diperbaiki. Detailnya ada di `.claude/skills/buat-video/SKILL.md`.

---

## Mengatur proyek (konfigurasi)

Semua angka ada di satu tempat. Komponen tidak boleh berisi angka atau teks sembarangan.

| Mau mengubah | File | Contoh |
|---|---|---|
| Naskah, teks layar, angka, CTA | `data/episodes/<id>.json` | `vo`, `lines`, `count.value` |
| Warna, font, ukuran teks | `src/lib/brand.ts` | `COLORS.gold`, `TYPE.headline` |
| Area aman, posisi panggung, caption | `src/lib/brand.ts` | `SAFE_ZONE`, `SAFE_AREA`, `STAGE`, `CAPTION` |
| Lokasi foto Shifu dan tingginya | `src/lib/brand.ts` | `SHIFU.photo`, `SHIFU.height` |
| Kecepatan bicara, jeda, durasi min/maks | `src/lib/timing.ts` | `PACING`, `REEL` |
| Kurva gerak dan pegas | `src/lib/motion.ts` | `EASE.out`, `SPRING.heavy` |
| Transisi tinta | `src/lib/brand.ts` | `INK_WIPE.frames` |
| Format keluar layar: bingkai, kamera 3D, bayangan, ukuran | `src/lib/brand.ts` (`POP`), `src/lib/space.ts` | `POP.frame`, `POP.focal`, `POP.sway` |
| Volume VO, SFX, target loudness | `src/lib/mix.ts`, `src/lib/sfx.ts` | `VO_LEVEL`, `SFX_MIX` |
| Bentuk SFX | `scripts/sfx.ts` | resep gong, lonceng, whoosh |
| Model dan voice ElevenLabs | `.env` | `ELEVENLABS_VOICE_ID` |
| Izin perintah Claude Code | `.claude/settings.json` | Boleh `npm run`, tidak boleh baca `.env` |

---

## Struktur folder

```
shifupo-reels/
├─ .claude/                 Izin, skill /buat-video, dan skill resmi Remotion
├─ data/episodes/           Satu JSON per episode (naskah, teks, cue, klaim)
├─ docs/
│  ├─ PLAN-SP01.md          Planning SP01, sekaligus standar kualitas
│  ├─ guides/               Panduan langkah 1–8 (lihat tabel alur kerja)
│  ├─ templates/            Template planning episode baru
│  └─ setup/                Panduan setup laptop dan contoh izin Claude
├─ public/
│  ├─ assets/
│  │  ├─ shifu/             Foto Shifu Po (dari Anda)
│  │  ├─ brand/             Logo resmi (logo-shifupo-red.png)
│  │  ├─ 2d/                Aset 2D raster per episode (2d/sp03/) atau umum (2d/common/site/: foto asli dari situs, lihat SOURCES.md)
│  │  └─ 3d/                Hasil render 3D (urutan PNG transparan)
│  └─ audio/
│     ├─ sfx/               SFX hasil npm run sfx
│     ├─ bgm/               Musik berlisensi + LICENSES.md
│     └─ <id>/              VO hasil TTS (tidak ikut ke Git)
├─ scripts/                 Pipeline: setup, tts, vo-level, sfx, render, postprocess, produce, stills
├─ src/
│  ├─ lib/                  Token brand, timing, gerak, mix, kamera 3D (space.ts)
│  ├─ components/           Aset 2D yang digambar dengan kode (SVG)
│  ├─ scenes/Scenes.tsx     Enam scene format story (SP01)
│  ├─ scenes/PopScenes.tsx  Empat scene format popout (SP02)
│  ├─ compositions/         Reel.tsx (story) dan PopReel.tsx (popout)
│  └─ schema.ts             Validasi episode
├─ tests/                   Test episode dan pipeline
└─ out/                     Hasil render (tidak ikut ke Git)
```

---

## Aturan wajib

1. **Animasi hanya berbasis frame** (`useCurrentFrame`, `interpolate`, `spring`). Tidak boleh `Math.random`, `Date.now`, `setTimeout`, atau animasi/transisi CSS. Hasil render harus sama persis setiap kali.
2. **Durasi mengikuti VO.** Kejadian visual diikat ke kata yang diucapkan, bukan ke detik.
3. **Teks hanya di JSON episode.** Test memastikan setiap kata cue diucapkan tepat satu kali dan angka di layar sama dengan yang diucapkan.
4. **Lisensi:** musik hanya yang berlisensi komersial (catat di `public/audio/bgm/LICENSES.md`). SFX dibuat sendiri. Semua ilustrasi orisinal.
5. **Klaim** (angka, manfaat) ditandai `reviewed: false` sampai dicek manusia. Angka resmi hanya dari website: 3.000+ klien, 850+ properti, 10+ tahun, laporan 3–7 hari kerja.
6. **Rahasia** hanya di `.env`.

---

## Masalah umum

| Gejala | Penyebab dan solusi |
|---|---|
| `"ffmpeg" was not found on PATH` | Install ffmpeg, lalu buka ulang terminal |
| Video tanpa suara | `.env` belum terisi. Jalankan `npm run setup` untuk melihat variabel yang kurang |
| `401 Unauthorized` saat TTS | `ELEVENLABS_API_KEY` salah atau kedaluwarsa |
| `404 Not found` saat TTS | `ELEVENLABS_VOICE_ID` salah, atau voice belum ditambahkan ke akun |
| `cue "..." must appear exactly once` | Kata cue di JSON tidak ada di `vo` atau muncul dua kali. Ganti cue-nya |
| `the VO must say "tiga ribu"` | Angka `count.value` tidak sama dengan yang diucapkan di `vo` |
| Render berhenti di tengah | Pipeline otomatis mencoba ulang sekali. Kalau masih gagal, tutup Studio atau browser lain, lalu `npm run produce -- <id> --from render` |
| File di atas 30 MB | `postprocess` otomatis menaikkan kompresi bertahap |
| Cek whisper mengunduh 1,6 GB | Normal, hanya sekali pada laptop baru, disimpan di `.whisper/` |

Setup laptop baru langkah demi langkah: [docs/setup/SETUP-LAPTOP.md](docs/setup/SETUP-LAPTOP.md).

## Lisensi

Proyek privat (`UNLICENSED`). Remotion gratis untuk individu dan perusahaan dengan maksimal 3 karyawan. Di atas itu perlu Company License ([remotion.dev/license](https://www.remotion.dev/license)).
