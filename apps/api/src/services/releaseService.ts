/**
 * Release evaluation service (legacy).
 *
 * Turns pipeline evidence into a deployment decision with reasons.
 * The decision contract is consumed by CI pipelines — treat the response
 * shape as frozen (see packages/contracts).
 */
import { POLICY_VERSION, MINIMUM_COVERAGE } from '../constants.js';
import type { Decision, ReleaseEvidence, ReasonCode } from '@release-guardian/contracts';
import { REASON_CODES } from '@release-guardian/contracts';

const HOTFIX_MINIMUM_COVERAGE = 65;
const COVERAGE_REVIEW_UPPER_BOUND = 80;

const BLOCKING_REASONS: ReadonlySet<ReasonCode> = new Set([
  'COVERAGE_BELOW_MINIMUM',
  'MANDATORY_TEST_FAILURE',
  'CRITICAL_SECURITY_VULNERABILITY',
]);

const REVIEW_REASONS: ReadonlySet<ReasonCode> = new Set([
  'HIGH_SECURITY_RISK',
  'LINT_ERRORS',
]);

export interface DecisionResult {
  decision: Decision;
  reasons: ReasonCode[];
  policyVersion: string;
}

export function evaluateRelease(data: ReleaseEvidence): DecisionResult {
  const matchedReasons = new Set<ReasonCode>();
  const isHotfix = data.releaseType === 'hotfix';

  // Coverage bands depend on release type.
  const coverageBlockThreshold = isHotfix ? HOTFIX_MINIMUM_COVERAGE : MINIMUM_COVERAGE;
  let coverageBand: 'none' | 'review' | 'block' = 'none';
  if (data.coverage < coverageBlockThreshold) {
    coverageBand = 'block';
    matchedReasons.add('COVERAGE_BELOW_MINIMUM');
  } else if (data.coverage < COVERAGE_REVIEW_UPPER_BOUND) {
    coverageBand = 'review';
  }

  if (data.tests.failed > 0) {
    matchedReasons.add('MANDATORY_TEST_FAILURE');
  }

  if (data.security.high >= 3) {
    matchedReasons.add('HIGH_SECURITY_RISK');
  }

  if (data.security.critical > 0) {
    matchedReasons.add('CRITICAL_SECURITY_VULNERABILITY');
  }

  if (data.lintErrors > 0) {
    matchedReasons.add('LINT_ERRORS');
  }

  const reasons = REASON_CODES.filter((reason) => matchedReasons.has(reason));

  // decide final outcome from collected reasons
  let decision: Decision = 'GO';
  const hasBlockingReason = reasons.some((reason) => BLOCKING_REASONS.has(reason)) || coverageBand === 'block';
  const hasReviewReason = reasons.some((reason) => REVIEW_REASONS.has(reason)) || coverageBand === 'review';

  if (hasBlockingReason) {
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
