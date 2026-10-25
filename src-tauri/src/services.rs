//! Mengatur layanan latar belakang sesuai modul yang aktif di Settings.
//! Modul yang dimatikan benar-benar berhenti (tidak mendengarkan apa pun).

use std::sync::Arc;

use tauri::{AppHandle, Manager};

use crate::{store::Settings, timer::Pomodoro};

pub fn apply(app: &AppHandle, settings: &Settings) {
    if !settings.enabled("pomodoro") {
        app.state::<Arc<Pomodoro>>().reset();
    }
}
