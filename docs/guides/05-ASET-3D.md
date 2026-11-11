# 05. Aset 3D

Proyek ini bergaya **2D**. 3D hanya dipakai sebagai aksen kalau sebuah benda memang lebih kuat ditampilkan berputar dalam ruang, misalnya luo pan yang dimiringkan, kodok emas, atau maket rumah. Hasil 3D harus terlihat menyatu dengan dunia tinta dan kertas, bukan seperti render produk yang menempel.

Sebelumnya: [04-ASET-2D.md](04-ASET-2D.md) · Lanjut ke: [06-PENEMPATAN-ASET.md](06-PENEMPATAN-ASET.md)

---

## 1. Kapan memakai 3D

| Pakai 3D | Tetap 2D |
|---|---|
| Benda berputar 360° atau kamera mengelilinginya | Benda yang hanya masuk, bergeser, atau menyala |
| Perspektif ruangan (denah menjadi rumah 3D) | Ikon, ornamen, partikel, teks |
| Material yang harus berkilau nyata (emas, giok) dalam close-up | Latar dunia (gunung, bambu, kertas) |

Kalau ragu, buat 2D dulu. Rotasi semu (`scaleX` seperti koin di `Koi.tsx`) sering sudah cukup.

## 2. Cara yang dipakai: render terlebih dulu, lalu tempel

3D **tidak** dirender langsung di dalam Remotion. Benda dimodelkan dan dirender di Blender menjadi urutan PNG transparan, lalu dimainkan sebagai lapisan di scene.

| Alasan | Penjelasan |
|---|---|
| Render stabil | Tidak ada risiko WebGL atau GPU berbeda di laptop lain. Hasil frame selalu sama |
| Cepat | Remotion hanya menempel gambar, render video tetap ringan |
| Gaya terkendali | Shading toon dan garis tinta diatur di Blender, dicek per frame |

## 3. Gaya agar menyatu dengan 2D

| Aspek | Aturan |
|---|---|
| Shading | Toon/cel 2–3 tingkat terang, bukan realistis. Bayangan diwarnai `inkSoft`, bukan hitam |
| Garis | Outline tinta (Freestyle atau Line Art) warna `ink`, ketebalan sedikit bervariasi |
| Warna | Hanya palet `src/lib/brand.ts`: gold `#C9A45C` / `#9C7A35` / `#F1DDA8`, seal `#A8161D`, ink `#12100E`, jade `#2E7D63` |
| Cahaya | Satu cahaya utama dari kiri atas (sama dengan bayangan di aset 2D), rim light emas tipis |
| Latar | Transparan (film transparent). Bayangan jatuh dibuat 2D di Remotion |
| Gerak | Kurva Bezier dengan ease in/out di Blender. Tidak boleh linear, sesuai [07-ANIMASI.md](07-ANIMASI.md) |

## 4. Spesifikasi ekspor

| Item | Nilai |
|---|---|
| Format | Urutan PNG RGBA 8-bit, sRGB (Color Management: Standard, bukan Filmic/AgX) |
| Frame rate | 30 fps, sama dengan video |
| Resolusi | Sebesar ukuran tampil × 1,25 (misalnya benda 600 px di layar → render 750 px persegi) |
| Durasi | Sepanjang aksi yang dibutuhkan saja (biasanya 30–90 frame). Bagian diam bisa diulang di Remotion |
| Penamaan | `0001.png`, `0002.png`, ... (4 digit, mulai 1) |
| Ukuran | Usahakan total di bawah 40 MB per aset; kompres dengan `oxipng` atau ekspor WebP lossless kalau perlu |

Simpan file `.blend` sumbernya di luar repo (Drive tim), dan catat lokasinya di `README.md` folder asetnya.

## 5. Lokasi dan cara memakai

```
public/assets/3d/<nama-aset>/
├─ README.md        sumber .blend, frame awal-akhir, siapa pembuatnya
├─ 0001.png
├─ 0002.png
└─ ...
```

Contoh komponen pemutar:

```tsx
import { Img, staticFile, useCurrentFrame } from "remotion";

// Plays public/assets/3d/<name>/0001.png... from `start`, holding the last frame.
export const Sequence3D: React.FC<{ name: string; frames: number; start: number; size: number }> = ({
  name,
  frames,
  start,
  size,
}) => {
  const frame = useCurrentFrame();
  const i = Math.min(frames, Math.max(1, frame - start + 1));
  const file = `assets/3d/${name}/${String(i).padStart(4, "0")}.png`;
  return <Img src={staticFile(file)} style={{ width: size, height: size }} />;
};
```

Jumlah frame dan ukuran tampil ditaruh sebagai konstanta (di `src/lib/brand.ts` atau di atas file scene), bukan angka langsung di JSX. Posisi di frame mengikuti aturan [06-PENEMPATAN-ASET.md](06-PENEMPATAN-ASET.md).

## 6. Checklist aset 3D

- [ ] Benar-benar butuh 3D (lihat bagian 1)
- [ ] Shading toon, outline tinta, palet brand
- [ ] PNG transparan, 30 fps, penamaan 4 digit
- [ ] Tepi bersih (tidak ada halo putih atau hitam di atas kertas krem)
- [ ] Tiba di pose kunci tepat di frame cue
- [ ] `README.md` di folder aset diisi
