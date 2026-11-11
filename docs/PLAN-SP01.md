# SP01: "Kerja Keras Punya Arah" (planning ketat)

Reels promosi 2D pertama untuk **Shifu Po, Konsultan Feng Shui & BaZi**. Dokumen ini adalah acuan tunggal: urutan kerja, isi tiap scene, aturan gerak, aset, dan cara cek kualitas. Semua fase dijalankan berurutan tanpa berhenti, kecuali kondisi di bagian 11.

Status: **Fase 0–6 selesai** (2026-11-11): `out/sp01_final.mp4`, 28,5 detik, 1080×1920, 20,3 MB, −14,2 LUFS, true peak −2,9 dB, render ulang identik; laporan `out/sp01_report.md`. Masih tanpa VO (timing perkiraan) dan dengan siluet pengganti Shifu Po. Menunggu dari user: foto cutout Shifu Po (bagian 6.4), `.env` dengan kunci dan voice ElevenLabs untuk Shifu Po (bagian 8), handle Instagram (opsional). Setelah itu cukup `npm run produce -- sp01`.

---

## 1. Tujuan

- Membuat orang yang merasa "kerja keras tapi hasil begitu-begitu saja" berhenti scroll, paham bahwa BaZi dan Feng Shui memberi **arah**, lalu chat WhatsApp.
- Terasa premium dan tenang seperti website dan banner Shifu Po, tapi **hidup**: setiap elemen bergerak halus dari scene ke scene, seperti animasi anime 2D.

## 2. Identitas brand (diambil dari website `shifupo-home-v2`)

| Item | Nilai |
|---|---|
| Nama | Shifu Po · Konsultan Feng Shui & BaZi |
| Tagline | "Supaya kerja keras Anda punya arah." |
| Warna | Tinta `#12100E`, kertas `#F8F4EC`, garis `#E2D7C3`, emas `#C9A45C` / `#9C7A35` / `#F1DDA8`, merah stempel `#A8161D` |
| Font | Plus Jakarta Sans (body, caption), Cinzel (judul serif tebal ala banner), Noto Serif SC (huruf Han), Ma Shan Zheng (huruf kuas) |
| Motif | Kertas krem, gunung tinta (sumi-e), kompas luo pan emas, bambu, stempel merah, koi, koin emas, cetak biru rumah, sudut bingkai bergaya kisi Tiongkok |
| Sapaan | "Anda" (sama dengan website) |
| CTA | "Konsultasi via WhatsApp" (tombol pil emas) |
| Angka resmi | 3.000+ klien, 850+ properti, 10+ tahun, laporan 3–7 hari kerja |

## 3. Spesifikasi

| Item | Nilai |
|---|---|
| Format | 1080×1920, 30 fps, H.264 + AAC, maks 30 MB |
| Durasi | 24–29 detik, mengikuti panjang VO |
| Loudness | −14 LUFS, true peak ≤ −1,5 dB |
| Safe area | x 64, y 314, lebar 792, tinggi 1122 (UI Reels di luar area ini) |
| Teknologi | Remotion (React, SVG). Semua gerak dihitung dari nomor frame, jadi render selalu sama dan bisa motion blur |

Kenapa Remotion dan bukan anime.js: anime.js menghitung gerak dari jam real-time, jadi tidak bisa dirender frame per frame secara pasti. Prinsip yang sama (easing, spring, stagger, path motion, timeline) dibangun di atas `interpolate`, `spring`, `@remotion/paths`, dan `@remotion/noise`.

## 4. Naskah VO

Bahasa Indonesia, hangat dan meyakinkan, sapaan "Anda". Kira-kira 2,15 kata per detik → sekitar 27 detik.

