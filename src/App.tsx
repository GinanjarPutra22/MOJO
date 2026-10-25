import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { formatDate, formatTime, useMinuteClock } from "./clock";
import { Back, Gear } from "./icons";
import OverlayView from "./OverlayView";
import { ANIM_MS, COLLAPSED, EXPANDED, resizeIsland } from "./island";
import { MODULES } from "./modules";
import { listenOverlay, overlayStore } from "./overlay";
import { invoke } from "@tauri-apps/api/core";
import { enabledStore, loadSettings, saveSettings, type Settings } from "./settings";
import { listenMusic } from "./modules/music/store";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const HOVER_OPEN_MS = 120;
const HOVER_CLOSE_MS = 500;

export default function App() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"home" | "settings">("home");
  const [tabId, setTabId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>({ modules: {} });
  const now = useMinuteClock();
  const overlay = overlayStore.use();

  const want = useRef(false);
  const isOpen = useRef(false);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .catch(() => {});
    const offOverlay = listenOverlay();
    const offMusic = listenMusic();
    return () => {
      offOverlay();
      offMusic();
    };
  }, []);

  /** Samakan keadaan island dengan keinginan terakhir (`want`). Aman dipanggil berulang. */
  const sync = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      while (want.current !== isOpen.current) {
        if (want.current) {
          // Perbesar jendela dulu, baru animasikan island di dalamnya.
          await resizeIsland(EXPANDED);
          isOpen.current = true;
          setOpen(true);
          await wait(ANIM_MS);
        } else {
          // Animasikan island dulu, baru kecilkan jendela.
          isOpen.current = false;
          setOpen(false);
          await wait(ANIM_MS + 30);
          await resizeIsland(COLLAPSED);
          setView("home");
        }
      }
    } finally {
      busy.current = false;
    }
  }, []);

  const hover = (inside: boolean) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => {
        want.current = inside;
        sync();
      },
      inside ? HOVER_OPEN_MS : HOVER_CLOSE_MS,
    );
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        want.current = false;
        sync();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sync]);

  useEffect(() => enabledStore.set(settings.modules), [settings]);

  const enabled = MODULES.filter((m) => settings.modules[m.id] ?? false);
  const tabs = enabled.filter((m) => m.tab);
  const current = tabs.find((m) => m.id === tabId) ?? tabs[0];

  const toggleModule = (id: string, value: boolean) => {
    const next = { modules: { ...settings.modules, [id]: value } };
    setSettings(next);
    saveSettings(next).catch(() => {});
  };

  const clockOn = settings.modules["clock"] ?? false;
  const centerText = clockOn ? `${formatDate(now)} | ${formatTime(now)}` : "MOJO";

  return (
    <div
      className={`island${open ? " open" : ""}`}
      onMouseEnter={() => hover(true)}
      onMouseLeave={() => hover(false)}
    >
      {/* Tampilan ciut */}
      <div className="mini" aria-hidden={open}>
        <div className="mini-side left">
          {enabled.map((m) => m.mini?.Left && <m.mini.Left key={m.id} />)}
        </div>
        <div className="mini-center">{overlay ? <OverlayView overlay={overlay} /> : clockOn ? formatTime(now) : "MOJO"}</div>
        <div className="mini-side right">
          {enabled.map((m) => m.mini?.Right && <m.mini.Right key={m.id} />)}
        </div>
      </div>

      {/* Tampilan terbuka */}
      <div className="content" aria-hidden={!open}>
        <header className="bar">
          <nav className="tabs">
            {view === "home" &&
              tabs.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`tab${m === current ? " on" : ""}`}
                  onClick={() => setTabId(m.id)}
                >
                  {m.tab!.label}
                </button>
              ))}
            {view === "settings" && <span className="tab on">Pengaturan</span>}
          </nav>
          <div className="bar-center">{overlay ? <OverlayView overlay={overlay} /> : centerText}</div>
          <button
            type="button"
            className="icon"
            aria-label={view === "home" ? "Pengaturan" : "Kembali"}
            onClick={() => setView(view === "home" ? "settings" : "home")}
          >
            {view === "home" ? <Gear /> : <Back />}
          </button>
        </header>

        {/* Tab tetap terpasang (state tidak hilang), hanya disembunyikan. */}
        <main className="body" hidden={view !== "home"}>
          {tabs.length === 0 && <p className="muted">Belum ada modul aktif. Nyalakan di Pengaturan.</p>}
          {tabs.map((m) => {
            const Tab = m.tab!.Component;
            return (
              <section key={m.id} hidden={m !== current} className="tab-pane">
                <Tab active={open && view === "home" && m === current} />
              </section>
            );
          })}
        </main>

        {view === "settings" && (
          <main className="body settings">
            {MODULES.map((m) => (
              <label key={m.id} className="row">
                <span>
                  <strong>{m.name}</strong>
                  <small>{m.description}</small>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={settings.modules[m.id] ?? false}
                  onChange={(e) => toggleModule(m.id, e.target.checked)}
                />
              </label>
            ))}
            <button type="button" className="quit" onClick={() => invoke("quit_app")}>
              Keluar dari MOJO
            </button>
          </main>
        )}
      </div>
    </div>
  );
}
