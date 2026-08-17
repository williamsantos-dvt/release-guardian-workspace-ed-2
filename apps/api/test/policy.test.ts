import { describe, it, expect } from 'vitest';
import { evaluateRelease } from '../src/services/releaseService.js';

const healthy = {
  releaseId: 'test-release',
  releaseType: 'standard',
  tests: { passed: 100, failed: 0 },
  coverage: 85,
  security: { critical: 0, high: 0 },
  lintErrors: 0,
};

describe('release policy (1.4.0)', () => {
  it('approves a healthy release', () => {
    const result = evaluateRelease(healthy);
    expect(result.decision).toBe('GO');
    expect(result.reasons).toEqual([]);
  });

  it('returns REVIEW for standard coverage of 72', () => {
    const result = evaluateRelease({ ...healthy, coverage: 72 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['COVERAGE_REQUIRES_REVIEW']);
  });

  it('returns REVIEW for hotfix coverage of 67', () => {
    const result = evaluateRelease({ ...healthy, releaseType: 'hotfix', coverage: 67 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['COVERAGE_REQUIRES_REVIEW']);
  });

  it('blocks standard coverage below 70', () => {
    const result = evaluateRelease({ ...healthy, coverage: 67 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('COVERAGE_BELOW_MINIMUM');
  });

  it('blocks hotfix coverage below 65', () => {
    const result = evaluateRelease({ ...healthy, releaseType: 'hotfix', coverage: 63 });
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

  it('returns REVIEW for high vulnerabilities (>=3)', () => {
    const result = evaluateRelease({ ...healthy, security: { critical: 0, high: 3 } });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toContain('HIGH_SECURITY_RISK');
  });

  it('returns REVIEW for lint errors', () => {
    const result = evaluateRelease({ ...healthy, lintErrors: 5 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toContain('LINT_ERRORS');
  });

  it('returns all applicable reasons in a stable order', () => {
    const result = evaluateRelease({
      ...healthy,
      releaseType: 'hotfix',
      coverage: 70,
      tests: { passed: 10, failed: 3 },
      security: { critical: 2, high: 4 },
      lintErrors: 7,
    });
    expect(result.reasons).toEqual([
      'MANDATORY_TEST_FAILURE',
      'CRITICAL_SECURITY_VULNERABILITY',
      'HIGH_SECURITY_RISK',
      'COVERAGE_REQUIRES_REVIEW',
      'LINT_ERRORS',
    ]);
  });
});
