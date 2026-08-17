// Release Guardian — runtime constants.
// Values mirrored in docs/release-policy.md (verify when changing).
export const POLICY_VERSION = '1.4.0';
export const SERVICE_VERSION = '1.0.0';
export const MINIMUM_COVERAGE = 70;
export const COVERAGE_REVIEW_THRESHOLD = 80;
export const COVERAGE_BLOCK_THRESHOLD_BY_RELEASE_TYPE = {
  standard: 70,
  hotfix: 65,
} as const;
export const SUPPORTED_RELEASE_TYPES = ['standard', 'hotfix'];
