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

describe('release policy (evolved)', () => {
  it('approves a healthy release', () => {
    const result = evaluateRelease(healthy);
    expect(result.decision).toBe('GO');
    expect(result.reasons).toEqual([]);
  });

  it('returns NO_GO for standard coverage at 69.99', () => {
    const result = evaluateRelease({ ...healthy, coverage: 69.99 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_MINIMUM']);
  });

  it('returns REVIEW for standard coverage at 70', () => {
    const result = evaluateRelease({ ...healthy, coverage: 70 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_MINIMUM']);
  });

  it('returns REVIEW for standard coverage at 79.99', () => {
    const result = evaluateRelease({ ...healthy, coverage: 79.99 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_MINIMUM']);
  });

  it('returns GO for standard coverage at 80', () => {
    const result = evaluateRelease({ ...healthy, coverage: 80 });
    expect(result.decision).toBe('GO');
    expect(result.reasons).toEqual([]);
  });

  it('returns NO_GO for hotfix coverage at 64.99', () => {
    const result = evaluateRelease({ ...healthy, releaseType: 'hotfix', coverage: 64.99 });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_MINIMUM']);
  });

  it('returns REVIEW for hotfix coverage at 65', () => {
    const result = evaluateRelease({ ...healthy, releaseType: 'hotfix', coverage: 65 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_MINIMUM']);
  });

  it('returns REVIEW for hotfix coverage at 67 (CR-01 canonical scenario)', () => {
    const result = evaluateRelease({ ...healthy, releaseType: 'hotfix', coverage: 67 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['COVERAGE_BELOW_MINIMUM']);
  });

  it('returns GO for hotfix coverage at 80', () => {
    const result = evaluateRelease({ ...healthy, releaseType: 'hotfix', coverage: 80 });
    expect(result.decision).toBe('GO');
    expect(result.reasons).toEqual([]);
  });

  it('does not emit HIGH_SECURITY_RISK for high=2', () => {
    const result = evaluateRelease({ ...healthy, security: { critical: 0, high: 2 } });
    expect(result.decision).toBe('GO');
    expect(result.reasons).toEqual([]);
  });

  it('emits HIGH_SECURITY_RISK as REVIEW for high=3', () => {
    const result = evaluateRelease({ ...healthy, security: { critical: 0, high: 3 } });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['HIGH_SECURITY_RISK']);
  });

  it('returns REVIEW for lintErrors=1 with healthy coverage', () => {
    const result = evaluateRelease({ ...healthy, coverage: 85, lintErrors: 1 });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['LINT_ERRORS']);
  });

  it('returns NO_GO for critical=1 even with coverage 85', () => {
    const result = evaluateRelease({ ...healthy, coverage: 85, security: { critical: 1, high: 0 } });
    expect(result.decision).toBe('NO_GO');
    expect(result.reasons).toContain('CRITICAL_SECURITY_VULNERABILITY');
  });

  it('returns NO_GO when NO_GO and REVIEW reasons coexist, preserving canonical order', () => {
    const result = evaluateRelease({
      ...healthy,
      coverage: 74,
      tests: { passed: 80, failed: 2 },
      security: { critical: 1, high: 4 },
      lintErrors: 2,
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
