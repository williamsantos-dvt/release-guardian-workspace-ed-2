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
  HOTFIX_MINIMUM_COVERAGE,
  TARGET_COVERAGE,
  HIGH_SECURITY_REVIEW_THRESHOLD,
} from '../constants.js';

export interface DecisionResult {
  decision: 'GO' | 'REVIEW' | 'NO_GO';
  reasons: string[];
  policyVersion: string;
}

export function evaluateRelease(data: any): DecisionResult {
  const minimumCoverage = getMinimumCoverage(data.releaseType);
  const coverageBelowMinimum = data.coverage < minimumCoverage;
  const coverageNeedsReview = !coverageBelowMinimum && data.coverage < TARGET_COVERAGE;
  const mandatoryTestFailure = data.tests.failed > 0;
  const criticalSecurityVulnerability = data.security.critical > 0;
  const highSecurityRisk = data.security.high >= HIGH_SECURITY_REVIEW_THRESHOLD;
  const lintErrors = data.lintErrors > 0;

  const reasons: string[] = [];
  if (coverageBelowMinimum) {
    reasons.push('COVERAGE_BELOW_MINIMUM');
  }
  if (mandatoryTestFailure) {
    reasons.push('MANDATORY_TEST_FAILURE');
  }
  if (criticalSecurityVulnerability) {
    reasons.push('CRITICAL_SECURITY_VULNERABILITY');
  }
  if (highSecurityRisk) {
    reasons.push('HIGH_SECURITY_RISK');
  }
  if (coverageNeedsReview) {
    reasons.push('COVERAGE_NEEDS_REVIEW');
  }
  if (lintErrors) {
    reasons.push('LINT_ERRORS');
  }

  // decide final outcome from collected reasons
  const hasNoGoReason =
    reasons.includes('COVERAGE_BELOW_MINIMUM') ||
    reasons.includes('MANDATORY_TEST_FAILURE') ||
    reasons.includes('CRITICAL_SECURITY_VULNERABILITY');
  const hasReviewReason =
    reasons.includes('HIGH_SECURITY_RISK') ||
    reasons.includes('COVERAGE_NEEDS_REVIEW') ||
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
export function getMinimumCoverage(releaseType: string = 'standard'): number {
  return releaseType === 'hotfix' ? HOTFIX_MINIMUM_COVERAGE : MINIMUM_COVERAGE;
}

export function getTargetCoverage(): number {
  return TARGET_COVERAGE;
}
