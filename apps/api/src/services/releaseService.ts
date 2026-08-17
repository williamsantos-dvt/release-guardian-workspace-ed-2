/**
 * Release evaluation service (legacy).
 *
 * Turns pipeline evidence into a deployment decision with reasons.
 * The decision contract is consumed by CI pipelines — treat the response
 * shape as frozen (see packages/contracts).
 */
import type { Decision, ReleaseEvidence } from '@release-guardian/contracts';
import { POLICY_VERSION, MINIMUM_COVERAGE, COVERAGE_THRESHOLDS } from '../constants.js';

export interface DecisionResult {
  decision: Decision;
  reasons: string[];
  policyVersion: string;
}

export function evaluateRelease(data: ReleaseEvidence): DecisionResult {
  const reasons: string[] = [];
  const thresholds = COVERAGE_THRESHOLDS[data.releaseType] ?? COVERAGE_THRESHOLDS.standard;

  if (data.coverage < thresholds.noGoBelow) {
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

  // decide final outcome from coverage band, then apply blockers
  let decision: Decision = 'GO';
  if (data.coverage < thresholds.noGoBelow) {
    decision = 'NO_GO';
  } else if (data.coverage < thresholds.goFrom) {
    decision = 'REVIEW';
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
