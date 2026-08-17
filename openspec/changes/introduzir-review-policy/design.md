## Context

Current engine in `apps/api/src/services/releaseService.ts` emits only `GO`/`NO_GO` and does not evaluate `security.high` as a blocker.
Public contract in `packages/contracts/src/index.ts` already includes `REVIEW`, and API schemas already allow it.
See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Emit `GO | REVIEW | NO_GO` from policy engine with deterministic rules.
- Treat `security.high > 0` as hard blocker with `HIGH_SECURITY_RISK`.
- Apply coverage bands by `releaseType` with stricter `hotfix` thresholds.
- Preserve request/response HTTP shapes and status codes.
- Keep reason ordering canonical and stable.

**Non-Goals:**
- No endpoint additions or payload shape changes.
- No infrastructure changes (database, queue, external services).
- No dashboard redesign; only behavior reflection through existing API responses.

## Decisions

### Decision 1: Two-phase evaluation (hard blockers first, coverage second)
Use two-phase evaluation inside `evaluateRelease(data)`:
1) Collect hard-blocker reasons.
2) If blockers exist, return `NO_GO` immediately.
3) Otherwise evaluate coverage by `releaseType` and return `GO`, `REVIEW`, or coverage-only `NO_GO`.

Rationale: enforces explicit precedence and simplifies testability.

Alternative considered: evaluate all checks in one pass and derive decision from reason set.
Rejected: increases ambiguity for `REVIEW` semantics and complicates precedence guarantees.

### Decision 2: Threshold constants in `apps/api/src/constants.ts`
Introduce per-type constants:
- `STANDARD_REVIEW_MIN = 70`
- `STANDARD_GO_MIN = 75`
- `HOTFIX_REVIEW_MIN = 75`
- `HOTFIX_GO_MIN = 80`

Keep `MINIMUM_COVERAGE` aligned with the standard GO baseline exposed by `/api/v1/policy`.

Rationale: single source for numeric policy tuning and easier invariant checks.

Alternative considered: inline thresholds in `releaseService.ts`.
Rejected: harder to audit and maintain across policy endpoint/documentation/tests.

### Decision 3: Contract-level reason code extension without schema shape changes
Extend `REASON_CODES` with `HIGH_SECURITY_RISK` in canonical order.
Do not alter request/response object structure.

Rationale: semantic expansion with compatibility preserved.

Alternative considered: introducing new response fields for blocker categories.
Rejected: unnecessary contract expansion for this scope.

### Decision 4: Canonical reason ordering via explicit order map
Sort final `reasons` array using fixed rank map:
1. `COVERAGE_BELOW_MINIMUM`
2. `MANDATORY_TEST_FAILURE`
3. `CRITICAL_SECURITY_VULNERABILITY`
4. `HIGH_SECURITY_RISK`
5. `LINT_ERRORS`

Rationale: deterministic output for tests, API consumers, and statistics consistency.

Alternative considered: preserve insertion order only.
Rejected: fragile under refactors and branching logic changes.

### Decision 5: Repository and statistics remain structurally unchanged
Keep repository behavior (`seed re-evaluation on boot`) and statistics aggregation logic as-is.
Only expected counts/reasons change due to policy semantics.

Rationale: minimal surface change while preserving deterministic history model.

Alternative considered: manual migration of seed decisions.
Rejected: conflicts with current design where seeds are always re-evaluated by active policy.

## Risks / Trade-offs

- [Threshold mismatch between docs/tests/constants] -> Define constants first, then align API tests and `docs/release-policy.md` in same change.
- [Consumer surprise due to new `REVIEW` volume] -> Keep HTTP contract stable and document semantics clearly in release-policy docs.
- [Regression in reason ordering] -> Add unit tests asserting exact order for combined failure cases.
- [Policy endpoint ambiguity for minimum coverage] -> Explicitly define `/api/v1/policy.minimumCoverage` as standard GO baseline.

## Migration Plan

1. Update contract reason codes and policy constants.
2. Add/adjust policy unit tests for hard blockers, coverage bands, and reason ordering.
3. Implement policy engine changes in `evaluateRelease`.
4. Update API tests for `REVIEW` path and statistics expectations.
5. Update `docs/release-policy.md` to match implemented behavior.
6. Run `npm run validate` before merge.

Rollback strategy:
- Revert this change set to restore prior policy semantics (`GO`/`NO_GO` only in engine behavior) without altering endpoint contracts.

## Open Questions

- None.
