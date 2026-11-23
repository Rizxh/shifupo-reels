# SP10 — "KITA PAY JAY SEN" versi 2D (Motion Format paper cartoon)

## 1. Arah kreatif

- **Isi:** storyboard klien "Alur Animasi per Lirik" yang sama dengan sp09 (18 baris, 72 detik, 4 detik per baris lirik). Tidak ada VO, karena lirik itu dinyanyikan di lagu. Musik sementara `pay-jay-sen-temp.wav` (120 BPM) dipakai sampai lagu asli tersedia.
- **Penonton:** pengikut Shifu Po, pemilik usaha keluarga (ruko, toko, warung).
- **Janji:** rezeki tumbuh dari usaha, kejujuran, dan berbagi (tagline klien).
- **Gaya:** 2D paper cartoon yang lucu dan berwarna, seperti sp07 yang disukai user, bukan hitam putih. Logika gerak Motion Format:
  - kamera dengan titik fokus yang mengikuti subjek, plus parallax 4 lapis;
  - squash & stretch saat mendarat;
  - motion blur terarah pada gerak cepat;
  - gerak sekunder: lampion bergoyang, kedip, asap, kilau;
  - SFX per mikro-kejadian;
  - "kantong teks": partikel menghindari lirik.
- **Dunia:** satu set panjang berbentuk penampang ruko seperti rumah boneka. Kiri ke kanan: altar Cai Shen → lantai toko (rak, meja kasir, meja makan) → pintu merah berukir → jalan pasar (kios, lampion, kotak amal) → langit sore.
- **Kamera:** kamera berjalan di atas set ini dengan pan, zoom dan crane. Lebih banyak gerak kamera kontinu, sedikit hard cut. Montase memakai potongan cepat dengan wipe kertas.

## 2. Storyboard (perbaikan dibanding sp09 ditandai ★)

| Detik | Lirik | Visual 2D | Kamera / transisi |
|---|---|---|---|
| 0–4 | (intro) | Layar gelap, asap dupa membentuk tulisan "KITA PAY JAY SEN", lampion menyala satu per satu | Zoom-in pelan, partikel emas |
| 4–8 | KITA PAY JAY SEN | Tangan kakek memegang dupa lalu menunduk → wajah Cai Shen tersenyum | Close-up tangan → cut ke wajah |
| 8–12 | PINTU TERBUKA | ★ Match cut: asap dupa berubah jadi cahaya pintu. Pintu berukir terbuka, rak penuh, pasar ramai | Kamera mengikuti cahaya dari altar ke pintu |
| 12–16 | KAYA DAN JAYA | ★ Split-screen kertas: Cai Shen memberi restu di kiri, ruko jadi ramai di kanan | Dua panel, kilau emas mengalir antar-panel |
| 16–20 | ADA SEBABNYA | Montase: buka toko pagi, menata barang, menyapu, mencatat jujur, masing-masing dengan ikon | 4 potongan cepat dengan wipe kertas |
| 20–24 | SIKON MENUNJANG | Tetangga mengangkat barang, pembeli menunjuk ramah, pedagang berbagi keranjang | Pan dari lorong pasar ke ruko |
| 24–28 | RAMAH ORANGNYA | Ibu tersenyum, anak menyerahkan kantong, kakek menawarkan teh; hati emas kecil | Close-up senyum dan anggukan |
| 28–32 | GIAT USAHA | Antrean pembeli, timbangan, barang diangkat; Cai Shen mengamati bangga | Tracking mengikuti alur pelanggan |
| 32–36 | BERKAT BERLIMPAH | Partikel emas dari asap jatuh ke rak, panci, keranjang; rak jadi penuh | Zoom-out memperlihatkan ruko makmur |
| 36–40 | PAY JAY SEN | Keluarga menanam dupa, Cai Shen mengangguk, asap membentuk lingkaran emas, lampion lebih terang | Fokus dupa → Cai Shen |
| 40–44 | DAPAT PAHALA | Cahaya emas mengalir ke keluarga lalu ke tetangga; anak memberi makanan ke tukang bersih jalan | Kamera mengikuti aliran cahaya |
| 44–48 | PAY JAY SEN | Cai Shen mengangkat yuanbao, harimau hitam kecil mengedip | Close-up, kilau di yuanbao |
| 48–52 | HARTA MERUAH | ★ Sungai koin dan ingot tersebar ke pasar, keluarga, dan **kotak amal** | Crane up ke pasar |
| 52–56 | PAY JAY SEN | Keluarga dan tetangga sembahyang bersama, lampion bergoyang | Wide, kamera berputar pelan (parallax) |
| 56–60 | HOKGI BERTAMBAH | ★ Montase: anak bermain, pembeli tersenyum, makan bersama; teks kecil "HOKGI" di kilau emas | 3 potongan cepat |
| 60–64 | PAY JAY SEN | ★ Dupa terakhir ditancapkan, asap naik membentuk kata "JAY SEN" | Kamera naik mengikuti asap ke langit sore |
| 64–68 | HOKGI BERTAMBAH | Wide ruko dan pasar, keluarga menunduk syukur, Cai Shen memudar ke cahaya | Zoom-out, fade to gold |
| 68–72 | (outro) | Logo, judul "KITA PAY JAY SEN", asap dan koin emas, tagline | Fade out |

## 3. Aset (semua SVG orisinal, kode)

- **Karakter kertas chibi ber-rig** (kepala, badan, lengan, kaki dengan pivot), memakai `src/core/paper` dan `Face`: kakek, ayah, ibu, anak, 2 tetangga, 3 pembeli, anak jalanan, tukang bersih jalan.
- **Cai Shen kertas:** jubah merah emas, topi bersayap, jenggot, yuanbao.
- **Harimau hitam kecil.**
- **Set:** altar, rak barang, meja kasir dengan timbangan, meja makan, pintu berukir, kios pasar, lampion, kotak amal, langit sore.
- **Efek:** asap (morph jadi teks), partikel emas, sungai koin, hati emas, belah ketupat 福.

## 4. Teknis

- Format `mv` dipakai ulang (lirik, overlay, musik, cut). Ditambah dunia **2D**: registry `MV_WORLDS` mendapat jenis `2d` yang dirender SVG, bukan Stage3D.
- Episode `data/episodes/sp10.json`: tabel lirik yang sama, `world: "ruko2d"`.
- QA:
  - review loop 3 putaran;
  - `qc-motion` (target energi ≥ 5; 2D flat biasanya ~3, jadi diusahakan dengan kamera dan gerak sekunder);
  - teks di safe area, ≤ 30 MB, loudness -14 LUFS.

## 5. Klaim / risiko

- Klaim tradisi Cai Shen: `reviewed: false`, perlu konfirmasi Shifu Po.
- Lirik dan tagline dari storyboard klien. Musik sementara sampai lagu asli ada.
- Risiko: 18 shot × karakter ber-rig = pekerjaan besar. Render 2D lebih cepat dari 3D (~10 menit).
