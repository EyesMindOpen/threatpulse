export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  organizationId: string | null;
  organizationName: string | null;
}

export interface ThreatItem {
  id: string;
  threatId: string;
  title: string;
  type: string;
  severity: string;
  status: string;
  description: string | null;
  affectedAssets: string | null;
  source: string | null;
  indicators: string | null;
  mitreTactic: string | null;
  mitreTechnique: string | null;
  cvssScore: number | null;
  dateAdded: string;
  lastUpdated: string;
  organizationId: string;
}

export interface OrgUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

export interface DashboardStats {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  recentThreats: ThreatItem[];
}
