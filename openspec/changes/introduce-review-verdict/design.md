## Context

See `proposal.md` for motivation. CR-01 introduces an additional constraint after initial planning: coverage gating now depends on `releaseType`, with a lower NO_GO threshold for hotfixes to reduce emergency mitigation delays while preserving safety gates.

## Goals / Non-Goals

**Goals:**
- Introduce a deterministic tri-state verdict model with explicit precedence.
- Classify reason codes into blocking and review tiers using CR-01 thresholds (`security.high >= 3` and `lintErrors > 0` as review-tier; tests/critical as blocking).
- Apply coverage decision bands per `releaseType` (`standard` vs `hotfix`) with a shared review band up to `< 80`.
- Preserve existing HTTP payload shapes while evolving policy behavior.
- Ensure consistent behavior across policy evaluation, seeded history re-evaluation, API responses, statistics, simulator output, and docs.

**Non-Goals:**
- Changing endpoint shapes or introducing new endpoints.
- Adding persistence or infrastructure components.
- Refactoring unrelated modules outside verdict semantics and verification.

## Decisions

### Decision 1: Use reason-tier classification (Option B)
- Decision: Model each policy reason as either `blocking` or `review`, then derive decision by precedence: `NO_GO > REVIEW > GO`.
- Rationale: This cleanly supports the current `REVIEW` requirement and future policy expansions without repeatedly rewriting decision branching logic.
- Alternatives considered:
  - Inline conditional patches for each rule (quick but brittle).
  - Fully external policy DSL/config (too heavy for current scope).

### Decision 2: Evaluate coverage with release-type-specific bands
- Decision: Coverage evaluation computes a coverage tier from `(releaseType, coverage)`:
  - `standard`: `< 70 => blocking`, `70-79.99 => review`, `>= 80 => none`
  - `hotfix`: `< 65 => blocking`, `65-79.99 => review`, `>= 80 => none`
- Rationale: Implements CR-01 exactly and keeps coverage policy explicit and testable.
- Alternatives considered:
  - Single global coverage threshold (rejected by CR-01 requirements).

### Decision 3: Keep canonical reason list independent from final decision
- Decision: Report all applicable reasons in canonical order even when a blocking reason determines final decision.
- Rationale: Preserves audit trace clarity and avoids hiding secondary risk signals.
- Alternatives considered:
  - Emit only reasons that match the final decision tier (simpler, but loses diagnostic context).

### Decision 4: Preserve contract shape and activate existing REVIEW compatibility
- Decision: Keep request/response schemas and endpoint shapes unchanged; only evolve decision semantics and reason set expectations.
- Rationale: Existing consumers already model `REVIEW`, so compatibility risk is primarily behavioral, not structural.
- Alternatives considered:
  - Contract revision with explicit reason categories in payload (useful long-term, unnecessary for this change).

### Decision 5: Verify behavior through matrix tests and end-to-end observable outputs
- Decision: Expand policy and API tests around decision tier precedence, mixed reasons, and statistics aggregation.
- Rationale: The key risk is semantic drift between policy engine, docs, and observable outputs; matrix testing is the fastest guardrail.
- Alternatives considered:
  - Only updating unit tests or only updating smoke path (insufficient coverage of cross-surface consistency).

## Risks / Trade-offs

- [Risk] Existing seed expectations and scenario fixtures may shift due to release-type coverage thresholds. -> Mitigation: update seed-based assertions and simulator scenarios in the same change.
- [Risk] Documentation may drift again if policy logic changes without doc updates. -> Mitigation: include docs alignment as a required task and verification checkpoint.
- [Risk] Canonical reason ordering can break tests if updated ad hoc. -> Mitigation: centralize reason ordering in one policy source and assert ordering in tests.

## Migration Plan

1. Implement release-type coverage band evaluation and CR-01 gate thresholds.
2. Update reason-tier mapping (`lintErrors > 0` as review, `security.high >= 3` as review).
3. Update contract-adjacent assertions (policy tests, API tests, seed/statistics expectations, simulator scenarios).
4. Align policy docs to the same percentages and precedence semantics.
5. Run validation pipeline and simulator checks to confirm `GO`, `REVIEW`, and `NO_GO` paths, including CR-01 acceptance.

Rollback strategy:
- Revert to previous binary mapping by restoring baseline policy evaluation behavior and previous test/doc expectations if regressions are found.

## Open Questions

- None blocking for planning.
