import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import { invoke } from "@tauri-apps/api/core";
import App from "./App";

// Teruskan galat ke terminal Rust supaya terlihat walau jendela tidak tampil.
const report = (m: string) => invoke("log_js", { message: m }).catch(() => {});
window.addEventListener("error", (e) => report(`${e.message} @ ${e.filename}:${e.lineno}`));
window.addEventListener("unhandledrejection", (e) => report(`promise ditolak: ${String(e.reason)}`));
report("halaman dimuat");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
