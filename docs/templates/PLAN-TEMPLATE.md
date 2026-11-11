# <ID>: "<Judul reels>" (planning)

Status: **menunggu persetujuan**. Setelah disetujui, produksi berjalan otomatis (`/buat-video`).

Acuan kualitas dan aturan gerak: `docs/PLAN-SP01.md`.

---

## 1. Tujuan

- Siapa penontonnya, masalah apa yang mereka rasakan, dan apa yang harus mereka lakukan setelah menonton (biasanya chat WhatsApp).

## 2. Layanan dan klaim

| Item | Isi |
|---|---|
| Layanan yang dipromosikan | BaZi / Feng Shui rumah / kantor / jodoh / garis tangan / Yin Zhai / simbol |
| Angka resmi yang dipakai | Hanya dari website (3.000+ klien, 850+ properti, 10+ tahun, 3–7 hari kerja) |
| Klaim yang perlu dicek | ... (`reviewed: false` sampai dicek) |

## 3. Naskah VO

Bahasa Indonesia dengan sapaan "Anda". Durasi ≈ jumlah kata ÷ 2,05 + 3 detik jeda (maksimal 29 detik).

| # | Beat | VO | Kata cue |
|---|---|---|---|
| 1 | Hook | "..." | |
| ... | | | |
| 6 | CTA | "Konsultasi via WhatsApp, ..." | "WhatsApp" |

## 4. Teks layar

Semua teks hanya ada di `data/episodes/<id>.json`, diikat ke kata di VO.

| Scene | Teks | Muncul di kata |
|---|---|---|

## 5. Storyboard

Setiap scene punya **benda penghubung** yang bergerak ke scene berikutnya (match move), ditambah transisi percikan tinta.

| Scene | Latar | Aksi dan gerak | Teks | Penghubung ke scene berikutnya |
|---|---|---|---|---|

## 6. Aset dan geraknya

| Aset | Dipakai ulang / baru | Gerak (easing, overshoot, follow-through, stagger) |
|---|---|---|

## 7. Suara

| Lapisan | Rencana |
|---|---|
| VO | ElevenLabs, voice Shifu Po di `.env` |
| SFX | Sintesis (`npm run sfx`), ditempel ke cue visual |
| BGM | Hanya lagu berlisensi komersial |

## 8. Yang perlu manusia

- Foto atau aset baru dari user, klaim yang perlu dicek, lisensi musik.
