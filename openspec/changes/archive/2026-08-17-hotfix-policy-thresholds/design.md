## Context

See `proposal.md` for motivation. The policy engine currently evaluates coverage with a single minimum across release types. This change introduces per-release-type coverage thresholds focused on `hotfix`, while preserving contract shape, decision precedence, and canonical reason ordering.

## Goals / Non-Goals

**Goals:**
- Parameterize coverage thresholds by `releaseType` with `hotfix` minimum coverage at 65.
- Keep `standard` threshold behavior unchanged.
- Preserve existing precedence (`NO_GO > REVIEW > GO`) and reason ordering.
- Keep `POST /api/v1/evaluations` request/response contract unchanged.
- Keep simulator and tests aligned with the new hotfix behavior.

**Non-Goals:**
- No schema/type changes in `packages/contracts/src/index.ts`.
- No new endpoints, persistence, dependencies, or dashboard-only implementation.
- No remediation of unrelated baseline divergences (pagination bug, dead code, organizer test gap).

## Decisions

### Decision 1: Use a release-type threshold map in constants
- **Choice:** Define thresholds in `apps/api/src/constants.ts` as a release-type keyed structure (same threshold model, parameterized by `releaseType`).
- **Rationale:** Avoids hard-coded literals in the engine and keeps `GET /api/v1/policy` consistent with runtime decisions.
- **Alternative considered:** Keep branching literals in `releaseService.ts`. Rejected due to drift risk (D-01/D-02 pattern).

### Decision 2: Keep decision derivation as band selection + precedence overrides
- **Choice:** `evaluateRelease` first derives a coverage band decision based on selected thresholds, then applies higher-precedence blockers/review signals without changing reason order.
- **Rationale:** Preserves existing operational semantics while introducing hotfix-specific leniency only where requested.
- **Alternative considered:** Split separate decision engines by release type. Rejected as unnecessary duplication and higher maintenance risk.

### Decision 3: Preserve seed determinism and expose migration explicitly
- **Choice:** Keep seed entries unchanged and let repository re-evaluate them under the new policy; update expected aggregate counts and scenario assertions.
- **Rationale:** Matches current architecture and keeps historical simulation deterministic.
- **Alternative considered:** Freeze old seed decisions and bypass re-evaluation. Rejected because it diverges from repository behavior.

## Risks / Trade-offs

- **[Partial threshold migration]** Updating service without policy snapshot/docs can mislead operators → **Mitigation:** update constants, service, policy endpoint expectations, and docs together.
- **[Aggregate test breakage]** Seed re-evaluation changes `byDecision` counts → **Mitigation:** update API tests and validation script expectations with explicit moved IDs.
- **[Precedence regression]** New hotfix branch can accidentally bypass blocker precedence → **Mitigation:** add focused policy tests for override scenarios.

## Migration Plan

1. Introduce release-type threshold constants in `apps/api/src/constants.ts` and adjust `POLICY_VERSION`.
2. Update `apps/api/src/services/releaseService.ts` to select thresholds by `releaseType` and preserve precedence and reason ordering.
3. Align `apps/api/src/routes/index.ts` policy snapshot output with the new threshold source.
4. Update policy tests, API aggregate tests, and simulator expectations for `hotfix-release`.
5. Update `docs/release-policy.md` with hotfix-specific thresholds.
6. Validate end-to-end with `npm run validate` and `npm run simulate:pipeline -- hotfix-release`.

## Open Questions

- Nenhuma no âmbito deste change: o capability path e os limiares de hotfix foram definidos (`release-policy/hotfix`, `NO_GO < 65`, `REVIEW >= 65 && < 80`, `GO >= 80`).
