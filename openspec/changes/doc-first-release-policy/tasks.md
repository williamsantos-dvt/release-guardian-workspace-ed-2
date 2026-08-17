## 1. Policy and contract updates

- [x] 1.1 Raise minimum coverage to 75 and update policy version constants
- [x] 1.2 Add `HIGH_SECURITY_RISK` to shared reason codes in `@release-guardian/contracts`
- [x] 1.3 Update `evaluateRelease` to emit `GO`/`REVIEW`/`NO_GO` with canonical reason ordering

## 2. Test and seed alignment

- [x] 2.1 Update policy tests for coverage 75 threshold and review semantics
- [x] 2.2 Update API tests for policy snapshot and seeded statistics after policy changes
- [x] 2.3 Verify seeded history expectations remain deterministic with IDs `EV-0001`..`EV-0018`

## 3. Documentation and simulator alignment

- [x] 3.1 Update release policy docs to match implemented behavior and reason ordering
- [x] 3.2 Update architecture docs where decision behavior is described
- [x] 3.3 Verify simulator scenarios/messages remain coherent for `GO`/`REVIEW`/`NO_GO`

## 4. Validation

- [x] 4.1 Run focused tests for policy and API changes
- [x] 4.2 Run full validation gate (`npm run validate`) and resolve regressions
