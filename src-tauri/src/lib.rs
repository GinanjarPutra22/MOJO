mod overlay;
mod services;
mod store;
mod timer;
#[cfg(windows)]
mod win;

use std::sync::Arc;

use store::Settings;
use timer::{Pomodoro, PomodoroState};
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, LogicalSize, Manager, PhysicalPosition, WebviewWindow,
};

/// Jarak island dari tepi atas layar. 0 = menempel ke tepi, seperti notch.
const TOP_MARGIN: f64 = 0.0;

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

/// Pengaturan dengan semua modul terisi (nilai bawaan sudah diterapkan).
#[tauri::command]
fn get_settings(app: AppHandle) -> Settings {
    store::load_settings(&app).resolved()
}

#[tauri::command]
fn save_settings(app: AppHandle, settings: Settings) -> Result<(), String> {
    let merged = Settings {
        modules: {
            let mut m = store::load_settings(&app).modules;
            m.extend(settings.modules);
            m
        },
    };
    store::store_settings(&app, &merged)?;
    services::apply(&app, &merged);
    Ok(())
}

#[tauri::command]
fn pomodoro_get(p: tauri::State<Arc<Pomodoro>>) -> PomodoroState {
    p.get()
}

#[tauri::command]
fn pomodoro_start(app: AppHandle, p: tauri::State<Arc<Pomodoro>>) -> PomodoroState {
    p.start(&app)
}

#[tauri::command]
fn pomodoro_pause(p: tauri::State<Arc<Pomodoro>>) -> PomodoroState {
    p.pause()
}

#[tauri::command]
fn pomodoro_reset(p: tauri::State<Arc<Pomodoro>>) -> PomodoroState {
    p.reset()
}

#[tauri::command]
fn pomodoro_skip(p: tauri::State<Arc<Pomodoro>>) -> PomodoroState {
    p.skip()
}

/// Keluar dari MOJO (tombol di Pengaturan; menu tray juga memanggil app.exit).
#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn read_data(app: AppHandle, key: String) -> Result<Option<String>, String> {
    store::read_data(&app, &key)
}

#[tauri::command]
fn write_data(app: AppHandle, key: String, value: String) -> Result<(), String> {
    store::write_data(&app, &key, &value)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            resize_island,
            get_settings,
            save_settings,
            quit_app,
            read_data,
            write_data,
            pomodoro_get,
            pomodoro_start,
            pomodoro_pause,
            pomodoro_reset,
            pomodoro_skip
        ])
        .setup(|app| {
            app.manage(Pomodoro::new());
            app.manage(services::Services::default());
            let window = app
                .get_webview_window("main")
                .expect("jendela 'main' tidak ditemukan");

            // Ikon tray: satu-satunya cara menutup MOJO karena tidak ada di taskbar.
            let quit = MenuItem::with_id(app, "quit", "Keluar dari MOJO", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit])?;
            let mut tray = TrayIconBuilder::new()
                .tooltip("MOJO")
                .menu(&menu)
                .on_menu_event(|app, event| {
                    if event.id.as_ref() == "quit" {
                        app.exit(0);
                    }
                });
            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }
            tray.build(app)?;

            // Jendela dibuat tersembunyi di tauri.conf.json agar tidak
            // "melompat" saat dipindah; tampilkan setelah posisinya benar.
            let width = window.outer_size()?.width as f64 / window.scale_factor()?;
            place_top_center(&window, width)?;
            window.show()?;

            services::apply(app.handle(), &store::load_settings(app.handle()));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("gagal menjalankan MOJO");
}
