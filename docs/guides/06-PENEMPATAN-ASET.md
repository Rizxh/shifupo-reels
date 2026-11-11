# 06. Penempatan aset

Dua hal: **di folder mana file disimpan**, dan **di bagian frame mana aset diletakkan**.

Sebelumnya: [05-ASET-3D.md](05-ASET-3D.md) · Lanjut ke: [07-ANIMASI.md](07-ANIMASI.md)

---

## 1. Folder file

| Folder | Isi | Ikut ke Git |
|---|---|---|
| `public/assets/shifu/` | `shifu.png` (wajib), `shifu-fan.png` (opsional) | Ya |
| `public/assets/brand/` | Logo resmi (`logo.svg` atau `logo.png`), kalau berbeda dari stempel 風 bawaan | Ya |
| `public/assets/2d/common/` | Aset raster yang dipakai banyak episode | Ya |
| `public/assets/2d/<id>/` | Aset raster khusus satu episode, misalnya `2d/sp02/` | Ya |
| `public/assets/3d/<nama>/` | Urutan PNG hasil render 3D + `README.md` | Ya (jaga ukurannya) |
| `public/audio/sfx/` | SFX hasil `npm run sfx` | Ya |
| `public/audio/bgm/` | Musik berlisensi + `LICENSES.md` | Ya |
| `public/audio/<id>/` | VO hasil `npm run tts` | Tidak (dibuat ulang) |
| `src/components/` | Aset vektor dari kode | Ya |

Di kode, path ditulis relatif terhadap `public/` dan selalu lewat `staticFile()`:

```tsx
staticFile("assets/2d/sp02/lantern-red.png")
```

Path yang dipakai di lebih dari satu tempat menjadi konstanta di `src/lib/brand.ts` (contohnya `SHIFU.photo`). Untuk aset yang mungkin belum ada, cek dengan `hasStaticFile()` dan sediakan cadangan vektor.

## 2. Peta frame 1080 × 1920

Semua angka di bawah berasal dari `src/lib/brand.ts`. Jangan menulis ulang angkanya, impor konstantanya.

```
 x=0                                     x=920  x=1080
 ┌──────────────────────────────────────────┬──────┐ y=0
 │   Zona IG atas (SAFE_ZONE.top = 250)     │      │
 ├──┬───────────────────────────────────┬───┤      │ y=250
 │  │ GUTTER 64                         │   │      │
 │  ├───────────────────────────────────┤   │ Zona │ y=314  ← SAFE_AREA.y = HEADLINE.top − 10
 │  │  JUDUL / KICKER                   │   │ IG   │
 │  │  (HeadlineStack, ±2 baris)        │   │ kanan│
 │  │                                   │   │ 160  │
 │  │          ● STAGE (540, 1010)      │   │      │ ← pusat subjek scene
 │  │        subjek: kompas, luo pan,   │   │      │
 │  │        denah, koi                 │   │      │
 │  │                                   │   │      │
 │  ├───────────────────────────────────┤   │      │ y=1246 ← CAPTION.y
 │  │  CAPTION (190 px)                 │   │      │
 │  └───────────────────────────────────┘   │      │ y=1436 ← bawah SAFE_AREA
 ├──────────────────────────────────────────┤      │
 │   Zona IG bawah (SAFE_ZONE.bottom = 420) │      │
 └──────────────────────────────────────────┴──────┘ y=1920
      SAFE_AREA = x 64, y 314, lebar 792, tinggi 1122
```

| Zona | Konstanta | Yang boleh ada di sana |
|---|---|---|
| Area aman | `SAFE_AREA` | **Semua teks dan tombol.** Tidak ada pengecualian |
| Judul | `HEADLINE.top` sampai ±560 | Kicker, judul, stempel |
| Panggung | `STAGE.cx`, `STAGE.cy` | Subjek utama scene, berpusat di sini |
| Caption | `CAPTION.y`, `CAPTION.height` | Hanya caption otomatis |
| Zona IG (atas, bawah, kanan) | `SAFE_ZONE` | Hanya latar dan bagian ilustrasi yang boleh terpotong (bambu, gunung, badan figur). Tidak ada informasi penting |

Figur Shifu Po boleh keluar dari area aman di bagian bawah (badan terpotong frame), asal wajah dan kipas di dalam area aman dan tidak tertutup teks. Di SP01: BaZi `x 930`, CTA `x 830`, kaki di bawah frame (`baseY = H + 60`).

## 3. Urutan tumpukan (siapa di depan)

Urutan render di JSX = urutan tumpukan. Yang ditulis belakangan berada di depan.

```
Dunia (Reel.tsx) → subjek SVG → efek (Sparkles) → Shifu → HeadlineStack → caption (Reel.tsx)
```

- Teks selalu di atas subjek. Kalau subjek menimpa teks, **pindahkan subjeknya**, jangan teksnya.
- Jangan memakai `zIndex` acak. Ubah urutan JSX.

## 4. Cara meletakkan aset di scene

Komponen digambar di sekitar titik (0,0); scene yang menentukan posisinya. Posisi menjadi konstanta bernama di atas file scene:

```tsx
// src/scenes/Scenes.tsx
const LUOPAN = { x: 372, y: 900 } as const;

<g transform={`translate(${LUOPAN.x} ${LUOPAN.y})`}>
  <Luopan start={start} id="bazi-luopan" />
</g>
```

Untuk grup (pilar, koin), hitung posisi dengan fungsi dari ukuran grupnya, seperti `pillarX(i, count)`, supaya grup tetap simetris kalau jumlahnya berubah.

## 5. Mengecek penempatan

1. `npm run studio`: overlay area aman (garis putus merah) aktif karena `debug: true`.
2. Geser ke frame setiap kartu teks dan pastikan tidak ada teks yang menyentuh garis merah.
3. Frame ukuran penuh: `npm run stills -- <id> <frame> --scale 1`.
4. Render final selalu memakai `debug: false`, jadi overlay tidak ikut ke video.
