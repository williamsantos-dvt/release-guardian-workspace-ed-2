// Release Guardian — runtime constants.
// Values mirrored in docs/release-policy.md (verify when changing).
export const POLICY_VERSION = '1.3.0';
export const SERVICE_VERSION = '1.0.0';
export const SUPPORTED_RELEASE_TYPES = ['standard', 'hotfix'] as const;

export const COVERAGE_THRESHOLDS = {
  standard: { noGoBelow: 70, goFrom: 70 },
  hotfix: { noGoBelow: 65, goFrom: 80 },
} as const;

// Minimum effective coverage floor across supported release types.
export const MINIMUM_COVERAGE = Math.min(
  ...SUPPORTED_RELEASE_TYPES.map((type) => COVERAGE_THRESHOLDS[type].noGoBelow)
);
