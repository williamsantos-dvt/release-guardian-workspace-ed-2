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
  const reasons: string[] = [];
  const isHotfix = data.releaseType === 'hotfix';
  const reviewMin = isHotfix ? HOTFIX_REVIEW_MIN : STANDARD_REVIEW_MIN;
  const goMin = isHotfix ? HOTFIX_GO_MIN : STANDARD_GO_MIN;

  const coverageBelowGoBand = data.coverage < goMin;
  const coverageBelowReviewBand = data.coverage < reviewMin;
  const hasFailedMandatoryTests = data.tests.failed > 0;
  const hasCriticalVulnerabilities = data.security.critical > 0;
  const hasHighSecurityRisk = data.security.high >= 3;
  const hasLintErrors = data.lintErrors > 0;

  if (coverageBelowGoBand) {
    reasons.push('COVERAGE_BELOW_MINIMUM');
  }

  if (hasFailedMandatoryTests) {
    reasons.push('MANDATORY_TEST_FAILURE');
  }

  if (hasCriticalVulnerabilities) {
    reasons.push('CRITICAL_SECURITY_VULNERABILITY');
  }

  if (hasHighSecurityRisk) {
    reasons.push('HIGH_SECURITY_RISK');
  }

  if (hasLintErrors) {
    reasons.push('LINT_ERRORS');
  }

  const decision = hasFailedMandatoryTests || hasCriticalVulnerabilities || coverageBelowReviewBand
    ? 'NO_GO'
    : coverageBelowGoBand || hasHighSecurityRisk || hasLintErrors
      ? 'REVIEW'
      : 'GO';

  return {
    decision,
    reasons: sortReasons(reasons),
    policyVersion: POLICY_VERSION,
  };
}

// exported for the /policy endpoint; kept in sync with the checks above
export function getMinimumCoverage(): number {
  return MINIMUM_COVERAGE;
}
