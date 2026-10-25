import {
  definitions,
  validateEntity,
  type Definition,
  type EntityKind,
} from "../../../src/operations/model.ts";
import {
  deviceTypes,
  isUuid,
  validateTelemetry,
  validateFeedback,
} from "../../../src/operations/deviceContract.ts";
import { parseExtraction } from "../../../src/pilot/rules.ts";
const check = (ok: unknown, message = "Permintaan tidak valid.") => {
  if (!ok) throw new Error(message);
};
export async function operations(db: any, userId: string, p: any) {
  if (p.operation === "ops-claim-invites") {
    const r = await db.rpc("op_claim_invites", { p_user: userId });
    check(!r.error);
    return { claimed: r.data };
  }
  if (p.operation === "create-farm") {
    check(typeof p.name === "string" && typeof p.location === "string");
    const r = await db.rpc("bootstrap_farm", {
      p_user: userId,
      p_name: p.name,
      p_location: p.location,
    });
    check(!r.error, r.error?.message);
    return { id: r.data };
  }
  const admin = await db
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (p.operation === "ops-admin") return { enabled: Boolean(admin.data) };
  if (p.operation === "ops-farms") {
    check(admin.data, "Akses admin diperlukan.");
    const r = await db
      .from("farms")
      .select("id,name,location")
      .order("name")
      .limit(500);
    check(!r.error);
    return r.data;
  }
  check(isUuid(p.farmId), "Tambak tidak valid.");
  const { data: member } = await db
    .from("memberships")
    .select("role")
    .eq("farm_id", p.farmId)
    .eq("user_id", userId)
    .maybeSingle();
  const isAdmin = Boolean(admin.data);
  check(member || isAdmin, "Akses tambak ditolak.");
  const role = member?.role ?? "admin";
  const owner = () =>
    check(role === "owner" || isAdmin, "Fitur ini dikelola pemilik tambak.");
  if (p.operation === "ops-alert") {
    check(isUuid(p.id));
    const r = await db
      .from("op_alerts")
      .update({ status: "acknowledged" })
      .eq("id", p.id)
      .eq("farm_id", p.farmId)
      .eq("status", "open");
    check(!r.error);
    return { acknowledged: true };
  }
  if (p.operation === "ops-catalog-list") {
    check(isAdmin);
    const r = await db.from("catalog").select("*").order("name");
    check(!r.error);
    return r.data;
  }
  if (p.operation === "ops-extraction") {
    check(
      p.data?.reviewedAt && Number.isFinite(Date.parse(p.data.reviewedAt)),
      "Periksa hasil pembacaan sebelum menyimpan.",
    );
    const value = parseExtraction(p.data.extraction);
    check(JSON.stringify(value).length <= 100000, "Catatan terlalu panjang.");
    const r = await db
      .from("op_extractions")
      .insert({
        farm_id: p.farmId,
        created_by: userId,
        text_content: value.text,
        visual_context: value.context,
        observations: value.observations,
        tables_data: value.tables,
        uncertainties: value.uncertainties,
        reviewed_at: p.data.reviewedAt,
      })
      .select("id")
      .single();
    check(!r.error);
    return r.data;
  }
  if (p.operation === "ops-commands") {
    const r = await db
      .from("commands")
      .select("id,device_id,status,feedback,created_at,expires_at")
      .eq("farm_id", p.farmId)
      .order("created_at", { ascending: false })
      .limit(100);
    check(!r.error);
    return r.data;
  }
  if (p.operation === "ops-catalog") {
    check(isAdmin, "Katalog dikelola admin.");
    check(
      [
        "Core Monitoring",
        "Smart Oxygen",
        "BioflocCare",
        "Cluster Service",
      ].includes(p.name) &&
        Number.isSafeInteger(p.monthlyPrice) &&
        p.monthlyPrice > 0 &&
        typeof p.enabled === "boolean",
    );
    check(!p.id || isUuid(p.id));
    const q = db.from("catalog");
    const payload = {
      name: p.name,
      monthly_price: p.monthlyPrice,
      enabled: p.enabled,
    };
    const r = await (
      p.id ? q.update(payload).eq("id", p.id) : q.insert(payload)
    )
      .select("id")
      .single();
    check(!r.error);
    return r.data;
  }
  if (p.operation === "ops-snapshot") {
    const kinds = Object.keys(definitions).filter(
      (k) =>
        !(definitions[k as EntityKind] as Definition).owner ||
        role === "owner" ||
        isAdmin,
    );
    const result: Record<string, unknown[]> = {};
    const more: string[] = [];
    const asOf = new Date().toISOString();
    await Promise.all(
      [
        ...kinds,
        "alerts",
        ...(role === "owner" || isAdmin
          ? ["quotes", "contracts", "invoices"]
          : []),
      ].map(async (kind) => {
        const table = definitions[kind as EntityKind]?.table ?? `op_${kind}`;
        const all: unknown[] = [];
        let offset = 0;
        do {
          const r = await db
            .from(table)
            .select("*")
            .eq("farm_id", p.farmId)
            .lte("created_at", asOf)
            .order("created_at", { ascending: false })
            .order("id")
            .range(offset, offset + 499);
          check(!r.error, "Ringkasan belum dapat dimuat.");
          all.push(...r.data);
          if (kind === "measurements") {
            if (r.data.length === 500) more.push(kind);
            break;
          }
          if (r.data.length < 500) break;
          offset += 500;
          check(offset < 100000, "Gunakan periode ekspor yang lebih pendek.");
        } while (offset < 100000);
        if (kind === "measurements") {
          const latest = await db.rpc("op_latest_measurements", {
            p_farm: p.farmId,
          });
          check(!latest.error);
          const merged = new Map(all.map((r: any) => [r.id, r]));
          for (const r of latest.data ?? []) merged.set(r.id, r);
          result[kind] = [...merged.values()];
        } else result[kind] = all;
      }),
    );
    const devices=await db.from('devices').select('id').eq('farm_id',p.farmId).eq('enabled',true);check(!devices.error);const enabled=new Set((devices.data??[]).map((d:any)=>d.id));result.measurements=(result.measurements??[]).filter((r:any)=>!r.device_id||enabled.has(r.device_id));
    return { rows: result, more };
  }
  if (p.operation === "ops-list") {
    const table =
      p.kind === "alerts"
        ? "op_alerts"
        : p.kind === "extractions"
          ? "op_extractions"
          : p.kind === "quotes"
            ? "op_quotes"
            : p.kind === "contracts"
              ? "op_contracts"
              : p.kind === "invoices"
                ? "op_invoices"
                : definitions[p.kind as EntityKind]?.table;
    check(table, "Jenis data tidak dikenal.");
    if (
      (definitions[p.kind as EntityKind] as Definition)?.owner ||
      ["quotes", "contracts", "invoices"].includes(p.kind)
    )
      owner();
    check(
      p.offset === undefined ||
        (Number.isInteger(p.offset) && p.offset >= 0 && p.offset <= 10000000),
      "Halaman tidak valid.",
    );
    const offset = p.offset ?? 0;
    check(
      !p.asOf || Number.isFinite(Date.parse(p.asOf)),
      "Waktu ekspor tidak valid.",
    );
    let query = db.from(table).select("*").eq("farm_id", p.farmId);
    if (p.asOf) query = query.lte("created_at", p.asOf);
    const r = await query
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + 499);
    check(!r.error);
    return { rows: r.data, next: r.data.length === 500 ? offset + 500 : null };
  }
  if (p.operation === "ops-quality") {
    check(
      Number.isFinite(Date.parse(p.start)) &&
        Number.isFinite(Date.parse(p.end)),
    );
    const r = await db.rpc("op_data_quality", {
      p_farm: p.farmId,
      p_start: p.start,
      p_end: p.end,
    });
    check(!r.error, r.error?.message);
    return r.data;
  }
  if (p.operation === "ops-save") {
    const def = definitions[p.kind as EntityKind] as Definition;
    check(def);
    if (def.owner) owner();
    if (def.roles)
      check(
        def.roles.includes(role) || isAdmin,
        "Hak pencatatan tidak sesuai.",
      );
    check(isUuid(p.mutationId) && p.data && typeof p.data === "object");
    const data = validateEntity(p.kind, p.data);
    if (def.pond) {
      check(isUuid(p.data.pond_id), "Pilih kolam.");
      data.pond_id = p.data.pond_id;
    }
    if (p.data.cycle_id) {
      check(isUuid(p.data.cycle_id));
      data.cycle_id = p.data.cycle_id;
    }
    if (p.kind === "services") {
      if (!isAdmin && role !== "pondivator" && !p.id)
        check(
          data.status === "requested",
          "Perubahan status dikelola petugas.",
        );
      if (data.status === "completed")
        check(
          String(data.checklist ?? "").trim().length > 0,
          "Lengkapi checklist pemeriksaan.",
        );
    }
    if (p.id) {
      check(isUuid(p.id) && Number.isInteger(p.version));
      if (["ponds", "cycles", "thresholds", "configurations"].includes(p.kind))
        owner();
      const old = await db
        .from(def.table)
        .select("*")
        .eq("id", p.id)
        .eq("farm_id", p.farmId)
        .single();
      check(old.data, "Catatan tidak ditemukan.");
      if (p.kind === "services" && !isAdmin) {
        if (role === "pondivator")
          check(
            !old.data.assigned_to || old.data.assigned_to === userId,
            "Kunjungan ditugaskan kepada petugas lain.",
          );
        else check(old.data.status === data.status, "Status dikelola petugas.");
      }
      check(
        (old.data.pond_id ?? undefined) === data.pond_id &&
          old.data.cycle_id === (data.cycle_id ?? null),
        "Kolam dan siklus catatan tidak dapat dipindahkan.",
      );
    }
    if (p.kind === "probes") {
      check(isUuid(data.device_id));
      const d = await db
        .from("devices")
        .select("id,operational_pond_id,device_type")
        .eq("id", data.device_id)
        .eq("farm_id", p.farmId)
        .eq("enabled", true)
        .single();
      check(
        d.data?.operational_pond_id === data.pond_id,
        "Probe harus terhubung ke perangkat pada kolam yang sama.",
      );
      const weather = [
        "airTemperature",
        "humidity",
        "rainfall",
        "windSpeed",
      ].includes(String(data.parameter));
      check(
        d.data.device_type === "aqua_weather"
          ? weather
          : d.data.device_type === "sensor_node" && !weather,
        "Parameter tidak sesuai jenis perangkat.",
      );
    }
    if (p.kind === "calibrations") {
      check(isUuid(data.probe_id));
      const r = await db
        .from("op_probes")
        .select("pond_id")
        .eq("id", data.probe_id)
        .eq("farm_id", p.farmId)
        .single();
      check(r.data?.pond_id === data.pond_id, "Probe tidak sesuai kolam.");
    }
    const r = await db.rpc("op_write", {
      p_table: def.table,
      p_farm: p.farmId,
      p_actor: userId,
      p_data: data,
      p_mutation: p.mutationId,
      p_id: p.id ?? null,
      p_version: p.version ?? null,
    });
    check(!r.error, r.error?.message ?? "Catatan belum tersimpan.");
    return r.data;
  }
  if (p.operation === "ops-members") {
    owner();
    const r = await db
      .from("memberships")
      .select("user_id,role")
      .eq("farm_id", p.farmId);
    check(!r.error);
    return r.data;
  }
  if (p.operation === "ops-member") {
    owner();
    check(
      isUuid(p.userId) &&
        p.userId !== userId &&
        ["operator", "pondivator", "revoke"].includes(p.role),
      "Perubahan anggota tidak valid.",
    );
    const r = await db.rpc("op_member", {
      p_farm: p.farmId,
      p_user: p.userId,
      p_role: p.role,
      p_actor: userId,
    });
    check(!r.error);
    return { updated: true };
  }
  if (p.operation === "ops-assign") {
    check(isAdmin, "Penugasan dikelola admin layanan.");
    check(isUuid(p.id) && isUuid(p.userId));
    const m = await db
      .from("memberships")
      .select("role")
      .eq("farm_id", p.farmId)
      .eq("user_id", p.userId)
      .single();
    check(
      m.data?.role === "pondivator",
      "Pilih Pondivator yang ditugaskan pada tambak.",
    );
    const r = await db
      .from("op_services")
      .update({ assigned_to: p.userId })
      .eq("id", p.id)
      .eq("farm_id", p.farmId);
    check(!r.error);
    return { updated: true };
  }
  if (p.operation === "ops-quote") {
    check(isAdmin, "Penawaran dibuat admin layanan.");
    check(
      [
        "Core Monitoring",
        "Smart Oxygen",
        "BioflocCare",
        "Cluster Service",
      ].includes(p.package) &&
        Number.isSafeInteger(p.amount) &&
        p.amount > 0 &&
        ["monthly", "cycle"].includes(p.periodType) &&
        typeof p.terms === "string" &&
        p.terms.length > 0 &&
        p.terms.length <= 5000 &&
        Number.isFinite(Date.parse(p.startsOn)) &&
        Date.parse(p.endsOn) > Date.parse(p.startsOn),
    );
    const r = await db
      .from("op_quotes")
      .insert({
        farm_id: p.farmId,
        package: p.package,
        amount: p.amount,
        period_type: p.periodType,
        starts_on: p.startsOn,
        ends_on: p.endsOn,
        terms: p.terms,
        created_by: userId,
      })
      .select()
      .single();
    check(!r.error);
    return r.data;
  }
  if (p.operation === "ops-accept") {
    owner();
    check(
      p.accepted === true && isUuid(p.quoteId),
      "Periksa dan setujui penawaran.",
    );
    const r = await db.rpc("op_accept_quote", {
      p_farm: p.farmId,
      p_quote: p.quoteId,
      p_actor: userId,
    });
    check(!r.error, r.error?.message);
    return { id: r.data };
  }
  if (p.operation === "ops-cancel") {
    owner();
    check(isUuid(p.contractId));
    const r = await db
      .from("op_contracts")
      .update({ cancel_at_end: true })
      .eq("farm_id", p.farmId)
      .eq("id", p.contractId);
    check(!r.error);
    return { cancelled: true };
  }
  if (p.operation === "ops-cluster") {
    check(isAdmin, "Klaster dikelola admin layanan.");
    check(
      typeof p.name === "string" &&
        p.name.length <= 120 &&
        typeof p.agreement === "string" &&
        p.agreement.length > 0 &&
        p.agreement.length <= 5000 &&
        isUuid(p.hubId),
    );
    const r = await db.rpc("op_cluster", {
      p_name: p.name,
      p_agreement: p.agreement,
      p_hub: p.hubId,
      p_members: p.members,
    });
    check(!r.error, r.error?.message);
    return r.data;
  }
  if (p.operation === "ops-link-node") {
    check(isAdmin, "Penautan klaster dikelola admin.");
    check(isUuid(p.hubId) && isUuid(p.nodeId));
    const r = await db.rpc("op_link_node", {
      p_hub: p.hubId,
      p_node: p.nodeId,
    });
    check(!r.error, r.error?.message);
    return { linked: true };
  }
  if (p.operation === "ops-register-device") {
    owner();
    check(
      Object.hasOwn(deviceTypes, p.deviceType) &&
        typeof p.name === "string" &&
        p.name.trim().length > 0 &&
        p.name.length <= 100,
      "Jenis/nama perangkat tidak valid.",
    );
    if (p.deviceType !== "pond_hub") {
      check(isUuid(p.pondId));
      const pond = await db
        .from("op_ponds")
        .select("id")
        .eq("id", p.pondId)
        .eq("farm_id", p.farmId)
        .single();
      check(pond.data, "Kolam tidak ditemukan.");
    }
    if (p.hubId) {
      check(isUuid(p.hubId));
      const h = await db
        .from("devices")
        .select("id")
        .eq("id", p.hubId)
        .eq("device_type", "pond_hub")
        .eq("farm_id", p.farmId)
        .eq("enabled", true)
        .single();
      check(h.data, "PondHub tidak sesuai.");
    }
    const token = crypto.randomUUID() + crypto.randomUUID();
    const bytes = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(token),
    );
    const hash = Array.from(new Uint8Array(bytes), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    const r = await db.rpc("op_register_device", {
      p_farm: p.farmId,
      p_name: p.name.trim(),
      p_type: p.deviceType,
      p_pond: p.deviceType === "pond_hub" ? null : p.pondId,
      p_hub: p.hubId ?? null,
      p_hash: hash,
      p_capabilities: deviceTypes[p.deviceType as keyof typeof deviceTypes],
      p_interval: ["sensor_node", "aqua_weather"].includes(p.deviceType)
        ? (p.sampleInterval ?? null)
        : null,
    });
    check(!r.error, r.error?.message);
    return { ...r.data, token };
  }
  throw new Error("Operasi tidak dikenal.");
}

