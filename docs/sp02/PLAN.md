# SP02: "Rezeki Lewat" (format keluar layar / pop-out, 15 detik)

Status: **Selesai tanpa VO** (`out/sp02_final.mp4`, 15,6 detik, 7,6 MB, −14,3 LUFS, semua cek lolos). Menunggu `.env` ElevenLabs dan foto Shifu Po, lalu jalankan `npm run produce -- sp02`.

Acuan kualitas dan aturan gerak: `docs/PLAN-SP01.md` bagian 6 dan `docs/guides/07-ANIMASI.md`.

---

## 1. Tujuan

- Penonton: pemilik rumah dan usaha yang merasa rezekinya "lewat".
- Efek utama: ilusi **4D / keluar layar**. Ada bingkai lak merah di tengah layar, lalu benda di dalamnya (koi emas, luo pan, koin, Shifu Po, tombol) menembus bingkai ke arah penonton.
- Aksi setelah menonton: chat WhatsApp.

## 2. Layanan dan klaim

| Item | Isi |
|---|---|
| Layanan | Feng Shui rumah (arah), konsultasi umum |
| Angka resmi | 3.000+ klien |
| Klaim yang perlu dicek | "arah rumah belum selaras" sebagai kemungkinan penyebab (`reviewed: false`) |

## 3. Naskah VO (26 kata, ±15 detik)

| # | Scene | VO | Kata cue |
|---|---|---|---|
| 1 | `leap` | "Pernah merasa rezeki lewat begitu saja?" | rezeki, begitu, lewat (koi melompat keluar) |
| 2 | `turn` | "Bisa jadi, arah rumah Anda belum selaras." | arah, belum, selaras (jarum terkunci) |
| 3 | `count` | "Shifu Po sudah membantu lebih dari tiga ribu klien." | tiga (koin meledak keluar, angka berhitung) |
| 4 | `cta` | "Konsultasi sekarang via WhatsApp." | Konsultasi (Shifu Po mencondongkan badan keluar), WhatsApp (tombol keluar) |

## 4. Teks layar

| Scene | Teks | Muncul di kata |
|---|---|---|
| leap | REZEKI LEWAT / BEGITU SAJA? | rezeki / begitu |
| turn | ARAH RUMAH / BELUM SELARAS (aksen SELARAS) | arah / belum |
| count | 3.000+ (keluar bingkai), KLIEN TELAH DIBANTU | tiga |
| cta | SHIFU PO / FENG SHUI & BAZI, tombol "Konsultasi via WhatsApp" | Konsultasi / WhatsApp |

## 5. Storyboard

Bingkai lak merah (bidang z = 0) **tidak pernah hilang**. Isi jendela berganti dengan percikan tinta di dalam bingkai. Kamera 3D (perspektif 1500 px) selalu sedikit bergoyang (yaw/pitch) dan tersentak mundur sedikit setiap ada benda yang keluar.

| Scene | Dalam jendela | Aksi keluar layar | Penghubung |
|---|---|---|---|
| leap | Kolam malam (tinta → giok), daun teratai di beberapa kedalaman, riak | Koi emas berenang, menyelam (antisipasi), lalu di kata "lewat" melompat menembus bingkai, melewati penonton; cipratan air ikut keluar bingkai dan jatuh dengan gravitasi | Cipratan berubah jadi kabut gunung |
| turn | Gunung tinta berkabut | Luo pan naik dari dalam, berbaring miring, lalu terbang keluar bingkai menghadap penonton; jarum berputar dan terkunci di "selaras", kilau | Luo pan terbang melewati kamera |
| count | Ruang cahaya emas, sinar berputar | Di "tiga", 26 koin emas meledak dari dalam ke arah penonton (berputar, blur saat dekat); angka 3.000+ keluar bingkai dan berhitung | Koin terakhir melewati kamera |
| cta | Kertas dengan gunung tenang | Shifu Po mencondongkan badan keluar jendela (kepala dan bahu di depan bingkai, kaki tertutup ambang); tombol WhatsApp keluar bingkai dengan bayangan di bingkai | Akhir |

Sepanjang video: beberapa kelopak merah dan butir emas melayang **di depan** bingkai (z positif), sebagai petunjuk kedalaman.

## 6. Aturan ilusi keluar layar (wajib)

1. Satu kamera untuk semua benda (`src/lib/space.ts`): posisi 3D diproyeksikan, tidak ada skala sembarangan.
2. Benda di belakang bidang bingkai (z < 0) dipotong oleh jendela; benda di depan (z ≥ 0) menimpa bingkai.
3. Benda hanya menembus bidang bingkai saat seluruh proyeksinya masih di dalam jendela, supaya tidak ada lompatan visual.
4. Benda besar yang "mencondong keluar" (Shifu Po, tombol) digambar dua kali dengan potongan berbeda: salinan dalam dipotong jendela, salinan depan dipotong garis ambang.
5. Setiap benda di depan menjatuhkan bayangan ke bidang bingkai; makin dekat ke penonton, bayangan makin jauh dan kabur.
6. Benda yang sangat dekat kamera blur (depth of field) lalu memudar sebelum melewati kamera.
7. Semua aturan gerak SP01 bagian 6 tetap berlaku.

## 7. Aset dan geraknya

| Aset | Baru / pakai ulang | Gerak |
|---|---|---|
| Bingkai lak + ornamen sudut emas | Baru (`PopFrame`) | Diproyeksikan; ikut goyang kamera |
| Koi emas | Pakai ulang `KoiFish` dengan palet emas + garis tinta | Renang sinus, lompatan antisipasi → arc keluar |
| Cipratan air | Baru | Partikel 3D dengan gravitasi |
| Kolam, teratai, riak | Baru | Parallax per kedalaman |
| Gunung tinta | Pakai ulang `InkMountains` | Parallax |
| Luo pan + jarum | Pakai ulang `Luopan`, jarum baru | Miring 70° → 10°, jarum spring snap |
| Koin emas | Baru (3D) | Putaran scaleX, blur dekat kamera |
| Angka 3.000+ | Teks | Spring keluar bingkai + hitung |
| Shifu Po | Pakai ulang `Shifu` (foto atau siluet) | Condong keluar, napas |
| Tombol WhatsApp | Pakai ulang `WhatsAppButton` | Keluar bingkai, bayangan |

## 8. Suara

| Lapisan | Rencana |
|---|---|
| VO | ElevenLabs, voice Shifu Po di `.env` (tanpa `.env`: tanpa VO, timing perkiraan) |
| SFX | gong pembuka, whoosh + **splash** (resep baru) saat koi keluar, tik + lock + shimmer di luo pan, denting koin bertubi, pop + lonceng di tombol |
| BGM | Tanpa BGM |

## 9. Teknis

- Format episode baru `"format": "popout"` dengan skema sendiri di `src/schema.ts`; komposisi `PopReel`.
- Durasi tetap dari VO, minimal 15 detik (hold akhir diperpanjang otomatis kalau VO terlalu pendek).
- Script (`produce`, `render`, `stills`) memilih komposisi dari format episode.

## 10. Yang perlu manusia

- Foto Shifu Po (`public/assets/shifu/shifu.png`), `.env` ElevenLabs.
- Cek klaim, lalu ubah `reviewed` menjadi `true`.
