/**
 * Release evaluation service (legacy).
 *
 * Turns pipeline evidence into a deployment decision with reasons.
 * The decision contract is consumed by CI pipelines — treat the response
 * shape as frozen (see packages/contracts).
 */
import { POLICY_VERSION, MINIMUM_COVERAGE } from '../constants.js';
import type { Decision, ReleaseEvidence } from '@release-guardian/contracts';

export interface DecisionResult {
  decision: Decision;
  reasons: string[];
  policyVersion: string;
}

const BLOCKING_REASONS = new Set([
  'COVERAGE_BELOW_MINIMUM',
  'MANDATORY_TEST_FAILURE',
  'CRITICAL_SECURITY_VULNERABILITY',
  'LINT_ERRORS',
]);

export function evaluateRelease(data: ReleaseEvidence): DecisionResult {
  const reasons: string[] = [];

  if (data.coverage < MINIMUM_COVERAGE) {
    reasons.push('COVERAGE_BELOW_MINIMUM');
  }

  if (data.tests.failed > 0) {
    reasons.push('MANDATORY_TEST_FAILURE');
  }

  if (data.security.critical > 0) {
    reasons.push('CRITICAL_SECURITY_VULNERABILITY');
  }

  if (data.lintErrors > 0) {
    reasons.push('LINT_ERRORS');
  }

  if (data.security.critical === 0 && data.security.high > 0) {
    reasons.push('HIGH_SECURITY_RISK');
  }

  let decision: Decision = 'GO';
  if (reasons.some((reason) => BLOCKING_REASONS.has(reason))) {
    decision = 'NO_GO';
  } else if (reasons.includes('HIGH_SECURITY_RISK')) {
    decision = 'REVIEW';
  }

  const result = {
    decision,
    reasons,
    policyVersion: POLICY_VERSION,
  };

  return result;
}

// exported for the /policy endpoint; kept in sync with the checks above
export function getMinimumCoverage(): number {
  return MINIMUM_COVERAGE;
}
