## 1. Policy Engine

- [x] 1.1 Update decision logic to use coverage bands (`<70`, `70-79.999...`, `>=80`).
- [x] 1.2 Make decision logic release-type aware for `standard` vs `hotfix` in the 70-79 band.
- [x] 1.3 Emit `REVIEW` for borderline `standard` releases without hard blockers.
- [x] 1.4 Emit `COVERAGE_BELOW_MINIMUM` for all coverage `<80`, while keeping it non-blocking for borderline hotfixes.
- [x] 1.5 Keep canonical reason ordering intact.

## 2. Verification

- [x] 2.1 Update unit tests for policy behavior (`GO`/`REVIEW`/`NO_GO` outcomes and reason order).
- [x] 2.2 Update API tests for policy version and seed decision distribution.
- [x] 2.3 Add integration coverage for `REVIEW` and non-blocking coverage on hotfixes.

## 3. Documentation

- [x] 3.1 Update release policy documentation to Policy v2.0.0.
- [x] 3.2 Document `REVIEW` semantics as blocked pending manual auditable approval.
