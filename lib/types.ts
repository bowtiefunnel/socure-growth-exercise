export interface Lead {
  id: number;
  name: string;
  email: string;
  domain: string;
  title: string;
  enrichment?: Enrichment;
  score?: Score;
  routing?: Routing;
  suppressed?: boolean;
  battle_card_path?: string;
}

export interface Enrichment {
  industry: string;
  sub_vertical: string;
  employee_range: string;
  est_revenue: string;
  tech_signals: string[];
  source: "bitscale" | "nrev" | "public+symbolic" | "symbolic" | "llm";
  confidence: number;
}

export interface Score {
  total: number;
  breakdown: Record<string, { bucket: string; points: number }>;
  tier: "hot" | "warm" | "cold";
  dq_reason?: string;
}

export interface Routing {
  rep_id: string;
  rep: string;
  priority: string;
  sla: string;
  owner_status: "existing_owner" | "new_assignment";
  reason: string;
}

export interface Account {
  domain: string;
  leads: Lead[];
  account_score: number;
  tier: "hot" | "warm" | "cold";
  committee_depth: number;
  existing_customer: boolean;
  routing?: Routing;
}
