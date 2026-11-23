# 05. Aset 3D

3D dibuat langsung di Remotion dengan **React Three Fiber** (`@remotion/three` + `@react-three/drei` + `@react-three/postprocessing`), bukan di Blender. Keputusan pengguna 13 Nov 2026: lebih ringan, detail dan pewarnaannya lebih bagus, dan semuanya tetap kode yang bisa diulang. Pipeline Blender (`scripts/blender/`, `npm run render3d`) hanya arsip; jangan dipakai untuk episode baru.

Sebelumnya: [04-ASET-2D.md](04-ASET-2D.md) · Lanjut ke: [06-PENEMPATAN-ASET.md](06-PENEMPATAN-ASET.md)

---

## 1. Kapan memakai 3D

| Pakai 3D (format `cinema` + `world`) | Tetap 2D (`story` / `popout`) |
|---|---|
| Ruang yang diceritakan: kantor, rumah, toko, diorama | Ikon, ornamen, teks, partikel datar |
| Kamera harus bergerak di dalam ruang (crane, orbit, POV, top-down) | Dunia lukisan tinta, gunung, bambu |
| Benda fisik yang jatuh, memantul, berputar (koin, meja, pintu) | Gerak masuk/geser sederhana |

## 2. Susunan (shared core + produk)

| Bagian | Lokasi | Isi |
|---|---|---|
| Rig kamera | `src/core/three/rig.ts` | Shot = keyframe per kanal dengan easing; kamera **berjalan** dari akhir shot ke awal shot berikutnya (match move, tanpa cut kosong); handheld idle; `projectToScreen` untuk anotasi |
| Panggung | `src/core/three/Stage3D.tsx` | `ThreeCanvas`, cahaya environment dari panel prosedural (tanpa unduh HDR), bayangan lembut, post: N8AO, depth of field, bloom, AgX, vignette, SMAA |
| Tekstur | `src/core/three/textures.ts` | Kayu, plester, karpet, lukisan tinta, layar: digambar di canvas dengan seed (tanpa file berlisensi) |
| Anotasi | `src/core/fx/marks.tsx` | Lingkaran coretan, panah + catatan tangan, stempel (bahasa layar Motion Format), menempel ke titik 3D |
| Dunia | `src/products/shifupo/worlds/<nama>.tsx` + `<nama>Config.ts` | Mesh, fisika, event cerita, anchor, suara per benturan, kamera per shot, look |
| Registri | `src/products/shifupo/worlds/index.ts` | `WORLDS` |

Episode memilih dunia dengan `"world": "office"`; tiap scene memakai `shot` (nama kamera), `events` (aksi dunia pada kata VO) dan `marks` (anotasi pada kata VO).

## 3. Aturan wajib

| Aturan | Alasan |
|---|---|
| Semua gerak dari `frame` (prop dunia) dan frame event (`ev`); tidak ada `useFrame` untuk animasi, tidak ada helper drei yang bergerak sendiri (`Sparkles`, `Cloud`, `Float`) | Render deterministik per frame, tidak berkedip |
| Tidak memakai preset `Environment` drei yang mengunduh HDR atau `Text` drei yang mengunduh font | Render tidak boleh bergantung pada CDN |
| Setiap benda yang bergerak punya hukum fisika (`core/motion/physics.ts`: pegas, pantulan + `bounceImpacts`, proyektil dengan hambatan) | Gerak terasa nyata, bukan geser |
| Setiap benturan fisik punya suara (`world.sounds`) | Motion Format: suara per mikro-kejadian |
| Kamera tiap beat berbeda dan selalu bergerak sedikit (handheld) | Tidak ada frame mati |
| Permukaan besar wajib bertekstur (kayu, plester, karpet), benda pakai `RoundedBox`/bevel | Menghindari kotak polos |
| Teks dan catatan tangan tidak boleh menimpa subjek: cek still per beat | Kebersihan layar |

## 4. Catatan teknis

- WebGL di render headless memakai `Config.setChromiumOpenGlRenderer("angle")` (`remotion.config.ts`).
- `ThreeCanvas` menggambar sebelum `EffectComposer` siap pada frame pertama sebuah mount; `Stage3D` menahan render (`delayRender`) untuk beberapa gambar pemanasan. Jangan dihapus: tanpa itu frame pertama tiap still/worker hitam.
- Satu still 1080×1920 dengan post lengkap ±1–2 detik di laptop ini.
- Lookdev: `npm run stills -- <id> <frame...> --scale 0.4`, lihat lembar kontak, perbaiki kamera/cahaya di `<nama>Config.ts`.
