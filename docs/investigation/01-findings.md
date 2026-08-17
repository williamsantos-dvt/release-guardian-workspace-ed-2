# Investigation 01 - Baseline findings

## Scope

This report is read-only analysis of the legacy policy behavior and source-of-truth conflicts, based on executable code, tests, contracts, docs, and simulator examples.

## 1) Exact decision path in `evaluateRelease`

### Function signature and output type

- `evaluateRelease` returns `DecisionResult` with `decision: 'GO' | 'NO_GO'` (no `REVIEW` in engine return type): `apps/api/src/services/releaseService.ts:10`-`apps/api/src/services/releaseService.ts:14`, `apps/api/src/services/releaseService.ts:16`.

### Rule checks and order (as implemented)

Rules are evaluated in this fixed order:

1. Coverage rule: `if (data.coverage < 70) reasons.push('COVERAGE_BELOW_MINIMUM')` at `apps/api/src/services/releaseService.ts:19`-`apps/api/src/services/releaseService.ts:21`.
2. Tests rule: `if (data.tests.failed > 0) reasons.push('MANDATORY_TEST_FAILURE')` at `apps/api/src/services/releaseService.ts:23`-`apps/api/src/services/releaseService.ts:25`.
3. Security rule (critical only): `if (data.security.critical > 0) reasons.push('CRITICAL_SECURITY_VULNERABILITY')` at `apps/api/src/services/releaseService.ts:27`-`apps/api/src/services/releaseService.ts:29`.
4. Lint rule: `if (data.lintErrors > 0) reasons.push('LINT_ERRORS')` at `apps/api/src/services/releaseService.ts:31`-`apps/api/src/services/releaseService.ts:33`.

### Thresholds: literals vs constants

- Coverage threshold in the decision rule is a literal `70`: `apps/api/src/services/releaseService.ts:19`.
- `MINIMUM_COVERAGE = 70` exists as a constant: `apps/api/src/constants.ts:5`.
- `getMinimumCoverage()` returns the constant: `apps/api/src/services/releaseService.ts:60`-`apps/api/src/services/releaseService.ts:61`.
- `/api/v1/policy` exposes `minimumCoverage` via `getMinimumCoverage()`: `apps/api/src/routes/index.ts:24`.

So the rule and constant currently match numerically, but the engine uses a literal while the policy endpoint uses the constant.

### Final decision logic

- Decision starts as `GO`: `apps/api/src/services/releaseService.ts:36`.
- Each reason independently flips decision to `NO_GO`: `apps/api/src/services/releaseService.ts:37`-`apps/api/src/services/releaseService.ts:48`.
- Result contains `policyVersion` from constant: `apps/api/src/services/releaseService.ts:53`, with import at `apps/api/src/services/releaseService.ts:8`.

No branch can produce `REVIEW` in this function.

```text
evaluateRelease(data)
  -> reasons = []
  -> coverage < 70? add COVERAGE_BELOW_MINIMUM
  -> tests.failed > 0? add MANDATORY_TEST_FAILURE
  -> security.critical > 0? add CRITICAL_SECURITY_VULNERABILITY
  -> lintErrors > 0? add LINT_ERRORS
  -> decision = GO
  -> if any of the 4 reasons present: decision = NO_GO
  -> return { decision, reasons, policyVersion }
```

## 2) What tests in `apps/api/test/` guarantee (and what they do NOT)

### Guarantees

### API tests (`apps/api/test/api.test.ts`)

