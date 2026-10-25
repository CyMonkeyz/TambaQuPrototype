export type Field = {
  key: string;
  label: string;
  type?: "number" | "date" | "datetime-local" | "select" | "textarea";
  options?: readonly string[];
  required?: boolean;
  min?: number;
  max?: number;
};
export type Definition = {
  title: string;
  description: string;
  table: string;
  owner?: boolean;
  roles?: readonly string[];
  pond?: boolean;
  fields: Field[];
};
export const parameters = {
  dissolvedOxygen: { label: "Oksigen terlarut", unit: "mg/L", min: 0, max: 30 },
  ph: { label: "pH", unit: "", min: 0, max: 14 },
  temperature: { label: "Suhu", unit: "°C", min: -10, max: 70 },
  salinity: { label: "Salinitas", unit: "ppt", min: 0, max: 100 },
  ammonia: { label: "TAN", unit: "mg/L", min: 0, max: 100 },
  nitrite: { label: "Nitrit", unit: "mg/L", min: 0, max: 100 },
  alkalinity: { label: "Alkalinitas", unit: "mg/L CaCO₃", min: 0, max: 2000 },
  sv30: { label: "Volume flok (SV30)", unit: "mL/L", min: 0, max: 1000 },
  tss: { label: "TSS", unit: "mg/L", min: 0, max: 100000 },
  turbidity: { label: "Kekeruhan", unit: "NTU", min: 0, max: 10000 },
  airTemperature: { label: "Suhu udara", unit: "°C", min: -20, max: 70 },
  humidity: { label: "Kelembapan", unit: "%", min: 0, max: 100 },
  rainfall: { label: "Curah hujan", unit: "mm", min: 0, max: 2000 },
  windSpeed: { label: "Kecepatan angin", unit: "m/s", min: 0, max: 150 },
} as const;
const text = (key: string, label: string): Field => ({ key, label });
const num = (key: string, label: string, min = 0): Field => ({
  key,
  label,
  type: "number",
  min,
});
const choice = (key: string, label: string, options: string[]): Field => ({
  key,
  label,
  type: "select",
  options,
});
const when: Field = {
  key: "measured_at",
  label: "Waktu pengukuran",
  type: "datetime-local",
};
export const definitions = {
  schedules: {
    title: "Jadwal uji air",
    description: "Atur interval pemeriksaan sesuai SOP kolam.",
    table: "op_schedules",
    owner: true,
    pond: true,
    fields: [
      choice("parameter", "Parameter", [
        "ammonia",
        "nitrite",
        "alkalinity",
        "sv30",
        "tss",
        "turbidity",
      ]),
      num("interval_hours", "Ulangi setiap (jam)", 1),
      text("reference", "Acuan jadwal"),
    ],
  },
  ponds: {
    title: "Kolam",
    description: "Data kolam dan sistem budidaya.",
    table: "op_ponds",
    owner: true,
    fields: [
      text("name", "Nama kolam"),
      num("area_m2", "Luas (m²)"),
      num("depth_m", "Kedalaman (m)"),
      choice("system", "Sistem", ["semi_intensive", "biofloc", "other"]),
    ],
  },
  cycles: {
    title: "Siklus budidaya",
    description: "Pisahkan catatan setiap periode pemeliharaan.",
    table: "op_cycles",
    owner: true,
    pond: true,
    fields: [
      text("name", "Nama siklus"),
      { key: "started_on", label: "Mulai", type: "date" },
      { key: "ended_on", label: "Selesai", type: "date", required: false },
      num("stock_count", "Jumlah tebar (ekor)"),
      { ...num("initial_biomass_kg", "Biomassa awal (kg)"), required: false },
      {
        ...choice("accounting_status", "Pemeriksaan catatan", [
          "open",
          "reviewed",
        ]),
        required: false,
      },
    ],
  },
  measurements: {
    title: "Hasil uji air",
    description: "Isi hasil yang benar-benar diukur.",
    table: "op_measurements",
    pond: true,
    fields: [
      choice("parameter", "Parameter", Object.keys(parameters)),
      num("value", "Hasil ukur", -10),
      choice("source", "Sumber", ["manual", "laboratory"]),
      choice("quality", "Kualitas", ["valid", "unverified", "invalid"]),
      when,
      text("method", "Alat atau metode"),
    ],
  },
  thresholds: {
    title: "Acuan PondBrain",
    description: "Pemilik menetapkan acuan sesuai SOP lokasi.",
    table: "op_thresholds",
    owner: true,
    pond: true,
    fields: [
      choice("parameter", "Parameter", Object.keys(parameters)),
      num("minimum", "Batas bawah", -10),
      num("maximum", "Batas atas", -10),
      num("critical_minimum", "Batas kritis bawah", -10),
      num("critical_maximum", "Batas kritis atas", -10),
      num("max_age_minutes", "Batas usia data (menit)", 1),
      text("reference", "SOP atau hasil review"),
    ],
  },
  actions: {
    title: "Tindakan lapangan",
    description: "Catat tindakan, lalu evaluasi hasilnya.",
    table: "op_actions",
    pond: true,
    fields: [
      text("title", "Tindakan"),
      choice("status", "Status", ["planned", "done", "reviewed"]),
      { key: "note", label: "Catatan", type: "textarea" },
      {
        key: "outcome",
        label: "Hasil pemeriksaan ulang",
        type: "textarea",
        required: false,
      },
    ],
  },
  feed: {
    title: "Catatan pakan",
    description: "Rencana, realisasi dan persediaan pakan.",
    table: "op_feed",
    pond: true,
    roles: ["owner", "operator"],
    fields: [
      text("product", "Jenis pakan"),
      choice("entry_type", "Jenis catatan", ["stock_in", "plan", "actual"]),
      num("quantity_kg", "Berat (kg)", 0.001),
      { key: "scheduled_at", label: "Jadwal", type: "datetime-local" },
      text("note", "Catatan"),
    ],
  },
  biofloc: {
    title: "Perawatan bioflok",
    description:
      "Catat input karbon dan pengelolaan padatan. Hasil uji air dicatat pada pengukuran.",
    table: "op_biofloc",
    pond: true,
    fields: [
      choice("activity", "Kegiatan", [
        "carbon_input",
        "sludge_removal",
        "observation",
      ]),
      num("quantity", "Jumlah"),
      text("unit", "Satuan"),
      { key: "note", label: "Hasil pengamatan", type: "textarea" },
      when,
    ],
  },
  costs: {
    title: "Biaya",
    description: "Biaya aktual per kolam dan siklus.",
    table: "op_costs",
    owner: true,
    pond: true,
    fields: [
      text("title", "Kebutuhan"),
      choice("category", "Kategori", [
        "feed",
        "energy",
        "service",
        "equipment",
        "other",
      ]),
      num("amount", "Nilai (Rp)", 1),
      { key: "occurred_on", label: "Tanggal", type: "date" },
    ],
  },
  revenues: {
    title: "Pendapatan",
    description: "Penerimaan selain penjualan panen.",
    table: "op_revenues",
    owner: true,
    pond: true,
    fields: [
      text("title", "Keterangan"),
      num("amount", "Nilai (Rp)", 1),
      { key: "occurred_on", label: "Tanggal", type: "date" },
    ],
  },
  harvests: {
    title: "Panen",
    description: "Hasil timbang dan pendapatan aktual.",
    table: "op_harvests",
    owner: true,
    pond: true,
    fields: [
      num("weight_kg", "Berat panen (kg)", 0.001),
      num("amount", "Pendapatan (Rp)", 1),
      { key: "occurred_on", label: "Tanggal", type: "date" },
    ],
  },
  energy: {
    title: "Energi",
    description: "Catat pemakaian meter, bukan perkiraan penghematan.",
    table: "op_energy",
    pond: true,
    fields: [
      num("kwh", "Pemakaian (kWh)", 0.001),
      { key: "started_at", label: "Awal periode", type: "datetime-local" },
      { key: "ended_at", label: "Akhir periode", type: "datetime-local" },
      text("meter", "Identitas meter"),
    ],
  },
  configurations: {
    title: "Survei tambak",
    description: "Survei instalasi dan kompatibilitas aerator.",
    table: "op_configurations",
    owner: true,
    pond: true,
    fields: [
      text("name", "Nama survei"),
      text("aerator", "Aerator dan kapasitas"),
      text("electricity", "Daya dan proteksi listrik"),
      text("connectivity", "Koneksi dan jangkauan"),
      num("node_count", "Kebutuhan node", 1),
      choice("compatibility", "Hasil inspeksi", [
        "not_assessed",
        "compatible",
        "needs_work",
        "incompatible",
      ]),
      { key: "note", label: "Catatan teknis", type: "textarea" },
    ],
  },
  services: {
    title: "Layanan Pondivator",
    description: "Ajukan kunjungan atau laporkan gangguan.",
    table: "op_services",
    pond: true,
    fields: [
      text("title", "Kebutuhan"),
      choice("service_type", "Layanan", [
        "survey",
        "installation",
        "calibration",
        "maintenance",
        "incident",
      ]),
      choice("status", "Status", [
        "requested",
        "scheduled",
        "in_progress",
        "completed",
      ]),
      {
        key: "scheduled_at",
        label: "Jadwal",
        type: "datetime-local",
        required: false,
      },
      { key: "note", label: "Catatan dan tindak lanjut", type: "textarea" },
      {
        key: "checklist",
        label: "Hasil checklist pemeriksaan",
        type: "textarea",
        required: false,
      },
    ],
  },
  probes: {
    title: "Probe sensor",
    description: "Daftarkan identitas probe sebelum kalibrasi.",
    table: "op_probes",
    roles: ["owner", "pondivator"],
    pond: true,
    fields: [
      text("device_id", "ID SensorNode"),
      text("serial", "Nomor seri probe"),
      choice("parameter", "Parameter", Object.keys(parameters)),
    ],
  },
  calibrations: {
    title: "Kalibrasi",
    description: "Bandingkan probe dengan alat rujukan.",
    table: "op_calibrations",
    roles: ["owner", "pondivator"],
    pond: true,
    fields: [
      text("probe_id", "ID probe"),
      num("measured_value", "Hasil probe", -10),
      num("reference_value", "Hasil alat rujukan", -10),
      text("reference_tool", "Alat rujukan"),
      when,
      {
        key: "next_due_on",
        label: "Jadwal kalibrasi berikutnya",
        type: "date",
      },
      text("note", "Catatan"),
    ],
  },
} satisfies Record<string, Definition>;
export type EntityKind = keyof typeof definitions;
export interface Entity {
  id: string;
  farm_id: string;
  pond_id?: string | null;
  cycle_id?: string | null;
  created_at: string;
  created_by?: string;
  mutation_id: string;
  version: number;
  [key: string]: unknown;
}
export const labels: Record<string, string> = {
  manual: "Uji manual",
  laboratory: "Laboratorium",
  sensor: "Sensor",
  valid: "Valid",
  invalid: "Tidak valid",
  unverified: "Perlu diperiksa",
  semi_intensive: "Semi-intensif",
  biofloc: "Bioflok",
  other: "Lainnya",
  planned: "Direncanakan",
  done: "Sudah dilakukan",
  reviewed: "Sudah dievaluasi",
  stock_in: "Stok masuk",
  plan: "Rencana",
  actual: "Realisasi",
  carbon_input: "Input karbon",
  sludge_removal: "Pembuangan lumpur",
  observation: "Pengamatan",
  requested: "Diajukan",
  scheduled: "Terjadwal",
  in_progress: "Dikerjakan",
  completed: "Selesai",
  survey: "Survei",
  installation: "Instalasi",
  calibration: "Kalibrasi",
  maintenance: "Perawatan",
  incident: "Gangguan",
  not_assessed: "Belum dinilai",
  compatible: "Sesuai",
  needs_work: "Perlu penyesuaian",
  incompatible: "Tidak sesuai",
  feed: "Pakan",
  energy: "Energi",
  service: "Layanan",
  equipment: "Peralatan",
};
export const labelFor = (value: string) =>
  (parameters as Record<string, { label: string }>)[value]?.label ??
  labels[value] ??
  value;
