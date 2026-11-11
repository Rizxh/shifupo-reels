# 03. Membuat scene per scene

Tujuan langkah ini: setiap beat naskah menjadi scene yang **mengalir menjadi satu gerakan panjang**, bukan potongan slide.

Sebelumnya: [02-PLANNING-KONTEN.md](02-PLANNING-KONTEN.md) · Lanjut ke: [04-ASET-2D.md](04-ASET-2D.md)

---

## 1. Anatomi satu scene

Setiap frame terdiri dari lapisan berikut, dari belakang ke depan:

| Lapisan | Isi | Siapa yang menggambar |
|---|---|---|
| 1. Dunia | Kertas, gunung tinta 3 lapis, bambu, kelopak | `World` di `src/compositions/Reel.tsx`. Tidak pernah dipotong antar scene |
| 2. Subjek | Ilustrasi utama scene (kompas, luo pan, denah, koi) | Komponen di `src/components/` |
| 3. Figur | Shifu Po (foto atau siluet) | `Shifu` |
| 4. Efek | Garis kecepatan, kilau, percikan tinta | `src/components/Fx.tsx` |
| 5. Teks | Kicker, judul, stempel, tombol | `src/components/Text.tsx`, `Brand.tsx` |
| 6. Caption | Kata yang sedang diucapkan | Otomatis di `Reel.tsx` |

Batas posisi setiap lapisan dijelaskan di [06-PENEMPATAN-ASET.md](06-PENEMPATAN-ASET.md).

## 2. Storyboard per scene

Tulis tabel ini di `docs/<id>/PLAN.md` bagian 5, satu baris per scene:

| Kolom | Isi |
|---|---|
| Latar | Apa yang dilakukan dunia: naik, turun, gunung memudar |
| Subjek dan aksinya | Apa yang bergerak dan bagaimana: masuk, aksi utama, keluar |
| Cue | Kata yang memicu setiap kejadian |
| Teks | Teks layar dan kata cue-nya |
| SFX | Suara di setiap kejadian (gong, lonceng, whoosh, stempel) |
| **Penghubung** | Benda yang membawa mata ke scene berikutnya |

**Penghubung (match move)** adalah kunci rasa "anime". Contoh dari SP01:

| Dari | Ke | Penghubung |
|---|---|---|
| Hook | Insight | Batu yang didorong berguling dan menjadi kompas |
| Insight | BaZi | Kompas membesar menjadi luo pan |
| BaZi | Feng Shui | Pilar turun, cahaya emasnya mengalir menjadi pita qi |
| Feng Shui | Bukti | Pita qi berubah menjadi aliran koin emas |
| Bukti | CTA | Koi berenang ke atas dan masuk ke stempel logo |

Transisi tinta (`INK_WIPE`) dibuka dari titik yang sedang dilihat mata (`WIPE_ORIGIN` di `Reel.tsx`).

## 3. Tiga fase setiap scene

Setiap scene memakai pola yang sama. `start`, `end`, dan `cue(word)` dikirim oleh `Reel.tsx`:

```
start ──► masuk ──► aksi utama (diikat ke cue) ──► tahan, tetap bergerak ──► keluar (end − EXIT_LEAD) ──► end
```

| Fase | Aturan |
|---|---|
| Masuk | 8–14 frame, `EASE.out` atau `SPRING.pop`. Grup masuk bergiliran 2–4 frame |
| Aksi | Tepat di frame cue. Teks 3 frame sebelumnya (`HEADLINE.leadFrames`) |
| Tahan | Napas, drift, partikel. Tidak boleh ada frame yang diam total |
| Keluar | Mulai `EXIT_LEAD` (14) frame sebelum `end`, `EASE.in`, berlanjut sampai transisi tinta selesai |

Contoh nyata: `BaziScene` di `src/scenes/Scenes.tsx`.

## 4. Menambah jenis scene baru

Kalau episode butuh scene yang tidak ada di SP01 (misalnya `palm` untuk garis tangan), ubah di tempat-tempat ini secara berurutan:

| # | File | Yang ditambah |
|---|---|---|
| 1 | `src/schema.ts` | Skema zod baru (`type: z.literal("palm")`), masuk ke `sceneSchema`, kata cue-nya di `sceneCues` |
| 2 | `src/schema.ts` | Urutan scene: `SCENE_ORDER` (atau ubah menjadi urutan per episode kalau strukturnya berbeda) |
| 3 | `src/components/` | Komponen ilustrasi baru. Lihat [04-ASET-2D.md](04-ASET-2D.md) |
| 4 | `src/scenes/Scenes.tsx` | `PalmScene` dengan pola `Base & { scene: SceneOf<"palm"> }` |
| 5 | `src/compositions/Reel.tsx` | Satu `case` di `SceneBody`, titik transisi di `WIPE_ORIGIN`, kunci kamera di `World` |
| 6 | `src/components/Sfx.tsx` | Satu `case` di `hitsFor` untuk suara scene itu |
| 7 | `tests/episode.test.ts` | Test untuk aturan khusus scene baru (misalnya angka) |

TypeScript akan menandai setiap `switch` yang lupa diberi `case` baru. Jalankan `npm run check`.

## 5. Mengecek satu scene

```bash
npm run studio
```

Di Studio, pilih komposisi `Reel`, lalu geser timeline ke scene yang sedang dibuat. Garis putus-putus merah adalah area aman. Untuk frame ukuran penuh:

```bash
npm run stills -- sp02 120 135 150 --scale 1
```

Periksa frame tepat di cue, 3 frame sebelumnya, dan di tengah transisi. Daftar lengkap ada di [08-QA-HASIL-BERSIH.md](08-QA-HASIL-BERSIH.md).

## 6. Checklist per scene

- [ ] Ada aksi utama yang jatuh tepat di kata cue
- [ ] Ada penghubung yang jelas ke scene berikutnya
- [ ] Minimal tiga kedalaman parallax (dunia, subjek, partikel atau teks)
- [ ] Teks di dalam area aman dan tidak menimpa subjek
- [ ] SFX tercatat di `hitsFor` dan jatuh di frame yang sama dengan visualnya
