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
  HOTFIX_MINIMUM_COVERAGE,
  REVIEW_COVERAGE_THRESHOLD,
  HIGH_SECURITY_RISK_THRESHOLD,
} from '../constants.js';

export interface DecisionResult {
  decision: Decision;
  reasons: string[];
  policyVersion: string;
}

function getCoverageMinimum(releaseType: ReleaseEvidence['releaseType']): number {
  return releaseType === 'hotfix' ? HOTFIX_MINIMUM_COVERAGE : MINIMUM_COVERAGE;
}

export function evaluateRelease(data: ReleaseEvidence): DecisionResult {
  const reasons: string[] = [];
  const minimumCoverage = getCoverageMinimum(data.releaseType);

  const hasCoverageBlock = data.coverage < minimumCoverage;
  const hasCoverageReviewBand = !hasCoverageBlock && data.coverage < REVIEW_COVERAGE_THRESHOLD;
  const hasMandatoryTestFailure = data.tests.failed > 0;
  const hasCriticalSecurityVulnerability = data.security.critical > 0;
  const hasHighSecurityRisk = data.security.high >= HIGH_SECURITY_RISK_THRESHOLD;
  const hasLintErrors = data.lintErrors > 0;

  if (hasCoverageBlock) {
    reasons.push('COVERAGE_BELOW_MINIMUM');
  }

  if (hasCoverageReviewBand) {
    reasons.push('COVERAGE_BELOW_TARGET');
  }

  if (hasMandatoryTestFailure) {
    reasons.push('MANDATORY_TEST_FAILURE');
  }

  if (hasCriticalSecurityVulnerability) {
    reasons.push('CRITICAL_SECURITY_VULNERABILITY');
  }

  if (hasHighSecurityRisk) {
    reasons.push('HIGH_SECURITY_RISK');
  }

  if (hasLintErrors) {
    reasons.push('LINT_ERRORS');
  }

  let decision: Decision = 'GO';
  if (hasCoverageBlock || hasMandatoryTestFailure || hasCriticalSecurityVulnerability) {
    decision = 'NO_GO';
  } else if (hasCoverageReviewBand || hasHighSecurityRisk || hasLintErrors) {
    decision = 'REVIEW';
  }

  const result = {
    decision,
    reasons,
    policyVersion: POLICY_VERSION,
  };

  return result;
}

// exported for the /policy endpoint (standard release threshold)
export function getMinimumCoverage(): number {
  return MINIMUM_COVERAGE;
}
