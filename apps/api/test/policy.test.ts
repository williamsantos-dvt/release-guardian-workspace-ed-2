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

describe('release policy (baseline)', () => {
  it('approves a healthy release', () => {
    const result = evaluateRelease(healthy);
    expect(result.decision).toBe('GO');
    expect(result.reasons).toEqual([]);
  });

  it('requires review for standard coverage of 72', () => {
    const result = evaluateRelease({ ...healthy, coverage: 72 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_MINIMUM']);
  });

  it('blocks standard coverage below review minimum', () => {
    const result = evaluateRelease({ ...healthy, coverage: 63 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_MINIMUM']);
  });

  it('requires review for hotfix coverage of 77', () => {
    const result = evaluateRelease({ ...healthy, releaseType: 'hotfix', coverage: 77 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_MINIMUM']);
  });

  it('approves hotfix coverage of 80', () => {
    const result = evaluateRelease({ ...healthy, releaseType: 'hotfix', coverage: 80 });
    expect(result.decision).toBe('GO');
    expect(result.reasons).toEqual([]);
  });

  it('blocks hotfix coverage below review minimum', () => {
    const result = evaluateRelease({ ...healthy, releaseType: 'hotfix', coverage: 67 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_MINIMUM']);
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

  it('blocks high vulnerabilities', () => {
    const result = evaluateRelease({ ...healthy, security: { critical: 0, high: 1 } });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('HIGH_SECURITY_RISK');
  });

  it('blocks lint errors', () => {
    const result = evaluateRelease({ ...healthy, lintErrors: 5 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('LINT_ERRORS');
  });

  it('prioritizes hard blockers over coverage', () => {
    const result = evaluateRelease({
      ...healthy,
      coverage: 90,
      tests: { passed: 10, failed: 2 },
    });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toEqual(['MANDATORY_TEST_FAILURE']);
  });

  it('returns hard-blocker reasons in canonical order', () => {
    const result = evaluateRelease({
      ...healthy,
      coverage: 60,
      tests: { passed: 10, failed: 3 },
      security: { critical: 2, high: 1 },
      lintErrors: 7,
    });
    expect(result.reasons).toEqual([
      'MANDATORY_TEST_FAILURE',
      'CRITICAL_SECURITY_VULNERABILITY',
      'HIGH_SECURITY_RISK',
      'LINT_ERRORS',
    ]);
  });
});
