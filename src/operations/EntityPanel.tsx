import { useState, type FormEvent } from "react";
import { Plus, Pencil, Check, ChevronDown } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Overlay";
import {
  definitions,
  labelFor,
  type Definition,
  type EntityKind,
  type Entity,
  validateEntity,
  parameters,
} from "./model";
export function EntityPanel({
  kind,
  rows,
  pondId,
  cycleId,
  allowed,
  role = "owner",
  onSave,
  parameterOptions,
}: {
  kind: EntityKind;
  rows: Entity[];
  pondId: string;
  cycleId: string;
  allowed: boolean;
  role?: string;
  parameterOptions?: readonly string[];
  onSave: (
    kind: EntityKind,
    data: Record<string, unknown>,
    edit?: Entity,
  ) => Promise<void>;
}) {
  const def: Definition = definitions[kind];
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Entity | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formTime, setFormTime] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString(),
  );
  const sorted = [...rows]
    .filter((r) =>
      def.fields.some((f) =>
        String(r[f.key] ?? "")
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data: Record<string, unknown> = {};
    const values = new FormData(e.currentTarget);
    for (const field of def.fields) {
      const v = values.get(field.key);
      if (v !== null && v !== "")
        data[field.key] =
          field.type === "number"
            ? Number(v)
            : field.type === "datetime-local"
              ? new Date(String(v)).toISOString()
              : String(v);
    }
    try {
      validateEntity(kind, data);
      if (def.pond) {
        if (!pondId) throw new Error("Tambahkan dan pilih kolam dahulu.");
        data.pond_id = pondId;
        if (cycleId) data.cycle_id = cycleId;
        else if (edit?.cycle_id) data.cycle_id = edit.cycle_id;
      }
      await onSave(kind, data, edit);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Catatan belum tersimpan.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">{def.title}</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-foreground-muted">
            {def.description}
          </p>
        </div>
        {allowed && (
          <Button
            disabled={def.pond && !pondId}
            leadingIcon={<Plus size={16} />}
            onClick={() => {
              setEdit(undefined);
              setFormTime(
                new Date(
                  Date.now() - new Date().getTimezoneOffset() * 60000,
                ).toISOString(),
              );
              setError("");
              setOpen(true);
            }}
          >
            {kind === "measurements"
              ? "Catat hasil uji"
              : kind === "biofloc"
                ? "Catat perawatan"
                : "Tambah"}
          </Button>
        )}
      </div>
      <div className="p-5 sm:p-6">
        <details
          open={kind === "measurements" && parameterOptions ? undefined : true}
        >
          <summary
            className={
              kind === "measurements" && parameterOptions
                ? "min-h-10 cursor-pointer text-sm font-semibold text-primary"
                : "hidden"
            }
          >
            Riwayat hasil uji ({rows.length})
          </summary>
          {rows.length > 4 && (
            <input
              aria-label={`Cari ${def.title}`}
              className="pilot-input mb-5"
              placeholder="Cari catatan…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          )}
          {!sorted.length ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-foreground-muted">
                {rows.length
                  ? "Catatan tidak ditemukan."
                  : "Belum ada catatan."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.slice(0, page * 8).map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-border p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">
                        {labelFor(
                          String(
                            row.title ??
                              row.name ??
                              row.product ??
                              row.parameter ??
                              row.activity ??
                              def.title,
                          ),
                        )}
                      </h3>
                      {kind === "feed" && (
                        <p className="mt-2 text-sm font-semibold text-primary">
                          {labelFor(String(row.entry_type))} ·{" "}
                          {Number(row.quantity_kg).toLocaleString("id-ID")} kg
                        </p>
                      )}
                      {kind === "measurements" && (
                        <p className="mt-2 text-sm font-semibold text-primary">
                          {Number(row.value).toLocaleString("id-ID")}{" "}
                          {
                            parameters[row.parameter as keyof typeof parameters]
                              ?.unit
                          }{" "}
                          · {labelFor(String(row.source))}
                        </p>
                      )}
                      {kind === "biofloc" && (
                        <p className="mt-2 text-sm font-semibold text-primary">
                          {Number(row.quantity).toLocaleString("id-ID")}{" "}
                          {String(row.unit)}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-foreground-muted">
                        {new Date(row.created_at).toLocaleString("id-ID")}{" "}
                        {row.version === 0 ? "· Belum terkirim" : ""}
                      </p>
                    </div>
                    {allowed &&
                      !["measurements", "calibrations", "thresholds"].includes(
                        kind,
                      ) && (
                        <button
                          className="grid size-10 shrink-0 place-items-center rounded-lg border border-border text-primary"
                          aria-label={`Ubah ${String(row.title ?? row.name ?? row.product ?? def.title)}`}
                          onClick={() => {
                            setEdit(row);
                            setOpen(true);
                            setError("");
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                  </div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-semibold text-primary">
                      Lihat catatan
                    </summary>
                    <dl className="mt-3 space-y-2">
                      {role === "admin" && (
                        <div className="text-xs">
                          <dt>Referensi catatan</dt>
                          <dd className="break-all">{row.id}</dd>
                        </div>
                      )}
                      {def.fields.map((f) => (
                        <div
                          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-4 text-sm"
                          key={f.key}
                        >
                          <dt className="text-foreground-muted">{f.label}</dt>
                          <dd className="break-words text-right">
                            {row[f.key] === null || row[f.key] === undefined
                              ? "—"
                              : labelFor(String(row[f.key]))}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                </div>
              ))}
            </div>
          )}
          {sorted.length > page * 8 && (
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => setPage(page + 1)}
              trailingIcon={<ChevronDown size={16} />}
            >
              Tampilkan lagi
            </Button>
          )}
        </details>
      </div>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
        title={`${edit ? "Ubah" : "Tambah"} ${def.title}`}
        description={def.description}
      >
        <form key={edit?.id ?? "new"} className="space-y-4" onSubmit={submit}>
          {def.fields.map((field) => {
            const value = edit?.[field.key];
            const defaultValue =
              value === undefined
                ? !edit &&
                  field.required !== false &&
                  kind !== "energy" &&
                  (field.type === "date" || field.type === "datetime-local")
                  ? formTime.slice(0, field.type === "date" ? 10 : 16)
                  : ""
                : field.type === "datetime-local"
                  ? new Date(
                      Date.parse(String(value)) -
                        new Date().getTimezoneOffset() * 60000,
                    )
                      .toISOString()
                      .slice(0, 16)
                  : String(value);
            return (
              <label key={field.key} className="block text-sm font-semibold">
                {field.label}
                {field.required === false && (
                  <span className="font-normal text-foreground-muted">
                    {" "}
                    · opsional
                  </span>
                )}
                {field.type === "select" ? (
                  <select
                    name={field.key}
                    className="pilot-input mt-2"
                    defaultValue={
                      defaultValue ||
                      (kind === "measurements" && field.key === "quality"
                        ? "unverified"
                        : undefined) ||
                      (field.key === "parameter" && parameterOptions
                        ? parameterOptions[0]
                        : field.options?.[0])
                    }
                    required={field.required !== false}
                  >
                    {(kind === "services" &&
                    field.key === "status" &&
                    !["admin", "pondivator"].includes(role)
                      ? [String(edit?.status ?? "requested")]
                      : field.key === "parameter" && parameterOptions
                        ? parameterOptions
                        : field.options
                    )?.map((v) => (
                      <option key={v} value={v}>
                        {labelFor(v)}
                        {field.key === "parameter" &&
                        parameters[v as keyof typeof parameters]?.unit
                          ? ` · ${parameters[v as keyof typeof parameters].unit}`
                          : ""}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    name={field.key}
                    className="pilot-input mt-2 min-h-24 font-normal"
                    defaultValue={defaultValue}
                    maxLength={3000}
                    required={field.required !== false}
                  />
                ) : (
                  <input
                    name={field.key}
                    className="pilot-input mt-2 font-normal"
                    type={field.type ?? "text"}
                    defaultValue={defaultValue}
                    min={field.min}
                    max={field.max}
                    step={field.type === "number" ? "any" : undefined}
                    maxLength={300}
                    required={field.required !== false}
                  />
                )}
              </label>
            );
          })}
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}
          <Button
            type="submit"
            isLoading={busy}
            leadingIcon={<Check size={16} />}
          >
            Simpan catatan
          </Button>
        </form>
      </Dialog>
    </Card>
  );
}
