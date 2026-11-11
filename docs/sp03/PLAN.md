# SP03: "Usaha Jalan, Pelanggan Sepi" (format keluar layar + foto asli, ±19 detik)

Status: **Selesai tanpa VO** (`out/sp03_final.mp4`, 19,5 detik, 11,3 MB, −14,3 LUFS, semua cek lolos). Menunggu `.env` ElevenLabs, lalu jalankan `npm run produce -- sp03`.

Acuan: `docs/sp02/PLAN.md` (aturan ilusi keluar layar) dan `CLAUDE.md` (siklus review visual).

## 1. Tujuan

- Penonton: pemilik usaha, toko, dan kantor yang merasa usahanya sepi padahal sudah berjalan.
- Layanan: Feng Shui Kantor/Bisnis (kata pertama di tagline logo: "Business, Love & Life").
- Pertama kali memakai **aset asli dari shifupofengshui.com**: logo resmi, foto Shifu Po saat konsultasi, foto kartu layanan bisnis. Sumber dicatat di `public/assets/2d/common/site/SOURCES.md`.

## 2. Klaim

| Klaim | Status |
|---|---|
| 850+ properti telah ditangani (angka resmi situs) | `reviewed: false` |
| Posisi meja dan pintu usaha sebagai kemungkinan penyebab usaha sepi | `reviewed: false` |

## 3. Naskah VO (34 kata)

| # | Scene | VO | Cue |
|---|---|---|---|
| 1 | `chart` | "Usaha sudah jalan, tapi pelanggan tetap sepi?" | jalan, pelanggan, sepi (panah terjun keluar) |
| 2 | `turn` | "Bisa jadi, posisi meja dan pintu usaha Anda belum selaras." | meja, belum, selaras (jarum terkunci) |
| 3 | `count` | "Shifu Po sudah menangani lebih dari delapan ratus lima puluh properti." | Shifu, delapan (koin meledak, 850+) |
| 4 | `cta` | "Konsultasi bisnis Anda sekarang via WhatsApp." | Konsultasi, WhatsApp (tombol keluar) |

## 4. Storyboard

| Scene | Dalam jendela | Momen keluar layar |
|---|---|---|
| chart | Foto kartu "Fengshui Kantor/Bisnis" (balok core values), digelapkan, grafik penjualan emas tergambar turun | Di "sepi", anak panah merah melesat keluar bingkai ke arah penonton lalu jatuh keluar layar |
| turn | Foto asli konsultasi di depan pagoda | Luo pan naik di atas meja konsultasi, terbang keluar bingkai, jarum terkunci di "selaras" |
| count | Ruang emas + ingot dengan koin meloncat | Koin meledak keluar, angka 850+ menembus sisi bingkai |
| cta | Foto asli Shifu Po (baju merah-hitam) sedang konsultasi | Logo resmi di atas; tombol WhatsApp keluar bingkai |

## 5. Teknis baru

- Scene `chart` di format `popout` (grafik + panah terjun).
- Field `photo` di setiap scene popout: foto asli menggantikan dunia gambar di dalam jendela (Ken Burns, grading hangat, vignette tinta).
- `figure: "none"` di CTA: Shifu Po tidak dicondongkan keluar karena fotonya sudah ada di dalam jendela.
- `brand.logo`: CTA menampilkan logo resmi menggantikan nama yang diketik.
- Urutan scene popout kini fleksibel: dibuka `chart` atau `leap`, diakhiri `cta`, 3–5 scene.
- Test baru `tests/assets.test.ts`: setiap path foto/logo di episode harus ada di `public/`.

## 6. Yang perlu manusia

- `.env` ElevenLabs.
- Cek dua klaim di atas.
- Foto Shifu Po berlatar transparan resolusi tinggi masih dibutuhkan untuk format yang mencondongkan Shifu keluar bingkai (`figure: "lean"`).
