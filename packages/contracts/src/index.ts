/**
 * Shared contracts for the Release Guardian.
 *
 * Single source of truth for the shapes exchanged between the API, the
 * dashboard and the CI pipeline simulator. All consumers MUST import from
 * here; duplicating these shapes in a consumer is a contract drift bug.
 */

/** Final decision for a release. */
export type Decision = 'GO' | 'REVIEW' | 'NO_GO';

/** Supported release types. */
export type ReleaseType = 'standard' | 'hotfix';

/** Quality evidence produced by a CI/CD pipeline. The Guardian never generates evidence — it only evaluates it. */
export interface ReleaseEvidence {
  releaseId: string;
  releaseType: ReleaseType;
  tests: { passed: number; failed: number };
  /** Code coverage percentage, 0–100, decimals allowed (e.g. 76.5). */
  coverage: number;
  security: { critical: number; high: number };
  lintErrors: number;
}

/** Reason codes emitted by the policy engine, in canonical order. */
export const REASON_CODES = [
  'COVERAGE_BELOW_MINIMUM',
  'MANDATORY_TEST_FAILURE',
  'CRITICAL_SECURITY_VULNERABILITY',
  'HIGH_SECURITY_RISK',
  'COVERAGE_REQUIRES_REVIEW',
  'LINT_ERRORS',
] as const;

export type ReasonCode = (typeof REASON_CODES)[number];

/** A persisted evaluation: evidence + decision + audit trail. */
export interface ReleaseEvaluation {
  evaluationId: string;
  releaseId: string;
  decision: Decision;
  reasons: string[];
  policyVersion: string;
  evidence: ReleaseEvidence;
  evaluatedAt: string;
}

/** Response body of POST /api/v1/evaluations. Frozen public contract. */
export interface EvaluateResponse {
  evaluationId: string;
  releaseId: string;
  decision: Decision;
  reasons: string[];
  policyVersion: string;
  evaluatedAt: string;
}

/** Item of GET /api/v1/evaluations. */
export interface EvaluationSummary {
  evaluationId: string;
  releaseId: string;
  decision: Decision;
  evaluatedAt: string;
}

/** Response of GET /api/v1/policy. */
export interface PolicySnapshot {
  policyVersion: string;
  minimumCoverage: number;
  supportedReleaseTypes: ReleaseType[];
}

/** Response of GET /api/v1/statistics. */
export interface ReleaseStatistics {
  total: number;
  byDecision: Record<Decision, number>;
  topBlockingReasons: { reason: string; count: number }[];
}

/** Response of GET /health. */
export interface HealthStatus {
  status: 'ok';
  service: 'release-guardian';
  version: string;
}

//
// JSON Schemas (HTTP boundary validation)
//

export const releaseEvidenceSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['releaseId', 'releaseType', 'tests', 'coverage', 'security', 'lintErrors'],
  properties: {
    releaseId: { type: 'string', minLength: 1 },
    releaseType: { type: 'string', enum: ['standard', 'hotfix'] },
    tests: {
      type: 'object',
      additionalProperties: false,
      required: ['passed', 'failed'],
      properties: {
        passed: { type: 'integer', minimum: 0 },
        failed: { type: 'integer', minimum: 0 },
      },
    },
    coverage: { type: 'number', minimum: 0, maximum: 100 },
    security: {
      type: 'object',
      additionalProperties: false,
      required: ['critical', 'high'],
      properties: {
        critical: { type: 'integer', minimum: 0 },
        high: { type: 'integer', minimum: 0 },
      },
    },
    lintErrors: { type: 'integer', minimum: 0 },
  },
} as const;

export const evaluateResponseSchema = {
  type: 'object',
  required: ['evaluationId', 'releaseId', 'decision', 'reasons', 'policyVersion', 'evaluatedAt'],
  properties: {
    evaluationId: { type: 'string' },
    releaseId: { type: 'string' },
    decision: { type: 'string', enum: ['GO', 'REVIEW', 'NO_GO'] },
    reasons: { type: 'array', items: { type: 'string' } },
    policyVersion: { type: 'string' },
    evaluatedAt: { type: 'string' },
  },
} as const;

export const policySnapshotSchema = {
  type: 'object',
  required: ['policyVersion', 'minimumCoverage', 'supportedReleaseTypes'],
  properties: {
    policyVersion: { type: 'string' },
    minimumCoverage: { type: 'number' },
    supportedReleaseTypes: { type: 'array', items: { type: 'string' } },
  },
} as const;