- `GET /health` returns `200` and includes `{ status: 'ok', service: 'release-guardian' }`: `apps/api/test/api.test.ts:24`-`apps/api/test/api.test.ts:29`.
- `GET /api/v1/policy` returns `policyVersion: '1.2.0'`, `minimumCoverage: 70`, and `supportedReleaseTypes: ['standard', 'hotfix']`: `apps/api/test/api.test.ts:32`-`apps/api/test/api.test.ts:40`.
- `POST /api/v1/evaluations` happy path returns `201`, `decision = GO`, no reasons, and `evaluationId` format `EV-\d{4}`: `apps/api/test/api.test.ts:44`-`apps/api/test/api.test.ts:57`.
- Incomplete POST payload (only `releaseId`) returns `400`: `apps/api/test/api.test.ts:59`-`apps/api/test/api.test.ts:66`.
- `GET /api/v1/evaluations` on fresh app has exactly 18 seeded evaluations and starts with `EV-0001`: `apps/api/test/api.test.ts:69`-`apps/api/test/api.test.ts:78`.
- `GET /api/v1/evaluations/:id` returns `200` for `EV-0001` and `404` for unknown ID: `apps/api/test/api.test.ts:82`-`apps/api/test/api.test.ts:92`.
- `GET /api/v1/statistics` baseline is `total = 18`, `byDecision = { GO: 13, REVIEW: 0, NO_GO: 5 }`: `apps/api/test/api.test.ts:95`-`apps/api/test/api.test.ts:104`.

### Policy tests (`apps/api/test/policy.test.ts`)

- Healthy evidence -> `GO` + no reasons: `apps/api/test/policy.test.ts:14`-`apps/api/test/policy.test.ts:18`.
- `coverage: 72` is approved (`GO`): `apps/api/test/policy.test.ts:20`-`apps/api/test/policy.test.ts:23`.
- `coverage: 63` is blocked with `COVERAGE_BELOW_MINIMUM`: `apps/api/test/policy.test.ts:25`-`apps/api/test/policy.test.ts:29`.
- Failed tests block with `MANDATORY_TEST_FAILURE`: `apps/api/test/policy.test.ts:31`-`apps/api/test/policy.test.ts:35`.
- Critical vulns block with `CRITICAL_SECURITY_VULNERABILITY`: `apps/api/test/policy.test.ts:37`-`apps/api/test/policy.test.ts:41`.
- Lint errors block with `LINT_ERRORS`: `apps/api/test/policy.test.ts:43`-`apps/api/test/policy.test.ts:47`.
- Multi-failure case enforces stable reason ordering: `apps/api/test/policy.test.ts:49`-`apps/api/test/policy.test.ts:62`.

### Not covered (relevant gaps)

- No test ensures engine uses `MINIMUM_COVERAGE` constant vs literal `70`; engine currently uses literal (`apps/api/src/services/releaseService.ts:19`) while policy endpoint uses constant (`apps/api/src/services/releaseService.ts:60`-`apps/api/src/services/releaseService.ts:61`, `apps/api/src/routes/index.ts:24`).
- No test for `security.high`-only behavior (e.g. `critical = 0`, `high > 0`).
- No test that can ever assert `REVIEW` output from engine/API; baseline asserts `REVIEW: 0` only in statistics (`apps/api/test/api.test.ts:103`).
- No API test for `topBlockingReasons` payload shape/content despite endpoint computing it at `apps/api/src/routes/index.ts:90`-`apps/api/src/routes/index.ts:93`.
- No API test for `/api/v1/evaluations?limit=...`; current implementation slices with `Number(query.limit) - 1` at `apps/api/src/routes/index.ts:57`.
- No API test for schema edge cases like `coverage: null`; schema requires numeric coverage at `packages/contracts/src/index.ts:106`, while `examples/incomplete-evidence.json` uses `coverage: null` at `examples/incomplete-evidence.json:5`.

## 3) Contradictions across implementation, tests, `docs/release-policy.md`, and `examples/*.json`

## C1 - Coverage threshold: docs say 75, runtime/tests are 70

