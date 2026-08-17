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
  STANDARD_REVIEW_MIN,
  STANDARD_GO_MIN,
  HOTFIX_REVIEW_MIN,
  HOTFIX_GO_MIN,
} from '../constants.js';

export interface DecisionResult {
  decision: 'GO' | 'REVIEW' | 'NO_GO';
  reasons: string[];
  policyVersion: string;
}

const REASON_ORDER = [
  'COVERAGE_BELOW_MINIMUM',
  'MANDATORY_TEST_FAILURE',
  'CRITICAL_SECURITY_VULNERABILITY',
  'HIGH_SECURITY_RISK',
  'LINT_ERRORS',
] as const;

const REASON_INDEX = Object.fromEntries(REASON_ORDER.map((reason, index) => [reason, index])) as Record<
  string,
  number
>;

function sortReasons(reasons: string[]): string[] {
  return [...reasons].sort((a, b) => {
    const aIndex = REASON_INDEX[a] ?? Number.MAX_SAFE_INTEGER;
    const bIndex = REASON_INDEX[b] ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });
}

export function evaluateRelease(data: any): DecisionResult {
  const hardBlockerReasons: string[] = [];

  if (data.tests.failed > 0) {
    hardBlockerReasons.push('MANDATORY_TEST_FAILURE');
  }

  if (data.security.critical > 0) {
    hardBlockerReasons.push('CRITICAL_SECURITY_VULNERABILITY');
  }

  if (data.security.high > 0) {
    hardBlockerReasons.push('HIGH_SECURITY_RISK');
  }

  if (data.lintErrors > 0) {
    hardBlockerReasons.push('LINT_ERRORS');
  }

  if (hardBlockerReasons.length > 0) {
    return {
      decision: 'NO_GO',
      reasons: sortReasons(hardBlockerReasons),
      policyVersion: POLICY_VERSION,
    };
  }

  const isHotfix = data.releaseType === 'hotfix';
  const reviewMin = isHotfix ? HOTFIX_REVIEW_MIN : STANDARD_REVIEW_MIN;
  const goMin = isHotfix ? HOTFIX_GO_MIN : STANDARD_GO_MIN;

  if (data.coverage < reviewMin) {
    return {
      decision: 'NO_GO',
      reasons: ['COVERAGE_BELOW_MINIMUM'],
      policyVersion: POLICY_VERSION,
    };
  }

  if (data.coverage < goMin) {
    return {
      decision: 'REVIEW',
      reasons: ['COVERAGE_BELOW_MINIMUM'],
      policyVersion: POLICY_VERSION,
    };
  }

  return {
    decision: 'GO',
    reasons: [],
    policyVersion: POLICY_VERSION,
  };
}

// exported for the /policy endpoint; kept in sync with the checks above
export function getMinimumCoverage(): number {
  return MINIMUM_COVERAGE;
}
