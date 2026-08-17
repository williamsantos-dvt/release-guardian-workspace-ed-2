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

  it('blocks coverage below 60', () => {
    const result = evaluateRelease({ ...healthy, coverage: 59 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('COVERAGE_BELOW_MINIMUM');
  });

  it('requires review for coverage of 60', () => {
    const result = evaluateRelease({ ...healthy, coverage: 60 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toContain('COVERAGE_REQUIRES_REVIEW');
  });

  it('requires review for coverage of 79', () => {
    const result = evaluateRelease({ ...healthy, coverage: 79 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toContain('COVERAGE_REQUIRES_REVIEW');
  });

  it('does not apply coverage reason for 80', () => {
    const result = evaluateRelease({ ...healthy, coverage: 80 });
    expect(result.decision).toBe('GO');
    expect(result.reasons).not.toContain('COVERAGE_REQUIRES_REVIEW');
    expect(result.reasons).not.toContain('COVERAGE_BELOW_MINIMUM');
  });

  it('requires review for high vulnerabilities when critical is zero', () => {
    const result = evaluateRelease({ ...healthy, security: { critical: 0, high: 1 } });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toContain('HIGH_SECURITY_RISK');
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

  it('keeps blocking precedence when review and blocking conditions coexist', () => {
    const result = evaluateRelease({
      ...healthy,
      coverage: 75,
      tests: { passed: 90, failed: 1 },
    });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('COVERAGE_REQUIRES_REVIEW');
    expect(result.reasons).toContain('MANDATORY_TEST_FAILURE');
  });

  it('blocks lint errors', () => {
    const result = evaluateRelease({ ...healthy, lintErrors: 5 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('LINT_ERRORS');
  });

  it('orders review reasons consistently', () => {
    const result = evaluateRelease({
      ...healthy,
      coverage: 75,
      security: { critical: 0, high: 2 },
    });
    expect(result.reasons).toEqual(['COVERAGE_REQUIRES_REVIEW', 'HIGH_SECURITY_RISK']);
  });

  it('returns all applicable reasons in a stable order', () => {
    const result = evaluateRelease({
      ...healthy,
      coverage: 75,
      tests: { passed: 10, failed: 3 },
      security: { critical: 2, high: 1 },
      lintErrors: 7,
    });
    expect(result.reasons).toEqual([
      'COVERAGE_REQUIRES_REVIEW',
      'MANDATORY_TEST_FAILURE',
      'CRITICAL_SECURITY_VULNERABILITY',
      'LINT_ERRORS',
    ]);
  });
});
