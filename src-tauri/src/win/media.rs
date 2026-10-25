//! Musik yang sedang diputar lewat Windows media session (SMTC).
//! Bekerja untuk Spotify, YouTube Music di browser, dsb. Berbasis event:
//! Windows memanggil kita saat lagu, status, atau posisi berubah.

use std::{
    collections::hash_map::DefaultHasher,
    hash::{Hash, Hasher},
    sync::{mpsc, Arc, Mutex, OnceLock},
    thread,
    time::{SystemTime, UNIX_EPOCH},
};

use serde::Serialize;
use tauri::{AppHandle, Emitter};
use windows::{
    Foundation::TypedEventHandler,
    Media::Control::{
        GlobalSystemMediaTransportControlsSession as Session,
        GlobalSystemMediaTransportControlsSessionManager as Manager,
        GlobalSystemMediaTransportControlsSessionPlaybackStatus as Status,
    },
    Storage::Streams::DataReader,
    Win32::System::Com::{CoInitializeEx, CoUninitialize, COINIT_MULTITHREADED},
};

use crate::services::Service;

/// Selisih detik antara tahun 1601 (epoch Windows) dan 1970, dalam satuan 100 ns.
const EPOCH_DIFF_100NS: i64 = 116_444_736_000_000_000;

#[derive(Serialize, Clone, Default)]
pub struct MusicState {
    pub has_session: bool,
    /// Kunci lagu (judul|artis|album), dipakai UI untuk mengenali pergantian lagu.
    pub track_key: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub playing: bool,
    pub position_ms: i64,
    pub duration_ms: i64,
    /// Kapan `position_ms` dihitung (ms sejak 1970); UI memperkirakan posisi dari sini.
    pub at_ms: i64,
    /// Sampul sebagai data URL. Hanya dikirim saat berubah.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thumb: Option<String>,
}

pub enum Cmd {
    Toggle,
    Next,
    Prev,
    Stop,
}

static TX: OnceLock<Mutex<Option<mpsc::Sender<Cmd>>>> = OnceLock::new();

fn tx_slot() -> &'static Mutex<Option<mpsc::Sender<Cmd>>> {
    TX.get_or_init(|| Mutex::new(None))
}

/// Kirim perintah kontrol (play/pause, next, prev) ke sesi aktif.
pub fn send(cmd: Cmd) {
    if let Some(tx) = tx_slot().lock().unwrap().as_ref() {
        let _ = tx.send(cmd);
    }
}

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

const B64: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

fn base64(data: &[u8]) -> String {
    let mut out = String::with_capacity(data.len().div_ceil(3) * 4);
    for chunk in data.chunks(3) {
        let n = (chunk[0] as u32) << 16
            | (*chunk.get(1).unwrap_or(&0) as u32) << 8
            | *chunk.get(2).unwrap_or(&0) as u32;
        out.push(B64[(n >> 18) as usize & 63] as char);
        out.push(B64[(n >> 12) as usize & 63] as char);
        out.push(if chunk.len() > 1 { B64[(n >> 6) as usize & 63] as char } else { '=' });
        out.push(if chunk.len() > 2 { B64[n as usize & 63] as char } else { '=' });
    }
    out
}

fn read_thumbnail(props: &windows::Media::Control::GlobalSystemMediaTransportControlsSessionMediaProperties) -> Option<Vec<u8>> {
    let stream = props.Thumbnail().ok()?.OpenReadAsync().ok()?.join().ok()?;
    let size = stream.Size().ok()? as u32;
    if size == 0 || size > 4 * 1024 * 1024 {
        return None;
    }
    let reader = DataReader::CreateDataReader(&stream).ok()?;
    reader.LoadAsync(size).ok()?.join().ok()?;
    let mut buf = vec![0u8; size as usize];
    reader.ReadBytes(&mut buf).ok()?;
    Some(buf)
}

/// Sesi yang sedang dipantau beserta token event-nya.
struct Tracker {
    session: Option<(Session, [i64; 3])>,
    last_thumb_hash: Option<u64>,
}

impl Tracker {
    fn unbind(&mut self) {
        if let Some((s, t)) = self.session.take() {
            let _ = s.RemoveMediaPropertiesChanged(t[0]);
            let _ = s.RemovePlaybackInfoChanged(t[1]);
            let _ = s.RemoveTimelinePropertiesChanged(t[2]);
        }
    }