- Docs say minimum coverage is `75%`: `docs/release-policy.md:22`-`docs/release-policy.md:23`.
- Runtime constant is `70`: `apps/api/src/constants.ts:5`.
- Engine check is literal `< 70`: `apps/api/src/services/releaseService.ts:19`.
- API policy endpoint test expects `minimumCoverage: 70`: `apps/api/test/api.test.ts:38`.
- Policy tests explicitly approve `72` and block `63`: `apps/api/test/policy.test.ts:20`-`apps/api/test/policy.test.ts:29`.

## C2 - `REVIEW` exists in contract/simulator but is not produced by engine

- Contract decision union includes `REVIEW`: `packages/contracts/src/index.ts:10`.
- Response JSON schema allows `REVIEW`: `packages/contracts/src/index.ts:126`.
- Statistics shape includes `REVIEW` via `Decision`: `packages/contracts/src/index.ts:73`-`packages/contracts/src/index.ts:76`.
- Stats route initializes a `REVIEW` bucket: `apps/api/src/routes/index.ts:80`.
- Simulator has explicit `REVIEW` branch: `scripts/simulate-pipeline.cjs:84`-`scripts/simulate-pipeline.cjs:86`.
- Engine return type excludes `REVIEW`: `apps/api/src/services/releaseService.ts:11`.
- Engine logic only sets `GO` or `NO_GO`: `apps/api/src/services/releaseService.ts:36`-`apps/api/src/services/releaseService.ts:48`.
- Baseline stats test expects `REVIEW: 0`: `apps/api/test/api.test.ts:103`.
- Challenge brief confirms current state is GO/NO_GO and REVIEW is to be introduced by policy evolution: `docs/challenge-brief.md:23`.

## C3 - Docs mention `HIGH_SECURITY_RISK` / high vulnerabilities requiring review, but runtime/contract do not

- Docs: high vulns require review with reason `HIGH_SECURITY_RISK`: `docs/release-policy.md:32`-`docs/release-policy.md:33`.
- Contract reason codes do not include `HIGH_SECURITY_RISK`: `packages/contracts/src/index.ts:27`-`packages/contracts/src/index.ts:32`.
- Engine never checks `security.high`; only `security.critical`: `apps/api/src/services/releaseService.ts:27`-`apps/api/src/services/releaseService.ts:29`.
- Seed includes multiple entries with `high > 0` and `critical = 0` (`apps/api/src/seeds/seedData.ts:17`, `apps/api/src/seeds/seedData.ts:19`, `apps/api/src/seeds/seedData.ts:23`, `apps/api/src/seeds/seedData.ts:25`, `apps/api/src/seeds/seedData.ts:27`), but no dedicated high-risk reason exists in output contract.

## C4 - Docs "decisions possible" table vs public contract

- Docs decision table lists only `GO` and `NO_GO`: `docs/release-policy.md:13`-`docs/release-policy.md:17`.
- Contract public type includes `GO | REVIEW | NO_GO`: `packages/contracts/src/index.ts:10`.

## C5 - Examples include intentionally invalid evidence that docs present as scenario fixtures

- `examples/incomplete-evidence.json` has `coverage: null`: `examples/incomplete-evidence.json:5`.
- Contract schema requires `coverage` to be `number` (`0..100`): `packages/contracts/src/index.ts:106`.
- Simulator sends evidence as-is and treats `400` as expected invalid evidence path: `scripts/simulate-pipeline.cjs:52`-`scripts/simulate-pipeline.cjs:68`.

This is not a bug by itself, but it is a deliberate mismatch between "example payload" and schema-valid payload.

## 4) For each contradiction: trusted source and rationale

## C1 (coverage 75 vs 70)

- Trusted source: implementation + tests + constants (`apps/api/src/services/releaseService.ts:19`, `apps/api/src/constants.ts:5`, `apps/api/test/policy.test.ts:20`-`apps/api/test/policy.test.ts:29`, `apps/api/test/api.test.ts:38`).
- Why: executable behavior and automated assertions agree on 70; docs are stale.

## C2 (`REVIEW` in contract but unreachable)