| # | Beat | VO | Kata kunci (cue) |
|---|---|---|---|
| 1 | Hook | "Kerja keras tiap hari, tapi hasilnya begitu-begitu saja?" | "keras", "begitu-begitu" |
| 2 | Insight | "Mungkin bukan kurang usaha. Arahnya yang belum tepat." | "usaha", "Arahnya" |
| 3 | BaZi | "Lewat BaZi, Shifu Po membaca empat pilar kelahiran Anda: tahun, bulan, hari, dan jam." | "BaZi", "Shifu", "tahun", "bulan", "hari", "jam" |
| 4 | Feng Shui | "Lalu menyelaraskan energi rumah dan tempat usaha, tanpa harus bongkar total." | "rumah", "tanpa" |
| 5 | Bukti | "Lebih dari tiga ribu klien sudah merasakannya." | "tiga" |
| 6 | CTA | "Konsultasi sekarang via WhatsApp. Supaya kerja keras Anda punya arah." | "WhatsApp", "arah" |

Aturan: semua teks layar dan VO hanya ada di `data/episodes/sp01.json`, divalidasi schema. Setiap cue harus muncul tepat satu kali di kalimatnya. Angka di layar harus cocok dengan angka yang diucapkan.

## 5. Storyboard dan gerak per scene

Setiap scene memiliki **benda penghubung** yang bergerak masuk ke scene berikutnya (match move), supaya tidak ada potongan mati.

### Scene 1: Hook "Kerja keras tanpa arah" (VO 1)

- **Latar:** kertas krem bertekstur, tiga lapis gunung tinta dengan kabut bergerak (parallax lambat, lapis depan paling cepat).
- **Aksi:** sosok kecil (siluet tinta) mendorong batu besar mendaki bukit. Bukit berputar seperti treadmill, jadi dia tidak pernah sampai. Tetes keringat memantul, debu tinta keluar dari kaki setiap langkah.
- **Kamera:** dorong pelan (scale 1.0 → 1.06) dengan sedikit goyang napas.
- **Teks:** "KERJA KERAS," muncul di kata "keras" (slam + garis kecepatan ala anime), lalu "HASIL BEGITU-BEGITU SAJA?" di kata "begitu-begitu" dengan goyang kecil.
- **Penghubung:** batu besar berguling ke tengah, lalu berubah jadi jarum kompas.

### Scene 2: Insight "Arahnya belum tepat" (VO 2)

- **Aksi:** kompas besar di tengah, jarumnya berputar liar (spring dengan overshoot), lalu panah-panah kuas tergambar ke delapan arah (stroke draw) dan saling bertabrakan.
- **Di kata "Arahnya":** semua panah memudar kecuali satu, jarum mengunci ke panah itu dengan "klik" (overshoot kecil lalu diam), dan percikan emas keluar.
- **Teks:** "BUKAN KURANG USAHA." lalu "ARAHNYA BELUM TEPAT." (kata "ARAH" emas).
- **Penghubung:** kompas membesar dan berubah jadi luo pan emas berlapis (cincin luar bertambah satu per satu).

### Scene 3: BaZi "Empat pilar kelahiran" (VO 3)

- **Aksi:** luo pan berputar lambat di belakang (setiap cincin dengan kecepatan dan arah berbeda). Di kata "BaZi", empat pilar lak merah-emas naik dari kabut secara bertahap (spring, stagger 3 frame).
- **Di kata "Shifu":** figur Shifu Po masuk dari kanan bawah (slide + fade + bernapas pelan). Sebelum ada foto, dipakai siluet berjubah yang memegang kipas.
- **Di "tahun", "bulan", "hari", "jam":** huruf 年 月 日 時 di tiap pilar menyala satu per satu (cahaya emas + riak), dengan label kecil TAHUN / BULAN / HARI / JAM.
- **Teks:** "BAZI" + "4 PILAR KELAHIRAN".
- **Penghubung:** pilar turun, cahaya emas mengalir menjadi pita qi.

### Scene 4: Feng Shui "Selaraskan energi rumah" (VO 4)

