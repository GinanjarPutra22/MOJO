import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { ANIM_MS, COLLAPSED, EXPANDED, resizeIsland } from "./island";
import { MODULES } from "./modules";
import { loadSettings, saveSettings, type Settings } from "./settings";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"home" | "settings">("home");
  const [settings, setSettings] = useState<Settings>({ modules: {} });
  const busy = useRef(false);

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .catch(() => {}); // gagal baca = pakai bawaan
  }, []);

  const expand = useCallback(async () => {
    if (busy.current || open) return;
    busy.current = true;
    // Perbesar jendela dulu, baru animasikan pil di dalamnya.
    await resizeIsland(EXPANDED);
    setOpen(true);
    await wait(ANIM_MS);
    busy.current = false;
  }, [open]);

  const collapse = useCallback(async () => {
    if (busy.current || !open) return;
    busy.current = true;
    // Animasikan pil dulu, baru kecilkan jendela.
    setOpen(false);
    await wait(ANIM_MS + 30);
    await resizeIsland(COLLAPSED);
    setView("home");
    busy.current = false;
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && collapse();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [collapse]);

  const isEnabled = (id: string, def: boolean) => settings.modules[id] ?? def;

  const toggleModule = (id: string, value: boolean) => {
    const next = { modules: { ...settings.modules, [id]: value } };
    setSettings(next);
    saveSettings(next).catch(() => {});
  };

  const enabled = MODULES.filter((m) => isEnabled(m.id, m.defaultEnabled));

  return (
    <div className={`island${open ? " open" : ""}`}>
      {!open && (
        <button
          type="button"
          className="hit"
          aria-label="Buka MOJO"
          onClick={expand}
        />
      )}

      <div className="content" aria-hidden={!open}>
        <header className="bar">
          <span className="title">{view === "home" ? "MOJO" : "Pengaturan"}</span>
          <div className="bar-actions">
            <button
              type="button"
              className="icon"
              aria-label={view === "home" ? "Pengaturan" : "Kembali"}
              onClick={() => setView(view === "home" ? "settings" : "home")}
            >
              {view === "home" ? "⚙" : "←"}
            </button>
            <button
              type="button"
              className="icon"
              aria-label="Tutup"
              onClick={collapse}
            >
              ✕
            </button>
          </div>
        </header>

        {/* Modul tetap terpasang (agar state timer tidak hilang), hanya disembunyikan. */}
        <main className="home" hidden={view !== "home"}>
          {enabled.length === 0 && (
            <p className="muted">Belum ada modul aktif. Nyalakan di Pengaturan.</p>
          )}
          {enabled.map(({ id, Component }) => (
            <Component key={id} active={open && view === "home"} />
          ))}
        </main>

        {view === "settings" && (
          <main className="settings">
            {MODULES.map((m) => {
              const on = isEnabled(m.id, m.defaultEnabled);
              return (
                <label key={m.id} className="row">
                  <span>
                    <strong>{m.name}</strong>
                    <small>{m.description}</small>
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={on}
                    onChange={(e) => toggleModule(m.id, e.target.checked)}
                  />
                </label>
              );
            })}
          </main>
        )}
      </div>
    </div>
  );
}
