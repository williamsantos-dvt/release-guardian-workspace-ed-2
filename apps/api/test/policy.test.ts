import { describe, it, expect } from 'vitest';
import { evaluateRelease } from '../src/services/releaseService.js';
import type { ReleaseEvidence } from '@release-guardian/contracts';

const healthy: ReleaseEvidence = {
  releaseId: 'test-release',
  releaseType: 'standard',
  tests: { passed: 100, failed: 0 },
  coverage: 85,
  security: { critical: 0, high: 0 },
  lintErrors: 0,
};

describe('release policy', () => {
  it('approves a healthy release', () => {
    const result = evaluateRelease(healthy);
    expect(result.decision).toBe('GO');
    expect(result.reasons).toEqual([]);
  });

  it('blocks coverage of 72 under the 75 minimum', () => {
    const result = evaluateRelease({ ...healthy, coverage: 72 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_MINIMUM']);
  });

  it('blocks coverage below the minimum', () => {
    const result = evaluateRelease({ ...healthy, coverage: 63 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('COVERAGE_BELOW_MINIMUM');
  });

  it('blocks failed mandatory tests', () => {
    const result = evaluateRelease({ ...healthy, tests: { passed: 90, failed: 2 } });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('MANDATORY_TEST_FAILURE');
  });

  it('blocks critical vulnerabilities', () => {
    const result = evaluateRelease({ ...healthy, security: { critical: 1, high: 0 } });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('CRITICAL_SECURITY_VULNERABILITY');
  });

  it('requires REVIEW for high vulnerabilities without critical findings', () => {
    const result = evaluateRelease({ ...healthy, security: { critical: 0, high: 2 } });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['HIGH_SECURITY_RISK']);
  });

  it('keeps NO_GO and omits high-risk review reason when critical vulnerabilities exist', () => {
    const result = evaluateRelease({ ...healthy, security: { critical: 1, high: 2 } });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toEqual(['CRITICAL_SECURITY_VULNERABILITY']);
  });

  it('blocks lint errors', () => {
    const result = evaluateRelease({ ...healthy, lintErrors: 5 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('LINT_ERRORS');
  });

  it('returns all applicable reasons in a stable order', () => {
    const result = evaluateRelease({
      ...healthy,
      coverage: 60,
      tests: { passed: 10, failed: 3 },
      security: { critical: 2, high: 2 },
      lintErrors: 7,
    });
    expect(result.reasons).toEqual([
      'COVERAGE_BELOW_MINIMUM',
      'MANDATORY_TEST_FAILURE',
      'CRITICAL_SECURITY_VULNERABILITY',
      'LINT_ERRORS',
    ]);
  });

  it('appends HIGH_SECURITY_RISK last when review and blockers co-exist without critical', () => {
    const result = evaluateRelease({
      ...healthy,
      coverage: 60,
      tests: { passed: 10, failed: 3 },
      security: { critical: 0, high: 2 },
      lintErrors: 7,
    });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toEqual([
      'COVERAGE_BELOW_MINIMUM',
      'MANDATORY_TEST_FAILURE',
      'LINT_ERRORS',
      'HIGH_SECURITY_RISK',
    ]);
  });
});
