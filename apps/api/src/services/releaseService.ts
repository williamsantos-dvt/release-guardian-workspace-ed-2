/**
 * Release evaluation service (legacy).
 *
 * Turns pipeline evidence into a deployment decision with reasons.
 * The decision contract is consumed by CI pipelines — treat the response
 * shape as frozen (see packages/contracts).
 */
import { POLICY_VERSION, MINIMUM_COVERAGE } from '../constants.js';
import type { Decision, ReleaseEvidence } from '@release-guardian/contracts';

const HOTFIX_MIN_COVERAGE = 65;
const REVIEW_COVERAGE_MAX = 80;

function getCoverageMinimum(releaseType: ReleaseEvidence['releaseType']): number {
  return releaseType === 'hotfix' ? HOTFIX_MIN_COVERAGE : MINIMUM_COVERAGE;
}

function isCoverageInReviewBand(evidence: ReleaseEvidence): boolean {
  const reviewMin = evidence.releaseType === 'hotfix' ? HOTFIX_MIN_COVERAGE : MINIMUM_COVERAGE;
  return evidence.coverage >= reviewMin && evidence.coverage < REVIEW_COVERAGE_MAX;
}

export interface DecisionResult {
  decision: Decision;
  reasons: string[];
  policyVersion: string;
}

export function evaluateRelease(data: ReleaseEvidence): DecisionResult {
  const reasons: string[] = [];
  const coverageMinimum = getCoverageMinimum(data.releaseType);

  if (data.coverage < coverageMinimum) {
    reasons.push('COVERAGE_BELOW_MINIMUM');
  }

  if (data.tests.failed > 0) {
    reasons.push('MANDATORY_TEST_FAILURE');
  }

  if (data.security.critical > 0) {
    reasons.push('CRITICAL_SECURITY_VULNERABILITY');
  }

  const hasLintErrors = data.lintErrors > 0;
  if (hasLintErrors) {
    reasons.push('LINT_ERRORS');
  }

  const hasBlockingReasons = reasons.some((reason) => reason !== 'LINT_ERRORS');
  const hasReviewSignals = isCoverageInReviewBand(data) || data.security.high >= 3 || hasLintErrors;

  let decision: Decision;
  if (hasBlockingReasons) {
    decision = 'NO_GO';
  } else if (hasReviewSignals) {
    decision = 'REVIEW';
  } else {
    decision = 'GO';
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