export async function deviceV2(db: any, device: any, p: any) {
  if (p.operation === "heartbeat") {
    check(
      typeof p.firmwareVersion === "string" && p.firmwareVersion.length <= 80,
    );
    const s = p.status ?? {};
    check(
      typeof s === "object" &&
        !Array.isArray(s) &&
        JSON.stringify(s).length <= 2000,
    );
    const allowed = [
      "manualOverride",
      "interlock",
      "motorTrip",
      "outputState",
      "clockSynced",
      "bufferedMessages",
      "bufferOverflow",
    ];
    check(Object.keys(s).every((k) => allowed.includes(k)));
    for (const key of ["bufferedMessages", "bufferOverflow"])
      check(!(key in s) || (Number.isSafeInteger(s[key]) && s[key] >= 0));
    check(
      !("outputState" in s) || ["on", "off", "unknown"].includes(s.outputState),
    );
    for (const key of [
      "manualOverride",
      "interlock",
      "motorTrip",
      "clockSynced",
    ])
      check(!(key in s) || typeof s[key] === "boolean");
    const r = await db
      .from("devices")
      .update({
        last_seen: new Date().toISOString(),
        firmware_version: p.firmwareVersion,
        status: s,
      })
      .eq("id", device.id);
    check(!r.error);
    return { accepted: true };
  }
  const v = validateTelemetry(p);
  const node = await db
    .from("devices")
    .select("*")
    .eq("id", v.nodeId)
    .eq("enabled", true)
    .single();
  check(
    node.data &&
      node.data.operational_pond_id &&
      ["sensor_node", "aqua_weather"].includes(node.data.device_type),
    "Node tidak sesuai.",
  );
  if (device.id !== v.nodeId) {
    check(
      device.device_type === "pond_hub",
      "Token tidak berhak meneruskan node.",
    );
    const link = await db
      .from("op_node_links")
      .select("node_id")
      .eq("hub_id", device.id)
      .eq("node_id", v.nodeId)
      .single();
    check(link.data, "Node tidak terdaftar di gateway ini.");
  }
  const data = [];
  for (const m of v.measurements) {
    const probe = await db
      .from("op_probes")
      .select("id,parameter,pond_id")
      .eq("id", m.probeId)
      .eq("device_id", v.nodeId)
      .eq("farm_id", node.data.farm_id)
      .single();
    check(
      probe.data?.parameter === m.parameter &&
        probe.data?.pond_id === node.data.operational_pond_id,
      "Probe tidak cocok dengan node dan kolam.",
    );
    let validCalibration = false;
    if (m.calibrationId) {
      const c = await db
        .from("op_calibrations")
        .select("measured_at,next_due_on")
        .eq("id", m.calibrationId)
        .eq("probe_id", m.probeId)
        .eq("farm_id", node.data.farm_id)
        .single();
      check(c.data, "Kalibrasi tidak ditemukan.");
      validCalibration =
        Date.parse(c.data.measured_at) <= Date.parse(v.measuredAt) &&
        Date.parse(c.data.next_due_on + "T23:59:59Z") >=
          Date.parse(v.measuredAt);
    }
    data.push({
      parameter: m.parameter,
      value: m.value,
      source: "sensor",
      quality:
        m.quality === "valid" && !validCalibration ? "unverified" : m.quality,
      measured_at: v.measuredAt,
      device_id: v.nodeId,
      probe_id: m.probeId,
      calibration_id: m.calibrationId ?? null,
      firmware_version: v.firmwareVersion,
    });
  }
  const r = await db.rpc("op_ingest", {
    p_sender: device.id,
    p_node: v.nodeId,
    p_message: v.messageId,
    p_rows: data,
  });
  check(!r.error, r.error?.message);
  return { accepted: true, messageId: v.messageId, ...r.data };
}
export { validateFeedback };
