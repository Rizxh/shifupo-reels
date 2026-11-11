# 02. Planning konten

Tujuan langkah ini: mengubah ide menjadi **naskah VO, teks layar, dan file episode JSON** yang lolos validasi.

Sebelumnya: [01-PLANNING-IDE.md](01-PLANNING-IDE.md) · Lanjut ke: [03-SCENE-BY-SCENE.md](03-SCENE-BY-SCENE.md)

---

## 1. Naskah VO

| Aturan | Alasan |
|---|---|
| Bahasa Indonesia, sapaan "Anda" | Suara brand Shifu Po |
| Total 45–55 kata | Durasi ≈ kata ÷ 2,05 + ±3 s jeda. Harus 20–29 s (maksimal 30) |
| Satu kalimat per scene | Satu file VO per scene, durasi scene mengikuti kalimatnya |
| Kalimat pendek, mudah diucapkan | ElevenLabs paling natural untuk kalimat 6–14 kata |
| Angka ditulis dengan huruf | "tiga ribu", bukan "3.000", supaya diucapkan benar dan bisa dicek test |
| Hindari singkatan dan simbol | "dan" bukan "&", "BaZi" ditulis sama setiap kali |

Hitung durasi sebelum lanjut: jumlah kata ÷ 2,05 + (jumlah scene × 0,3) + 0,35 + 1,2 detik.

## 2. Kata cue

Setiap kejadian visual diikat ke satu **kata cue** yang diucapkan, bukan ke detik. Teks muncul 3 frame sebelum katanya.

- Kata cue harus muncul **tepat satu kali** di kalimat VO scene itu. Kalau muncul dua kali, test gagal.
- Pilih kata yang bermakna: "keras", "Arahnya", "tahun", "WhatsApp". Hindari kata sambung ("yang", "dan").
- Kata dengan tanda hubung dihitung satu kata: "begitu-begitu".
- Untuk angka, kata cue adalah kata pertama angkanya ("tiga" untuk "tiga ribu"). Test memastikan `count.value` sama dengan yang diucapkan.

## 3. Teks layar

| Aturan | Nilai |
|---|---|
| Panjang judul | Maksimal 2 baris × ±14 karakter pada ukuran `TYPE.headline` |
| Huruf | Judul KAPITAL, tagline kalimat biasa |
| Aksen emas | Satu kata atau frasa per scene (`accent`) |
| Isi | Merangkum, bukan menyalin VO kata per kata |
| Caption bawah | Otomatis dari VO, maksimal 4 kata per halaman. Tidak perlu ditulis |

## 4. File episode `data/episodes/<id>.json`

Semua kata di layar dan di VO hanya ada di sini. Kerangkanya:

```jsonc
{
  "id": "sp02",                       // spNN, sama dengan nama file
  "title": "Pintu Utama Pembuang Rezeki",
  "brand": {
    "name": "SHIFU PO",
    "descriptor": "FENG SHUI & BAZI",
    "sealGlyph": "風",
    "handle": null                     // "@shifupo.official" kalau sudah pasti
  },
  "claims": [
    { "text": "850+ properti", "reviewed": false }
  ],
  "scenes": [
    {
      "type": "hook",
      "vo": "Rumah baru, rezeki malah seret?",
      "voHighlight": ["rezeki"],        // kata yang ditebalkan di caption, harus diucapkan
      "lines": [
        { "text": "RUMAH BARU,", "cueWord": "baru" },
        { "text": "REZEKI SERET?", "cueWord": "seret" }
      ]
    }
    // insight, bazi, fengshui, proof, cta: lihat sp01.json untuk bentuk lengkapnya
  ]
}
```

Bentuk setiap jenis scene ada di `src/schema.ts`:

| `type` | Field wajib |
|---|---|
| `hook` | `vo`, `lines` (2 × `text` + `cueWord`) |
| `insight` | `vo`, `lines` (2, boleh `accent`), `lockCueWord` |
| `bazi` | `vo`, `title`, `subtitle`, `shifuCueWord`, `pillars` (4 × `glyph`, `label`, `cueWord`) |
| `fengshui` | `vo`, `title`, `stamp` |
| `proof` | `vo`, `count` (`value`, `suffix`, `label`, `cueWord`) |
| `cta` | `vo`, `button`, `tagline` (dengan `accent`) |

Urutan scene saat ini wajib `hook, insight, bazi, fengshui, proof, cta`. Untuk struktur lain, ikuti [03-SCENE-BY-SCENE.md](03-SCENE-BY-SCENE.md) bagian 4.

## 5. Validasi

```bash
npm test
```

Test memeriksa:

- setiap kata cue diucapkan tepat satu kali;
- setiap `voHighlight` benar-benar diucapkan;
- angka di layar sama dengan yang diucapkan;
- urutan scene dan bentuk setiap field.

Pesan error menyebut scene dan kata yang salah. Perbaiki JSON-nya, jangan menghapus test.

## 6. Checklist sebelum lanjut

- [ ] Durasi perkiraan 20–29 detik
- [ ] Hook maksimal 8 kata
- [ ] Hanya angka resmi; klaim lain `reviewed: false`
- [ ] `npm test` lolos
- [ ] Ringkasan (hook, VO lengkap, daftar scene, durasi) sudah disetujui. Dengan `/buat-video`, ini satu-satunya titik persetujuan
