# MOJO

Aplikasi produktivitas ringan bergaya Dynamic Island untuk Windows 11, dibuat dengan Tauri 2, Rust, React, dan TypeScript. Kode orisinal.

**Status: milestone M0 sampai M6, dengan tampilan baru mengikuti "Mojo - Prototipe Visual".**

| Milestone | Isi |
|---|---|
| M0 | Jendela island: tanpa bingkai, transparan, selalu di atas, tidak di taskbar, menempel di tengah atas layar |
| M1 | Hover untuk membuka/menutup dengan animasi pegas (spring) |
| M2 | Pengaturan (tab Fitur/Sistem/Tampilan) dan sistem modul (saklar on/off, tersimpan), tray dengan menu Keluar |
| M3 | To-Do (prioritas, tenggat) dan Pomodoro (3 mode, timer dihitung di Rust) |
| M4 | Overlay volume dan Caps Lock |
| M5 | Musik dari Windows media session (sampul, judul, artis, kontrol) dan lirik |
| M6 | Pop-up baterai/charger, Wi-Fi, dan pergantian perangkat audio (headphone) |

Belum dikerjakan: Water/pengingat minum, tab Notif dan Status dari prototipe, file shelf (M7), deteksi full-screen dan multi-monitor (M8), installer (M9), overlay brightness.

## Cara keluar dari MOJO

MOJO tidak punya bingkai dan tidak ada di taskbar, jadi ada tiga cara menutupnya:

1. **Ikon tray** (pojok kanan bawah, dekat jam; mungkin di balik panah `^`): klik kanan, pilih **Keluar dari MOJO**.
2. **Pengaturan**: arahkan mouse ke island, klik ikon heksagon di kanan atas, lalu tombol **Keluar** di kanan atas panel.
3. Saat memakai `npm run tauri dev`: tekan `Ctrl+C` di terminal.

## Yang dibutuhkan

Sudah terpasang kalau kamu mengikuti panduan setup: Node.js LTS, Rust (`stable-msvc`), C++ Build Tools, dan WebView2. Cek di PowerShell:

```powershell
node -v
npm -v
rustc -V
cargo -V
```

Hasil yang benar: keempatnya menampilkan nomor versi, bukan pesan error.

## Menjalankan

```powershell
git clone https://github.com/GinanjarPutra22/MOJO.git
cd MOJO
npm install
npm run tauri dev
```

Kompilasi pertama memakan beberapa menit (ada banyak paket Rust). Itu normal; berikutnya jauh lebih cepat. Kalau muncul error merah di terminal, salin seluruhnya dan kirim ke thread proyek.

## Cara memverifikasi

Setelah `npm run tauri dev` selesai, cek satu per satu dan catat nomor yang gagal.

### M0 dan M1: jendela, hover, dan animasi pegas

1. Pil hitam kecil menempel di tengah atas layar utama (sudut bawah membulat, ada lengkung kecil di kiri-kanan atas seperti notch), berisi jam (`15:08`).
2. Di sekeliling pil tidak ada kotak putih/abu-abu dan tidak ada tombol di taskbar. Buka Notepad dan geser ke area atas: pil tetap di atasnya.
3. Arahkan mouse ke pil: ia melebar dan memanjang ke bawah dengan animasi pegas (sedikit memantul), lalu tampil header (tab, tanggal | jam, ikon heksagon).
4. Jauhkan mouse: setelah sekitar 1/3 detik ia mengecil tenang. `Esc` juga menutup. Saat mengetik di kolom teks, island tidak menutup.
5. Saat musik berjalan, pil melebar sedikit: ikon hijau di kiri, jam di tengah, gelombang di kanan. Saat Pomodoro berjalan, pil menampilkan hitung mundur dengan titik oranye (fokus) atau hijau (istirahat). Pesan singkat (volume, baterai, dll.) tampil di pil selama sekitar 2 detik.
6. Biarkan tertutup tanpa musik/timer, lihat Task Manager: CPU MOJO harus 0%.

