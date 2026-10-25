import { useEffect, useId, useState } from "react";
import type { PondVisual } from "./model";
const names = {
  safe: "Aman",
  warning: "Waspada",
  critical: "Kritis",
  unknown: "Belum ada data",
};
export function PondMap({
  ponds,
  selected,
  onSelect,
  onSensor,
}: {
  ponds: PondVisual[];
  selected?: string;
  onSelect?: (id: string) => void;
  onSensor?: () => void;
}) {
  const uid = useId().replace(/:/g, "");
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const change = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);
  return (
    <div className={`pond-map ${visible ? "" : "motion-paused"}`}>
      <svg
        viewBox="0 0 800 530"
        role="img"
        aria-label="Peta tambak semi-isometrik. Pilih kolam melalui tombol di bawah peta."
      >
        <defs>
          <linearGradient id={`water${uid}`} x2="1" y2="1">
            <stop stopColor="#14B8A6" />
            <stop offset="1" stopColor="#08758a" />
          </linearGradient>
          <linearGradient id={`land${uid}`} x2="0" y2="1">
            <stop stopColor="#284b55" />
            <stop offset="1" stopColor="#123340" />
          </linearGradient>
          <pattern
            id={`grid${uid}`}
            width="42"
            height="42"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M42 0H0V42"
              fill="none"
              stroke="#8ddbd0"
              strokeOpacity=".08"
            />
          </pattern>
        </defs>
        <rect width="800" height="530" fill={`url(#grid${uid})`} />
        <ellipse
          cx="415"
          cy="422"
          rx="320"
          ry="70"
          fill="#001a2b"
          opacity=".45"
        />
        <g transform="translate(15 22)">
          <path d="M45 242 420 55 754 231 379 441Z" fill="#0b2735" />
          <path
            d="M45 220 420 33 754 209 379 419Z"
            fill={`url(#land${uid})`}
            stroke="#5f9296"
            strokeWidth="1"
          />
          {ponds.slice(0, 3).map((p, i) => {
            const x = [150, 375, 210][i],
              y = [180, 200, 302][i];
            return (
              <g
                key={p.id}
                onClick={() => onSelect?.(p.id)}
                style={{ cursor: onSelect ? "pointer" : "default" }}
                className={`map-pond ${selected === p.id ? "selected" : ""}`}
              >
                <path
                  d={`M${x - 70} ${y} l135 -67 150 78 -135 67Z`}
                  fill="#052c42"
                  stroke={selected === p.id ? "#6ce4cf" : "#578589"}
                  strokeWidth={selected === p.id ? 3 : 1}
                />
                <path
                  d={`M${x - 58} ${y} l124 -59 132 69 -124 59Z`}
                  fill={`url(#water${uid})`}
                  opacity={p.status === "unknown" ? 0.25 : 0.85}
                />
                {[0, 1, 2].map((n) => (
                  <path
                    className="water-line"
                    key={n}
                    d={`M${x - 30 + n * 28} ${y + 8 + n * 7} l90 -44`}
                    stroke="#a5f8ea"
                    strokeOpacity=".25"
                    strokeWidth="2"
                  />
                ))}
                <ellipse
                  className="water-ripple"
                  cx={x + 65}
                  cy={y + 7}
                  rx="28"
                  ry="14"
                  fill="none"
                  stroke="#affff0"
                  strokeOpacity=".45"
                />
                <g
                  className="aerator"
                  style={{ transformOrigin: `${x + 65}px ${y + 7}px` }}
                >
                  <path
                    d={`M${x + 48} ${y + 7}h34M${x + 65} ${y - 4}v22`}
                    stroke="#d7f3ef"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </g>
                <circle cx={x + 2} cy={y - 30} r="8" fill="#d9fff4" />
                <circle cx={x + 2} cy={y - 30} r="3" fill="#0B6E8E" />
                <path
                  className="data-path"
                  d={`M${x + 2} ${y - 30} Q550 180 596 140`}
                  fill="none"
                  stroke="#68d9cb"
                  strokeWidth="1.6"
                  strokeDasharray="5 8"
                  opacity=".6"
                />
                <text
                  x={x + 38}
                  y={y + 48}
                  fill="#d9f4ef"
                  fontSize="13"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {p.name}
                </text>
              </g>
            );
          })}
          <g transform="translate(570 90)">
            <path d="M-13 36 18 20 51 37 19 54Z" fill="#14B8A6" />
            <path d="M-13 36v35l32 17V54Z" fill="#0a6266" />
            <path d="M19 54 51 37v34L19 88Z" fill="#0b8c86" />
            <path d="M19 20V-6" stroke="#d5f8ee" strokeWidth="3" />
            <circle cx="19" cy="-10" r="5" fill="#8effdf" />
            <path
              d="M6-16q13-14 26 0M-2-24q21-22 42 0"
              fill="none"
              stroke="#8effdf"
              opacity=".6"
            />
            <text
              x="20"
              y="114"
              fontSize="12"
              fill="#b8dbdc"
              textAnchor="middle"
            >
              PondHub
            </text>
          </g>
        </g>
      </svg>
      <div className="map-caption">
        <span className="connection-dot" /> Visual konfigurasi · {ponds.length}{" "}
        kolam
      </div>
      <div className="pond-map-selector">
        {ponds.map((p) => (
          <button
            key={p.id}
            disabled={!onSelect}
            aria-label={`${p.name} ${names[p.status]}, oksigen ${p.oxygen === null ? "belum tersedia" : p.oxygen.toFixed(1) + " mg/L"}`}
            onClick={() => onSelect?.(p.id)}
            aria-pressed={selected === p.id}
            className={selected === p.id ? "active" : ""}
          >
            <strong>{p.name}</strong>
            <span className={`status-${p.status}`}>{names[p.status]}</span>
            <b>
              {p.oxygen === null ? "—" : p.oxygen.toFixed(1)}{" "}
              <small>mg/L</small>
            </b>
          </button>
        ))}
      </div>
      {onSensor && (
        <button className="map-sensor-button" onClick={onSensor}>
          Lihat sensor {ponds.find((p) => p.id === selected)?.name ?? ""} ↗
        </button>
      )}
    </div>
  );
}
