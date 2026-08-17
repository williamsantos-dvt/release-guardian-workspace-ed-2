import { describe, it, expect } from 'vitest';
import type { ReleaseEvidence } from '@release-guardian/contracts';
import { evaluateRelease } from '../src/services/releaseService.js';

const healthyStandard: ReleaseEvidence = {
  releaseId: 'test-release',
  releaseType: 'standard',
  tests: { passed: 100, failed: 0 },
  coverage: 85,
  security: { critical: 0, high: 0 },
  lintErrors: 0,
};

describe('release policy (baseline)', () => {
  it('approves a healthy standard release above 80% coverage', () => {
    const result = evaluateRelease(healthyStandard);
    expect(result.decision).toBe('GO');
    expect(result.reasons).toEqual([]);
  });

  it('puts standard releases with coverage 70-79.99 into REVIEW when healthy', () => {
    const result = evaluateRelease({ ...healthyStandard, coverage: 72 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_TARGET']);
  });

  it('blocks standard coverage below the minimum', () => {
    const result = evaluateRelease({ ...healthyStandard, coverage: 63 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('COVERAGE_BELOW_MINIMUM');
  });

  it('blocks hotfix coverage below 65', () => {
    const result = evaluateRelease({
      ...healthyStandard,
      releaseType: 'hotfix',
      coverage: 60,
    });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_MINIMUM']);
  });

  it('puts hotfix coverage 65-79.99 into REVIEW when healthy', () => {
    const result = evaluateRelease({
      ...healthyStandard,
      releaseType: 'hotfix',
      coverage: 67,
    });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_TARGET']);
  });

  it('keeps NO_GO precedence when mandatory tests fail in a REVIEW coverage band', () => {
    const result = evaluateRelease({
      ...healthyStandard,
      coverage: 75,
      tests: { passed: 95, failed: 1 },
    });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_TARGET', 'MANDATORY_TEST_FAILURE']);
  });

  it('keeps NO_GO precedence when critical vulnerabilities are present in a REVIEW coverage band', () => {
    const result = evaluateRelease({
      ...healthyStandard,
      coverage: 74,
      security: { critical: 1, high: 4 },
      lintErrors: 12,
    });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toEqual([
      'COVERAGE_BELOW_TARGET',
      'CRITICAL_SECURITY_VULNERABILITY',
      'HIGH_SECURITY_RISK',
      'LINT_ERRORS',
    ]);
  });

  it('puts releases with many high vulnerabilities into REVIEW when otherwise healthy', () => {
    const result = evaluateRelease({ ...healthyStandard, security: { critical: 0, high: 3 } });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['HIGH_SECURITY_RISK']);
  });

  it('puts releases with lint errors into REVIEW when otherwise healthy', () => {
    const result = evaluateRelease({ ...healthyStandard, lintErrors: 2 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['LINT_ERRORS']);
  });

  it('returns all applicable reasons in a stable order', () => {
    const result = evaluateRelease({
      ...healthyStandard,
      releaseType: 'hotfix',
      coverage: 60,
      tests: { passed: 10, failed: 3 },
      security: { critical: 2, high: 4 },
      lintErrors: 7,
    });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toEqual([
      'COVERAGE_BELOW_MINIMUM',
      'MANDATORY_TEST_FAILURE',
      'CRITICAL_SECURITY_VULNERABILITY',
      'HIGH_SECURITY_RISK',
      'LINT_ERRORS',
    ]);
  });
});
