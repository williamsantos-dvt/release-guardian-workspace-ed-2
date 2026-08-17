/**
 * Release evaluation service.
 *
 * Turns pipeline evidence into a deployment decision with reasons.
 * The decision contract is consumed by CI pipelines — treat the response
 * shape as frozen (see packages/contracts).
 */
import type { Decision, ReasonCode, ReleaseEvidence } from '@release-guardian/contracts';
import {
  COVERAGE_REVIEW_THRESHOLD,
  MINIMUM_COVERAGE,
  POLICY_VERSION,
} from '../constants.js';

export interface DecisionResult {
  decision: Decision;
  reasons: ReasonCode[];
  policyVersion: string;
}

export function evaluateRelease(data: ReleaseEvidence): DecisionResult {
  const reasons: ReasonCode[] = [];
  const coverageBelowMinimum = data.coverage < MINIMUM_COVERAGE;
  const coverageNeedsAttention = data.coverage < COVERAGE_REVIEW_THRESHOLD;
  const coverageIsBorderline = data.coverage >= MINIMUM_COVERAGE && coverageNeedsAttention;
  const isHotfixRelease = data.releaseType === 'hotfix';
  const hasTestFailure = data.tests.failed > 0;
  const hasCriticalVulnerability = data.security.critical > 0;
  const hasLintErrors = data.lintErrors > 0;

  if (coverageNeedsAttention) {
    reasons.push('COVERAGE_BELOW_MINIMUM');
  }

  if (hasTestFailure) {
    reasons.push('MANDATORY_TEST_FAILURE');
  }

  if (hasCriticalVulnerability) {
    reasons.push('CRITICAL_SECURITY_VULNERABILITY');
  }

  if (hasLintErrors) {
    reasons.push('LINT_ERRORS');
  }

  let decision: Decision = 'GO';
  if (coverageBelowMinimum || hasTestFailure || hasCriticalVulnerability || hasLintErrors) {
    decision = 'NO_GO';
  } else if (coverageIsBorderline && !isHotfixRelease) {
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
