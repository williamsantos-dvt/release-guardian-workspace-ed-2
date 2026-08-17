import { describe, expect, it } from 'vitest';
import {
  REASON_CODES,
  evaluateResponseSchema,
  policySnapshotSchema,
} from '../src/index.js';

describe('contracts package', () => {
  it('keeps REVIEW as an allowed decision in evaluate responses', () => {
    expect(evaluateResponseSchema.properties.decision.enum).toEqual(['GO', 'REVIEW', 'NO_GO']);
  });

  it('publishes policy thresholds and supported decisions in policy snapshot schema', () => {
    expect(policySnapshotSchema.required).toEqual([
      'policyVersion',
      'minimumCoverage',
      'hotfixMinimumCoverage',
      'targetCoverage',
      'supportedDecisions',
      'supportedReleaseTypes',
    ]);
    expect(policySnapshotSchema.properties.supportedDecisions.items.enum).toEqual([
      'GO',
      'REVIEW',
      'NO_GO',
    ]);
  });

  it('defines reason codes in canonical policy order', () => {
    expect(REASON_CODES).toEqual([
      'COVERAGE_BELOW_MINIMUM',
      'MANDATORY_TEST_FAILURE',
      'CRITICAL_SECURITY_VULNERABILITY',
      'HIGH_SECURITY_RISK',
      'COVERAGE_NEEDS_REVIEW',
      'LINT_ERRORS',
    ]);
  });
});
