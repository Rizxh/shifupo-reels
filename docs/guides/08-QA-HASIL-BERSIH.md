# 08. QA: hasil bersih, presisi, tanpa bug

Video baru boleh dikirim kalau semua cek otomatis lolos **dan** semua cek visual di bawah ini dicentang. Semuanya dijalankan dari terminal, tanpa harus menonton manual berulang-ulang.

Sebelumnya: [07-ANIMASI.md](07-ANIMASI.md) · Kembali ke: [README](../../README.md)

---

## 1. Urutan kerja

```bash
npm run check                         # test + lint + typecheck
npm run produce -- <id> --draft       # render setengah ukuran + lembar frame
npm run stills -- <id> <frame...> --scale 1   # crop 100% di frame penting
npm run produce -- <id>               # final + laporan QA
```

Ulangi draft → perbaiki → draft maksimal tiga putaran. Kalau masih gagal, berhenti dan laporkan apa yang gagal.

## 2. Cek otomatis

| Cek | Dijalankan oleh | Lolos kalau |
|---|---|---|
| Isi episode | `npm test` | Cue diucapkan tepat sekali, highlight diucapkan, angka cocok dengan VO, urutan scene benar |
| Kode | `npm run lint` | Tidak ada error ESLint dan TypeScript |
| Resolusi dan codec | `produce` (verify) | 1080×1920, H.264 + AAC |
| Durasi | `produce` | 15–30 detik |
| Ukuran | `postprocess` | ≤ 30 MB (kompresi dinaikkan bertahap otomatis) |
| Loudness | `postprocess` | −14 LUFS ±1 LU, true peak ≤ −1,5 dB |
| VO sesuai naskah | `produce` (whisper) | ≥ 90% kata naskah terdengar berurutan |
| Hasil lengkap | `out/<id>_report.md` | Tertulis "Semua cek lolos." |

## 3. Cek visual (wajib, per frame)

Frame yang harus dilihat dalam ukuran penuh (`--scale 1`):

- frame cue setiap teks, dan 3 frame sebelumnya;
- tengah setiap transisi (start scene + 8);
- frame terakhir setiap scene dan frame terakhir video.

| # | Cek | Gagal kalau |
|---|---|---|
| 1 | Area aman | Ada huruf, tombol, atau angka yang menyentuh zona IG (lihat [06-PENEMPATAN-ASET.md](06-PENEMPATAN-ASET.md)) |
| 2 | Teks terpotong | Huruf terpotong, angka besar terbelah ke dua baris, ellipsis |
| 3 | Tumpang tindih | Teks menimpa wajah Shifu Po, subjek utama, atau caption |
| 4 | Sinkron | Teks muncul lebih dari 3 frame setelah katanya terdengar |
| 5 | Frame mati | Ada frame yang benar-benar diam (bandingkan 2 frame berjarak 10) |
| 6 | Transisi | Ada cut keras, atau scene lama hilang sebelum tinta menutup |
| 7 | Ketajaman | Emas atau merah pecah atau buram, tepi foto bergerigi, sisa latar di sekitar foto |
| 8 | Warna | Ada warna di luar palet brand |
| 9 | Ejaan | Typo atau kapitalisasi tidak konsisten (teks hanya dari JSON, perbaiki di sana) |
| 10 | Konsistensi | Ukuran judul, jarak, dan posisi kicker sama di semua scene |

## 4. Aturan presisi

| Aturan | Cara |
|---|---|
| Hasil render identik setiap kali | Render satu frame acak dua kali, hash harus sama: `npm run stills -- <id> 300` lalu bandingkan file |
| Tidak ada angka liar | Ukuran, warna, posisi dari `brand.ts`; waktu dari `timing.ts` dan cue |
| Angka besar tidak terbelah | `display: inline-block` + `whiteSpace: "nowrap"`, ukuran diperkecil kalau tidak muat |
| Font sudah termuat | Font hanya lewat `@remotion/google-fonts` di `brand.ts` (Remotion menunggu font sebelum render) |
| Gradien SVG muncul | Setiap komponen yang memakai `url(#...)` merender `GoldDefs` sendiri dengan `id` unik |
| Elemen yang bertahan sampai akhir | `out={Infinity}`, ditangani `prog` tanpa error |
| Gambar luar | Selalu `Img` + `staticFile`, bukan `<img>` biasa (Remotion menunggu gambar termuat) |

## 5. Masalah yang sudah pernah terjadi dan solusinya

| Masalah | Solusi |
|---|---|
| `inputRange [Infinity, Infinity]` di CTA | Sudah ditangani di `prog`. Jangan memanggil `interpolate` langsung dengan rentang yang bisa tak hingga |
| Badan pilar tidak terlihat | Tambahkan `<GoldDefs id={id} />` |
| Angka "3.000+" terpotong | Perkecil ukuran, `inline-block`, `nowrap` |
| Batang bambu menembus judul | Pendekkan batang kiri di `Background.tsx` |
| Durasi 30,2 detik | Pangkas naskah (target ±52 kata), jeda akhir 1,2 s |
| `remotion render --sequence` crash (EINVAL) | Pakai `npm run stills` atau lembar frame dari draft |
| Render mati di tengah | Retry otomatis sekali. Tutup Studio/preview, lalu `--from render` |
| True peak terlalu tinggi setelah AAC | Limiter di `postprocess` (sudah aktif) |

## 6. Sebelum dikirim

- [ ] `out/<id>_report.md` menyatakan semua cek lolos
- [ ] Semua cek visual di bagian 3 dicentang
- [ ] Klaim di JSON sudah dicek manusia (`reviewed: true`), atau user tahu masih `false`
- [ ] Musik (kalau ada) tercatat di `public/audio/bgm/LICENSES.md`
- [ ] Foto Shifu Po asli sudah dipakai, atau user tahu masih siluet
