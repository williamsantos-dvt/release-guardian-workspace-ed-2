// Release Guardian — runtime constants.
// Values mirrored in docs/release-policy.md (verify when changing).
export const POLICY_VERSION = '1.2.0';
export const SERVICE_VERSION = '1.0.0';

export const COVERAGE_THRESHOLDS = {
  standard: { noGoBelow: 70, reviewBelow: 80 },
  hotfix: { noGoBelow: 65, reviewBelow: 80 },
} as const;

export const RULE_THRESHOLDS = {
  testsFailedNoGoFrom: 1,
  securityCriticalNoGoFrom: 1,
  securityHighReviewFrom: 3,
  lintErrorsReviewFrom: 1,
} as const;

export const MINIMUM_COVERAGE = COVERAGE_THRESHOLDS.standard.noGoBelow;
export const SUPPORTED_RELEASE_TYPES = ['standard', 'hotfix'];
