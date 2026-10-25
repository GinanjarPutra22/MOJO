use serde::Serialize;
use tauri::{AppHandle, Emitter};

/// Pesan singkat yang ditampilkan island (volume, Caps Lock, baterai, dll.).
#[derive(Serialize, Clone)]
pub struct Overlay {
    pub kind: &'static str,
    pub text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ms: Option<u64>,
}

impl Overlay {
    pub fn new(kind: &'static str, text: impl Into<String>) -> Self {
        Overlay { kind, text: text.into(), value: None, ms: None }
    }
}

pub fn emit(app: &AppHandle, overlay: Overlay) {
    let _ = app.emit("overlay", overlay);
}
