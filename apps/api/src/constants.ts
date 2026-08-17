// Release Guardian — runtime constants.
// Values mirrored in docs/release-policy.md (verify when changing).
export const POLICY_VERSION = '1.3.0';
export const SERVICE_VERSION = '1.0.0';
export const STANDARD_REVIEW_MIN = 70;
export const STANDARD_GO_MIN = 75;
export const HOTFIX_REVIEW_MIN = 75;
export const HOTFIX_GO_MIN = 80;
export const MINIMUM_COVERAGE = STANDARD_GO_MIN;
export const SUPPORTED_RELEASE_TYPES = ['standard', 'hotfix'];