export function validateEntity(
  kind: EntityKind,
  input: Record<string, unknown>,
) {
  const def: Definition = definitions[kind];
  if (!def) throw new Error("Jenis catatan tidak dikenal.");
  const clean: Record<string, unknown> = {};
  for (const field of def.fields) {
    const value = input[field.key];
    if (value === undefined || value === null || value === "") {
      if (field.required !== false)
        throw new Error(`${field.label} perlu diisi.`);
      continue;
    }
    if (field.type === "number") {
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < (field.min ?? -Infinity) ||
        value > (field.max ?? Infinity)
      )
        throw new Error(`${field.label} tidak valid.`);
    } else if (
      typeof value !== "string" ||
      value.trim().length === 0 ||
      value.length > (field.type === "textarea" ? 3000 : 300)
    )
      throw new Error(`${field.label} tidak valid.`);
    if (field.options && !field.options.includes(String(value)))
      throw new Error(`${field.label} tidak valid.`);
    if (
      (field.type === "date" || field.type === "datetime-local") &&
      !Number.isFinite(Date.parse(String(value)))
    )
      throw new Error(`${field.label} tidak valid.`);
    clean[field.key] = typeof value === "string" ? value.trim() : value;
  }
  if (kind === "measurements") {
    const meta = parameters[clean.parameter as keyof typeof parameters];
    if (
      !meta ||
      Number(clean.value) < meta.min ||
      Number(clean.value) > meta.max
    )
      throw new Error("Hasil ukur di luar rentang alat yang diterima.");
  }
  if (
    kind === "thresholds" &&
    !(
      Number(clean.critical_minimum) <= Number(clean.minimum) &&
      Number(clean.minimum) < Number(clean.maximum) &&
      Number(clean.maximum) <= Number(clean.critical_maximum)
    )
  )
    throw new Error("Urutan batas acuan tidak sesuai.");
  if (
    kind === "energy" &&
    Date.parse(String(clean.ended_at)) <= Date.parse(String(clean.started_at))
  )
    throw new Error("Akhir periode harus setelah awal.");
  if (
    kind === "cycles" &&
    clean.ended_on &&
    String(clean.ended_on) < String(clean.started_on)
  )
    throw new Error("Akhir siklus harus setelah mulai.");
  if (
    kind === "cycles" &&
    clean.accounting_status === "reviewed" &&
    (!clean.ended_on || clean.initial_biomass_kg === undefined)
  )
    throw new Error(
      "Lengkapi tanggal selesai dan biomassa awal sebelum menandai catatan diperiksa.",
    );
  return clean;
}
export function assessMeasurements(
  rows: Entity[],
  thresholds: Entity[],
  now = Date.now(),
) {
  const latest = (key: string) => {
    const candidates = rows
      .filter((r) => r.parameter === key)
      .sort((a, b) =>
        String(b.measured_at).localeCompare(String(a.measured_at)),
      );
    const sensor = candidates.filter(
      (r) => r.source === "sensor" && r.device_id,
    );
    const rule = thresholds
      .filter((r) => r.parameter === key)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    const relevant = sensor.length
      ? [
          ...sensor,
          ...candidates
            .filter(
              (r) =>
                r.source !== "sensor" &&
                r.quality === "valid" &&
                now - Date.parse(String(r.measured_at)) <=
                  Number(rule?.max_age_minutes) * 60000,
            )
            .slice(0, 1),
        ]
      : candidates;
    const seen = new Map<string, Entity>();
    for (const r of relevant) {
      const id = String(r.probe_id ?? r.device_id ?? "manual");
      if (!seen.has(id)) seen.set(id, r);
    }
    return [...seen.values()];
  };
  const reasons: string[] = [];
  let critical = false;
  let unknown = false;
  let warning = false;
  for (const key of ["dissolvedOxygen", "ph", "temperature"]) {
    const readings = latest(key),
      rule = thresholds
        .filter((r) => r.parameter === key)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    const name = labelFor(key);
    if (!rule) {
      unknown = true;
      reasons.push(`${name}: acuan belum diatur.`);
      continue;
    }
    if (!readings.length) {
      unknown = true;
      reasons.push(`${name}: belum diukur.`);
      continue;
    }
    for (const reading of readings) {
      const age = now - Date.parse(String(reading?.measured_at));
      if (
        !reading ||
        reading.quality !== "valid" ||
        !Number.isFinite(age) ||
        age < -60000 ||
        age > Number(rule.max_age_minutes) * 60000
      ) {
        unknown = true;
        reasons.push(`${name}: periksa data dan waktu ukur.`);
        continue;
      }
      const value = Number(reading.value);
      if (value < Number(rule.minimum) || value > Number(rule.maximum)) {
        warning = true;
        reasons.push(
          `${name} di luar acuan. Ukur ulang dan periksa kondisi kolam.`,
        );
        if (
          value < Number(rule.critical_minimum) ||
          value > Number(rule.critical_maximum)
        )
          critical = true;
      }
    }
  }
  return {
    level: critical
      ? "critical"
      : warning
        ? "warning"
        : unknown
          ? "unknown"
          : reasons.length
            ? "warning"
            : "safe",
    title: critical
      ? "Segera periksa kolam"
      : warning
        ? "Perlu perhatian"
        : unknown
          ? "Periksa kelengkapan data"
          : reasons.length
            ? "Perlu perhatian"
            : "Dalam acuan kolam",
    reasons: reasons.length
      ? [...new Set(reasons)]
      : ["Parameter inti berada dalam acuan yang ditetapkan."],
  };
}
export function feedSummary(rows: Entity[], cycleId = "") {
  const products = [...new Set(rows.map((r) => String(r.product)))];
  return products.map((product) => {
    const items = rows.filter((r) => r.product === product);
    const sum = (type: string, all = false) =>
      items
        .filter(
          (r) =>
            r.entry_type === type &&
            (all || !cycleId || r.cycle_id === cycleId),
        )
        .reduce((s, r) => s + Number(r.quantity_kg), 0);
    return {
      product,
      stock: sum("stock_in", true) - sum("actual", true),
      planned: sum("plan"),
      actual: sum("actual"),
      difference: sum("actual") - sum("plan"),
    };
  });
}
export function financeSummary(
  costs: Entity[],
  revenues: Entity[],
  harvests: Entity[],
  feed: Entity[],
  cycle?: Entity,
) {
  const cost = costs.reduce((s, r) => s + Number(r.amount), 0),
    revenue = [...revenues, ...harvests].reduce(
      (s, r) => s + Number(r.amount),
      0,
    );
  const weight = harvests.reduce((s, r) => s + Number(r.weight_kg), 0),
    actualFeed = feed
      .filter((r) => r.entry_type === "actual")
      .reduce((s, r) => s + Number(r.quantity_kg), 0);
  const complete =
    cycle?.accounting_status === "reviewed" &&
    Boolean(cycle.ended_on) &&
    cycle.initial_biomass_kg !== null &&
    cycle.initial_biomass_kg !== undefined &&
    Number.isFinite(Number(cycle.initial_biomass_kg)) &&
    harvests.length > 0 &&
    feed.some((r) => r.entry_type === "actual");
  const gain = weight - Number(cycle?.initial_biomass_kg);
  return {
    cost,
    revenue,
    difference: revenue - cost,
    fcr: complete && gain > 0 ? actualFeed / gain : null,
    margin: complete && revenue > 0 ? ((revenue - cost) / revenue) * 100 : null,
  };
}
export function csv(rows: Record<string, unknown>[]) {
  const keys = [...new Set(rows.flatMap(Object.keys))];
  const cell = (v: unknown) => {
    let s = typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return (
    "\uFEFF" +
    [
      keys.map(cell).join(","),
      ...rows.map((row) => keys.map((k) => cell(row[k])).join(",")),
    ].join("\r\n")
  );
}
