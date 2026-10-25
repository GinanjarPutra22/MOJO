#![cfg_attr(not(windows), allow(dead_code))]
//! Mengatur layanan latar belakang sesuai modul yang aktif di Settings.
//! Modul yang dimatikan benar-benar berhenti (tidak mendengarkan apa pun).

use std::sync::{Arc, Mutex};

use tauri::{AppHandle, Manager};

use crate::{store::Settings, timer::Pomodoro};

/// Layanan yang berjalan. Saat dibuang (drop), layanan berhenti.
pub struct Service(Option<Box<dyn FnOnce() + Send>>);

impl Service {
    pub fn new(stop: impl FnOnce() + Send + 'static) -> Self {
        Service(Some(Box::new(stop)))
    }
}

impl Drop for Service {
    fn drop(&mut self) {
        if let Some(stop) = self.0.take() {
            stop();
        }
    }
}

#[derive(Default)]
pub struct Running {
    caps: Option<Service>,
    volume: Option<Service>,
}

#[derive(Default)]
pub struct Services(Mutex<Running>);

#[cfg_attr(not(windows), allow(dead_code))]
/// Nyalakan atau matikan satu layanan agar sesuai keinginan.
fn toggle(slot: &mut Option<Service>, want: bool, start: impl FnOnce() -> Option<Service>) {
    if want && slot.is_none() {
        *slot = start();
    } else if !want {
        *slot = None;
    }
}

pub fn apply(app: &AppHandle, settings: &Settings) {
    if !settings.enabled("pomodoro") {
        app.state::<Arc<Pomodoro>>().reset();
    }

    let services = app.state::<Services>();
    let mut run = services.0.lock().unwrap();
    #[cfg(windows)]
    {
        use crate::win;
        toggle(&mut run.caps, settings.enabled("capslock"), || win::caps::start(app.clone()));
        toggle(&mut run.volume, settings.enabled("volume"), || win::audio::start(app.clone()));
    }
    #[cfg(not(windows))]
    {
        // Layanan sistem hanya ada di Windows.
        let _ = &mut *run;
    }
}