- **Aksi:** cetak biru rumah tergambar garis demi garis (stroke draw) di atas kertas. Di kata "rumah", pita qi emas masuk lewat pintu, berkelok melewati ruangan, dan setiap ruangan yang dilewati berpendar lembut.
- **Di kata "tanpa":** palu kecil yang mau membongkar dinding dicoret stempel merah, lalu muncul teks "TANPA BONGKAR TOTAL".
- **Teks:** "SELARASKAN ENERGI RUMAH & USAHA".
- **Penghubung:** pita qi berubah jadi aliran koin emas.

### Scene 5: Bukti "3.000+ klien" (VO 5)

- **Aksi:** dua koi berenang memutar (jalur kurva, badan meliuk, sirip bergerak sekunder). Koin emas berjatuhan dengan pantulan dan putaran. Angka berhitung 0 → 3.000+ di kata "tiga", diakhiri kilau.
- **Teks:** "3.000+" besar dan "KLIEN TELAH DIBANTU".
- **Penghubung:** koi berenang ke atas dan masuk ke stempel logo.

### Scene 6: CTA (VO 6)

- **Aksi:** pelat logo (stempel lingkaran 風 + "SHIFU PO · FENG SHUI") terbentuk dari tinta yang menyebar. Sudut bingkai kisi merah tergambar di empat sudut. Figur Shifu Po kembali, kipas bergoyang pelan.
- **Di kata "WhatsApp":** tombol pil emas "Konsultasi via WhatsApp" pop dengan kilau yang lewat.
- **Di kata "arah":** tagline "Supaya kerja keras Anda punya arah." dengan "arah" emas.
- **Penutup:** tahan 1,2 detik, kelopak dan kabut tetap bergerak (tidak ada frame beku).

## 6. Aturan gerak "anime smooth" (wajib)

1. **Tidak ada gerak linear** untuk benda yang terlihat. Pakai kurva ease atau spring dari `src/lib/motion.ts`.
2. **Antisipasi dan overshoot:** benda besar mundur sedikit sebelum bergerak, lalu melewati sasaran 3–8% dan kembali.
3. **Overlap dan follow-through:** bagian yang menempel (ekor koi, kain jubah, rumbai kipas, debu) bergerak terlambat 2–6 frame dari badannya.
4. **Stagger:** grup (pilar, panah, koin, huruf) masuk bergiliran 2–4 frame, tidak serentak.
5. **Selalu ada gerak kecil:** kabut, kelopak, napas kamera, partikel. Tidak ada frame yang benar-benar diam.
6. **Parallax:** minimal tiga lapis kedalaman per scene, dengan kecepatan berbeda.
7. **Transisi:** antar scene memakai match move (bagian 5) ditambah percikan tinta (mask organik dari noise), sekitar 14 frame. Tidak ada cut keras.
8. **Garis kecepatan dan impact frame ala anime** hanya di momen penekanan (hook, kunci arah), maksimal 4 frame.
9. **Motion blur** pada benda cepat (jarum, batu berguling, koin jatuh) lewat sub-frame Remotion.
10. **Acak tapi pasti:** semua variasi memakai `random(seed)` atau `@remotion/noise`, tidak pernah `Math.random`.

### 6.4 Figur Shifu Po (aset dari user)

- File: `public/assets/shifu/shifu.png`, PNG transparan (latar dihapus), potret setengah badan sampai seluruh badan, tinggi minimal 1600 px.
- Opsional untuk gerak lebih hidup: `shifu-fan.png` (lengan dan kipas terpisah), supaya kipas bisa bergoyang.
- Selama file belum ada, dipakai siluet tinta berjubah. Begitu file ditaruh, render ulang akan langsung memakai foto, tanpa ubah kode.

## 7. Aset (dibuat sendiri dengan kode, tanpa lisensi pihak ketiga)

