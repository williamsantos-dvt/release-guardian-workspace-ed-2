// Seed evidence used to restore the evaluation history on every startup.
// The repository is in-memory and deterministic: a fresh boot always shows
// the same 18 evaluations so that demos and tests are reproducible.
import type { ReleaseEvidence } from '@release-guardian/contracts';

export interface SeedEntry {
  evaluationId: string;
  evidence: ReleaseEvidence;
  evaluatedAt: string;
}

const t = (day: string, time: string) => `2026-08-${day}T${time}.000Z`;

export const SEED_EVALUATIONS: SeedEntry[] = [
  { evaluationId: 'EV-0001', evaluatedAt: t('11', '09:12:04'), evidence: { releaseId: 'checkout-api-4.8.2', releaseType: 'standard', tests: { passed: 428, failed: 0 }, coverage: 84, security: { critical: 0, high: 0 }, lintErrors: 0 } },
  { evaluationId: 'EV-0002', evaluatedAt: t('11', '09:47:41'), evidence: { releaseId: 'portal-web-3.6.1', releaseType: 'standard', tests: { passed: 312, failed: 0 }, coverage: 91, security: { critical: 0, high: 0 }, lintErrors: 0 } },
  { evaluationId: 'EV-0003', evaluatedAt: t('11', '10:22:18'), evidence: { releaseId: 'billing-svc-2.2.0', releaseType: 'standard', tests: { passed: 256, failed: 0 }, coverage: 88, security: { critical: 0, high: 1 }, lintErrors: 0 } },
  { evaluationId: 'EV-0004', evaluatedAt: t('11', '11:05:33'), evidence: { releaseId: 'auth-api-5.0.1', releaseType: 'standard', tests: { passed: 190, failed: 0 }, coverage: 85, security: { critical: 0, high: 0 }, lintErrors: 0 } },
  { evaluationId: 'EV-0005', evaluatedAt: t('11', '11:58:02'), evidence: { releaseId: 'search-svc-1.9.3', releaseType: 'standard', tests: { passed: 141, failed: 0 }, coverage: 83, security: { critical: 0, high: 2 }, lintErrors: 0 } },
  { evaluationId: 'EV-0006', evaluatedAt: t('11', '13:31:57'), evidence: { releaseId: 'notifications-2.4.0', releaseType: 'standard', tests: { passed: 98, failed: 0 }, coverage: 81, security: { critical: 0, high: 0 }, lintErrors: 0 } },
  { evaluationId: 'EV-0007', evaluatedAt: t('11', '14:44:10'), evidence: { releaseId: 'api-gw-6.1.0', releaseType: 'standard', tests: { passed: 502, failed: 0 }, coverage: 80, security: { critical: 0, high: 0 }, lintErrors: 0 } },
  { evaluationId: 'EV-0008', evaluatedAt: t('11', '15:29:48'), evidence: { releaseId: 'ml-inference-0.9.2', releaseType: 'standard', tests: { passed: 77, failed: 0 }, coverage: 92, security: { critical: 0, high: 0 }, lintErrors: 0 } },
  { evaluationId: 'EV-0009', evaluatedAt: t('11', '16:15:22'), evidence: { releaseId: 'mobile-bff-3.3.1', releaseType: 'standard', tests: { passed: 233, failed: 0 }, coverage: 86, security: { critical: 0, high: 1 }, lintErrors: 0 } },
  { evaluationId: 'EV-0010', evaluatedAt: t('11', '17:03:39'), evidence: { releaseId: 'reporting-svc-4.0.0', releaseType: 'standard', tests: { passed: 164, failed: 0 }, coverage: 90, security: { critical: 0, high: 0 }, lintErrors: 0 } },
  { evaluationId: 'EV-0011', evaluatedAt: t('12', '09:08:15'), evidence: { releaseId: 'payments-api-8.2.0', releaseType: 'standard', tests: { passed: 410, failed: 0 }, coverage: 76, security: { critical: 0, high: 1 }, lintErrors: 0 } },
  { evaluationId: 'EV-0012', evaluatedAt: t('12', '10:41:53'), evidence: { releaseId: 'inventory-svc-2.7.4', releaseType: 'standard', tests: { passed: 187, failed: 0 }, coverage: 72, security: { critical: 0, high: 0 }, lintErrors: 0 } },
  { evaluationId: 'EV-0013', evaluatedAt: t('12', '11:27:06'), evidence: { releaseId: 'crm-sync-1.4.9', releaseType: 'standard', tests: { passed: 121, failed: 0 }, coverage: 78.9, security: { critical: 0, high: 2 }, lintErrors: 0 } },
  { evaluationId: 'EV-0014', evaluatedAt: t('12', '12:52:31'), evidence: { releaseId: 'legacy-cron-1.0.7', releaseType: 'standard', tests: { passed: 34, failed: 0 }, coverage: 63, security: { critical: 0, high: 0 }, lintErrors: 0 } },
  { evaluationId: 'EV-0015', evaluatedAt: t('12', '13:36:44'), evidence: { releaseId: 'checkout-api-4.8.1', releaseType: 'standard', tests: { passed: 401, failed: 2 }, coverage: 81, security: { critical: 0, high: 0 }, lintErrors: 0 } },
  { evaluationId: 'EV-0016', evaluatedAt: t('12', '14:19:27'), evidence: { releaseId: 'payments-api-8.1.0', releaseType: 'standard', tests: { passed: 388, failed: 0 }, coverage: 74, security: { critical: 1, high: 4 }, lintErrors: 12 } },
  { evaluationId: 'EV-0017', evaluatedAt: t('12', '15:04:58'), evidence: { releaseId: 'docs-portal-0.3.0', releaseType: 'standard', tests: { passed: 52, failed: 1 }, coverage: 77, security: { critical: 0, high: 0 }, lintErrors: 5 } },
  { evaluationId: 'EV-0018', evaluatedAt: t('12', '16:48:12'), evidence: { releaseId: 'emergency-fix-221', releaseType: 'hotfix', tests: { passed: 130, failed: 0 }, coverage: 67, security: { critical: 0, high: 0 }, lintErrors: 0 } },
];