### Tab geser dan Pengaturan

7. Di island terbuka ada tab **Music**, **Pomodoro**, **To-Do** (tiga tab terlihat sekaligus). Pindah tab dengan: klik nama tab, tombol panah kiri/kanan, scroll horizontal (trackpad, atau `Shift` + roda mouse), atau tarik ke kiri/kanan dengan mouse di area kosong.
8. Klik ikon heksagon: panel Pengaturan dengan tiga bagian.
   - **Fitur**: saklar Music, Pomodoro, To-Do (minimal satu harus aktif). Matikan satu: tab-nya hilang.
   - **Sistem**: saklar Lirik, overlay volume, Caps Lock, baterai, Wi-Fi, perangkat audio.
   - **Tampilan**: gaya *Notch* atau *Dynamic Island* (pil melayang), ukuran font 85–120%, radius sudut 12–44 px.
   - **Tetap terbuka** menahan island terbuka (tidak menutup saat mouse keluar).
9. Keluar dari MOJO dan jalankan lagi: semua pilihan tetap. File ada di `%APPDATA%\com.mojo.app\settings.json`.

### M3: Pomodoro dan To-Do

10. Tab **Pomodoro**: cincin 25:00, pilihan Fokus / Istirahat / Istirahat panjang, tombol Mulai/Jeda, Ulang, Lewati, dan empat titik sesi. Tekan Mulai, tutup island, tunggu 1 menit, buka lagi: waktu tetap akurat. Setelah 4 sesi fokus, istirahat berikutnya otomatis panjang (15 menit). Hitungan sesi hilang saat MOJO ditutup.
11. Saat waktu habis, pil menampilkan "Fokus selesai"/"Istirahat selesai", lalu pindah ke mode berikutnya dan menunggu kamu menekan Mulai.
12. Tab **To-Do**: `+ Tambah tugas`, isi teks, ganti prioritas (merah/kuning/biru) dan tenggat, Simpan. Centang, ubah (ikon pena), hapus (ikon silang), dan bilah progres bertambah. Keluar lalu jalankan lagi: daftar tetap ada. Matikan Pomodoro di Pengaturan: timer direset dan berhenti.

### M4: overlay sistem

13. Ubah volume (tombol keyboard atau ikon speaker): island menampilkan `Volume xx%` dengan bilah selama sekitar 2 detik, lalu kembali ke jam. Mute menampilkan "Suara dimatikan".
14. Caps Lock bawaannya **mati** (karena memasang hook keyboard, yang kadang dicurigai antivirus). Nyalakan di Pengaturan, tekan Caps Lock: muncul "Caps Lock aktif/mati". Hook hanya memeriksa tombol Caps Lock; tombol lain tidak dibaca, disimpan, atau dikirim ke mana pun.

### M5: musik dan lirik

