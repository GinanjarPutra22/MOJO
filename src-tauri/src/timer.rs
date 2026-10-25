//! Pomodoro. Waktu dihitung di Rust (bukan di JavaScript), jadi tetap akurat
//! walau island tertutup. Tidak ada polling: satu thread tidur sampai tenggat.

use std::{
    sync::{Arc, Condvar, Mutex},
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

use crate::overlay::{self, Overlay};

#[derive(Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Mode {
    Focus,
    Short,
    Long,
}

impl Mode {
    fn duration(self) -> u64 {
        match self {
            Mode::Focus => 25 * 60_000,
            Mode::Short => 5 * 60_000,
            Mode::Long => 15 * 60_000,
        }
    }
}

#[derive(Clone, Serialize)]
pub struct PomodoroState {
    pub mode: Mode,
    pub running: bool,
    /// Sisa waktu saat berhenti/jeda.
    pub remaining_ms: u64,
    /// Waktu selesai (ms sejak 1970) saat berjalan.
    pub ends_at_ms: u64,
    /// Total durasi mode ini, untuk menggambar cincin.
    pub total_ms: u64,
    /// Sesi fokus yang selesai sejak MOJO dibuka (atau sejak modul dinyalakan).
    pub sessions: u32,
}

struct Inner {
    state: PomodoroState,
    /// Naik setiap start/jeda/reset; thread lama berhenti kalau angkanya beda.
    generation: u64,
}

pub struct Pomodoro {
    inner: Mutex<Inner>,
    wake: Condvar,
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn idle(mode: Mode, sessions: u32) -> PomodoroState {
    PomodoroState {
        mode,
        running: false,
        remaining_ms: mode.duration(),
        ends_at_ms: 0,
        total_ms: mode.duration(),
        sessions,
    }
}

/// Mode setelah fokus: istirahat panjang tiap sesi fokus ke-4.
fn break_after(sessions: u32) -> Mode {
    if sessions > 0 && sessions % 4 == 0 {
        Mode::Long
    } else {
        Mode::Short
    }
}

impl Pomodoro {
    pub fn new() -> Arc<Self> {
        Arc::new(Pomodoro {
            inner: Mutex::new(Inner { state: idle(Mode::Focus, 0), generation: 0 }),
            wake: Condvar::new(),
        })
    }

    /// Ganti keadaan dan hentikan thread yang sedang menunggu.
    fn replace(&self, g: &mut Inner, state: PomodoroState) -> PomodoroState {
        g.state = state;
        g.generation += 1;
        self.wake.notify_all();
        g.state.clone()
    }

    pub fn get(&self) -> PomodoroState {
        self.inner.lock().unwrap().state.clone()
    }

    pub fn start(self: &Arc<Self>, app: &AppHandle) -> PomodoroState {
        let mut g = self.inner.lock().unwrap();
        if g.state.running {
            return g.state.clone();
        }
        g.state.running = true;
        g.state.ends_at_ms = now_ms() + g.state.remaining_ms;
        g.generation += 1;
        let my_gen = g.generation;
        let snapshot = g.state.clone();
        drop(g);

        let this = Arc::clone(self);
        let app = app.clone();
        std::thread::spawn(move || this.run(my_gen, app));
        snapshot
    }

    pub fn pause(&self) -> PomodoroState {
        let mut g = self.inner.lock().unwrap();
        if g.state.running {
            let mut s = g.state.clone();
            s.remaining_ms = s.ends_at_ms.saturating_sub(now_ms());
            s.running = false;
            return self.replace(&mut g, s);
        }
        g.state.clone()
    }

    /// Ulang waktu mode yang sedang dipakai.
    pub fn reset(&self) -> PomodoroState {
        let mut g = self.inner.lock().unwrap();
        let s = idle(g.state.mode, g.state.sessions);
        self.replace(&mut g, s)
    }

    /// Kembali ke awal sama sekali (dipakai saat modul dimatikan).
    pub fn reset_all(&self) -> PomodoroState {
        let mut g = self.inner.lock().unwrap();
        self.replace(&mut g, idle(Mode::Focus, 0))
    }

    pub fn set_mode(&self, mode: Mode) -> PomodoroState {
        let mut g = self.inner.lock().unwrap();
        let s = idle(mode, g.state.sessions);
        self.replace(&mut g, s)
    }

    /// Loncat ke mode berikutnya (tanpa menghitung sesi), dalam keadaan berhenti.
    pub fn skip(&self) -> PomodoroState {
        let mut g = self.inner.lock().unwrap();
        let sessions = g.state.sessions;
        let next = match g.state.mode {
            Mode::Focus => break_after(sessions + 1),
            _ => Mode::Focus,
        };
        self.replace(&mut g, idle(next, sessions))
    }

    fn run(&self, my_gen: u64, app: AppHandle) {
        let mut g = self.inner.lock().unwrap();
        loop {
            if g.generation != my_gen || !g.state.running {
                return;
            }
            let now = now_ms();
            if now >= g.state.ends_at_ms {
                break;
            }
            let wait = Duration::from_millis(g.state.ends_at_ms - now);
            g = self.wake.wait_timeout(g, wait).unwrap().0;
        }

        // Waktu habis: pindah mode dan berhenti, menunggu pengguna menekan Mulai.
        let finished = g.state.mode;
        let mut sessions = g.state.sessions;
        let next = if finished == Mode::Focus {
            sessions += 1;
            break_after(sessions)
        } else {
            Mode::Focus
        };
        let snapshot = self.replace(&mut g, idle(next, sessions));
        drop(g);

        let text = if finished == Mode::Focus { "Fokus selesai" } else { "Istirahat selesai" };
        let mut o = Overlay::new("pomodoro", text);
        o.ms = Some(5000);
        overlay::emit(&app, o);
        let _ = app.emit("pomodoro", snapshot);
    }
}
