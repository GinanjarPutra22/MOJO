use std::{collections::HashMap, fs, path::PathBuf};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, LogicalSize, Manager, PhysicalPosition, WebviewWindow};

/// Jarak island dari tepi atas layar, dalam piksel logis.
const TOP_MARGIN: f64 = 8.0;

/// Pengaturan yang disimpan di settings.json.
/// `modules` memetakan id modul ke true (aktif) atau false (mati).
#[derive(Serialize, Deserialize, Default)]
struct Settings {
    #[serde(default)]
    modules: HashMap<String, bool>,
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_config_dir()
        .map(|dir| dir.join("settings.json"))
        .map_err(|e| e.to_string())
}

/// Taruh jendela di tengah atas layar utama. `width` dalam piksel logis.
fn place_top_center(window: &WebviewWindow, width: f64) -> tauri::Result<()> {
    if let Some(monitor) = window.primary_monitor()? {
        let scale = monitor.scale_factor();
        let screen = monitor.size();
        let origin = monitor.position();
        let win_width = (width * scale).round() as i32;
        let x = origin.x + (screen.width as i32 - win_width) / 2;
        let y = origin.y + (TOP_MARGIN * scale).round() as i32;
        window.set_position(PhysicalPosition::new(x, y))?;
    }
    Ok(())
}

/// Ubah ukuran jendela (piksel logis) dan jaga tetap di tengah atas.
#[tauri::command]
fn resize_island(window: WebviewWindow, width: f64, height: f64) -> Result<(), String> {
    window
        .set_size(LogicalSize::new(width, height))
        .map_err(|e| e.to_string())?;
    place_top_center(&window, width).map_err(|e| e.to_string())
}

/// Baca pengaturan. File belum ada atau rusak = pengaturan bawaan.
#[tauri::command]
fn get_settings(app: AppHandle) -> Settings {
    settings_path(&app)
        .ok()
        .and_then(|path| fs::read_to_string(path).ok())
        .and_then(|text| serde_json::from_str(&text).ok())
        .unwrap_or_default()
}

/// Simpan pengaturan. Ditulis ke file sementara lalu di-rename
/// agar file tidak rusak kalau aplikasi mati di tengah penulisan.
#[tauri::command]
fn save_settings(app: AppHandle, settings: Settings) -> Result<(), String> {
    let path = settings_path(&app)?;
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    let text = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, text).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            resize_island,
            get_settings,
            save_settings
        ])
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .expect("jendela 'main' tidak ditemukan");

            // Jendela dibuat tersembunyi di tauri.conf.json agar tidak
            // "melompat" saat dipindah; tampilkan setelah posisinya benar.
            let width = window.outer_size()?.width as f64 / window.scale_factor()?;
            place_top_center(&window, width)?;
            window.show()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("gagal menjalankan MOJO");
}
