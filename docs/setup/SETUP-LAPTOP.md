# Setup laptop untuk produksi Reels Shifu Po

Panduan menyiapkan laptop baru supaya bisa membuat Reels promosi Shifu Po dengan satu prompt: `/buat-video <topik>`.

## 1. Yang harus ada

| Kebutuhan | Keterangan |
|---|---|
| Windows 10/11 atau macOS, RAM 16 GB+ | Animasi 2D ringan, tapi render 1080×1920 tetap butuh CPU yang lumayan |
| [Node.js LTS](https://nodejs.org) versi 20 ke atas | Cek: `node -v` |
| [Git](https://git-scm.com) | Untuk mengambil proyek |
| [ffmpeg](https://ffmpeg.org/download.html) | Harus bisa dipanggil dari terminal. Cek: `ffmpeg -version` |
| Claude Code (aplikasi desktop atau CLI) | Login dengan akun Claude |
| Akun ElevenLabs berbayar | Paket gratis tidak boleh untuk konten komersial. Pilih satu voice pria dewasa yang tenang untuk Shifu Po |
| Lisensi Remotion | Gratis untuk individu dan perusahaan maks. 3 karyawan; di atas itu perlu Company License (remotion.dev/license) |

## 2. Ambil proyek dan install

```bash
git clone <url-repo-private> shifupo-reels
cd shifupo-reels
npm install
npm run sfx
```

Proyek ini berdiri sendiri, tidak butuh folder proyek lain. Saat pertama kali ada VO, langkah cek suara mengunduh whisper.cpp dan model ~1,6 GB ke `.whisper/` (sekali saja, tidak ikut ke Git). Pastikan ruang disk cukup dan internet stabil.

## 3. Isi kunci ElevenLabs

Salin `.env.example` menjadi `.env`, lalu isi sendiri:

```
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
```

Jangan pernah menempel kunci ini di chat Claude. `.env` tidak ikut ke Git. Tanpa `.env`, video tetap dibuat tapi tanpa suara.

## 4. Foto Shifu Po

Taruh `shifu.png` (latar transparan) di `public/assets/shifu/`. Spesifikasinya ada di `public/assets/shifu/README.md`.

## 5. Izin perintah

`.claude/settings.json` sudah ada di proyek: Claude boleh menjalankan `npm run`, ffmpeg, dan mengedit file proyek tanpa minta konfirmasi, tapi tidak boleh membaca `.env` atau `git push`.

## 6. Cek semuanya jalan

```bash
npm test
npm run produce -- sp01 --draft
```

## 7. Cara pakai sehari-hari

Buka folder proyek di Claude Code, lalu tulis:

```
/buat-video topik: feng shui kamar tidur untuk jodoh
```

1. Claude menyusun planning (naskah, teks layar, storyboard, aset) dan bertanya satu kali: setuju atau revisi.
2. Setelah disetujui, semuanya berjalan sendiri: VO ElevenLabs, animasi, SFX, render draft, cek mandiri dan perbaikan, render final, normalisasi audio, dan laporan QA.
3. Hasil akhir: `out/<id>_final.mp4`, lembar frame, dan laporan QA.

Claude hanya berhenti kalau butuh aset dari Anda (foto, logo), kunci ElevenLabs, atau ada cek yang tetap gagal setelah 3 kali diperbaiki.
