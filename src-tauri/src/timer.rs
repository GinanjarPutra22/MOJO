//! Pomodoro. Waktu dihitung di Rust (bukan di JavaScript), jadi tetap akurat
//! walau island tertutup. Tidak ada polling: satu thread tidur sampai tenggat.

use std::{
    sync::{Arc, Condvar, Mutex},
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use serde::Serialize;
use tauri::{AppHandle, Emitter};

use crate::overlay::{self, Overlay};

const FOCUS_MS: u64 = 25 * 60_000;
const BREAK_MS: u64 = 5 * 60_000;

#[derive(Clone, Copy, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Phase {
    Focus,
    Break,
}

impl Phase {
    fn duration(self) -> u64 {
        match self {
            Phase::Focus => FOCUS_MS,
            Phase::Break => BREAK_MS,
        }
    }
    fn next(self) -> Phase {
        match self {
            Phase::Focus => Phase::Break,
            Phase::Break => Phase::Focus,
        }
    }
}

#[derive(Clone, Serialize)]
pub struct PomodoroState {
    pub phase: Phase,
    pub running: bool,
    /// Sisa waktu saat berhenti/jeda.
    pub remaining_ms: u64,
    /// Waktu selesai (ms sejak 1970) saat berjalan.
    pub ends_at_ms: u64,
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

impl Pomodoro {
    pub fn new() -> Arc<Self> {
        Arc::new(Pomodoro {
            inner: Mutex::new(Inner {
                state: PomodoroState {
                    phase: Phase::Focus,
                    running: false,
                    remaining_ms: FOCUS_MS,
                    ends_at_ms: 0,
                },
                generation: 0,
            }),
            wake: Condvar::new(),
        })
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
            g.state.remaining_ms = g.state.ends_at_ms.saturating_sub(now_ms());
            g.state.running = false;
            g.generation += 1;
            self.wake.notify_all();
        }
        g.state.clone()
    }

    /// Kembali ke Fokus 25:00 dan berhenti. Dipakai juga saat modul dimatikan.
    pub fn reset(&self) -> PomodoroState {
        let mut g = self.inner.lock().unwrap();
        g.state = PomodoroState {
            phase: Phase::Focus,
            running: false,
            remaining_ms: FOCUS_MS,
            ends_at_ms: 0,
        };
        g.generation += 1;
        self.wake.notify_all();
        g.state.clone()
    }

    /// Loncat ke fase berikutnya (Fokus <-> Istirahat), dalam keadaan berhenti.
    pub fn skip(&self) -> PomodoroState {
        let mut g = self.inner.lock().unwrap();
        let next = g.state.phase.next();
        g.state = PomodoroState {
            phase: next,
            running: false,
            remaining_ms: next.duration(),
            ends_at_ms: 0,
        };
        g.generation += 1;
        self.wake.notify_all();
        g.state.clone()
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

        // Waktu habis: pindah fase dan berhenti, menunggu pengguna menekan Mulai.
        let finished = g.state.phase;
        let next = finished.next();
        g.state = PomodoroState {
            phase: next,
            running: false,
            remaining_ms: next.duration(),
            ends_at_ms: 0,
        };
        g.generation += 1;
        let snapshot = g.state.clone();
        drop(g);

        let text = match finished {
            Phase::Focus => "Fokus selesai. Waktunya istirahat 5 menit",
            Phase::Break => "Istirahat selesai. Siap fokus lagi?",
        };
        let mut o = Overlay::new("pomodoro", text);
        o.ms = Some(6000);
        overlay::emit(&app, o);
        let _ = app.emit("pomodoro", snapshot);
    }
}