15. Putar lagu di Spotify atau YouTube Music (browser). Tab **Music** menampilkan sampul, judul, artis, waktu, dan bilah hijau. Saat tertutup, sampul kecil muncul di kiri dan ikon visualizer di kanan jam.
16. Tombol ⏮ ⏯ ⏭ mengendalikan pemutar. Jeda lewat aplikasi lain: island ikut berubah.
17. Klik ikon kutip (") untuk tampilan lirik (sampul kecil di kiri, lirik bergulir di kanan). Lirik diambil dari layanan terbuka [LRCLIB](https://lrclib.net): **judul, artis, album, dan durasi lagu dikirim ke lrclib.net**. Matikan modul "Lirik" di Pengaturan kalau tidak mau. Tidak semua lagu punya lirik bersinkron; jika tidak ada, tampil "Lirik tidak ditemukan".
18. Ikon speaker di kartu musik hanya hiasan (sesuai desain), belum bisa diklik.

### M6: status perangkat

19. Laptop: cabut dan colok charger, pop-up "Charger terhubung/dicabut" muncul sekali. Saat baterai turun ke 20% muncul "Baterai rendah". PC tanpa baterai: tidak ada pop-up (normal).
20. Putuskan lalu sambungkan Wi-Fi: muncul "Tidak ada internet" dan "Terhubung: nama-wifi".
21. Colok headphone yang membuat output default berganti: muncul "Output: nama perangkat". Beberapa laptop tidak mengganti output default saat jack dicolok, jadi pop-up bisa tidak muncul.

Catatan: pop-up tampil di tempat jam (island tertutup) atau di tengah bilah atas (island terbuka).

## Yang belum terverifikasi (jujur)

Kode dibuat di lingkungan Linux, tanpa bisa menjalankan Windows. Yang sudah dicek: `npm run build`, `cargo check` di Linux, dan `cargo check --target x86_64-pc-windows-msvc` (kode Windows lolos kompilasi). Tampilan diperiksa lewat screenshot browser dengan Tauri di-mock. **Belum pernah dijalankan di Windows 11**, jadi semua langkah di atas masih perlu dicoba, terutama:

- Resize dan posisi jendela saat hover, serta kehalusan animasi di WebView2.
- Hook Caps Lock, callback volume, SMTC (sampul/kontrol), baterai, Wi-Fi, dan pergantian perangkat audio.
- Apakah lirik dari LRCLIB bisa diambil dari WebView (bergantung pada izin CORS layanan itu).
- Angka RAM dan CPU (lihat di bawah).

## Mengukur RAM dan CPU (penting)

Target MOJO adalah ringan, tapi angkanya harus diukur. Aplikasi Tauri memakai WebView2 yang berjalan sebagai beberapa proses `msedgewebview2.exe`.

1. Buat versi rilis: `npm run tauri build` (hasilnya di `src-tauri\target\release\`). Versi `dev` lebih boros.
2. Jalankan `mojo.exe`, biarkan island tertutup 1 menit.
3. Task Manager (`Ctrl+Shift+Esc`), tab **Details**: jumlahkan Memory `mojo.exe` dan semua `msedgewebview2.exe` anaknya. Catat juga CPU.
4. Ulangi dengan island terbuka dan musik berjalan.

Perilaku idle yang disengaja: tidak ada animasi saat diam; jam hanya berdetak sekali per menit. **Pengecualian:** saat musik berjalan dan island tertutup, gelombang di pil beranimasi (memakai transform, tapi tetap memakai sedikit GPU/CPU); saat Pomodoro berjalan, pil berdetak 1 detik. Detik di tab Music hanya berdetak saat island terbuka; semua data Windows memakai event (callback), bukan polling; modul yang dimatikan melepas listener-nya.

## Struktur

```
src/App.tsx               island: hover+spring, tab geser, ukuran jendela
src/Mini.tsx              isi pil saat ciut
src/Settings.tsx          panel Pengaturan (Fitur/Sistem/Tampilan)
src/modules/              satu modul per fitur; daftar di index.ts
src/modules/music/        musik, lirik (LRCLIB), state dari event Rust
src/overlay.ts            pesan singkat dari Rust (volume, baterai, dll.)
src-tauri/src/lib.rs      jendela, tray, perintah untuk UI
src-tauri/src/store.rs    settings.json dan data (to-do)
src-tauri/src/timer.rs    Pomodoro
src-tauri/src/services.rs menyalakan/mematikan layanan sesuai Pengaturan
src-tauri/src/win/        API Windows: caps, audio, media (SMTC), devices
```

Dependensi Rust: `tauri` (dengan tray), `serde`, `serde_json`, dan di Windows saja `windows`. Dependensi JS: React dan font Poppins (@fontsource, dibundel lokal).

## Menambah modul baru

1. Buat komponen di `src/modules/` (tab menerima prop `active`; jalankan timer hanya saat `active` true).
2. Daftarkan di `src/modules/index.ts` dan tambahkan id-nya di `MODULE_DEFAULTS` (`src-tauri/src/store.rs`). Saklar di Pengaturan muncul otomatis.

## Perintah lain

```powershell
npm run build   # cek TypeScript + build antarmuka
```
