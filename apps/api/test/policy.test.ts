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

describe('release policy (v2 tiered coverage)', () => {
  it('approves a healthy release', () => {
    const result = evaluateRelease(healthy);
    expect(result.decision).toBe('GO');
    expect(result.reasons).toEqual([]);
  });

  it('sends a standard release in the 70-79 band to REVIEW', () => {
    const result = evaluateRelease({ ...healthy, coverage: 72 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_MINIMUM']);
  });

  it('sends a hotfix in the 65-79.99 band to REVIEW', () => {
    const result = evaluateRelease({ ...healthy, releaseType: 'hotfix', coverage: 72 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_MINIMUM']);
  });

  it('does not emit a coverage reason at 80 or above', () => {
    const result = evaluateRelease({ ...healthy, coverage: 80 });
    expect(result.decision).toBe('GO');
    expect(result.reasons).toEqual([]);
  });

  it('blocks coverage below the minimum for standard releases', () => {
    const result = evaluateRelease({ ...healthy, coverage: 63 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('COVERAGE_BELOW_MINIMUM');
  });

  it('blocks hotfix releases below the hotfix minimum coverage', () => {
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

  it('blocks lint errors', () => {
    const result = evaluateRelease({ ...healthy, lintErrors: 5 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('LINT_ERRORS');
  });

  it('lets hard blockers override REVIEW for standard releases', () => {
    const result = evaluateRelease({
      ...healthy,
      coverage: 75,
      tests: { passed: 99, failed: 1 },
    });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_MINIMUM', 'MANDATORY_TEST_FAILURE']);
  });

  it('returns all applicable reasons in a stable order', () => {
    const result = evaluateRelease({
      ...healthy,
      coverage: 74,
      releaseType: 'hotfix',
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

  it('assesses a hotfix release with 67% coverage as REVIEW when signals are healthy', () => {
    const result = evaluateRelease({ ...healthy, releaseType: 'hotfix', coverage: 67 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_MINIMUM']);
  });

  it('keeps a standard release with 67% coverage as NO_GO when signals are healthy', () => {
    const result = evaluateRelease({ ...healthy, coverage: 67 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_MINIMUM']);
  });
});
