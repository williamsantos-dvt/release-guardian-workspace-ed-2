## 1. Engine thresholds and precedence

- [ ] 1.1 Extrair o literal `70` em `apps/api/src/services/releaseService.ts:19` para usar `MINIMUM_COVERAGE` de `apps/api/src/constants.ts:5` em checks de coverage `standard`.
- [ ] 1.2 Introduzir logica de thresholds por tipo de release (`standard` vs `hotfix`) dentro de `evaluateRelease` em `apps/api/src/services/releaseService.ts`, sem alterar a assinatura nem o contrato HTTP.
- [ ] 1.3 Implementar calculo de `coverageDecision` (`GO`/`REVIEW`/`NO_GO`) separado de decisoes de seguranca/testes/lint, mantendo `COVERAGE_BELOW_MINIMUM` apenas para casos de `NO_GO`.
- [ ] 1.4 Introduzir flags de precedencia (`hasMandatoryTestsFailure`, `hasCriticalVulnerability`, `hasCoverageBlock`, `hasCoverageReviewBand`, `hasHighVulnerabilitiesReview`, `hasLintReview`) e calcular decisao final com a cadeia `NO_GO > REVIEW > GO`, respeitando invariantes em `AGENTS.md:71`-`AGENTS.md:79`.

## 2. REVIEW signals: high vulnerabilities e lint

- [ ] 2.1 Implementar regra `security.high >= 3` -> `REVIEW` quando nao ha motivos de `NO_GO`, em `apps/api/src/services/releaseService.ts`.
- [ ] 2.2 Assegurar que `lintErrors > 0` produz `REVIEW` quando nao ha `NO_GO`, em vez de `NO_GO`.
- [ ] 2.3 Se a equipa decidir adicionar uma nova razao `HIGH_SECURITY_RISK`, atualizar `REASON_CODES` em `packages/contracts/src/index.ts:27`-`packages/contracts/src/index.ts:32`, e garantir ordenacao canonica e tests para essa nova razao.

## 3. Policy tests (unitarios)

- [ ] 3.1 Adicionar testes de coverage `standard` a `apps/api/test/policy.test.ts`, com nomes claros:
-      - `it('blocks standard coverage below 70')` (63 -> `NO_GO`).
-      - `it('puts standard releases with coverage 70-79.99 into REVIEW when healthy')` (72 -> `REVIEW`).
-      - `it('approves healthy standard release above 80% coverage')` (84 -> `GO`).
- [ ] 3.2 Adicionar testes de coverage `hotfix`:
-      - `it('blocks hotfix coverage below 65')` (60 -> `NO_GO`).
-      - `it('puts hotfix with coverage 65-79.99 into REVIEW when healthy')` (`examples/hotfix-release.json`, 67 -> `REVIEW`).
-      - `it('approves hotfix above 80% coverage when healthy')`.
- [ ] 3.3 Adicionar testes de precedencia:
-      - `it('critical vulnerabilities override coverage REVIEW band to NO_GO')`.
-      - `it('mandatory tests failures override coverage REVIEW band to NO_GO')`.
- [ ] 3.4 Adicionar testes de sinais de `REVIEW`:
-      - `it('puts releases with many high vulnerabilities into REVIEW when otherwise healthy')` (high >=3).
-      - `it('puts releases with lint errors into REVIEW when otherwise healthy')`.

## 4. API tests e estatisticas

- [ ] 4.1 Atualizar `GET /api/v1/statistics` em `apps/api/test/api.test.ts:95`-`apps/api/test/api.test.ts:104` para esperar o novo snapshot `byDecision`, recalculado a partir da nova policy (sem tocar em `SEED_EVALUATIONS` nem estreitar regras).
- [ ] 4.2 Confirmar que `GET /api/v1/evaluations` continua a devolver 18 seeds (`apps/api/test/api.test.ts:69`-`apps/api/test/api.test.ts:78`) e que IDs deterministicos (`EV-0001`..`EV-0018`) permanecem intactos (`apps/api/src/repository/evaluationRepository.ts:16`-`apps/api/src/repository/evaluationRepository.ts:20`).
- [ ] 4.3 Adicionar teste de aceitacao com `examples/hotfix-release.json` em `apps/api/test/policy.test.ts` ou `apps/api/test/api.test.ts` para verificar `REVIEW` no cenario canon descrito em `docs/change-requests/cr-01-hotfix-policy.md:53`-`docs/change-requests/cr-01-hotfix-policy.md:58`.

## 5. Docs (policy e change request)

- [ ] 5.1 Atualizar `docs/release-policy.md` para reflet thresholds por tipo (`standard` vs `hotfix`), veredito `REVIEW`, e precedencia formal `NO_GO > REVIEW > GO`, mantendo alinhamento com contratos e testes (ver `docs/investigation/01-findings.md:128`-`docs/investigation/01-findings.md:131`).
- [ ] 5.2 Ligar explicitamente a mudanca ao CR-01 em `docs/change-requests/cr-01-hotfix-policy.md`, referenciando os testes de aceitacao (hotfix 67% -> `REVIEW`, standard 67% -> `NO_GO`) e apontando para a seccao **Invariantes da Release Policy** em `AGENTS.md`.

## 6. Validation

- [ ] 6.1 Executar `npm run validate`:
-      - `typecheck` garante que nova logica respeita tipos (`apps/api/src/services/releaseService.ts`, `apps/api/test/**/*.test.ts`).
-      - `lint` garante que regras de lint em policy nao introduzem regressoes.
-      - `test` e `coverage` garantem que todos os requisitos da spec tem testes nomeados e verdes.
-      - `smoke funcional` em `scripts/validate.mjs:31`-`scripts/validate.mjs:96` confirma que `POST /api/v1/evaluations` continua a responder com formato imutavel, apenas com novas decisoes (`REVIEW` quando aplicavel).
