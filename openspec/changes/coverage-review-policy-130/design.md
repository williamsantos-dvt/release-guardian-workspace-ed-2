## Context

See `proposal.md` (Why) for motivation. The Release Guardian API already exposes a decision contract that allows `GO`, `REVIEW`, and `NO_GO`, but the runtime policy engine previously emitted only `GO` or `NO_GO`. Coverage logic was also hardcoded in the engine, while policy constants and policy docs had drift risk.

This change introduces policy `1.3.0` coverage bands and must preserve HTTP schema shape compatibility for pipeline and dashboard consumers.

## Goals / Non-Goals

**Goals:**
- Emit `REVIEW` using coverage only in policy `1.3.0`.
- Keep existing `NO_GO` blockers unchanged (failed tests, critical vulnerabilities, lint errors).
- Preserve response shape compatibility for `POST /api/v1/evaluations`.
- Keep decision reasons stable and ordered, with a dedicated coverage-review reason code.
- Align policy docs and automated tests with implemented behavior.

**Non-Goals:**
- Introduce security-high-driven `REVIEW` behavior (deferred to later feature).
- Redesign endpoint contracts, payload schema, or repository model.
- Add persistence or dashboard-only custom behavior.

## Decisions

1. **Coverage thresholds encoded as constants**
   - Decision: set `MINIMUM_COVERAGE = 60` and add `GO_COVERAGE = 80` in API constants.
   - Rationale: avoids magic numbers in the policy engine and makes `/api/v1/policy` semantics explicit.
   - Alternative considered: keep hardcoded thresholds in `releaseService.ts`.
   - Why not chosen: harder to maintain and easier to drift from docs/tests.

2. **Severity-first decision resolution**
   - Decision: compute reasons first, then resolve decision by precedence (`NO_GO` > `REVIEW` > `GO`).
   - Rationale: predictable behavior when review and blocking reasons coexist.
   - Alternative considered: branch by coverage first and override later.
   - Why not chosen: increases branching complexity and weakens explainability for mixed conditions.

3. **Dedicated review reason for coverage band**
   - Decision: add `COVERAGE_REQUIRES_REVIEW` to shared reason taxonomy.
   - Rationale: separates soft-gate audit semantics from blocking coverage semantics (`COVERAGE_BELOW_MINIMUM`).
   - Alternative considered: reuse `COVERAGE_BELOW_MINIMUM` for both review and block.
   - Why not chosen: ambiguous audit trail and weaker downstream reporting.

4. **No contract-shape changes**
   - Decision: keep request/response schemas unchanged and only evolve decision outcomes and reason values.
   - Rationale: endpoint shape is consumed by CI pipelines and dashboard and is contract-frozen.
   - Alternative considered: add new fields to indicate review severity.
   - Why not chosen: unnecessary breaking risk for consumers.

## Risks / Trade-offs

- **[Risk] Behavior shift for historical seed outcomes** -> **Mitigation:** update API statistics tests and document expected distribution (`GO: 10`, `REVIEW: 5`, `NO_GO: 3`).
- **[Risk] Teams may expect security-high to trigger REVIEW now** -> **Mitigation:** document explicit non-goal in policy docs and spec for 1.3.0.
- **[Trade-off] More reason codes increase maintenance surface** -> **Mitigation:** keep canonical ordering centralized in shared contracts and verify through tests.

## Migration Plan

1. Update constants and policy engine behavior.
2. Add shared reason code and align reason ordering.
3. Update policy reference documentation.
4. Update unit/API tests for new thresholds, `REVIEW` outcomes, and seed statistics.
5. Run `npm run validate` and confirm full pipeline pass.

Rollback strategy:
- Revert to policy `1.2.0` constants and prior evaluation logic if regression is detected; API contract shape remains unchanged so rollback is low risk.

## Open Questions

- None for this scoped change. Security-high REVIEW policy remains intentionally deferred.
