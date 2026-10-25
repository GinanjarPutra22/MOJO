//! Penyimpanan lokal berupa file JSON di folder config aplikasi
//! (Windows: %APPDATA%\com.mojo.app).

use std::{collections::HashMap, fs, path::PathBuf};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

/// Semua id modul beserta status bawaannya. Id yang sama dipakai di
/// `src/modules/index.ts`. Modul yang memasang hook sistem (Caps Lock)
/// sengaja mati secara bawaan.
pub const MODULE_DEFAULTS: &[(&str, bool)] = &[
    ("clock", true),
    ("music", true),
    ("lyrics", true),
    ("pomodoro", true),
    ("todo", true),
    ("volume", true),
    ("capslock", false),
    ("battery", true),
    ("wifi", true),
    ("headphone", true),
];

/// `modules` memetakan id modul ke true (aktif) atau false (mati).
#[derive(Serialize, Deserialize, Default, Clone)]
pub struct Settings {
    #[serde(default)]
    pub modules: HashMap<String, bool>,
}

impl Settings {
    pub fn enabled(&self, id: &str) -> bool {
        self.modules.get(id).copied().unwrap_or_else(|| {
            MODULE_DEFAULTS
                .iter()
                .find(|(k, _)| *k == id)
                .map(|(_, v)| *v)
                .unwrap_or(false)
        })
    }

    /// Salinan dengan semua id terisi (nilai bawaan dipakai untuk yang kosong).
    pub fn resolved(&self) -> Settings {
        let modules = MODULE_DEFAULTS
            .iter()
            .map(|(id, _)| (id.to_string(), self.enabled(id)))
            .collect();
        Settings { modules }
    }
}

fn file_path(app: &AppHandle, name: &str) -> Result<PathBuf, String> {
    app.path()
        .app_config_dir()
        .map(|dir| dir.join(name))
        .map_err(|e| e.to_string())
}

/// Tulis ke file sementara lalu rename, agar file tidak rusak kalau
/// aplikasi mati di tengah penulisan.
fn write_atomic(path: PathBuf, text: &str) -> Result<(), String> {
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, text).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &path).map_err(|e| e.to_string())
}

pub fn load_settings(app: &AppHandle) -> Settings {
    file_path(app, "settings.json")
        .ok()
        .and_then(|p| fs::read_to_string(p).ok())
        .and_then(|t| serde_json::from_str(&t).ok())
        .unwrap_or_default()
}

pub fn store_settings(app: &AppHandle, settings: &Settings) -> Result<(), String> {
    let text = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    write_atomic(file_path(app, "settings.json")?, &text)
}

/// Kunci data hanya boleh huruf kecil, angka, dan tanda minus
/// (mencegah penulisan ke luar folder config).
fn data_path(app: &AppHandle, key: &str) -> Result<PathBuf, String> {
    let ok = !key.is_empty()
        && key.len() <= 32
        && key
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-');
    if !ok {
        return Err("kunci data tidak valid".into());
    }
    file_path(app, &format!("data-{key}.json"))
}

pub fn read_data(app: &AppHandle, key: &str) -> Result<Option<String>, String> {
    Ok(fs::read_to_string(data_path(app, key)?).ok())
}

pub fn write_data(app: &AppHandle, key: &str, value: &str) -> Result<(), String> {
    write_atomic(data_path(app, key)?, value)
}
