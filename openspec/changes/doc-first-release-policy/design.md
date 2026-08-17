## Context

Current runtime behavior diverges from documented policy: implementation enforces coverage >= 70 and does not emit `REVIEW`, while docs define coverage >= 75 and describe manual review for high security risk. The API contract already supports `GO`/`REVIEW`/`NO_GO`, and dashboard/simulator already render `REVIEW`.

## Goals / Non-Goals

**Goals:**
- Align policy threshold with documentation by enforcing coverage >= 75.
- Introduce deterministic `REVIEW` handling for `security.high > 0` when `security.critical === 0`.
- Preserve frozen HTTP request/response shapes and keep strict boundary validation.
- Keep seeded history deterministic and update tests/docs to match runtime facts.

**Non-Goals:**
- No endpoint shape changes for `POST /api/v1/evaluations`.
- No persistence-layer redesign (repository remains in-memory).
- No dashboard feature redesign beyond consuming updated API outcomes.

## Decisions

### Decision 1: Coverage is a hard blocking gate at 75
- **Choice:** change minimum coverage from 70 to 75; coverage below 75 always blocks.
- **Rationale:** directly resolves code-vs-doc mismatch and sets clear quality baseline.
- **Alternatives considered:**
  - Keep 70 (rejected: keeps mismatch and weakens docs trust).
  - Introduce coverage review band (rejected for this change to keep doc-first behavior explicit).

### Decision 2: High security risk maps to `REVIEW`
- **Choice:** when `critical === 0` and `high > 0`, emit `HIGH_SECURITY_RISK` and decision `REVIEW` unless blocked by stronger reasons.
- **Rationale:** enables intended three-state policy without softening critical blockers.
- **Alternatives considered:**
  - Ignore `high` (rejected: contract and docs expectations not met).
  - Block on all `high` findings (rejected: too strict for intended review flow).

### Decision 3: Deterministic reason ordering includes new review reason
- **Choice:** canonical reason order becomes coverage, tests, critical, lint, high-risk.
- **Rationale:** keeps API/policy tests stable and avoids nondeterministic stats/UI behavior.
- **Alternatives considered:** dynamic ordering by severity (rejected: harder to reason about and test).

### Decision 4: Update shared contracts and tests in lockstep
- **Choice:** add `HIGH_SECURITY_RISK` to shared reason codes and update policy/API tests and seed-driven statistics together.
- **Rationale:** avoids contract drift across API, dashboard, simulator, and test suite.
- **Alternatives considered:** local-only reason constant in API (rejected: violates shared-contract boundary).

## Risks / Trade-offs

- **[Risk]** Raising coverage threshold to 75 changes seeded outcomes and may reduce GO count. -> **Mitigation:** update seed-based tests and docs together; validate with full `npm run validate`.
- **[Risk]** Adding a new reason code can break consumers expecting old reason set. -> **Mitigation:** keep response shape unchanged and rely on existing flexible reason array handling.
- **[Risk]** Review logic could accidentally be bypassed when blockers exist. -> **Mitigation:** explicit decision composition order and policy tests for mixed-reason cases.
- **[Risk]** Documentation may drift again after implementation. -> **Mitigation:** update `docs/release-policy.md` and `docs/architecture.md` in the same change and assert behavior through API tests.

## Migration Plan

1. Update shared reason code list and policy constants.
2. Update decision engine to support review composition and canonical ordering.
3. Update policy and API tests to new thresholds/decisions/statistics.
4. Update docs and simulator expectations where wording depends on decisions.
5. Run full validation gate (`npm run validate`) before completion.

Rollback strategy: revert policy/contract/test/doc updates as a single unit to restore prior threshold and two-state behavior.
