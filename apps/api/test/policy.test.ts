import { describe, it, expect } from 'vitest';
import { MINIMUM_COVERAGE } from '../src/constants.js';
import { evaluateRelease } from '../src/services/releaseService.js';

const healthy = {
  releaseId: 'test-release',
  releaseType: 'standard',
  tests: { passed: 100, failed: 0 },
  coverage: 85,
  security: { critical: 0, high: 0 },
  lintErrors: 0,
};

describe('release policy (evolved)', () => {
  it('approves a healthy release', () => {
    const result = evaluateRelease(healthy);
    expect(result.decision).toBe('GO');
    expect(result.reasons).toEqual([]);
  });

  it('returns NO_GO when any blocking reason exists even with review-eligible high risk', () => {
    const result = evaluateRelease({
      ...healthy,
      tests: { passed: 90, failed: 2 },
      security: { critical: 0, high: 3 },
    });
    expect(result.decision).toBe('NO_GO');
  });

  it('returns REVIEW when only high security risk is present', () => {
    const result = evaluateRelease({ ...healthy, security: { critical: 0, high: 1 } });
    expect(result.decision).toBe('REVIEW');
  });

  it('approves coverage exactly at minimum threshold', () => {
    const result = evaluateRelease({ ...healthy, coverage: MINIMUM_COVERAGE });
    expect(result.decision).toBe('GO');
    expect(result.reasons).toEqual([]);
  });

  it('blocks coverage below the minimum', () => {
    const result = evaluateRelease({ ...healthy, coverage: MINIMUM_COVERAGE - 0.1 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('COVERAGE_BELOW_MINIMUM');
  });

  it('returns exact blocking reasons in canonical order', () => {
    const result = evaluateRelease({
      ...healthy,
      coverage: MINIMUM_COVERAGE - 0.1,
      tests: { passed: 10, failed: 3 },
      security: { critical: 2, high: 0 },
      lintErrors: 7,
    });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toEqual([
      'COVERAGE_BELOW_MINIMUM',
      'MANDATORY_TEST_FAILURE',
      'CRITICAL_SECURITY_VULNERABILITY',
      'LINT_ERRORS',
    ]);
  });

  it('returns exact review reason for high risk without critical', () => {
    const result = evaluateRelease({ ...healthy, security: { critical: 0, high: 2 } });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['HIGH_SECURITY_RISK']);
  });

  it('does not include HIGH_SECURITY_RISK when critical vulnerability exists', () => {
    const result = evaluateRelease({ ...healthy, security: { critical: 1, high: 4 } });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('CRITICAL_SECURITY_VULNERABILITY');
    expect(result.reasons).not.toContain('HIGH_SECURITY_RISK');
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

  it('blocks lint errors', () => {
    const result = evaluateRelease({ ...healthy, lintErrors: 5 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('LINT_ERRORS');
  });
});
