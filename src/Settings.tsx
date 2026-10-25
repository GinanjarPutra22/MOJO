import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { MODULES } from "./modules";
import { num, setPref, type Pref } from "./settings";

interface Props {
  open: boolean;
  enabled: Record<string, boolean>;
  prefs: Record<string, Pref>;
  onToggle: (id: string, value: boolean) => void;
}

type Part = "f" | "s" | "t";

export default function Settings({ open, enabled, prefs, onToggle }: Props) {
  const [part, setPart] = useState<Part>("f");
  const style = prefs["ui.style"] === "d" ? "d" : "n";
  const font = num(prefs, "ui.font", 100);
  const radius = num(prefs, "ui.radius", 34);
  const pinned = prefs["ui.pinned"] === true;

  const featureCount = MODULES.filter((m) => m.group === "feature" && enabled[m.id]).length;
  const Switch = ({ id, name }: { id: string; name: string }) => {
    const on = !!enabled[id];
    const isFeature = MODULES.find((m) => m.id === id)?.group === "feature";
    return (
      <button
        type="button"
        className="sw"
        role="switch"
        aria-checked={on}
        title={MODULES.find((m) => m.id === id)?.description}
        onClick={() => {
          if (on && isFeature && featureCount < 2) return; // minimal satu fitur aktif
          onToggle(id, !on);
        }}
      >
        <span>{name}</span>
        <i />
      </button>
    );
  };

  return (
    <div className={`set${open ? " on" : ""}`}>
      <div className="set-top">
        <div className="seg sets" role="group" aria-label="Bagian pengaturan">
          {([["f", "Fitur"], ["s", "Sistem"], ["t", "Tampilan"]] as [Part, string][]).map(([p, label]) => (
            <button key={p} type="button" className={part === p ? "on" : ""} onClick={() => setPart(p)}>{label}</button>
          ))}
        </div>
        <div className="row">
          <button type="button" className="pill" aria-pressed={pinned} style={pinned ? { background: "#fff", color: "#000" } : undefined} onClick={() => setPref("ui.pinned", !pinned)}>
            Tetap terbuka
          </button>
          <button type="button" className="pill quit" onClick={() => invoke("quit_app")}>Keluar</button>
        </div>
      </div>

      {part === "f" && (
        <div className="sp on">
          <div className="sg">
            {MODULES.filter((m) => m.group === "feature").map((m) => <Switch key={m.id} id={m.id} name={m.name} />)}
          </div>
          <p className="sm" style={{ margin: "10px 0 0", fontSize: 12 }}>
            Geser kiri/kanan atau tekan panah untuk pindah fitur. Minimal satu fitur aktif.
          </p>
        </div>
      )}
      {part === "s" && (
        <div className="sp on">
          <div className="sg">
            {MODULES.filter((m) => m.group === "system").map((m) => <Switch key={m.id} id={m.id} name={m.name} />)}
          </div>
          <p className="sm" style={{ margin: "10px 0 0", fontSize: 12 }}>
            Layanan latar. Yang dimatikan benar-benar berhenti. Arahkan mouse ke saklar untuk penjelasan.
          </p>
        </div>
      )}
      {part === "t" && (
        <div className="sp on">
          <div className="sr">
            <span>Gaya</span>
            <div className="seg">
              <button type="button" className={style === "n" ? "on" : ""} onClick={() => setPref("ui.style", "n")}>Notch</button>
              <button type="button" className={style === "d" ? "on" : ""} onClick={() => setPref("ui.style", "d")}>Dynamic Island</button>
            </div>
          </div>
          <div className="sr">
            <span>Ukuran font</span>
            <div className="ct">
              <input type="range" min={85} max={120} step={5} value={font} aria-label="Ukuran font" onChange={(e) => setPref("ui.font", Number(e.target.value))} />
              <output>{font}%</output>
            </div>
          </div>
          <div className="sr">
            <span>Radius sudut</span>
            <div className="ct">
              <input type="range" min={12} max={44} step={1} value={radius} aria-label="Radius sudut" onChange={(e) => setPref("ui.radius", Number(e.target.value))} />
              <output>{radius} px</output>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
