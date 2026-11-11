# 07. Animasi "anime smooth"

Tujuannya: setiap gerakan terasa punya berat, mengalir, dan hidup, seperti animasi anime yang dianimasikan dengan teliti. Aturan wajibnya ada di `docs/PLAN-SP01.md` bagian 6; panduan ini menjelaskan cara menerapkannya di kode.

Sebelumnya: [06-PENEMPATAN-ASET.md](06-PENEMPATAN-ASET.md) · Lanjut ke: [08-QA-HASIL-BERSIH.md](08-QA-HASIL-BERSIH.md)

---

## 1. Dasar: semua gerak berbasis frame

```tsx
const frame = useCurrentFrame();
const { fps } = useVideoConfig();
```

| Boleh | Dilarang |
|---|---|
| `interpolate`, `spring`, helper di `src/lib/motion.ts` | Animasi/transisi CSS, `@keyframes` |
| `random(seed)`, `drift(seed, frame)` | `Math.random()` |
| Frame dari cue (`cue("Arahnya")`) | `Date.now()`, `setTimeout`, detik yang ditulis langsung |

Alasannya: Remotion merender frame secara acak dan paralel. Hanya gerak yang dihitung dari nomor frame yang hasilnya sama setiap kali.

## 2. Kamus gerak (`src/lib/motion.ts`)

| Helper | Pakai untuk |
|---|---|
| `prog(frame, a, b, EASE.out)` | 0 → 1 antara frame a dan b. `a`/`b` = `Infinity` berarti tidak pernah terjadi (elemen yang bertahan sampai akhir) |
| `springAt(frame, start, fps, SPRING.pop)` | Pegas mulai di `start`, 0 sebelum itu |
| `EASE.out` | Benda datang: cepat lalu mendarat lembut. Pilihan default |
| `EASE.inOut` | Gerak kamera dan perubahan bentuk |
| `EASE.in` | Benda pergi |
| `EASE.anticipate` | Mundur sedikit lalu melesat (antisipasi) |
| `EASE.overshoot` | Melewati sasaran lalu kembali |
| `SPRING.heavy` | Benda berat: pilar, pelat |
| `SPRING.pop` | Teks dan ikon, sedikit memantul |
| `SPRING.snap` | Kunci cepat: jarum kompas |
| `SPRING.soft` | Tanpa pantulan: figur masuk |
| `drift(seed, frame, speed)` | Goyangan organik −1..1 (kabut, kipas, kelopak) |
| `breathe(frame, fps)` | Skala "bernapas" saat diam |

## 3. Resep

**Masuk dengan antisipasi dan overshoot**

```tsx
const t = springAt(frame, cue("tahun") - 2, fps, SPRING.heavy);
const y = lerp(120, 0, t);       // pegas heavy memberi overshoot alami
```

**Stagger grup (bergiliran 2–4 frame)**

```tsx
items.map((item, i) => {
  const t = springAt(frame, start + i * 3, fps, SPRING.pop);
  // ...
});
```

**Follow-through (bagian yang menempel terlambat)**

```tsx
const body = drift("koi-body", frame, 0.03);
const tail = drift("koi-body", frame - 4, 0.03);   // ekor mengikuti 4 frame kemudian
```

**Tahan tetap hidup**

```tsx
const s = breathe(frame, fps, 0.008);
const sway = drift("shifu", frame, 0.01) * 1.2;
```

**Keluar**

```tsx
const out = prog(frame, end - EXIT_LEAD, end + 6, EASE.in);
// opacity 1 - out, scale 1 - out * 0.15
```

**Teks mendarat di katanya**

```tsx
<HeadlineLine text={line.text} cue={cue(line.cueWord)} out={end} />
// HeadlineLine sudah memajukan 3 frame (HEADLINE.leadFrames)
```

## 4. Angka acuan

| Gerak | Durasi | Kurva |
|---|---|---|
| Teks masuk | 10 frame (`HEADLINE.enterFrames`) | rise atau slam |
| Teks keluar | 8 frame | `EASE.in` |
| Stagger | 2–4 frame per item | |
| Overshoot | 3–8% dari jarak | `SPRING.heavy` / `EASE.overshoot` |
| Follow-through | terlambat 2–6 frame | |
| Transisi tinta | 16 frame (`INK_WIPE.frames`) | |
| Garis kecepatan / impact frame | maksimal 4–8 frame, hanya di momen penekanan | |
| Keluar scene | mulai 14 frame sebelum akhir (`EXIT_LEAD`) | `EASE.in` |

## 5. Transisi antar scene

Tiga lapis yang terjadi bersamaan:

1. **Match move:** benda penghubung bergerak dari scene lama ke scene baru (lihat [03-SCENE-BY-SCENE.md](03-SCENE-BY-SCENE.md)).
2. **Percikan tinta:** scene baru dibuka oleh noda tinta bertepi kasar dari `WIPE_ORIGIN` (`inkBlotClip`), ditambah `InkSplash`.
3. **Kamera dunia:** `World` mengubah ketinggian gunung dan kepadatan latar di awal setiap scene, jadi latar tidak pernah terpotong.

Tidak boleh ada cut keras.

## 6. Kesalahan yang sering terjadi

| Gejala | Penyebab | Solusi |
|---|---|---|
| Gerak terasa robotik | `interpolate` tanpa easing (linear) | Tambahkan `EASE.*` atau pakai pegas |
| Grup muncul serentak, terasa murah | Tanpa stagger | `start + i * 3` |
| Frame terasa beku saat tahan | Tidak ada gerak kecil | `breathe` / `drift` / partikel |
| Error `inputRange must be strictly monotonically increasing` | Rentang `interpolate` kosong atau tak hingga | Pakai `prog`, yang menangani `Infinity` |
| Bentuk SVG tidak terlihat | Gradien `url(#id)` tanpa `<GoldDefs id>` | Render `GoldDefs` dengan `id` unik |
| Hasil render berbeda tiap kali | `Math.random` atau waktu sistem | `random(seed)` / `drift` |
| Teks telat dari suaranya | Diikat ke detik, bukan cue | `cue(word)` |
