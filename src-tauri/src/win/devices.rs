//! Status perangkat lewat event WinRT: baterai/charger dan jaringan (Wi-Fi).

use std::{
    sync::{mpsc, Arc, Mutex},
    thread,
};

use tauri::AppHandle;
use windows::{
    Foundation::EventHandler,
    Networking::Connectivity::{
        NetworkConnectivityLevel, NetworkInformation, NetworkStatusChangedEventHandler,
    },
    System::Power::{BatteryStatus, PowerManager},
    Win32::System::Com::{CoInitializeEx, CoUninitialize, COINIT_MULTITHREADED},
};

use crate::{
    overlay::{self, Overlay},
    services::Service,
};

type Cleanup = Box<dyn FnOnce()>;

/// Jalankan `setup` di thread MTA sendiri. Thread dibiarkan hidup (tidur) sampai
/// layanan dihentikan, lalu `cleanup` melepas handler event.
fn spawn(setup: impl FnOnce() -> Option<Cleanup> + Send + 'static) -> Option<Service> {
    let (stop_tx, stop_rx) = mpsc::channel::<()>();
    let (ready_tx, ready_rx) = mpsc::channel::<bool>();
    thread::spawn(move || {
        let _ = unsafe { CoInitializeEx(None, COINIT_MULTITHREADED) };
        let cleanup = setup();
        let _ = ready_tx.send(cleanup.is_some());
        if let Some(cleanup) = cleanup {
            let _ = stop_rx.recv();
            cleanup();
        }
        unsafe { CoUninitialize() };
    });
    if !ready_rx.recv().ok()? {
        return None;
    }
    Some(Service::new(move || {
        let _ = stop_tx.send(());
    }))
}

const LOW_BATTERY: i32 = 20;

#[derive(Default)]
struct BatteryMemory {
    plugged: Option<bool>,
    low_warned: bool,
}

pub fn start_battery(app: AppHandle) -> Option<Service> {
    spawn(move || {
        let mem = Arc::new(Mutex::new(BatteryMemory::default()));

        let check = {
            let mem = mem.clone();
            move |announce: bool| {
                let Ok(status) = PowerManager::BatteryStatus() else { return };
                if status == BatteryStatus::NotPresent {
                    return; // PC desktop tanpa baterai
                }
                let pct = PowerManager::RemainingChargePercent().unwrap_or(0);
                let plugged = status != BatteryStatus::Discharging;
                let mut m = mem.lock().unwrap();

                if announce && m.plugged.is_some_and(|p| p != plugged) {
                    let text = if plugged {
                        format!("Charger terhubung ({pct}%)")
                    } else {
                        format!("Charger dicabut ({pct}%)")
                    };
                    overlay::emit(&app, Overlay::new(if plugged { "charging" } else { "battery" }, text));
                }
                m.plugged = Some(plugged);

                if plugged || pct > LOW_BATTERY {
                    m.low_warned = false;
                } else if !m.low_warned && announce {
                    m.low_warned = true;
                    let mut o = Overlay::new("battery", format!("Baterai rendah ({pct}%)"));
                    o.ms = Some(4000);
                    overlay::emit(&app, o);
                }
            }
        };
        check(false); // catat keadaan awal tanpa pop-up

        let check = Arc::new(check);
        let on_status = {
            let check = check.clone();
            PowerManager::BatteryStatusChanged(&EventHandler::new(move |_, _| {
                check(true);
                Ok(())
            }))
        };
        let on_charge = {
            let check = check.clone();
            PowerManager::RemainingChargePercentChanged(&EventHandler::new(move |_, _| {
                check(true);
                Ok(())
            }))
        };
        let (Ok(a), Ok(b)) = (on_status, on_charge) else { return None };
        Some(Box::new(move || {
            let _ = PowerManager::RemoveBatteryStatusChanged(a);
            let _ = PowerManager::RemoveRemainingChargePercentChanged(b);
        }) as Cleanup)
    })
}

/// Ringkasan jaringan: None = offline, Some("") = online bukan Wi-Fi, Some(ssid) = Wi-Fi.
fn network_state() -> Option<String> {
    let profile = NetworkInformation::GetInternetConnectionProfile().ok()?;
    if profile.GetNetworkConnectivityLevel().ok()? != NetworkConnectivityLevel::InternetAccess {
        return None;
    }
    if profile.IsWlanConnectionProfile().unwrap_or(false) {
        let ssid = profile
            .WlanConnectionProfileDetails()
            .and_then(|d| d.GetConnectedSsid())
            .map(|s| s.to_string())
            .unwrap_or_default();
        return Some(if ssid.is_empty() { "Wi-Fi".into() } else { ssid });
    }
    Some(String::new())
}

pub fn start_network(app: AppHandle) -> Option<Service> {
    spawn(move || {
        let last = Arc::new(Mutex::new(network_state())); // keadaan awal: tanpa pop-up
        let token = NetworkInformation::NetworkStatusChanged(&NetworkStatusChangedEventHandler::new(move |_| {
            let now = network_state();
            let mut last = last.lock().unwrap();
            if *last != now {
                let o = match &now {
                    Some(ssid) if !ssid.is_empty() => Overlay::new("wifi", format!("Terhubung: {ssid}")),
                    Some(_) => Overlay::new("wifi", "Jaringan terhubung"),
                    None => Overlay::new("wifi", "Tidak ada internet"),
                };
                overlay::emit(&app, o);
                *last = now;
            }
            Ok(())
        }))
        .ok()?;
        Some(Box::new(move || {
            let _ = NetworkInformation::RemoveNetworkStatusChanged(token);
        }) as Cleanup)
    })
}
