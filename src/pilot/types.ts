export type Role = "owner" | "operator" | "pondivator";
export type Module =
  | "pond"
  | "reading"
  | "action"
  | "alert"
  | "device"
  | "feed"
  | "cost"
  | "harvest"
  | "visit"
  | "configuration"
  | "extraction";
export interface FarmAccess {
  id: string;
  name: string;
  location: string;
  role: Role;
}
export interface PilotRecord {
  id: string;
  farm_id: string;
  kind: Module;
  data: Record<string, unknown>;
  version: number;
  created_at: string;
}
export interface Extraction {
  text: string;
  context: string;
  observations: {
    label: string;
    value: string;
    unit: string | null;
    context: string;
  }[];
  tables: { title: string; columns: string[]; rows: string[][] }[];
  uncertainties: string[];
}
export interface Assessment {
  level: "unknown" | "safe" | "warning" | "critical";
  title: string;
  reasons: string[];
}
