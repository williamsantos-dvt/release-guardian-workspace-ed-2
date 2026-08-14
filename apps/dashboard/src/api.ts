// Dashboard API client — consumes the shared contracts only.
import type {
  HealthStatus,
  PolicySnapshot,
  ReleaseStatistics,
  EvaluationSummary,
  ReleaseEvaluation,
  ReleaseEvidence,
  EvaluateResponse,
} from '@release-guardian/contracts';

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchHealth = () => get<HealthStatus>('/health');
export const fetchPolicy = () => get<PolicySnapshot>('/api/v1/policy');
export const fetchStatistics = () => get<ReleaseStatistics>('/api/v1/statistics');
export const fetchEvaluations = () =>
  get<{ evaluations: EvaluationSummary[] }>('/api/v1/evaluations');
export const fetchEvaluation = (id: string) =>
  get<ReleaseEvaluation>(`/api/v1/evaluations/${encodeURIComponent(id)}`);

export async function submitEvidence(
  evidence: ReleaseEvidence
): Promise<{ ok: true; body: EvaluateResponse } | { ok: false; status: number }> {
  const res = await fetch('/api/v1/evaluations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evidence),
  });
  if (res.ok) return { ok: true, body: (await res.json()) as EvaluateResponse };
  return { ok: false, status: res.status };
}
