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
- Apply CR-01 coverage policy by release type:
  - `standard`: `<70` => `NO_GO`, `70..79.99` => `REVIEW`, `>=80` => no coverage reason.
  - `hotfix`: `<65` => `NO_GO`, `65..79.99` => `REVIEW`, `>=80` => no coverage reason.
- Make high-security review threshold explicit: `security.high >= 3` when
  `security.critical == 0`.
- Treat lint errors (`lintErrors > 0`) as review-level findings.
- Keep blocking precedence (`NO_GO > REVIEW > GO`) explicit and stable.
- Keep HTTP request/response shapes stable while allowing new decision/reason
  values.
- Ensure tests and docs are updated in the same change to avoid drift.

**Non-Goals:**
- No new persistence, queues, or infrastructure.
- No redesign of route structure or dashboard data model.
- No new review criteria beyond CR-01 thresholds/rules for this increment.

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

3. Use release-type-aware coverage bands
- Decision: choose coverage thresholds by `releaseType`.
  - `standard`: `<70` blocking, `70..79.99` review, `>=80` none
  - `hotfix`: `<65` blocking, `65..79.99` review, `>=80` none
- Rationale: this is the exact CR-01 contract and preserves faster hotfix flow
  without relaxing standard releases.
- Alternative considered: keep one global threshold.
  Rejected because it cannot satisfy CR-01 acceptance for hotfix vs standard at
  the same coverage value.

4. Review-tier lint and high-security thresholds
- Decision: classify `LINT_ERRORS` as review-tier and emit `HIGH_SECURITY_RISK`
  only when `security.high >= 3` and `critical == 0`.
- Rationale: aligns rules with CR-01 "unchanged rules" section.
- Alternative considered: keep lint as blocking and high-threshold at `>0`.
  Rejected because it conflicts with CR-01 policy requirements.

5. Reuse existing seed re-evaluation model
- Decision: do not change repository/seed architecture; rely on startup
  re-evaluation to produce new decision counts.
- Rationale: current repository behavior is deterministic and already tested.
- Alternative considered: precompute and persist decisions in seed data.
  Rejected because it duplicates policy logic and increases drift risk.

## Risks / Trade-offs

- [Stats expectation drift after policy update] -> Recompute expected
  `byDecision` counts from seed evidence and update API tests in the same PR.
- [Boundary regressions around release-type thresholds] -> Add explicit unit and
  API test scenarios for `64/65/67/69.99/70/79.99/80` across both release types.
- [Docs becoming stale again] -> Update `docs/release-policy.md` alongside code
  and tests, and keep `AGENTS.md` source-of-truth guidance.
- [Reason ordering regressions] -> Keep a canonical-order unit test covering
  mixed blocking and review reasons.
- [Future rule growth adds complexity] -> Keep tier-based decision derivation so
  new rules map to tiers without changing API contracts.

## Migration Plan

1. Update contracts/reason list and policy engine logic.
2. Update unit tests for decision and reason ordering.
3. Update API tests for release-type coverage thresholds, seed statistics, and review scenarios.
4. Update release policy documentation to match executable behavior.
5. Run `npm run validate` before merge.

Rollback strategy:
- Revert this change set atomically (engine + tests + docs) to restore previous
  GO/NO_GO-only behavior.
