## Context

See `proposal.md` for motivation and CR-01 business context. The current runtime policy (1.3.0) uses one coverage model for all release types and treats lint as blocking, which conflicts with CR-01.

## Goals / Non-Goals

**Goals:**
- Implement policy `1.4.0` thresholds differentiated by `releaseType`.
- Keep API schema shape unchanged.
- Implement review-level reasons for `security.high >= 3` and `lintErrors > 0`.
- Preserve deterministic reason ordering and decision precedence.

**Non-Goals:**
- New endpoints, persistence changes, or dashboard-specific custom logic.
- Changes to request/response field structure.

## Decisions

1. **Release-type-aware coverage classifier**
   - Use `releaseType` to set coverage minimum (`70` for `standard`, `65` for `hotfix`) and shared GO threshold (`80`).
   - Rationale: direct mapping from CR-01 tables.

2. **Severity buckets for final decision**
   - `NO_GO` reasons: `COVERAGE_BELOW_MINIMUM`, `MANDATORY_TEST_FAILURE`, `CRITICAL_SECURITY_VULNERABILITY`.
   - `REVIEW` reasons: `COVERAGE_REQUIRES_REVIEW`, `HIGH_SECURITY_RISK`, `LINT_ERRORS`.
   - Decision uses precedence `NO_GO > REVIEW > GO`.

3. **Policy snapshot minimum coverage semantics**
   - Keep `minimumCoverage` as a single numeric value and set it to `65` (hotfix minimum), while docs clarify release-type-specific thresholds.
   - Rationale: preserve contract shape while matching CR-01 direction from facilitator.

4. **Reason taxonomy alignment in shared contracts**
   - Reintroduce `HIGH_SECURITY_RISK` in canonical `REASON_CODES` ordering.
   - Keep `LINT_ERRORS` code name unchanged but adjust policy meaning to review-level.

## Risks / Trade-offs

- **[Risk] Snapshot ambiguity (`minimumCoverage` = 65 while standard minimum is 70)** -> **Mitigation:** explicitly document per-type thresholds in policy docs and spec.
- **[Risk] Seed statistics distribution changes again** -> **Mitigation:** update API statistics test expectations from deterministic seed re-evaluation.
- **[Risk] Drift between docs and constants** -> **Mitigation:** keep constants centralized and update docs/tests in same change.

## Migration Plan

1. Update constants and policy engine logic for release-type-aware thresholds and reason buckets.
2. Update shared reason taxonomy and policy docs.
3. Update unit/API tests and acceptance scenario expectations.
4. Run targeted tests and full `npm run validate`.

Rollback strategy:
- Revert policy constants and decision logic to previous commit; endpoint contracts remain shape-compatible.

## Open Questions

- None.
