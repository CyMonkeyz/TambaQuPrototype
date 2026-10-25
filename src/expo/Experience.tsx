import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Expand,
  Menu,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Waves,
  X,
} from "lucide-react";
import { AppLogo } from "../components/common/AppLogo";
import { Dialog } from "../components/ui/Overlay";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PondMap } from "./PondMap";
import { demoPonds, scenes } from "./model";
import { useExpoStore } from "./store";
import "./expo.css";

const statuses = {
  safe: "Aman",
  warning: "Waspada",
  critical: "Kritis",
  unknown: "Belum ada data",
};
export function Landing() {
  useDocumentTitle("Tambak dalam satu pandangan");
  return (
    <div className="aqua-app landing">
      <header className="aqua-header">
        <Link to="/" aria-label="Beranda TambaQu">
          <AppLogo inverted />
        </Link>
        <span className="brand-line">SENSE · CONNECT · ACT</span>
        <Link to="/login" className="aqua-account">
          Masuk Akun <ArrowUpRight size={16} />
        </Link>
      </header>
      <main className="landing-grid">
        <section className="landing-copy">
          <p className="eyebrow">
            <span /> TEMAN TUMBUH TAMBAKMU
          </p>
          <h1>
            Satu pandangan.
            <br />
            <em>Seluruh kondisi</em>
            <br />
            tambak.
          </h1>
          <p className="landing-description">
            Kenali perubahan air, pahami risikonya, dan tentukan langkah
            berikutnya bersama TambaQu.
          </p>
          <div className="landing-actions">
            <Link
              className="aqua-button"
              onClick={() => useExpoStore.getState().reset()}
              to="/demo"
            >
              Coba Demo <ArrowRight size={18} />
            </Link>
            <Link
              className="aqua-button secondary"
              onClick={() => useExpoStore.getState().reset()}
              to="/expo"
            >
              <Play size={16} /> Mode Presentasi
            </Link>
          </div>
          <p className="landing-footnote">
            Tanpa daftar · Demo interaktif · Sekitar 90 detik
          </p>
          <div className="landing-benefits">
            <span>
              <Waves size={19} /> Pantau air
            </span>
            <span>
              <Sparkles size={19} /> Pahami kondisi
            </span>
            <span>
              <Check size={19} /> Tindak lebih cepat
            </span>
          </div>
        </section>
        <section
          className="landing-visual"
          aria-label="Pratinjau visual tambak"
        >
          <div className="visual-topline">
            <span className="mini-label">TAMBAK MINA JAYA</span>
            <span className="data-label">Data simulasi</span>
          </div>
          <PondMap ponds={demoPonds(0)} selected="b" />
          <div className="floating-insight">
            <span className="insight-symbol">
              <Sparkles size={19} />
            </span>
            <div>
              <strong>Kondisi air terpantau</strong>
              <p>Oksigen 5,8 mg/L · Kolam B</p>
            </div>
            <span className="status-pill status-safe">
              <Check size={12} /> Aman
            </span>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <span>Dirancang untuk budidaya udang vaname.</span>
        <span>Teknologi yang dekat dengan petambak.</span>
      </footer>
    </div>
  );
}

