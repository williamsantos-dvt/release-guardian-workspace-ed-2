/**
 * Release evaluation service (legacy).
 *
 * Turns pipeline evidence into a deployment decision with reasons.
 * The decision contract is consumed by CI pipelines — treat the response
 * shape as frozen (see packages/contracts).
 */
import type { Decision, ReleaseEvidence } from '@release-guardian/contracts';
import {
  POLICY_VERSION,
  MINIMUM_COVERAGE,
  COVERAGE_REVIEW_THRESHOLD,
  COVERAGE_BLOCK_THRESHOLD_BY_RELEASE_TYPE,
} from '../constants.js';

export interface DecisionResult {
  decision: Decision;
  reasons: string[];
  policyVersion: string;
}

export function evaluateRelease(data: ReleaseEvidence): DecisionResult {
  const reasons: string[] = [];

  const coverageBlockThreshold =
    COVERAGE_BLOCK_THRESHOLD_BY_RELEASE_TYPE[data.releaseType] ?? MINIMUM_COVERAGE;
  const coverageIsBlocking = data.coverage < coverageBlockThreshold;
  const coverageIsReview = !coverageIsBlocking && data.coverage < COVERAGE_REVIEW_THRESHOLD;
  const testsAreBlocking = data.tests.failed > 0;
  const criticalIsBlocking = data.security.critical > 0;
  const lintIsReview = data.lintErrors > 0;
  const highRiskIsReview = data.security.high >= 3;

  if (coverageIsBlocking || coverageIsReview) {
    reasons.push('COVERAGE_BELOW_MINIMUM');
  }

  if (testsAreBlocking) {
    reasons.push('MANDATORY_TEST_FAILURE');
  }

  if (criticalIsBlocking) {
    reasons.push('CRITICAL_SECURITY_VULNERABILITY');
  }

  if (lintIsReview) {
    reasons.push('LINT_ERRORS');
  }

  if (highRiskIsReview) {
    reasons.push('HIGH_SECURITY_RISK');
  }

  let decision: Decision = 'GO';
  if (coverageIsBlocking || testsAreBlocking || criticalIsBlocking) {
    decision = 'NO_GO';
  } else if (coverageIsReview || lintIsReview || highRiskIsReview) {
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
