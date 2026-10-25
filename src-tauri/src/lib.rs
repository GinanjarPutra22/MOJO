use tauri::{Manager, PhysicalPosition};

/// Jarak island dari tepi atas layar, dalam piksel logis.
const TOP_MARGIN: f64 = 8.0;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .expect("jendela 'main' tidak ditemukan");

            // Taruh di tengah atas layar utama, lalu tampilkan.
            // Jendela dibuat tersembunyi agar tidak "melompat" saat dipindah.
            if let Some(monitor) = window.primary_monitor()? {
                let scale = monitor.scale_factor();
                let screen = monitor.size();
                let origin = monitor.position();
                let win = window.outer_size()?;
                let x = origin.x + (screen.width as i32 - win.width as i32) / 2;
                let y = origin.y + (TOP_MARGIN * scale).round() as i32;
                window.set_position(PhysicalPosition::new(x, y))?;
            }
            window.show()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("gagal menjalankan MOJO");
}
