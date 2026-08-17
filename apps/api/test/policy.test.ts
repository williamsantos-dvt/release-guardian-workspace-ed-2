import { describe, it, expect } from 'vitest';
import type { ReleaseEvidence } from '@release-guardian/contracts';
import { evaluateRelease } from '../src/services/releaseService.js';

const healthy: ReleaseEvidence = {
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

  it('approves standard coverage of 72', () => {
    const result = evaluateRelease({ ...healthy, coverage: 72 });
    expect(result.decision).toBe('GO');
  });

  it('keeps standard coverage of 67 as NO_GO', () => {
    const result = evaluateRelease({ ...healthy, coverage: 67 });
    expect(result.decision).toBe('NO_GO');
  });

  it('returns NO_GO for hotfix coverage below 65', () => {
    const result = evaluateRelease({ ...healthy, releaseType: 'hotfix', coverage: 64.9 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('COVERAGE_BELOW_MINIMUM');
  });

  it('returns REVIEW for hotfix coverage at 65', () => {
    const result = evaluateRelease({ ...healthy, releaseType: 'hotfix', coverage: 65 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).not.toContain('COVERAGE_BELOW_MINIMUM');
  });

  it('returns REVIEW for hotfix coverage of 79.99', () => {
    const result = evaluateRelease({ ...healthy, releaseType: 'hotfix', coverage: 79.99 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual([]);
  });

  it('returns GO for hotfix coverage at 80', () => {
    const result = evaluateRelease({ ...healthy, releaseType: 'hotfix', coverage: 80 });
    expect(result.decision).toBe('GO');
    expect(result.reasons).toEqual([]);
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

  it('blocks lint errors', () => {
    const result = evaluateRelease({ ...healthy, releaseType: 'hotfix', coverage: 67, lintErrors: 5 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('LINT_ERRORS');
  });

  it('returns all applicable reasons in a stable order', () => {
    const result = evaluateRelease({
      ...healthy,
      coverage: 60,
      tests: { passed: 10, failed: 3 },
      security: { critical: 2, high: 0 },
      lintErrors: 7,
    });
    expect(result.reasons).toEqual([
      'COVERAGE_BELOW_MINIMUM',
      'MANDATORY_TEST_FAILURE',
      'CRITICAL_SECURITY_VULNERABILITY',
      'LINT_ERRORS',
    ]);
  });
});
