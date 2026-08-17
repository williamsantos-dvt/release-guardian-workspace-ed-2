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

  it('marks standard coverage of 72 as REVIEW', () => {
    const result = evaluateRelease({ ...healthy, coverage: 72 });
    expect(result.decision).toBe('REVIEW');
  });

  it('marks hotfix coverage of 67 as REVIEW', () => {
    const result = evaluateRelease({ ...healthy, releaseType: 'hotfix', coverage: 67 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual([]);
  });

  it('keeps standard coverage below 70 as NO_GO', () => {
    const result = evaluateRelease({ ...healthy, coverage: 67 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('COVERAGE_BELOW_MINIMUM');
  });

  it('keeps hotfix coverage below 65 as NO_GO', () => {
    const result = evaluateRelease({ ...healthy, releaseType: 'hotfix', coverage: 63 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('COVERAGE_BELOW_MINIMUM');
  });

  it('marks high vulnerabilities (>=3) as REVIEW without blockers', () => {
    const result = evaluateRelease({ ...healthy, coverage: 85, security: { critical: 0, high: 3 } });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual([]);
  });

  it('does not mark high vulnerabilities below threshold as REVIEW by themselves', () => {
    const result = evaluateRelease({ ...healthy, coverage: 85, security: { critical: 0, high: 2 } });
    expect(result.decision).toBe('GO');
    expect(result.reasons).toEqual([]);
  });

  it('marks lint errors as REVIEW when there are no blockers', () => {
    const result = evaluateRelease({ ...healthy, lintErrors: 5 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['LINT_ERRORS']);
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

  it('keeps NO_GO priority when review signals exist with blockers', () => {
    const blocked = evaluateRelease({
      ...healthy,
      coverage: 60,
      security: { critical: 0, high: 5 },
      lintErrors: 5,
    });
    expect(blocked.decision).toBe('NO_GO');
    expect(blocked.reasons).toContain('COVERAGE_BELOW_MINIMUM');
    expect(blocked.reasons).toContain('LINT_ERRORS');
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
