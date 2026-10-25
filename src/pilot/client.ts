import { createClient } from "@supabase/supabase-js";
import type { FarmAccess, Module, PilotRecord } from "./types";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Expo is browser-local by default, including when old deployment variables remain.
export const cloudConfigured = import.meta.env.VITE_ENABLE_LEGACY_CLOUD === "true" && Boolean(url && key);
export const cloud = cloudConfigured
  ? createClient(url, key, {
      auth: { detectSessionInUrl: true, flowType: "pkce" },
    })
  : null;
export async function api<T>(
  operation: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  if (!cloud)
    throw new Error(
      "Layanan akun belum dikonfigurasi. Mode demo tetap tersedia.",
    );
  const { data, error } = await cloud.functions.invoke("pilot-api", {
    body: { operation, ...payload },
  });
  if (error?.context instanceof Response) {
    try {
      const body = await error.context.json();
      if (typeof body.error === "string") throw new Error(body.error);
    } catch (parsed) {
      if (
        parsed instanceof Error &&
        parsed.message !== "Unexpected end of JSON input" &&
        !parsed.message.startsWith("Unexpected token")
      )
        throw parsed;
    }
  }
  if (error)
    throw new Error(
      "Layanan belum merespons. Periksa koneksi atau coba masuk kembali.",
    );
  if (data?.error) throw new Error(data.error);
  return data as T;
}
export async function farms(): Promise<FarmAccess[]> {
  if (!cloud) return [];
  const { data, error } = await cloud
    .from("memberships")
    .select("role, farms(id,name,location)");
  if (error) throw new Error("Daftar tambak belum dapat dimuat.");
  return (data ?? []).flatMap((r: any) =>
    r.farms ? [{ ...r.farms, role: r.role }] : [],
  );
}
export async function records(farmId: string): Promise<PilotRecord[]> {
  if (!cloud) return [];
  const { data, error } = await cloud
    .from("records")
    .select("*")
    .eq("farm_id", farmId)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error("Data tambak belum dapat dimuat.");
  return data as PilotRecord[];
}
export async function saveRecord(
  farmId: string,
  kind: Module,
  data: Record<string, unknown>,
  mutationId: string = crypto.randomUUID(),
) {
  return api<PilotRecord>("record", { farmId, kind, data, mutationId });
}
