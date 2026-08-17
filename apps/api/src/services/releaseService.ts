/**
 * Release evaluation service (legacy).
 *
 * Turns pipeline evidence into a deployment decision with reasons.
 * The decision contract is consumed by CI pipelines — treat the response
 * shape as frozen (see packages/contracts).
 */
import { POLICY_VERSION, MINIMUM_COVERAGE } from '../constants.js';
import type { Decision } from '@release-guardian/contracts';

export interface DecisionResult {
  decision: Decision;
  reasons: string[];
  policyVersion: string;
}

export function evaluateRelease(data: any): DecisionResult {
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

  if (data.security.high > 0 && data.security.critical === 0) {
    reasons.push('HIGH_SECURITY_RISK');
  }

  if (data.lintErrors > 0) {
    reasons.push('LINT_ERRORS');
  }

  // decide final outcome from collected reasons
  const hasBlockingReason =
    reasons.includes('COVERAGE_BELOW_MINIMUM') ||
    reasons.includes('MANDATORY_TEST_FAILURE') ||
    reasons.includes('CRITICAL_SECURITY_VULNERABILITY') ||
    reasons.includes('LINT_ERRORS');

  let decision: Decision = 'GO';
  if (hasBlockingReason) {
    decision = 'NO_GO';
  } else if (reasons.includes('HIGH_SECURITY_RISK')) {
    decision = 'REVIEW';
  }

  const result = {
    decision: decision,
    reasons: reasons,
    policyVersion: POLICY_VERSION,
  };

  return result;
}

// exported for the /policy endpoint; kept in sync with the checks above
export function getMinimumCoverage(): number {
  return MINIMUM_COVERAGE;
}