| Aset | Gerak |
|---|---|
| Kertas bertekstur | Statis, noise halus deterministik |
| Gunung tinta 3 lapis + kabut | Parallax, kabut mengalir dengan noise |
| Kelopak dan partikel emas | Jatuh dengan liukan noise, putaran, kedalaman blur |
| Sosok pendorong batu | Siklus jalan 8 pose, batu berputar sesuai jarak, debu langkah |
| Kompas dan jarum | Spring dengan overshoot, klik kunci |
| Panah kuas | Stroke draw dengan ujung kuas meruncing |
| Luo pan emas | 5 cincin (huruf, garis skala, trigram), putaran berbeda per cincin |
| Pilar lak 年月日時 | Naik dengan spring, huruf menyala, riak cahaya |
| Cetak biru rumah | Garis tergambar berurutan, ruangan berpendar |
| Pita qi | Jalur kurva dengan ujung bercahaya dan ekor memudar |
| Stempel merah | Hentak (scale 1.3 → 1) dengan tekstur tinta |
| Koi | Jalur kurva, badan meliuk sinus, sirip follow-through |
| Koin emas | Jatuh, berputar 3D semu (scaleX), memantul |
| Pelat logo, sudut bingkai, tombol pil | Tergambar atau pop sesuai cue |
| Siluet Shifu Po (placeholder) | Napas, kipas bergoyang |

## 8. Suara

| Lapisan | Rencana |
|---|---|
| VO | ElevenLabs `eleven_multilingual_v2`, voice pria dewasa yang tenang. Kunci dan voice ID diisi user di `.env` proyek ini |
| SFX | Disintesis ffmpeg (`npm run sfx`): gong lembut, denting lonceng angin, sapuan kuas, whoosh tinta, klik kompas, denting koin, hentak stempel, pop teks |
| BGM | Hanya lagu berlisensi komersial (dicatat di `public/audio/bgm/LICENSES.md`); sementara tanpa BGM |
| Mix | VO paling depan, tiap kalimat disamakan ke −25 LUFS sebelum mix, hasil akhir −14 LUFS |

Selama `.env` belum diisi, video dirender tanpa VO dengan timing perkiraan, supaya animasi tetap bisa dicek. Begitu `.env` ada, `npm run produce -- sp01` mengulang semuanya dengan VO asli.

## 9. Timing

- Durasi tiap beat dihitung dari file VO (atau perkiraan dari jumlah kata kalau belum ada).
- Setiap kejadian visual diikat ke **kata**, bukan ke detik. Teks mendahului katanya 3 frame.
- SFX ditempel ke cue yang sama dengan visualnya.

## 10. Urutan fase (ketat)

| Fase | Isi | Gerbang lolos |
|---|---|---|
| 0 | Proyek, konfigurasi, CLAUDE.md, skill, izin, pipeline | `npm run lint` dan `npm test` lolos |
| 1 | Naskah di `sp01.json` + schema + test cue | Test cue dan angka lolos |
| 2 | Sistem visual: token, kurva gerak, kertas, tinta, partikel, transisi | Lembar still per elemen terlihat rapi |
| 3 | Aset dan animasi enam scene + slot Shifu Po | Lembar frame tiap 0,5 detik tanpa frame diam, tanpa tabrakan |
| 4 | Teks layar dan caption | Semua teks di safe area, tidak menumpuk subjek, crop 100% tajam |
| 5 | SFX dan mix | Suara jatuh di frame cue, VO di depan |
| 6 | Render final, postprocess, QA | Laporan QA lolos: durasi, ukuran, loudness, true peak, (whisper bila ada VO) |

## 11. Kapan berhenti dan bertanya

Hanya untuk:
- Aset yang hanya user punya: foto Shifu Po, logo resmi kalau berbeda dari website, handle Instagram.
- Kunci atau voice ElevenLabs.
- Error fatal yang tetap gagal setelah tiga kali diperbaiki.

Selain itu semua fase berjalan otomatis.

## 12. QA akhir

- Lembar frame satu per detik dan crop 100% setiap kartu teks.
- Tidak ada typo: teks hanya dari JSON, test menjaga cue dan angka.
- Render ulang satu frame acak harus identik.
- Laporan otomatis `out/sp01_report.md`.
