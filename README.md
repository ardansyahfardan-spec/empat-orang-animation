# EMPAT ORANG — Episode 01: Rumah yang Memanggil

Animasi horor 3D vertikal untuk serial EMPAT ORANG.

## Target produksi
- Format: 9:16, 1080×1920, 30 FPS
- Durasi: 92 detik
- Video: MP4 H.264
- Audio: narasi bahasa Indonesia (suara TTS laki-laki) dan ambience frekuensi rendah
- Pemutar pratinjau: HTML + Three.js WebGL, bisa dibuka melalui Safari iPhone

## File utama
- `index.html` — pemutar animasi interaktif.
- `render/render.mjs` — renderer frame otomatis.
- `.github/workflows/render.yml` — render MP4 melalui GitHub Actions dan unggah hasil sebagai artifact.

## Membuat MP4
Setiap perubahan pada file animasi atau renderer memicu workflow **Render episode MP4**. Hasilnya diunggah sebagai artifact bernama `empat-orang-episode-01-mp4` pada halaman Actions repository.

## Status produksi
Renderer dan workflow audio sudah disiapkan dan didorong ke branch `main`. MP4 belum dinyatakan selesai sebelum job Actions berhasil dan file hasilnya diperiksa. Visual sudah dialihkan ke scene 3D realtime berbasis Three.js dengan lingkungan malam, rumah tua, karakter 3D konsisten, dan kamera cut-to-cut. Tahap berikutnya adalah menguji render WebGL di GitHub Actions, memasukkan file narasi TTSMaker, lalu menyempurnakan rig/ekspresi karakter.