- Trusted source split:
  - Contract truth for allowed API shape: `packages/contracts/src/index.ts:10`, `packages/contracts/src/index.ts:126`.
  - Runtime truth for current behavior: `apps/api/src/services/releaseService.ts:11`, `apps/api/src/services/releaseService.ts:36`-`apps/api/src/services/releaseService.ts:48`.
- Why: contract defines what clients may receive; engine defines what is currently emitted.

## C3 (`HIGH_SECURITY_RISK` in docs)

- Trusted source: contracts + engine + tests (`packages/contracts/src/index.ts:27`-`packages/contracts/src/index.ts:32`, `apps/api/src/services/releaseService.ts:27`-`apps/api/src/services/releaseService.ts:29`, `apps/api/test/policy.test.ts:37`-`apps/api/test/policy.test.ts:41`).
- Why: code and contract omit `HIGH_SECURITY_RISK`; doc appears ahead-of-implementation.

## C4 (docs decisions table missing REVIEW)

- Trusted source: contract for external API shape (`packages/contracts/src/index.ts:10`, `packages/contracts/src/index.ts:126`), plus challenge brief for intended evolution (`docs/challenge-brief.md:23`).
- Why: shared contract is the integration boundary; docs table is inconsistent with it.

## C5 (invalid example payload)

- Trusted source for validity: contract schema (`packages/contracts/src/index.ts:90`-`packages/contracts/src/index.ts:118`, especially `packages/contracts/src/index.ts:106`).
- Why: examples are scenario fixtures; one scenario intentionally exercises HTTP boundary rejection (`scripts/simulate-pipeline.cjs:62`-`scripts/simulate-pipeline.cjs:67`).

## 5) Where `REVIEW` already exists in contract but is unreachable in engine

`REVIEW` already exists here:

- Decision type: `packages/contracts/src/index.ts:10`.
- Evaluate response schema enum: `packages/contracts/src/index.ts:126`.
- Statistics structure (`Record<Decision, number>`): `packages/contracts/src/index.ts:75`.
- Stats route pre-allocates REVIEW counter: `apps/api/src/routes/index.ts:80`.
- Simulator handles REVIEW explicitly: `scripts/simulate-pipeline.cjs:84`-`scripts/simulate-pipeline.cjs:86`.

`REVIEW` is unreachable here:

- Engine output type excludes it: `apps/api/src/services/releaseService.ts:11`.
- Engine transitions only between `GO` and `NO_GO`: `apps/api/src/services/releaseService.ts:36`-`apps/api/src/services/releaseService.ts:48`.
- Repository persists decisions produced by engine (`evaluateRelease`): `apps/api/src/repository/evaluationRepository.ts:23`-`apps/api/src/repository/evaluationRepository.ts:29`.
- Baseline test confirms no review decisions in seed stats: `apps/api/test/api.test.ts:103`.

## Quick baseline conclusion

Executable baseline is coherent around a 70% threshold and binary engine decisions (`GO`/`NO_GO`), while docs contain forward-looking or stale policy statements (75%, `HIGH_SECURITY_RISK`, decisions table without `REVIEW`). Contract already exposes `REVIEW` at the boundary, but the decision engine has no path to emit it yet.

## 6) Riscos para a evolução da policy

### a) O engine lê `data.releaseType` em algum ponto?

Nao. Em `evaluateRelease`, as unicas leituras de `data` sao `coverage`, `tests.failed`, `security.critical` e `lintErrors`: `apps/api/src/services/releaseService.ts:19`-`apps/api/src/services/releaseService.ts:33`.

Implicacao hoje: `standard` e `hotfix` sao tratados de forma identica no motor de decisao. `releaseType` existe no contrato (`packages/contracts/src/index.ts:13`, `packages/contracts/src/index.ts:18`) e na validacao HTTP (`packages/contracts/src/index.ts:96`), e o endpoint de policy anuncia tipos suportados (`apps/api/src/constants.ts:6`, `apps/api/src/routes/index.ts:25`), mas essa informacao nao altera a decisao no engine.

