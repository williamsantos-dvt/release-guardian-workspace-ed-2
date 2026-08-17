## Context

See `proposal.md` for motivation. This change applies CR-01 policy semantics to the existing release engine without changing the HTTP contract. The policy is currently implemented centrally in `apps/api/src/services/releaseService.ts` and consumed by API routes, in-memory seeded history, dashboard statistics, and the pipeline simulator.

The main technical challenge is to introduce release-type-aware coverage review bands while keeping deterministic decision precedence and reason ordering across runtime behavior and tests.

## Goals / Non-Goals

**Goals:**
- Implement coverage thresholds that depend on `releaseType` (`standard` vs `hotfix`).
- Preserve deterministic precedence (`NO_GO > REVIEW > GO`) across all reasons.
- Keep the main endpoint contract frozen while updating policy behavior, tests, and docs.
- Make canonical scenario `hotfix-release` evaluate to `REVIEW`, while a standard release with the same coverage remains `NO_GO`.

**Non-Goals:**
- No new endpoints, no request/response shape changes, and no persistence redesign.
- No UI redesign in dashboard; UI must reflect backend behavior through existing contracts.
- No broad lint/tooling refactor outside policy-related adjustments.

## Decisions

### Decision 1: Use threshold maps keyed by release type
- **Choice:** model coverage behavior with explicit per-type thresholds in policy logic (standard: block <70, review <80; hotfix: block <65, review <80).
- **Rationale:** keeps CR-01 rules explicit, avoids deeply nested conditionals, and makes future policy changes localized.
- **Alternatives considered:**
  - hardcoding branch-heavy `if/else` checks (rejected: harder to read and maintain);
  - keeping one global threshold (rejected: violates CR-01).

### Decision 2: Split reasons into blocking vs review classes
- **Choice:** keep coverage below blocking threshold, failed tests, and critical vulnerabilities as blocking reasons; treat review-band coverage, high vulnerabilities (>=3), and lint errors as review reasons.
- **Rationale:** directly enforces precedence (`NO_GO > REVIEW > GO`) and clarifies composition logic.
- **Alternatives considered:**
  - decision-by-first-match (rejected: can hide applicable reasons);
  - severity scoring (rejected: unnecessary complexity for current policy).

### Decision 3: Preserve canonical reason ordering independent of decision
- **Choice:** emit all applicable reasons in a fixed order before deriving final decision.
- **Rationale:** deterministic outputs are required for tests, statistics, and simulator readability.
- **Alternatives considered:**
  - output order based on evaluation path (rejected: brittle and order-sensitive drift).

### Decision 4: Recalculate seeded outcomes through existing repository flow
- **Choice:** rely on startup seed re-evaluation (existing repository behavior) and adjust test expectations for statistics accordingly.
- **Rationale:** keeps deterministic seeded IDs and avoids data migration complexity.
- **Alternatives considered:**
  - manually hardcoding seed decisions (rejected: duplicates policy and risks divergence).

## Risks / Trade-offs

- **[Risk]** Policy changes can silently alter seed-based statistics and break API tests. -> **Mitigation:** update policy and API tests together; verify with focused tests plus full `npm run validate`.
- **[Risk]** Ambiguity in review-band reason code naming (coverage review still using `COVERAGE_BELOW_MINIMUM`) may confuse consumers. -> **Mitigation:** document semantics clearly in docs and spec scenarios.
- **[Risk]** If reason ordering drifts, consumers/tests may fail despite correct decisions. -> **Mitigation:** add policy tests asserting both decision and full ordered reasons.
- **[Risk]** CR-01 semantics may conflict with prior policy docs. -> **Mitigation:** update `docs/release-policy.md` and `docs/architecture.md` in the same change.

## Migration Plan

1. Update constants and policy logic for release-type coverage thresholds and review-band handling.
2. Align reason composition and precedence in `evaluateRelease`.
3. Update shared reason-code definitions (if needed by CR-01 semantics).
4. Update policy and API tests, including seeded statistics expectations.
5. Update documentation and verify simulator behavior for `healthy-release`, `low-coverage`, and `hotfix-release` scenarios.
6. Run full local gate (`npm run validate`) before apply completion.

Rollback strategy: revert policy/constants/tests/docs as a unit to restore prior decision behavior.

## Open Questions

- None; CR-01 provides concrete thresholds, precedence, and acceptance scenario.
