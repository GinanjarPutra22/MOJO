//! Perubahan volume lewat Core Audio (IAudioEndpointVolumeCallback).

use std::sync::{mpsc, Mutex};
use std::thread;

use tauri::AppHandle;
use windows::{
    core::{implement, Result},
    Win32::{
        Media::Audio::{
            eConsole, eRender,
            Endpoints::{
                IAudioEndpointVolume, IAudioEndpointVolumeCallback,
                IAudioEndpointVolumeCallback_Impl,
            },
            IMMDeviceEnumerator, MMDeviceEnumerator, AUDIO_VOLUME_NOTIFICATION_DATA,
        },
        System::Com::{CoCreateInstance, CoInitializeEx, CoUninitialize, CLSCTX_ALL, COINIT_MULTITHREADED},
    },
};

use crate::{
    overlay::{self, Overlay},
    services::Service,
};

#[implement(IAudioEndpointVolumeCallback)]
struct VolumeCallback {
    app: AppHandle,
    last: Mutex<Option<(u32, bool)>>,
}

impl IAudioEndpointVolumeCallback_Impl for VolumeCallback_Impl {
    fn OnNotify(&self, pnotify: *mut AUDIO_VOLUME_NOTIFICATION_DATA) -> Result<()> {
        if pnotify.is_null() {
            return Ok(());
        }
        let data = unsafe { &*pnotify };
        let pct = (data.fMasterVolume * 100.0).round() as u32;
        let muted = data.bMuted.as_bool();

        let mut last = self.last.lock().unwrap();
        if *last == Some((pct, muted)) {
            return Ok(());
        }
        *last = Some((pct, muted));

        let mut o = if muted {
            Overlay::new("mute", "Suara dimatikan")
        } else {
            Overlay::new("volume", format!("Volume {pct}%"))
        };
        o.value = Some(if muted { 0 } else { pct });
        overlay::emit(&self.app, o);
        Ok(())
    }
}

enum Msg {
    Stop,
}

unsafe fn run(app: AppHandle, rx: mpsc::Receiver<Msg>, ready: mpsc::Sender<bool>) {
    let _ = unsafe { CoInitializeEx(None, COINIT_MULTITHREADED) };

    let setup = || -> Result<(IAudioEndpointVolume, IAudioEndpointVolumeCallback)> {
        unsafe {
            let enumerator: IMMDeviceEnumerator =
                CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)?;
            let device = enumerator.GetDefaultAudioEndpoint(eRender, eConsole)?;
            let endpoint: IAudioEndpointVolume = device.Activate(CLSCTX_ALL, None)?;
            let cb: IAudioEndpointVolumeCallback =
                VolumeCallback { app, last: Mutex::new(None) }.into();
            endpoint.RegisterControlChangeNotify(&cb)?;
            Ok((endpoint, cb))
        }
    };

    match setup() {
        Ok((endpoint, cb)) => {
            let _ = ready.send(true);
            // Tidur sampai diminta berhenti. Tidak ada polling.
            let _ = rx.recv();
            unsafe {
                let _ = endpoint.UnregisterControlChangeNotify(&cb);
            }
        }
        Err(_) => {
            let _ = ready.send(false);
        }
    }
    unsafe { CoUninitialize() };
}

pub fn start(app: AppHandle) -> Option<Service> {
    let (tx, rx) = mpsc::channel::<Msg>();
    let (ready_tx, ready_rx) = mpsc::channel::<bool>();
    thread::spawn(move || unsafe { run(app, rx, ready_tx) });
    if !ready_rx.recv().ok()? {
        return None;
    }
    Some(Service::new(move || {
        let _ = tx.send(Msg::Stop);
    }))
}
