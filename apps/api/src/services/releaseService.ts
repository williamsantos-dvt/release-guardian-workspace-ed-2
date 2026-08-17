/**
 * Release evaluation service (legacy).
 *
 * Turns pipeline evidence into a deployment decision with reasons.
 * The decision contract is consumed by CI pipelines — treat the response
 * shape as frozen (see packages/contracts).
 */
import {
  POLICY_VERSION,
  MINIMUM_COVERAGE,
  GO_COVERAGE,
  STANDARD_MINIMUM_COVERAGE,
  HOTFIX_MINIMUM_COVERAGE,
} from '../constants.js';

export interface DecisionResult {
  decision: 'GO' | 'REVIEW' | 'NO_GO';
  reasons: string[];
  policyVersion: string;
}

export function evaluateRelease(data: any): DecisionResult {
  const reasons: string[] = [];
  const coverageMinimum =
    data.releaseType === 'hotfix' ? HOTFIX_MINIMUM_COVERAGE : STANDARD_MINIMUM_COVERAGE;

  if (data.coverage < coverageMinimum) {
    reasons.push('COVERAGE_BELOW_MINIMUM');
  }

  if (data.tests.failed > 0) {
    reasons.push('MANDATORY_TEST_FAILURE');
  }

  if (data.security.critical > 0) {
    reasons.push('CRITICAL_SECURITY_VULNERABILITY');
  }

  if (data.security.high >= 3) {
    reasons.push('HIGH_SECURITY_RISK');
  }

  if (data.coverage >= coverageMinimum && data.coverage < GO_COVERAGE) {
    reasons.push('COVERAGE_REQUIRES_REVIEW');
  }

  if (data.lintErrors > 0) {
    reasons.push('LINT_ERRORS');
  }

  // decide final outcome from collected reasons
  const hasNoGoReason =
    reasons.includes('COVERAGE_BELOW_MINIMUM') ||
    reasons.includes('MANDATORY_TEST_FAILURE') ||
    reasons.includes('CRITICAL_SECURITY_VULNERABILITY');

  const hasReviewReason =
    reasons.includes('HIGH_SECURITY_RISK') ||
    reasons.includes('COVERAGE_REQUIRES_REVIEW') ||
    reasons.includes('LINT_ERRORS');

  let decision: 'GO' | 'REVIEW' | 'NO_GO' = 'GO';
  if (hasNoGoReason) {
    decision = 'NO_GO';
  } else if (hasReviewReason) {
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
