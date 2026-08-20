import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/common/PageHeader";
import { PondCard } from "../../components/domain/PondCard";
import { Card } from "../../components/ui/Card";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "../../components/ui/Feedback";
import { RiskBadge } from "../../components/ui/RiskBadge";
import { StatusBadge } from "../../components/ui/StatusBadge";
import type { RiskLevel } from "../../domain/risk";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useFarmMonitoring } from "../../hooks/useMonitoring";
import { sortPondMonitoring, type PondSort } from "../../services/monitoring";
import { useAppStore } from "../../store/app-store";
import { formatSensorValue, formatWibTime } from "../../utils/formatters";

type RiskFilter = RiskLevel | "all";

export function PondsPage() {
  useDocumentTitle("Kolam");
  const farm = useAppStore((state) => state.activeFarm);
  const { data, isLoading, error, retry } = useFarmMonitoring(farm?.id ?? "");
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFilter = searchParams.get("risk");
  const riskFilter: RiskFilter =
    queryFilter === "safe" ||
    queryFilter === "warning" ||
    queryFilter === "critical"
      ? queryFilter
      : "all";
  const [sort, setSort] = useState<PondSort>("risk");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLocaleLowerCase("id-ID");
    return sortPondMonitoring(
      data.ponds.filter(
        (item) =>
          (riskFilter === "all" || item.risk.level === riskFilter) &&
          (!query ||
            item.pond.name.toLocaleLowerCase("id-ID").includes(query) ||
            item.pond.code.toLocaleLowerCase("id-ID").includes(query)),
      ),
      sort,
    );
  }, [data, riskFilter, search, sort]);

  const setFilter = (filter: RiskFilter) => {
    const next = new URLSearchParams(searchParams);
    if (filter === "all") next.delete("risk");
    else next.set("risk", filter);
    setSearchParams(next, { replace: true });
  };

  return (
    <>
      <PageHeader
        eyebrow="Monitoring multi-kolam"
        title="Kondisi Kolam"
        description={`Bandingkan tingkat risiko, kualitas air, dan kesehatan device di ${farm?.name}.`}
      />
      <Card className="mt-7 p-4 shadow-none">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[.08em] text-foreground-muted">
              Filter risiko
            </p>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter berdasarkan risiko"
            >
              {(
                [
                  ["all", "Semua"],
                  ["critical", "Kritis"],
                  ["warning", "Waspada"],
                  ["safe", "Aman"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  className={`min-h-11 rounded-xl px-3 text-sm font-semibold ${riskFilter === value ? "bg-primary text-white" : "bg-surface-muted text-foreground-muted"}`}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative">
              <span className="sr-only">Cari kolam</span>
              <Search
                className="absolute left-3 top-3 text-foreground-muted"
                size={17}
              />
              <input
                className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm outline-none focus:border-primary sm:w-56"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari kolam..."
              />
            </label>
            <label>
              <span className="sr-only">Urutkan kolam</span>
              <select
                className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:border-primary"
                value={sort}
                onChange={(event) => setSort(event.target.value as PondSort)}
              >
                <option value="risk">Prioritas Risiko</option>
                <option value="name">Nama Kolam</option>
                <option value="updated">Update Terbaru</option>
              </select>
            </label>
          </div>
        </div>
      </Card>
      <div className="mt-5">
        {isLoading ? (
          <LoadingSkeleton rows={4} />
        ) : error || !data ? (
          <ErrorState onRetry={retry} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={
              data.ponds.length === 0
                ? "Belum ada kolam terhubung"
                : "Kolam tidak ditemukan"
            }
            description={
              data.ponds.length === 0
                ? "Tambahkan perangkat untuk mulai memantau kondisi tambak."
                : "Ubah filter atau kata pencarian untuk melihat kolam lain."
            }
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {filtered.map((item) => (
                <PondCard key={item.pond.id} {...item} />
              ))}
            </div>
            <Card className="mt-5 hidden overflow-hidden shadow-none lg:block">
              <div className="border-b border-border px-5 py-4">
                <h2 className="font-semibold">Perbandingan cepat</h2>
                <p className="mt-1 text-xs text-foreground-muted">
                  Data terbaru dari seluruh kolam yang sesuai filter.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-surface-muted text-xs text-foreground-muted">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Kolam</th>
                      <th className="px-4 py-3 font-semibold">Risiko</th>
                      <th className="px-4 py-3 font-semibold">DO</th>
                      <th className="px-4 py-3 font-semibold">pH</th>
                      <th className="px-4 py-3 font-semibold">NH3</th>
                      <th className="px-4 py-3 font-semibold">Device</th>
                      <th className="px-5 py-3 font-semibold">Sinkron</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((item) => (
                      <tr key={item.pond.id} className="hover:bg-[#f9fcfb]">
                        <td className="px-5 py-4">
                          <Link
                            className="font-semibold text-primary hover:underline"
                            to={`/app/ponds/${item.pond.id}`}
                          >
                            {item.pond.name}
                          </Link>
                          <span className="ml-2 text-xs text-foreground-muted">
                            {item.pond.code}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <RiskBadge level={item.risk.level} />
                          <span className="ml-2 font-semibold">
                            {item.risk.score}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-semibold">
                          {
                            formatSensorValue(
                              "dissolvedOxygen",
                              item.reading.dissolvedOxygen,
                            ).value
                          }{" "}
                          <span className="text-xs text-foreground-muted">
                            mg/L
                          </span>
                        </td>
                        <td className="px-4 py-4 font-semibold">
                          {formatSensorValue("ph", item.reading.ph).value}
                        </td>
                        <td className="px-4 py-4 font-semibold">
                          {
                            formatSensorValue("ammonia", item.reading.ammonia)
                              .value
                          }
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={item.device.connectionStatus} />
                        </td>
                        <td className="px-5 py-4 text-foreground-muted">
                          {formatWibTime(item.device.lastSyncAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
