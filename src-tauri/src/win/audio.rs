//! Audio lewat Core Audio: perubahan volume (IAudioEndpointVolumeCallback) dan
//! pergantian perangkat output default, mis. headphone dicolok (IMMNotificationClient).
//! Keduanya berbasis callback dari Windows, tanpa polling.

use std::sync::{mpsc, Mutex};
use std::thread;

use tauri::AppHandle;
use windows::{
    core::{implement, Result, PCWSTR},
    Win32::{
        Devices::FunctionDiscovery::PKEY_Device_FriendlyName,
        Foundation::PROPERTYKEY,
        Media::Audio::{
            eConsole, eRender,
            Endpoints::{
                IAudioEndpointVolume, IAudioEndpointVolumeCallback,
                IAudioEndpointVolumeCallback_Impl,
            },
            EDataFlow, ERole, IMMDeviceEnumerator, IMMNotificationClient,
            IMMNotificationClient_Impl, MMDeviceEnumerator, AUDIO_VOLUME_NOTIFICATION_DATA,
            DEVICE_STATE,
        },
        System::Com::{
            CoCreateInstance, CoInitializeEx, CoUninitialize, CLSCTX_ALL, COINIT_MULTITHREADED,
            STGM_READ,
        },
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
    /// Perangkat output default berganti; isinya id perangkat baru.
    DeviceChanged(String),
}

/// Hanya meneruskan pergantian perangkat ke thread audio (callback harus singkat).
#[implement(IMMNotificationClient)]
struct DeviceCallback {
    tx: Mutex<mpsc::Sender<Msg>>,
}

impl IMMNotificationClient_Impl for DeviceCallback_Impl {
    fn OnDeviceStateChanged(&self, _: &PCWSTR, _: DEVICE_STATE) -> Result<()> {
        Ok(())
    }
    fn OnDeviceAdded(&self, _: &PCWSTR) -> Result<()> {
        Ok(())
    }
    fn OnDeviceRemoved(&self, _: &PCWSTR) -> Result<()> {
        Ok(())
    }
    fn OnDefaultDeviceChanged(&self, flow: EDataFlow, role: ERole, id: &PCWSTR) -> Result<()> {
        if flow == eRender && role == eConsole && !id.is_null() {
            let id = unsafe { id.to_string() }.unwrap_or_default();
            let _ = self.tx.lock().unwrap().send(Msg::DeviceChanged(id));
        }
        Ok(())
    }
    fn OnPropertyValueChanged(&self, _: &PCWSTR, _: &PROPERTYKEY) -> Result<()> {
        Ok(())
    }
}

type VolumeBinding = (IAudioEndpointVolume, IAudioEndpointVolumeCallback);

fn bind_volume(enumerator: &IMMDeviceEnumerator, app: &AppHandle) -> Result<VolumeBinding> {
    unsafe {
        let device = enumerator.GetDefaultAudioEndpoint(eRender, eConsole)?;
        let endpoint: IAudioEndpointVolume = device.Activate(CLSCTX_ALL, None)?;
        let cb: IAudioEndpointVolumeCallback =
            VolumeCallback { app: app.clone(), last: Mutex::new(None) }.into();
        endpoint.RegisterControlChangeNotify(&cb)?;
        Ok((endpoint, cb))
    }
}

fn unbind_volume(binding: Option<VolumeBinding>) {
    if let Some((endpoint, cb)) = binding {
        unsafe {
            let _ = endpoint.UnregisterControlChangeNotify(&cb);
        }
    }
}

fn device_name(enumerator: &IMMDeviceEnumerator, id: &str) -> Option<String> {
    let wide: Vec<u16> = id.encode_utf16().chain(std::iter::once(0)).collect();
    unsafe {
        let device = enumerator.GetDevice(PCWSTR(wide.as_ptr())).ok()?;
        let store = device.OpenPropertyStore(STGM_READ).ok()?;
        let value = store.GetValue(&PKEY_Device_FriendlyName).ok()?;
        let name = value.to_string();
        (!name.is_empty()).then_some(name)
    }
}

fn run(
    app: AppHandle,
    volume: bool,
    device: bool,
    tx: mpsc::Sender<Msg>,
    rx: mpsc::Receiver<Msg>,
    ready: mpsc::Sender<bool>,
) {
    let _ = unsafe { CoInitializeEx(None, COINIT_MULTITHREADED) };

    let enumerator: Result<IMMDeviceEnumerator> =
        unsafe { CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL) };
    let Ok(enumerator) = enumerator else {
        let _ = ready.send(false);
        unsafe { CoUninitialize() };
        return;
    };

    let mut binding = if volume { bind_volume(&enumerator, &app).ok() } else { None };
    let client: Option<IMMNotificationClient> = device.then(|| DeviceCallback { tx: Mutex::new(tx) }.into());
    if let Some(c) = &client {
        let _ = unsafe { enumerator.RegisterEndpointNotificationCallback(c) };
    }
    let _ = ready.send(true);

    let mut last_id: Option<String> = None;
    // Tidur sampai ada pesan. Tidak ada polling.
    while let Ok(msg) = rx.recv() {
        match msg {
            Msg::Stop => break,
            Msg::DeviceChanged(id) => {
                // Volume harus dipasang ulang ke perangkat baru.
                if volume {
                    unbind_volume(binding.take());
                    binding = bind_volume(&enumerator, &app).ok();
                }
                // Windows kadang memanggil beberapa kali untuk perangkat yang sama.
                if last_id.as_deref() != Some(id.as_str()) {
                    last_id = Some(id.clone());
                    if device {
                        let name = device_name(&enumerator, &id).unwrap_or_else(|| "perangkat baru".into());
                        overlay::emit(&app, Overlay::new("audio", format!("Output: {name}")));
                    }
                }
            }
        }
    }

    if let Some(c) = &client {
        let _ = unsafe { enumerator.UnregisterEndpointNotificationCallback(c) };
    }
    unbind_volume(binding);
    unsafe { CoUninitialize() };
}

/// `volume`: overlay volume. `device`: pop-up saat perangkat output default berganti.
pub fn start(app: AppHandle, volume: bool, device: bool) -> Option<Service> {
    let (tx, rx) = mpsc::channel::<Msg>();
    let (ready_tx, ready_rx) = mpsc::channel::<bool>();
    let stop_tx = tx.clone();
    thread::spawn(move || run(app, volume, device, tx, rx, ready_tx));
    if !ready_rx.recv().ok()? {
        return None;
    }
    Some(Service::new(move || {
        let _ = stop_tx.send(Msg::Stop);
    }))
}
