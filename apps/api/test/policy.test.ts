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

  it('reviews coverage of 72 for standard releases', () => {
    const result = evaluateRelease({ ...healthy, coverage: 72 });
    expect(result.decision).toBe('REVIEW');
  });

  it('blocks coverage below the minimum', () => {
    const result = evaluateRelease({ ...healthy, coverage: 63 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('COVERAGE_BELOW_MINIMUM');
  });

  it('reviews coverage of 67 for hotfix releases', () => {
    const hotfix: ReleaseEvidence = {
      ...healthy,
      releaseType: 'hotfix',
      coverage: 67,
    };
    const result = evaluateRelease(hotfix);
    expect(result.decision).toBe('REVIEW');
  });

  it('blocks coverage below 65 for hotfix releases', () => {
    const hotfix: ReleaseEvidence = {
      ...healthy,
      releaseType: 'hotfix',
      coverage: 64,
    };
    const result = evaluateRelease(hotfix);
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

  it('requires review for high vulnerabilities without blocking reasons when high >= 3', () => {
    const result = evaluateRelease({ ...healthy, security: { critical: 0, high: 3 } });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['HIGH_SECURITY_RISK']);
  });

  it('does not require review when high vulnerabilities are below threshold', () => {
    const result = evaluateRelease({ ...healthy, security: { critical: 0, high: 2 } });
    expect(result.decision).toBe('GO');
    expect(result.reasons).not.toContain('HIGH_SECURITY_RISK');
  });

  it('keeps NO_GO when critical and high vulnerabilities are both present above threshold', () => {
    const result = evaluateRelease({ ...healthy, security: { critical: 1, high: 3 } });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toEqual(['CRITICAL_SECURITY_VULNERABILITY', 'HIGH_SECURITY_RISK']);
  });

  it('requires review for lint errors', () => {
    const result = evaluateRelease({ ...healthy, lintErrors: 5 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toContain('LINT_ERRORS');
  });

  it('returns all applicable reasons in a stable order', () => {
    const result = evaluateRelease({
      ...healthy,
      coverage: 60,
      tests: { passed: 10, failed: 3 },
      security: { critical: 2, high: 3 },
      lintErrors: 7,
    });
    expect(result.reasons).toEqual([
      'COVERAGE_BELOW_MINIMUM',
      'MANDATORY_TEST_FAILURE',
      'CRITICAL_SECURITY_VULNERABILITY',
      'HIGH_SECURITY_RISK',
      'LINT_ERRORS',
    ]);
  });
});
