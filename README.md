# MOJO

Aplikasi produktivitas ringan bergaya Dynamic Island untuk Windows 11, dibuat dengan Tauri 2, Rust, React, dan TypeScript.

**Status: Milestone M0, M1, dan M2.**
- M0: jendela island (pil hitam di tengah atas layar).
- M1: klik pil untuk membuka/menutup dengan animasi halus.
- M2: halaman Pengaturan dan sistem modul yang bisa dinyalakan/dimatikan (modul contoh: Jam dan Timer fokus).

Jendela ini: tanpa bingkai, transparan, selalu di atas jendela lain, dan tidak muncul di taskbar.

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

Saat pertama kali, kompilasi Rust memakan waktu beberapa menit. Itu normal. Jalankan berikutnya jauh lebih cepat.

## Cara memverifikasi

Setelah `npm run tauri dev` selesai, cek satu per satu:

1. Pil hitam kecil (260x44) muncul di tengah atas layar utama, sedikit di bawah tepi atas.
2. Sudut pil membulat dan di sekelilingnya tembus pandang (tidak ada kotak putih atau abu-abu).
3. Tidak ada tombol di taskbar untuk MOJO.
4. Buka aplikasi lain, misalnya Notepad, lalu geser ke bawah pil: pil tetap terlihat di atasnya.

### Verifikasi M1 (animasi)

6. Klik pil: ia melebar dan memanjang ke bawah dengan halus, lalu muncul jam. Posisinya tetap di tengah atas.
7. Klik tombol `✕` (atau tekan `Esc`): pil mengecil kembali dengan halus, dan jendela ikut mengecil (area di sekitar pil bisa diklik tembus lagi ke jendela di belakangnya).
8. Biarkan pil tertutup, buka Task Manager: CPU MOJO harus 0% saat diam (tidak ada animasi atau timer yang berjalan).

### Verifikasi M2 (pengaturan dan modul)

9. Buka pil, klik `⚙`. Muncul daftar modul dengan saklar: Jam (aktif) dan Timer fokus (mati).
10. Nyalakan Timer fokus, klik `←`. Timer 25:00 muncul di bawah jam. Klik `Mulai`, hitungan mundur berjalan.
11. Matikan Jam di Pengaturan: jam hilang dari tampilan.
12. Tutup MOJO (`Ctrl+C` di terminal), jalankan lagi dengan `npm run tauri dev`: pilihan saklarmu masih sama. Pengaturan tersimpan di `%APPDATA%\com.mojo.app\settings.json`.

Untuk menutup: tekan `Ctrl+C` di terminal tempat `npm run tauri dev` berjalan.

Kalau ada yang tidak sesuai, catat nomor langkahnya dan kirim ke thread proyek bersama pesan error di terminal.

## Mengukur RAM dan CPU (penting)

Target MOJO adalah ringan, tapi angkanya harus diukur, bukan ditebak. Aplikasi Tauri memakai WebView2 yang berjalan sebagai beberapa proses `msedgewebview2.exe`.

1. Buat versi rilis: `npm run tauri build` (hasilnya di `src-tauri\target\release\`). Versi `dev` lebih boros, jangan dipakai untuk mengukur.
2. Jalankan `mojo.exe` dari folder itu, biarkan diam 1 menit.
3. Buka **Task Manager** (`Ctrl+Shift+Esc`), tab **Details**. Jumlahkan kolom Memory untuk `mojo.exe` dan semua `msedgewebview2.exe` yang menjadi turunannya.
4. Catat angka RAM dan CPU saat diam. Angka ini jadi patokan untuk milestone berikutnya.

## Struktur

```
src/App.tsx          pil island, animasi, halaman Pengaturan
src/modules/         satu file per modul + daftar di index.ts
src/settings.ts      baca/simpan pengaturan (lewat Rust)
src-tauri/src/lib.rs logika Rust: posisi/ukuran jendela, simpan settings.json
src-tauri/tauri.conf.json  pengaturan jendela (transparan, tanpa bingkai, dll.)
```

Rust sengaja minimal: `tauri`, `serde`, dan `serde_json`, tanpa plugin tambahan.

## Menambah modul baru

1. Buat komponen di `src/modules/NamaModul.tsx` (terima prop `active`; jalankan timer hanya saat `active` true).
2. Daftarkan di `src/modules/index.ts`. Saklar di Pengaturan muncul otomatis.

## Perintah lain

```powershell
npm run build   # cek TypeScript + build antarmuka
```
