# MOJO

Aplikasi produktivitas ringan bergaya Dynamic Island untuk Windows 11, dibuat dengan Tauri 2, Rust, React, dan TypeScript.

**Status: Milestone M0.** Baru berupa jendela "island": pil hitam polos di tengah atas layar. Belum ada fitur lain.

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
5. Pil bisa diseret dengan mouse (area pil adalah area geser).

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
src/                 antarmuka React (App.tsx = pil island)
src-tauri/src/lib.rs logika Rust: atur posisi jendela di tengah atas
src-tauri/tauri.conf.json  pengaturan jendela (transparan, tanpa bingkai, dll.)
```

Rust sengaja minimal: hanya `tauri` tanpa plugin tambahan.

## Perintah lain

```powershell
npm run build   # cek TypeScript + build antarmuka
```
