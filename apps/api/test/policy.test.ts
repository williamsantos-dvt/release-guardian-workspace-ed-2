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

  it('approves coverage of 72', () => {
    const result = evaluateRelease({ ...healthy, coverage: 72 });
    expect(result.decision).toBe('GO');
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
    const result = evaluateRelease({ ...healthy, lintErrors: 5 });
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
