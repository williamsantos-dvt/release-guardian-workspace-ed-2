## Context

Current policy evaluation happens in `apps/api/src/services/releaseService.ts`.
Today it collects reasons and emits only `GO` or `NO_GO`, while the shared
contract (`packages/contracts/src/index.ts`), dashboard, and simulator already
accept `REVIEW` as a valid decision value.

This change is cross-cutting because it touches:
- policy decision logic,
- contract reason set,
- API/statistics expectations from seed re-evaluation,
- tests and release-policy documentation.

See `proposal.md` (Why) for motivation and `specs/release-policy/spec.md` for
behavior requirements.

## Goals / Non-Goals

**Goals:**
- Add a minimal review path: `security.high > 0` with `security.critical == 0`
  yields `REVIEW`.
- Add a coverage review band: coverage `60..79` (inclusive) yields `REVIEW`,
  while coverage `< 60` remains blocking (`NO_GO`).
- Keep existing blocking rules unchanged and with higher precedence than review
  rules.
- Keep HTTP request/response shapes stable while allowing new decision/reason
  values.
- Ensure tests and docs are updated in the same change to avoid drift.

**Non-Goals:**
- No new persistence, queues, or infrastructure.
- No redesign of route structure or dashboard data model.
- No new review criteria beyond high-security and coverage-band rules for this increment.

## Decisions

1. Decision derivation by severity tiers
- Decision: classify reasons into `blocking` and `review` tiers.
- Rule: `NO_GO` if any blocking reason exists; else `REVIEW` if any review
  reason exists; else `GO`.
- Rationale: makes precedence explicit and easy to extend with future review
  reasons.
- Alternative considered: sequential hard-coded `if` checks only.
  Rejected because precedence becomes fragile as more rules are added.

2. Add `HIGH_SECURITY_RISK` as explicit reason code
- Decision: extend canonical reason set with `HIGH_SECURITY_RISK`.
- Rationale: keeps review outcomes auditable and consistent across API,
  statistics, and dashboard reason lists.
- Alternative considered: infer review solely from `decision` without a reason.
  Rejected because it weakens explainability and breaks reason-based insights.

3. Use explicit coverage bands
- Decision: define coverage ranges as:
  - `< 60` => blocking reason `COVERAGE_BELOW_MINIMUM` => `NO_GO`
  - `60..79` => review reason `COVERAGE_REQUIRES_REVIEW` => `REVIEW`
  - `>= 80` => no coverage reason
- Rationale: matches the requested policy behavior and provides clear boundaries
  for future evolution.
- Alternative considered: keep a single threshold and infer review implicitly.
  Rejected because it is ambiguous and hard to test at boundaries.

4. Reuse existing seed re-evaluation model
- Decision: do not change repository/seed architecture; rely on startup
  re-evaluation to produce new decision counts.
- Rationale: current repository behavior is deterministic and already tested.
- Alternative considered: precompute and persist decisions in seed data.
  Rejected because it duplicates policy logic and increases drift risk.

## Risks / Trade-offs

- [Stats expectation drift after policy update] -> Recompute expected
  `byDecision` counts from seed evidence and update API tests in the same PR.
- [Boundary regressions around 59/60/79/80] -> Add explicit unit and API test
  scenarios for these values.
- [Docs becoming stale again] -> Update `docs/release-policy.md` alongside code
  and tests, and keep `AGENTS.md` source-of-truth guidance.
- [Reason ordering regressions] -> Keep a canonical-order unit test covering
  mixed blocking and review reasons.
- [Future rule growth adds complexity] -> Keep tier-based decision derivation so
  new rules map to tiers without changing API contracts.

## Migration Plan

1. Update contracts/reason list and policy engine logic.
2. Update unit tests for decision and reason ordering.
3. Update API tests for seed statistics and review scenarios.
4. Update release policy documentation to match executable behavior.
5. Run `npm run validate` before merge.

Rollback strategy:
- Revert this change set atomically (engine + tests + docs) to restore previous
  GO/NO_GO-only behavior.
