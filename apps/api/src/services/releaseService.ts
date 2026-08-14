/**
 * Release evaluation service (legacy).
 *
 * Turns pipeline evidence into a deployment decision with reasons.
 * The decision contract is consumed by CI pipelines — treat the response
 * shape as frozen (see packages/contracts).
 */
import { POLICY_VERSION, MINIMUM_COVERAGE } from '../constants.js';

export interface DecisionResult {
  decision: 'GO' | 'NO_GO';
  reasons: string[];
  policyVersion: string;
}

export function evaluateRelease(data: any): DecisionResult {
  const reasons = [];

  if (data.coverage < 70) {
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

  // decide final outcome from collected reasons
  let decision: 'GO' | 'NO_GO' = 'GO';
  if (reasons.includes('COVERAGE_BELOW_MINIMUM')) {
    decision = 'NO_GO';
  }
  if (reasons.includes('MANDATORY_TEST_FAILURE')) {
    decision = 'NO_GO';
  }
  if (reasons.includes('CRITICAL_SECURITY_VULNERABILITY')) {
    decision = 'NO_GO';
  }
  if (reasons.includes('LINT_ERRORS')) {
    decision = 'NO_GO';
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
