//! Overlay Caps Lock lewat hook keyboard low-level (WH_KEYBOARD_LL).
//!
//! Privasi: hook hanya memeriksa apakah tombol yang ditekan adalah Caps Lock.
//! Tombol lain tidak disimpan, dicatat, atau dikirim ke mana pun.

use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc, OnceLock,
    },
    thread,
};

use tauri::AppHandle;
use windows::Win32::{
    Foundation::{LPARAM, LRESULT, WPARAM},
    System::Threading::GetCurrentThreadId,
    UI::{
        Input::KeyboardAndMouse::{GetKeyState, VK_CAPITAL},
        WindowsAndMessaging::{
            CallNextHookEx, GetMessageW, PostThreadMessageW, SetWindowsHookExW,
            UnhookWindowsHookEx, KBDLLHOOKSTRUCT, MSG, WH_KEYBOARD_LL, WM_KEYDOWN, WM_QUIT,
            WM_SYSKEYDOWN,
        },
    },
};

use crate::{
    overlay::{self, Overlay},
    services::Service,
};

static APP: OnceLock<AppHandle> = OnceLock::new();
/// Status Caps Lock menurut kita. Dibalik setiap Caps Lock ditekan.
static CAPS_ON: AtomicBool = AtomicBool::new(false);
static HELD: AtomicBool = AtomicBool::new(false);

unsafe extern "system" fn hook(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    if code >= 0 {
        let kb = unsafe { &*(lparam.0 as *const KBDLLHOOKSTRUCT) };
        if kb.vkCode == VK_CAPITAL.0 as u32 {
            let msg = wparam.0 as u32;
            if msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN {
                // Abaikan pengulangan otomatis saat tombol ditahan.
                if !HELD.swap(true, Ordering::Relaxed) {
                    let on = !CAPS_ON.fetch_xor(true, Ordering::Relaxed);
                    if let Some(app) = APP.get() {
                        let text = if on { "Caps Lock aktif" } else { "Caps Lock mati" };
                        overlay::emit(app, Overlay::new("caps", text));
                    }
                }
            } else {
                HELD.store(false, Ordering::Relaxed);
            }
        }
    }
    unsafe { CallNextHookEx(None, code, wparam, lparam) }
}

pub fn start(app: AppHandle) -> Option<Service> {
    let _ = APP.set(app);
    let (tx, rx) = mpsc::channel::<Option<u32>>();

    thread::spawn(move || unsafe {
        let hook_handle = match SetWindowsHookExW(WH_KEYBOARD_LL, Some(hook), None, 0) {
            Ok(h) => h,
            Err(_) => {
                let _ = tx.send(None);
                return;
            }
        };
        // Status awal diambil sekali dari Windows.
        CAPS_ON.store(GetKeyState(VK_CAPITAL.0 as i32) & 1 != 0, Ordering::Relaxed);
        HELD.store(false, Ordering::Relaxed);
        let _ = tx.send(Some(GetCurrentThreadId()));

        // Hook low-level butuh message loop di thread yang memasangnya.
        let mut msg = MSG::default();
        while GetMessageW(&mut msg, None, 0, 0).as_bool() {}
        let _ = UnhookWindowsHookEx(hook_handle);
    });

    let thread_id = rx.recv().ok()??;
    Some(Service::new(move || unsafe {
        let _ = PostThreadMessageW(thread_id, WM_QUIT, WPARAM(0), LPARAM(0));
    }))
}