    fn snapshot(&mut self) -> MusicState {
        let Some((session, _)) = &self.session else {
            self.last_thumb_hash = None;
            return MusicState::default();
        };
        let mut st = MusicState { has_session: true, ..Default::default() };

        let props = session.TryGetMediaPropertiesAsync().ok().and_then(|o| o.join().ok());
        if let Some(p) = &props {
            st.title = p.Title().map(|h| h.to_string()).unwrap_or_default();
            st.artist = p.Artist().map(|h| h.to_string()).unwrap_or_default();
            st.album = p.AlbumTitle().map(|h| h.to_string()).unwrap_or_default();
            if let Some(bytes) = read_thumbnail(p) {
                let mut h = DefaultHasher::new();
                bytes.hash(&mut h);
                let hash = h.finish();
                if self.last_thumb_hash != Some(hash) {
                    self.last_thumb_hash = Some(hash);
                    // Sampul biasanya JPEG; WebView mengenali format dari isinya.
                    st.thumb = Some(format!("data:image/jpeg;base64,{}", base64(&bytes)));
                }
            }
        }
        st.track_key = format!("{}|{}|{}", st.title, st.artist, st.album);

        st.playing = session
            .GetPlaybackInfo()
            .and_then(|i| i.PlaybackStatus())
            .map(|s| s == Status::Playing)
            .unwrap_or(false);

        if let Ok(t) = session.GetTimelineProperties() {
            let to_ms = |ticks: i64| ticks / 10_000;
            let start = t.StartTime().map(|d| d.Duration).unwrap_or(0);
            let end = t.EndTime().map(|d| d.Duration).unwrap_or(0);
            let pos = t.Position().map(|d| d.Duration).unwrap_or(0);
            st.duration_ms = to_ms(end - start).max(0);
            let mut position = to_ms(pos - start).max(0);
            // Posisi dilaporkan pada LastUpdatedTime; majukan sampai sekarang kalau sedang main.
            if st.playing {
                if let Ok(u) = t.LastUpdatedTime() {
                    let updated_ms = to_ms(u.UniversalTime - EPOCH_DIFF_100NS);
                    position += (now_ms() - updated_ms).max(0);
                }
            }
            if st.duration_ms > 0 {
                position = position.min(st.duration_ms);
            }
            st.position_ms = position;
        }
        st.at_ms = now_ms();
        st
    }
}

type Notify = Arc<dyn Fn() + Send + Sync>;

fn bind(tracker: &mut Tracker, manager: &Manager, notify: &Notify) {
    tracker.unbind();
    let Ok(session) = manager.GetCurrentSession() else { return };
    let n = notify.clone();
    let a = session.MediaPropertiesChanged(&TypedEventHandler::new(move |_, _| {
        n();
        Ok(())
    }));
    let n = notify.clone();
    let b = session.PlaybackInfoChanged(&TypedEventHandler::new(move |_, _| {
        n();
        Ok(())
    }));
    let n = notify.clone();
    let c = session.TimelinePropertiesChanged(&TypedEventHandler::new(move |_, _| {
        n();
        Ok(())
    }));
    if let (Ok(a), Ok(b), Ok(c)) = (a, b, c) {
        tracker.session = Some((session, [a, b, c]));
    }
}

fn run(app: AppHandle, rx: mpsc::Receiver<Cmd>, ready: mpsc::Sender<bool>) {
    let _ = unsafe { CoInitializeEx(None, COINIT_MULTITHREADED) };

    let manager = Manager::RequestAsync().ok().and_then(|o| o.join().ok());
    let Some(manager) = manager else {
        let _ = ready.send(false);
        unsafe { CoUninitialize() };
        return;
    };

    let tracker = Arc::new(Mutex::new(Tracker { session: None, last_thumb_hash: None }));

    // Dipanggil dari thread Windows setiap ada perubahan; membangun keadaan dan mengirimnya ke UI.
    let notify: Notify = {
        let tracker = tracker.clone();
        let app = app.clone();
        Arc::new(move || {
            let state = tracker.lock().unwrap().snapshot();
            let _ = app.emit("music", state);
        })
    };

    let session_token = {
        let (tracker, notify, m) = (tracker.clone(), notify.clone(), manager.clone());
        manager.CurrentSessionChanged(&TypedEventHandler::new(move |_, _| {
            bind(&mut tracker.lock().unwrap(), &m, &notify);
            notify();
            Ok(())
        }))
    };

    bind(&mut tracker.lock().unwrap(), &manager, &notify);
    notify();
    let _ = ready.send(true);

    // Tidur sampai ada perintah. Tidak ada polling.
    while let Ok(cmd) = rx.recv() {
        let session = manager.GetCurrentSession().ok();
        match (cmd, session) {
            (Cmd::Stop, _) => break,
            (Cmd::Toggle, Some(s)) => {
                let _ = s.TryTogglePlayPauseAsync().and_then(|o| o.join());
            }
            (Cmd::Next, Some(s)) => {
                let _ = s.TrySkipNextAsync().and_then(|o| o.join());
            }
            (Cmd::Prev, Some(s)) => {
                let _ = s.TrySkipPreviousAsync().and_then(|o| o.join());
            }
            _ => {}
        }
    }

    if let Ok(t) = session_token {
        let _ = manager.RemoveCurrentSessionChanged(t);
    }
    tracker.lock().unwrap().unbind();
    let _ = app.emit("music", MusicState::default());
    unsafe { CoUninitialize() };
}

pub fn start(app: AppHandle) -> Option<Service> {
    let (tx, rx) = mpsc::channel::<Cmd>();
    let (ready_tx, ready_rx) = mpsc::channel::<bool>();
    thread::spawn(move || run(app, rx, ready_tx));
    if !ready_rx.recv().ok()? {
        return None;
    }
    *tx_slot().lock().unwrap() = Some(tx.clone());
    Some(Service::new(move || {
        *tx_slot().lock().unwrap() = None;
        let _ = tx.send(Cmd::Stop);
    }))
}
