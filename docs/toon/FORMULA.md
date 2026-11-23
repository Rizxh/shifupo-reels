# Formula konten Shifu Po (format Toon)

Format **toon** adalah karakter 2D datar di dunia 3D berwarna, garis tinta, kamera bergerak terus, 40–59 detik. Format ini diambil dari domo-reels (EP13, disetujui user) dan referensi kelas iklan Grand Slam, lalu disesuaikan untuk **Shifu Po**, konsultan Feng Shui & BaZi ("Business, Love & Life").

Format ini **tambahan**. Format lama proyek ini (`story`, `popout`, `cinema`, `shio`, `parade`, `mv`) tetap jalan dengan aturan di CLAUDE.md.

## Brand di layar (`src/toon/brand.ts`)

| Elemen | Nilai |
|---|---|
| Warna | Tinta #12100E, kertas #F8F4EC, emas #C9A45C (kata kunci subtitle), merah segel #A8161D (tombol, baris kedua ajakan, bingkai papan) |
| Huruf | Cinzel untuk judul kartu (dikecilkan 0,62), Plus Jakarta Sans untuk badan dan label |
| Papan studio | Logo resmi `public/assets/brand/logo-shifupo-red.png` di papan kertas berbingkai merah segel |
| CTA | Tombol "KONSULTASI VIA WHATSAPP", tagline "Feng Shui & BaZi · Business, Love & Life", **tanpa @handle** |
| Bahasa | Bahasa Indonesia dengan **"Anda"** |
| Angka resmi | Hanya 3.000+ klien, 850+ properti, 10+ tahun (dari situs). Jangan mengarang angka lain. |

## Tokoh dan set

| Tokoh | Tampilan |
|---|---|
| **Shifu Po** (`SHIFU` di `src/toon/shifu/stage.ts`) | Kemeja merah gelap (dari foto banner: kemeja merah-hitam), celana tinta, rambut rapi, kancing emas. Shifu Po orang nyata: wajah kartun tetap sopan dan tidak karikatural. |
| Klien | Pemilik bisnis (Pak Hendra), pasangan (cinta), keluarga (rumah) |

| Set (`src/toon/kit/rooms.ts`) | Isi | Untuk |
|---|---|---|
| `fengshui` | Studio konsultasi: dinding kisi kayu, jendela bulan berpemandangan bambu, lampion merah, gulungan kaligrafi, cermin bagua, meja kayu dengan **luo pan** dan set teh, kursi ukir | Shifu Po membaca BaZi / feng shui |
| `office` | Kantor klien (meja, rak, whiteboard) | Masalah bisnis |
| `vip` | Ruang bos (panel kayu, meja eksekutif, TV grafik) | Klien kelas atas |
| `sultan` | Rumah mewah (marmer, pilar emas, lampu kristal) | Feng shui rumah, keluarga |
| Jalan + depan studio (`buildModern(..., "glass")`) | Papan logo resmi | Penutup / CTA |

## Pola cerita

**A. Kasus (default):**
Hook → Problem → False Hope → Isi (prinsip feng shui/BaZi, dijelaskan untuk awam) → Shifu Po membaca → 3 saran → Hasil → CTA

- **False hope:** solusi yang sudah dicoba tapi gagal, misalnya "udah ganti promo, udah tambah karyawan", atau "udah pasang hiasan dari internet".
- **Isi untuk awam:** tunjukkan **letak** (denah ruangan dari atas, panah arah pintu, meja, energi masuk), **benda aslinya** (luo pan, bagua, posisi meja), dan **cara kerjanya** (panah aliran qi). Setiap benda diberi label.
- **Klaim feng shui/BaZi** disampaikan sebagai **prinsip dalam praktik feng shui**, bukan janji hasil pasti. Kata "dijamin" dilarang.

**B. Fun fact budaya:**
Hook → Isi → STAR → jembatan → CTA. Contoh: asal luo pan, shio tahun ini (lihat format `shio` yang sudah ada).

## Hook

Pakai Seven Deadly Hook plus teknik pengunci:

| Jenis | Contoh Shifu Po |
|---|---|
| Experience | "Bisnis Pak Hendra sepi tiga bulan, padahal promo jalan terus." |
| Question | "Pernah merasa rezeki seret padahal kerja sudah maksimal?" |
| Negative spin | "Jangan taruh meja kerja Anda membelakangi pintu." |
| Call out | "Untuk Anda yang baru pindah rumah, tonton ini sebelum menata kamar." |
| How to | "Cara cek arah meja kerja Anda dalam 10 detik." |

## CTA

Struktur VO: "<gejala>? Konsultasi via WhatsApp dengan Shifu Po."

Kartu CTA (`cta`), muncul pada kata `cta.at`:

- `eyebrow`: pertanyaan, misalnya "BISNIS SEPI TANPA SEBAB?".
- `line` + `line2`: dua baris; baris kedua berwarna merah segel.
- Tombol berdenyut.

## Voice

- Suara Shifu Po memakai **suara kloning dari `.env` proyek ini**.
- User memilih **`eleven_multilingual_v2`** (14 Nov 2026), karena v3 mengubah karakter suaranya.
- Set `narration.model: "eleven_multilingual_v2"`, `speed` 1,05–1,15, `tempo: 1`.
- Tag emosi v3 tidak berlaku di v2; atur intonasi lewat tanda baca dan pilihan kata.

## Aturan visual dan QA

- Shot medium, tokoh tidak terpotong di tepi.
- Label di dalam frame.
- Subtitle per 2–3 kata, kata kunci berwarna emas.
- Dunia harus mengelilingi kamera: tidak boleh ada horizon kosong atau ujung set di frame. Kota punya skyline melingkar; ruangan dibuka hanya ke arah kamera.
- Wajib lolos `python scripts/toon/qa.py "<video>"`: daftar `pops` dan `whips` harus kosong.
- Tetap lakukan review loop proyek ini (lihat frame, isi catatan) sebelum produksi final.
