# Standar Aset (Shared Animation Core)

Tujuan: kualitas aset setara di semua product dan semua episode, apa pun panjang prompt-nya. Aset yang tidak memenuhi standar tidak boleh jadi `hero`.

## 1. Tier

| Tier | Contoh | Wajib |
|---|---|---|
| **hero** | luo pan, menara, karakter, mobil | Gradien + bayangan lembut + rim light; ≥ 3 state (masuk, aksi, diam hidup); gerak sekunder; detail yang terbaca di HP (1080 px lebar) |
| **support** | koin, lampion, panah energi | Gradien + bayangan; 1 gerak sekunder |
| **texture** | kabut, debu, kelopak, bintang | Bergerak terus (angin/gravitasi), tidak pernah diam |

## 2. Lingkungan (anti-polos)

Setiap shot: ≥ 3 lapis kedalaman, ≥ 2 atmosfer (`src/core/fx/atmosphere.tsx`: `MistBands`, `LightRays`, `Motes`; 3D: awan volumetrik, kabut, partikel), cahaya key + rim. Dunia latar format `story` kini memakai kabut tinta jauh/dekat, sinar emas, dan debu emas (`ATMOSPHERE` di `src/products/shifupo/brand.ts`).

## 3. Gerak

- Kanal per properti (`core/motion/tracks.ts`), bukan satu tween per elemen.
- Benda bergerak memakai hukum fisika (`core/motion/physics.ts`); mendarat = squash (`acting.ts`); gerak cepat = motion blur dari kecepatan nyata.
- Diam tetap hidup: `idle`, `blink`, `pendulum`, atmosfer.
- Target terukur: `npm run qc-motion` (frame mati < 3%, detik diam ≤ 2, energi p90 ≥ 5, jerk < 0,15, tanpa frame kosong).

## 4. 2D (SVG / Remotion)

- Palet dari `products/<name>/brand.ts`; tidak ada warna di komponen.
- Bentuk organik (bezier), bukan primitif polos; tekstur tipis (noise/grain) pada permukaan besar.
- Siluet placeholder tidak boleh menjadi elemen terbesar di layar lebih dari satu scene.

## 5. 3D (React Three Fiber, live di Remotion)

Sejak 13 Nov 2026 pipeline Blender dihentikan atas permintaan pengguna. 3D = dunia R3F (`src/core/three/*`, `src/products/shifupo/worlds/*`); panduan lengkap di `docs/guides/05-ASET-3D.md`.

| Aspek | Standar |
|---|---|
| Material | PBR (`meshStandardMaterial`), permukaan besar bertekstur prosedural, tepi `RoundedBox`/bevel |
| Cahaya | Matahari berbayangan lembut + panel environment prosedural + cahaya praktis (lampu meja, lorong); AgX |
| Atmosfer | Berkas sinar (sun shaft aditif), debu melayang, partikel chi HDR yang mem-bloom, depth of field |
| Fisika | Setiap benda bergerak memakai hukum di `core/motion/physics.ts`; setiap benturan bersuara |
| Kamera | Satu shot per beat, keyframe beresing, perjalanan kamera antar-beat (tanpa cut kosong) |
| Anotasi | Coretan, panah + catatan tangan, stempel menempel ke anchor 3D (gaya Motion Format) |

Status: dunia `office` (sp05) lulus lookdev per beat (13 Nov).
