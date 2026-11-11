# 04. Aset 2D

Gaya utama proyek ini adalah 2D: lukisan tinta (sumi-e) di atas kertas krem, aksen emas dan merah stempel. Aset 3D dibahas terpisah di [05-ASET-3D.md](05-ASET-3D.md).

Sebelumnya: [03-SCENE-BY-SCENE.md](03-SCENE-BY-SCENE.md) · Lanjut ke: [05-ASET-3D.md](05-ASET-3D.md)

---

## 1. Dua jenis aset 2D

| Jenis | Kapan dipakai | Lokasi |
|---|---|---|
| **Vektor dari kode (SVG di React)** | Hampir semua aset: ilustrasi, ikon, ornamen, partikel. Tajam di ukuran berapa pun, bisa dianimasikan per bagian, gratis lisensi | `src/components/*.tsx` |
| **Raster (PNG/WebP transparan)** | Foto asli (Shifu Po, logo resmi) atau ilustrasi gambar tangan yang terlalu rumit untuk kode | `public/assets/...` (lihat [06-PENEMPATAN-ASET.md](06-PENEMPATAN-ASET.md)) |

Utamakan vektor dari kode. Raster hanya untuk hal yang memang harus foto atau gambar tangan.

## 2. Katalog aset yang sudah ada

| Komponen | File | Isi dan gerak bawaan |
|---|---|---|
| `Paper`, `InkMountains`, `Bamboo`, `Petals` | `Background.tsx` | Kertas, gunung tinta 3 lapis + kabut (parallax), bambu bergoyang, kelopak plum |
| `PusherScene` | `Pusher.tsx` | Sosok mendorong batu di bukit berputar, debu langkah, keringat |
| `CompassScene` | `Compass.tsx` | Kompas, jarum mencari lalu terkunci dengan pegas |
| `Luopan` | `Luopan.tsx` | Luo pan emas 5 cincin (24 gunung, trigram), putaran berbeda per cincin |
| `Pillars` | `Pillars.tsx` | Empat pilar lak 年月日時, naik dengan pegas, huruf menyala per cue |
| `Blueprint` | `Blueprint.tsx` | Denah rumah tergambar garis demi garis, pita qi emas |
| `KoiPair`, `KoiFish`, `Coins` | `Koi.tsx` | Koi meliuk dengan sirip follow-through, koin jatuh dan memantul |
| `Shifu` | `Shifu.tsx` | Foto Shifu Po kalau ada, kalau tidak siluet tinta berjubah |
| `LogoPlate`, `CornerFrames`, `WhatsAppButton` | `Brand.tsx` | Stempel logo, sudut bingkai merah, tombol pil emas |
| `GoldDefs`, `SpeedLines`, `Sparkles`, `InkSplash`, `inkBlotClip` | `Fx.tsx` | Gradien emas, garis kecepatan, kilau, percikan dan transisi tinta |
| `HeadlineLine`, `HeadlineStack`, `Kicker`, `Caption` | `Text.tsx` | Judul (rise/slam), garis kuas, kicker, caption kotak |

Pakai ulang dulu sebelum membuat yang baru.

## 3. Membuat aset vektor baru

Kerangka komponen:

```tsx
// src/components/Lantern.tsx
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/brand";
import { breathe, drift, springAt, SPRING } from "../lib/motion";
import { GoldDefs } from "./Fx";

// Lantern that drops in on `start`, then sways.
export const Lantern: React.FC<{ start: number; id: string; scale?: number }> = ({
  start,
  id,
  scale = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = springAt(frame, start, fps, SPRING.pop);
  const sway = drift(`${id}-sway`, frame, 0.02) * 4;
  return (
    <g transform={`translate(0 ${(1 - t) * -200}) rotate(${sway}) scale(${scale * breathe(frame, fps)})`}>
      <GoldDefs id={id} />
      <ellipse rx={60} ry={80} fill={COLORS.seal} stroke={`url(#${id}-gold)`} strokeWidth={6} />
    </g>
  );
};
```

Aturan:

| Aturan | Detail |
|---|---|
| Warna | Hanya dari `COLORS` / `GOLD_GRADIENT` di `src/lib/brand.ts`. Tidak ada hex di komponen |
| Gradien | Setiap komponen yang memakai `url(#...)` wajib merender `<GoldDefs id={id} />` dengan `id` unik. Tanpa itu bentuknya tidak terlihat |
| Titik asal | Gambar di sekitar (0,0). Posisi di frame ditentukan oleh scene lewat `translate`, bukan di dalam komponen |
| Props waktu | Terima `start` / `cue` / `exitStart` dalam frame. Jangan menghitung detik |
| Acak | `random(seed)` dari Remotion atau `drift(seed, frame)`. Seed unik per komponen |
| Garis tinta | Ujung meruncing, ketebalan bervariasi (kuas), bukan garis rata seperti ikon |
| Detail | Cukup besar untuk layar HP: garis minimal 3 px, teks dalam aset minimal 28 px |

## 4. Aset raster (PNG/WebP)

| Spesifikasi | Nilai |
|---|---|
| Format | PNG transparan (atau WebP lossless), warna sRGB |
| Ukuran | Minimal 1,5× ukuran tampil. Figur setinggi layar: tinggi ≥ 1600 px |
| Potongan | Rapi, tanpa sisa latar (terlihat jelas di atas kertas terang) |
| Nama file | huruf kecil, tanda hubung: `lantern-red.png` |
| Bagian terpisah | Bagian yang bergerak (lengan, kipas) dalam file terpisah dengan ukuran kanvas yang sama, supaya bisa ditumpuk tepat |

Cara memakai di kode:

```tsx
import { Img, staticFile } from "remotion";
import { hasStaticFile } from "../lib/assets";

const SRC = "assets/2d/sp02/lantern-red.png";
// Fallback ke vektor selama file belum ada.
return hasStaticFile(SRC) ? <Img src={staticFile(SRC)} /> : <Lantern start={start} id="lantern" />;
```

Path file tetap ditaruh di `src/lib/brand.ts` (seperti `SHIFU.photo`) kalau dipakai di lebih dari satu tempat.

## 5. Lisensi

- Semua ilustrasi dibuat sendiri (kode atau gambar tangan tim).
- Foto Shifu Po dan logo dari pemilik brand.
- Jangan memakai karakter, gaya, atau aset studio lain, termasuk yang "mirip".
- Kalau suatu saat memakai aset luar, lisensinya harus komersial dan dicatat di `public/assets/2d/LICENSES.md`.