export function DemoExperience({ expo = false }: { expo?: boolean }) {
  useDocumentTitle(expo ? "Mode Expo" : "Demo Interaktif");
  const store = useExpoStore();
  const { simulation, selected, recorded } = store;
  const index = simulation.currentStep;
  const scene = scenes[index];
  const ponds = demoPonds(index);
  const pond = ponds.find((p) => p.id === selected) ?? ponds[1];
  const [section, setSection] = useState("Beranda");
  const [more, setMore] = useState(false);
  const [sensor, setSensor] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [notice, setNotice] = useState("");
  const stage = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const changed = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", changed);
    return () => document.removeEventListener("visibilitychange", changed);
  }, []);
  useEffect(() => {
    if (simulation.status !== "running" || !visible) return;
    const timer = setTimeout(() => useExpoStore.getState().next(), 18000);
    return () => clearTimeout(timer);
  }, [index, simulation.status, visible]);
  useEffect(
    () => () => {
      if (document.fullscreenElement)
        void document.exitFullscreen().catch(() => {});
    },
    [],
  );
  function next() {
    store.next();
  }
  function primary() {
    store.select("b");
    if (index === 4) {
      store.reset();
      setSection("Beranda");
    } else if (index === 3) {
      store.record();
      store.next();
      setSection("Aktivitas");
    } else {
      if (index === 1) setSection("PondBrain");
      next();
    }
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.current?.requestFullscreen();
    } catch {
      setNotice(
        "Layar penuh belum tersedia. Gunakan mode layar penuh browser.",
      );
    }
  }
  const history =
    selected === "b"
      ? scenes.slice(0, index + 1).map((s) => s.oxygen)
      : [pond.oxygen ?? 0, pond.oxygen ?? 0, pond.oxygen ?? 0];
  return (
    <div
      ref={stage}
      className={`aqua-app experience ${expo ? "expo-mode" : ""} ${visible ? "" : "motion-paused"}`}
      tabIndex={expo ? 0 : -1}
      role="region"
      aria-label={expo ? "Panggung presentasi TambaQu" : "Demo TambaQu"}
      onKeyDown={(e) => {
        if (
          !expo ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement ||
          (e.target as HTMLElement).isContentEditable
        )
          return;
        if (e.key === "Escape") {
          navigate("/demo");
          return;
        }
        if (e.target !== stage.current) return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          next();
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          store.go(index - 1);
        }
        if (e.code === "Space") {
          e.preventDefault();
          store.toggle();
        }
      }}
    >
      <header className="aqua-header">
        <Link to="/" aria-label="Beranda TambaQu">
          <AppLogo inverted />
        </Link>
        {!expo && (
          <nav className="desktop-demo-nav" aria-label="Navigasi demo">
            {["Beranda", "Kolam", "PondBrain", "Aktivitas"].map((s) => (
              <button
                aria-current={section === s ? "page" : undefined}
                className={section === s ? "active" : ""}
                key={s}
                onClick={() => setSection(s)}
              >
                {s}
              </button>
            ))}
            <button onClick={() => setMore(true)}>
              Lainnya <Menu size={15} />
            </button>
          </nav>
        )}
        <div className="header-right">
          <span className="data-label">Data simulasi</span>
          {expo ? (
            <Link className="icon-text" to="/demo">
              <X size={18} /> Keluar
            </Link>
          ) : (
            <Link className="icon-text" to="/expo">
              <Expand size={17} />
              <span>Presentasi</span>
            </Link>
          )}
        </div>
      </header>
      <main className="demo-main">
        <div className="demo-heading">
          <div>
            <p className="eyebrow">
              TAMBAK MINA JAYA <span className="eyebrow-divider" /> DEMO PRODUK
            </p>
            <h1>
              {expo
                ? scene.title
                : section === "Beranda"
                  ? "Lebih dekat dengan tambakmu."
                  : section === "Kolam"
                    ? "Setiap kolam, lebih terbaca."
                    : section === "PondBrain"
                      ? "Pahami yang berubah."
                      : "Setiap tindakan punya cerita."}
            </h1>
            <p>
              {expo
                ? scene.description
                : "Pantau kondisi. Kenali perubahan. Tentukan langkah."}
            </p>
          </div>
          {!expo && (
            <div className="farm-weather">
              <span>☀</span>
              <div>
                <strong>29 °C</strong>
                <small>Cuaca contoh · Cerah</small>
              </div>
            </div>
          )}
        </div>
        <div className="demo-grid">
          <section className="map-panel">
            <div className="panel-topline">
              <div>
                <p className="mini-label">PETA TAMBAK</p>
                <h2>Ruang tumbuh yang terhubung.</h2>
              </div>
              <span className="map-live">
                <span className="connection-dot" /> Skenario {index + 1}/5
              </span>
            </div>
            <PondMap
              ponds={ponds}
              selected={selected}
              onSelect={store.select}
              onSensor={() => setSensor(true)}
            />
          </section>
          <aside className="story-panel" key={`${index}-${section}`}>
            <div className="story-eyebrow">
              <Sparkles size={15} /> PONDBRAIN INSIGHT{" "}
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
            <span className={`status-pill status-${pond.status}`}>
              {pond.status === "safe" ? (
                <Check size={13} />
              ) : (
                <Bell size={13} />
              )}{" "}
              {statuses[pond.status]}
            </span>
            <h2>
              {selected === "b"
                ? scene.title
                : `${pond.name} dalam kondisi stabil.`}
            </h2>
            <p className="story-description">
              {selected === "b"
                ? scene.description
                : "Pengukuran contoh berada dalam rentang acuan. Lanjutkan pemeriksaan rutin dan pantau perubahan."}
            </p>
            {section === "Aktivitas" && (
              <div className="activity-preview">
                <Check size={20} />
                <div>
                  <strong>
                    {recorded
                      ? "Pemeriksaan aerasi dicatat"
                      : "Pemantauan dimulai"}
                  </strong>
                  <p>
                    {recorded
                      ? "Catatan contoh tim pada skenario demo."
                      : "Belum ada tindak lanjut dicatat."}
                  </p>
                </div>
              </div>
            )}
            <>
              <div className="oxygen-reading">
                <span>Oksigen terlarut · {pond.name}</span>
                <p key={`${pond.id}-${pond.oxygen}`}>
                  {pond.oxygen?.toFixed(1)}
                  <small>mg/L</small>
                </p>
                <span>
                  {index > 0 && index < 4 && selected === "b"
                    ? "↓ Menurun dari 5,8 mg/L"
                    : index === 4 && selected === "b"
                      ? "↑ Meningkat pada adegan pemulihan"
                      : "Dalam rentang acuan demo"}
                </span>
              </div>
              <MiniChart values={history} />
            </>
            <div className="next-action">
              <span>LANGKAH BERIKUTNYA</span>
              <strong>
                {index === 0
                  ? "Lihat cara TambaQu mengenali perubahan"
                  : index < 3
                    ? "Periksa tren dan rekomendasi aerasi"
                    : index === 3
                      ? "Periksa aerasi dan catat tindak lanjut"
                      : "Bandingkan kondisi dan catatan tim"}
              </strong>
            </div>
            <button className="aqua-button story-action" onClick={primary}>
              {scene.action}
              {index === 4 ? <RotateCcw size={17} /> : <ArrowRight size={17} />}
            </button>
            {index === 4 && (
              <p className="recovery-note">
                Pemulihan adalah adegan simulasi, bukan akibat otomatis dari
                pencatatan tindakan.
              </p>
            )}
          </aside>
        </div>
        <div className="sensor-strip">
          {[
            {
              label: "Suhu air",
              value: pond.temperature?.toFixed(1),
              unit: "°C",
              note: "Suhu kolam terpilih",
            },
            {
              label: "pH air",
              value: pond.ph?.toFixed(1),
              unit: "pH",
              note: "Keseimbangan air",
            },
            {
              label: "Sensor terhubung",
              value: "3",
              unit: "node",
              note: "PondHub menerima data contoh",
            },
            {
              label: "Tindak lanjut",
              value: recorded ? "1" : "0",
              unit: "catatan",
              note: "Tercatat dalam sesi demo",
            },
          ].map((s, i) => (
            <button
              key={s.label}
              className="sensor-summary"
              onClick={() =>
                i === 3 ? setSection("Aktivitas") : setSensor(true)
              }
            >
              <span className="sensor-icon">
                {i === 0 ? (
                  <Waves size={20} />
                ) : i === 1 ? (
                  <Sparkles size={20} />
                ) : i === 2 ? (
                  <span className="connection-dot" />
                ) : (
                  <Check size={20} />
                )}
              </span>
              <div>
                <span>{s.label}</span>
                <strong>
                  {s.value}
                  <small>{s.unit}</small>
                </strong>
                <p>{s.note}</p>
              </div>
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
        {section === "PondBrain" && (
          <section className="photo-example">
            <div>
              <p className="mini-label">FOTO → TEKS → KONTEKS</p>
              <h2>Catatan lapangan ikut terbaca.</h2>
              <p>
                Contoh hasil transkripsi yang bisa ditinjau sebelum disimpan.
              </p>
            </div>
            <div className="transcript-paper">
              <span>CATATAN CONTOH · KOLAM B · 05.00 WIB</span>
              <p>
                DO <strong>4,2 mg/L</strong> · Suhu <strong>30,1 °C</strong>
              </p>
              <p>Periksa aerasi dan ukur kembali.</p>
              <small>Ketidakpastian: tanggal pada foto terpotong.</small>
            </div>
          </section>
        )}
        {notice && <p role="status">{notice}</p>}
      </main>
      <footer className="scene-bar">
        <div className="scene-steps" aria-label="Adegan demo">
          {scenes.map((s, i) => (
            <button
              key={s.id}
              onClick={() => store.go(i)}
              aria-current={index === i ? "step" : undefined}
              className={index === i ? "active" : i < index ? "passed" : ""}
            >
              <span>{i < index ? <Check size={12} /> : i + 1}</span>
              {s.label}
            </button>
          ))}
        </div>
        <div className="scene-controls">
          <button
            aria-label="Adegan sebelumnya"
            disabled={index === 0}
            onClick={() => store.go(index - 1)}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="play-control"
            onClick={() => {
              stage.current?.focus();
              store.toggle();
            }}
            aria-label={
              simulation.status === "running"
                ? "Jeda presentasi"
                : "Putar presentasi"
            }
          >
            {simulation.status === "running" ? (
              <Pause size={18} />
            ) : (
              <Play size={18} />
            )}
          </button>
          <button
            aria-label="Adegan berikutnya"
            disabled={index === 4}
            onClick={next}
          >
            <ChevronRight size={20} />
          </button>
          <button aria-label="Ulangi demo" onClick={store.reset}>
            <RotateCcw size={17} />
          </button>
          {expo && (
            <button aria-label="Layar penuh" onClick={() => void fullscreen()}>
              <Expand size={17} />
            </button>
          )}
          <span className="duration-label">
            {simulation.status === "running" ? "Memutar" : "90 detik"} ·{" "}
            {index + 1}/5
          </span>
        </div>
      </footer>
      {!expo && (
        <nav className="mobile-demo-nav" aria-label="Navigasi ponsel demo">
          {["Beranda", "Kolam", "PondBrain", "Aktivitas"].map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={section === s ? "active" : ""}
            >
              {s}
            </button>
          ))}
          <button aria-label="Menu lainnya" onClick={() => setMore(true)}>
            <Menu size={18} />
          </button>
        </nav>
      )}
      <Dialog
        open={sensor}
        onOpenChange={setSensor}
        title={`Sensor ${pond.name}`}
        description="Pengukuran dan tren dalam data simulasi."
      >
        <div className="space-y-4">
          <p>
            Oksigen: <strong>{pond.oxygen?.toFixed(1)} mg/L</strong>
          </p>
          <p>
            Suhu: <strong>{pond.temperature?.toFixed(1)} °C</strong> · pH:{" "}
            <strong>{pond.ph?.toFixed(1)}</strong>
          </p>
          <div style={{ background: "#083F55", padding: 20, borderRadius: 16 }}>
            <MiniChart values={history} />
          </div>
          <p className="text-sm text-foreground-muted">
            Angka menunjukkan langkah skenario, bukan pengukuran hardware.
          </p>
        </div>
      </Dialog>
      <Dialog
        open={more}
        onOpenChange={setMore}
        title="Jelajahi TambaQu"
        description="Fitur lanjutan dan akses akun."
      >
        <div className="grid gap-3">
          {[
            [
              "Perangkat & sensor",
              "PondHub menghubungkan node sensor antar kolam.",
            ],
            ["Layanan & sewa", "Paket modular dengan pendampingan Pondivator."],
            ["Laporan", "Riwayat pengukuran dan tindakan dalam satu tempat."],
          ].map(([a, b]) => (
            <div key={a} className="rounded-xl bg-surface-muted p-4">
              <strong>{a}</strong>
              <p className="mt-2 text-sm">{b}</p>
            </div>
          ))}
          <Link className="aqua-button" to="/login">
            Masuk ruang pilot <ArrowRight size={16} />
          </Link>
        </div>
      </Dialog>
    </div>
  );
}
function MiniChart({ values }: { values: number[] }) {
  const data = values.length === 1 ? [values[0], values[0]] : values;
  const points = data
    .map((v, i) => `${12 + (i * 276) / (data.length - 1)},${76 - (v - 3) * 20}`)
    .join(" ");
  return (
    <svg
      className="mini-chart"
      viewBox="0 0 300 92"
      role="img"
      aria-label={`Tren oksigen contoh: ${values.map((v) => v.toFixed(1)).join(", ")} mg/L`}
    >
      <path d="M0 24H300M0 52H300M0 80H300" stroke="#ffffff15" />
      <polyline
        className="trend-line"
        points={points}
        fill="none"
        stroke="#61e0c6"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((v, i) => (
        <circle
          key={i}
          cx={12 + (i * 276) / (data.length - 1)}
          cy={76 - (v - 3) * 20}
          r="4"
          fill="#a0f9e5"
        />
      ))}
    </svg>
  );
}
