/**
 * Release evaluation service (legacy).
 *
 * Turns pipeline evidence into a deployment decision with reasons.
 * The decision contract is consumed by CI pipelines — treat the response
 * shape as frozen (see packages/contracts).
 */
import type { Decision, ReleaseEvidence, ReasonCode } from '@release-guardian/contracts';
import { REASON_CODES } from '@release-guardian/contracts';
import {
  POLICY_VERSION,
  MINIMUM_COVERAGE,
  HOTFIX_MINIMUM_COVERAGE,
  COVERAGE_REVIEW_THRESHOLD,
} from '../constants.js';

const BLOCKING_REASONS: ReadonlySet<ReasonCode> = new Set([
  'COVERAGE_BELOW_MINIMUM',
  'MANDATORY_TEST_FAILURE',
  'CRITICAL_SECURITY_VULNERABILITY',
]);

const REVIEW_REASONS: ReadonlySet<ReasonCode> = new Set([
  'COVERAGE_REQUIRES_REVIEW',
  'HIGH_SECURITY_RISK',
  'LINT_ERRORS',
]);

function getCoverageMinimumForReleaseType(releaseType: ReleaseEvidence['releaseType']): number {
  if (releaseType === 'hotfix') return HOTFIX_MINIMUM_COVERAGE;
  return MINIMUM_COVERAGE;
}

export interface DecisionResult {
  decision: Decision;
  reasons: string[];
  policyVersion: string;
}

export function evaluateRelease(data: ReleaseEvidence): DecisionResult {
  const reasonSet = new Set<ReasonCode>();
  const coverageMinimum = getCoverageMinimumForReleaseType(data.releaseType);

  if (data.coverage < coverageMinimum) {
    reasonSet.add('COVERAGE_BELOW_MINIMUM');
  } else if (data.coverage < COVERAGE_REVIEW_THRESHOLD) {
    reasonSet.add('COVERAGE_REQUIRES_REVIEW');
  }

  if (data.tests.failed > 0) {
    reasonSet.add('MANDATORY_TEST_FAILURE');
  }

  if (data.security.critical > 0) {
    reasonSet.add('CRITICAL_SECURITY_VULNERABILITY');
  }

  if (data.security.high >= 3 && data.security.critical === 0) {
    reasonSet.add('HIGH_SECURITY_RISK');
  }

  if (data.lintErrors > 0) {
    reasonSet.add('LINT_ERRORS');
  }

  const reasons = REASON_CODES.filter((reason) => reasonSet.has(reason));
  const hasBlockingReason = reasons.some((reason) => BLOCKING_REASONS.has(reason));
  const hasReviewReason = reasons.some((reason) => REVIEW_REASONS.has(reason));

  let decision: Decision = 'GO';
  if (hasBlockingReason) {
    decision = 'NO_GO';
  } else if (hasReviewReason) {
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
