/**
 * Release evaluation service (legacy).
 *
 * Turns pipeline evidence into a deployment decision with reasons.
 * The decision contract is consumed by CI pipelines — treat the response
 * shape as frozen (see packages/contracts).
 */
import type { Decision, ReasonCode, ReleaseEvidence } from '@release-guardian/contracts';
import { COVERAGE_THRESHOLDS, MINIMUM_COVERAGE, POLICY_VERSION, RULE_THRESHOLDS } from '../constants.js';

export interface DecisionResult {
  decision: Decision;
  reasons: string[];
  policyVersion: string;
}

type RuleSeverity = Decision;

interface RuleHit {
  reason: ReasonCode;
  severity: Exclude<RuleSeverity, 'GO'>;
}

type RuleEvaluator = (evidence: ReleaseEvidence) => RuleHit | null;

const coverageRule: RuleEvaluator = (evidence) => {
  const thresholds = COVERAGE_THRESHOLDS[evidence.releaseType];
  if (evidence.coverage < thresholds.noGoBelow) {
    return { reason: 'COVERAGE_BELOW_MINIMUM', severity: 'NO_GO' };
  }

  if (evidence.coverage < thresholds.reviewBelow) {
    return { reason: 'COVERAGE_BELOW_MINIMUM', severity: 'REVIEW' };
  }

  return null;
};

const testsRule: RuleEvaluator = (evidence) => {
  if (evidence.tests.failed >= RULE_THRESHOLDS.testsFailedNoGoFrom) {
    return { reason: 'MANDATORY_TEST_FAILURE', severity: 'NO_GO' };
  }

  return null;
};

const criticalSecurityRule: RuleEvaluator = (evidence) => {
  if (evidence.security.critical >= RULE_THRESHOLDS.securityCriticalNoGoFrom) {
    return { reason: 'CRITICAL_SECURITY_VULNERABILITY', severity: 'NO_GO' };
  }

  return null;
};

const highSecurityRule: RuleEvaluator = (evidence) => {
  if (evidence.security.high >= RULE_THRESHOLDS.securityHighReviewFrom) {
    return { reason: 'HIGH_SECURITY_RISK', severity: 'REVIEW' };
  }

  return null;
};

const lintRule: RuleEvaluator = (evidence) => {
  if (evidence.lintErrors >= RULE_THRESHOLDS.lintErrorsReviewFrom) {
    return { reason: 'LINT_ERRORS', severity: 'REVIEW' };
  }

  return null;
};

const RULES_IN_CANONICAL_ORDER: RuleEvaluator[] = [
  coverageRule,
  testsRule,
  criticalSecurityRule,
  highSecurityRule,
  lintRule,
];

function toDecision(hits: RuleHit[]): Decision {
  if (hits.some((hit) => hit.severity === 'NO_GO')) {
    return 'NO_GO';
  }

  if (hits.some((hit) => hit.severity === 'REVIEW')) {
    return 'REVIEW';
  }

  return 'GO';
}

export function evaluateRelease(data: ReleaseEvidence): DecisionResult {
  const hits = RULES_IN_CANONICAL_ORDER.flatMap((rule) => {
    const hit = rule(data);
    return hit ? [hit] : [];
  });

  return {
    decision: toDecision(hits),
    reasons: hits.map((hit) => hit.reason),
    policyVersion: POLICY_VERSION,
  };
}

// exported for the /policy endpoint; kept in sync with the checks above
export function getMinimumCoverage(): number {
  return MINIMUM_COVERAGE;
}