### b) Efeito de adicionar uma quinta atribuicao `decision = 'REVIEW'` depois de `releaseService.ts:48` para `critical > 0 && high > 0`

Se adicionares, apos os `if` atuais, algo como:

```ts
if (data.security.critical > 0 && data.security.high > 0) {
  decision = 'REVIEW';
}
```

entao essa nova atribuicao executa por ultimo e sobrepoe o `NO_GO` definido antes em `apps/api/src/services/releaseService.ts:37`-`apps/api/src/services/releaseService.ts:48`.

Caso concreto EV-0016:

- Seed EV-0016: `coverage: 74`, `failed: 0`, `critical: 1`, `high: 4`, `lintErrors: 12` em `apps/api/src/seeds/seedData.ts:30`.
- Razoes calculadas continuam a ser exatamente `['CRITICAL_SECURITY_VULNERABILITY', 'LINT_ERRORS']` (ordem pelo fluxo de checks): `apps/api/src/services/releaseService.ts:27`-`apps/api/src/services/releaseService.ts:33`.
- Decisao final passa a ser `REVIEW` (override final), nao `NO_GO`.
- `policyVersion` permanece `'1.2.0'`: `apps/api/src/constants.ts:3`, `apps/api/src/services/releaseService.ts:53`.

Efeito agregado no baseline seed (18 entradas): como o repositorio reavalia seeds via engine (`apps/api/src/repository/evaluationRepository.ts:14`-`apps/api/src/repository/evaluationRepository.ts:16`, `apps/api/src/repository/evaluationRepository.ts:23`), o `byDecision` esperado muda de `{ GO: 13, REVIEW: 0, NO_GO: 5 }` para `{ GO: 13, REVIEW: 1, NO_GO: 4 }`.

### c) Tipo de `reasons` nos contracts: `ReasonCode[]` ou `string[]`?

Nos contratos expostos, `reasons` esta tipado como `string[]`, nao `ReasonCode[]`:

- `ReleaseEvaluation.reasons: string[]`: `packages/contracts/src/index.ts:41`.
- `EvaluateResponse.reasons: string[]`: `packages/contracts/src/index.ts:52`.
- No engine, tambem e `string[]`: `apps/api/src/services/releaseService.ts:12`.
- No schema HTTP, `reasons` e array de `string` sem enum de reason codes: `packages/contracts/src/index.ts:127`.

Risco: passam sem deteccao estatica e sem rejeicao de schema valores fora da lista canonica (`REASON_CODES` em `packages/contracts/src/index.ts:27`-`packages/contracts/src/index.ts:32`), incluindo typos (ex.: `CRITICAL_SECURITY_VULNERABLITY`), razoes novas nao versionadas, duplicadas, ou strings arbitrarias.

### d) Que testes existentes quebram inevitavelmente ao introduzir `REVIEW`?

Com a alteracao concreta do ponto (b), o teste que quebra inevitavelmente e:

- `GET /api/v1/statistics` -> `aggregates decisions over the seeded history` em `apps/api/test/api.test.ts:96`-`apps/api/test/api.test.ts:104`.
  - Motivo: o teste fixa `byDecision` como `{ GO: 13, REVIEW: 0, NO_GO: 5 }` em `apps/api/test/api.test.ts:103`.
  - Com EV-0016 a virar `REVIEW`, o valor real passa a `{ GO: 13, REVIEW: 1, NO_GO: 4 }`.

No estado atual dos testes, nao ha outro teste que falhe inevitavelmente so por existir um caminho `REVIEW`. Os testes de policy em `apps/api/test/policy.test.ts:13`-`apps/api/test/policy.test.ts:64` nao usam fixture com `critical > 0 && high > 0`, portanto nao capturam diretamente o caso de override descrito em (b).
