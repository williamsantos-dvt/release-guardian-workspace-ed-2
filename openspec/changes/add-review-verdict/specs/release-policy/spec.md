## ADDED Requirements

### Requirement: Standard coverage thresholds with REVIEW band

Quando o tipo de release e `standard` (`ReleaseEvidence.releaseType = 'standard'`, ver `packages/contracts/src/index.ts:18`):

1. **Coverage abaixo de 70% bloqueia (`NO_GO`)**
   - Se `coverage < 70`, e nao ha falhas de schema, a decisao final DEVE ser `NO_GO` por cobertura.
   - A razao `COVERAGE_BELOW_MINIMUM` DEVE ser incluida em `reasons` e aparecer antes de quaisquer outras razoes (`REASON_CODES` em `packages/contracts/src/index.ts:27`-`packages/contracts/src/index.ts:32`).
   - Teste: `it('blocks standard coverage below the minimum')` em `apps/api/test/policy.test.ts` (novo caso para `releaseType: 'standard', coverage: 69`).

2. **Coverage entre 70 e 79.99% resulta em `REVIEW` se nao houver razoes `NO_GO`**
   - Se `70 <= coverage < 80`, `releaseType = 'standard'`, e nao ha motivos de `NO_GO` (sem `MANDATORY_TEST_FAILURE`, `CRITICAL_SECURITY_VULNERABILITY` ou coverage abaixo dos thresholds), a decisao final DEVE ser `REVIEW`.
   - Nenhuma razao de cobertura DEVE ser considerada “bloqueante”; apenas razoes de `REVIEW` adicionais (lint, high vulns) podem ser incluidas.
   - Teste: `it('puts standard releases with mid coverage into REVIEW when otherwise healthy')` em `apps/api/test/policy.test.ts` com evidencia `coverage: 72`, sem falhas nem vulns.

3. **Coverage >= 80% nao impoe restricoes de cobertura**
   - Se `coverage >= 80` e nao ha outros motivos de `NO_GO` ou `REVIEW`, a decisao final DEVE ser `GO`.
   - Teste: `it('approves healthy standard release above 80% coverage')` em `apps/api/test/policy.test.ts`.

### Requirement: Hotfix coverage thresholds with REVIEW band

Quando o tipo de release e `hotfix` (`ReleaseEvidence.releaseType = 'hotfix'`):

4. **Coverage abaixo de 65% bloqueia (`NO_GO`)**
   - Se `coverage < 65`, a decisao final DEVE ser `NO_GO` por cobertura.
   - `COVERAGE_BELOW_MINIMUM` DEVE ser incluida em `reasons`, mesmo que `MINIMUM_COVERAGE` permaneca 70 como valor canonico exposto via `/api/v1/policy` (ver `apps/api/src/constants.ts:5`, `apps/api/src/services/releaseService.ts:60`-`apps/api/src/services/releaseService.ts:61`).
   - Teste: `it('blocks hotfix coverage below 65')` em `apps/api/test/policy.test.ts` com evidencia `releaseType: 'hotfix', coverage: 60`.

5. **Coverage entre 65 e 79.99% em hotfix resulta em `REVIEW` quando saudavel**
   - Se `65 <= coverage < 80`, `releaseType = 'hotfix'`, e nao ha motivos de `NO_GO`, a decisao final DEVE ser `REVIEW`.
   - Teste de aceitacao: `it('evaluates canonical hotfix-release scenario as REVIEW')` em `apps/api/test/policy.test.ts`, usando `examples/hotfix-release.json` como evidencia (`examples/hotfix-release.json:1`-`examples/hotfix-release.json:8`).

6. **Coverage >= 80% em hotfix nao impoe restricoes de cobertura**
   - Se `coverage >= 80` e nao ha outros motivos de `NO_GO` ou `REVIEW`, a decisao final DEVE ser `GO`.
   - Teste: `it('approves hotfix with high coverage when otherwise healthy')` em `apps/api/test/policy.test.ts`.

### Requirement: Precedencia `NO_GO > REVIEW > GO`

7. **Critical e mandatory tests continuam sempre `NO_GO`**
   - Independentemente de coverage ou tipo de release, se `security.critical > 0` ou `tests.failed > 0`, a decisao final DEVE ser `NO_GO`.
   - Razoes correspondentes (`CRITICAL_SECURITY_VULNERABILITY`, `MANDATORY_TEST_FAILURE`) DEVE aparecer antes de quaisquer razoes de `REVIEW` (lint, high).
   - Teste:
     - `it('keeps NO_GO precedence when critical vulnerabilities are present even in REVIEW coverage band')` em `apps/api/test/policy.test.ts`.
     - `it('keeps NO_GO precedence when mandatory tests fail even in REVIEW coverage band')` em `apps/api/test/policy.test.ts`.

8. **High vulnerabilities e lint erros produzem `REVIEW` quando nao ha motivos de `NO_GO`**
   - Se `security.high >= 3` e nao ha motivos de `NO_GO`, a decisao DEVE ser `REVIEW`.
   - Se `lintErrors > 0` e nao ha motivos de `NO_GO`, a decisao DEVE ser `REVIEW`.
   - Razoes associadas (incluindo eventual `HIGH_SECURITY_RISK` se adicionada a `REASON_CODES`) DEVE ser devolvidas na ordem canonica.
   - Teste:
     - `it('puts releases with many high vulnerabilities into REVIEW when otherwise healthy')` em `apps/api/test/policy.test.ts`.
     - `it('puts releases with lint errors into REVIEW when otherwise healthy')` em `apps/api/test/policy.test.ts`.

9. **Combinacoes de `NO_GO` e `REVIEW` respeitam precedencia**
   - Quando coverage esta na faixa de `REVIEW`, mas existem tambem motivos de `NO_GO` (critical ou mandatory tests), a decisao final DEVE ser `NO_GO`, com todas as razoes devolvidas (`COVERAGE_BELOW_MINIMUM`, `MANDATORY_TEST_FAILURE`, `CRITICAL_SECURITY_VULNERABILITY`, `LINT_ERRORS`) na ordem definida em `REASON_CODES`.
   - Teste: reutilizar e ajustar o caso multi-falha em `apps/api/test/policy.test.ts:49`-`apps/api/test/policy.test.ts:62`, garantindo que decision e `NO_GO` e ordenacao de razoes se mantem.

### Requirement: Seeds e estatisticas

10. **Seeds reavaliados, `byDecision` recalculado**
    - `SEED_EVALUATIONS` mantem 18 entradas (`apps/api/src/seeds/seedData.ts:14`-`apps/api/src/seeds/seedData.ts:32`); o construtor do repositorio continua a reavaliar cada seed contra a policy corrente (`apps/api/src/repository/evaluationRepository.ts:13`-`apps/api/src/repository/evaluationRepository.ts:20`).
    - O snapshot `byDecision` exposto por `GET /api/v1/statistics` DEVE ser recalculado sob a nova policy, incluindo contagem de `REVIEW`.
    - Teste: atualizar `it('aggregates decisions over the seeded history')` em `apps/api/test/api.test.ts:95`-`apps/api/test/api.test.ts:104` para esperar o novo `byDecision` (por exemplo, `{ GO: 13, REVIEW: 1, NO_GO: 4 }`, dependendo do impacto em EV-0016, ver `apps/api/src/seeds/seedData.ts:30`).

### Requirement: Contrato e superficies externas

11. **Contrato HTTP permanece imutavel**
    - O shape de request/response de `POST /api/v1/evaluations` nao e alterado (ver `packages/contracts/src/index.ts:47`-`packages/contracts/src/index.ts:55`, `apps/api/src/routes/index.ts:30`-`apps/api/src/routes/index.ts:52`).
    - `Decision` continua a ser `'GO' | 'REVIEW' | 'NO_GO'`, sem novos valores no enum: `packages/contracts/src/index.ts:10`, `packages/contracts/src/index.ts:126`.
    - Teste: smoke functional em `scripts/validate.mjs:31`-`scripts/validate.mjs:96` permanece verde sem ajuste de formato, apenas com novas decisoes possiveis (REVIEW).

12. **Dashboard e simulador nao sao alterados**
    - `apps/dashboard/**` e `scripts/simulate-pipeline.cjs` nao recebem alteracoes; estes consumidores ja suportam `REVIEW` (`scripts/simulate-pipeline.cjs:82`-`scripts/simulate-pipeline.cjs:87`).
    - Teste: manual / demo funcional atraves de `npm run simulate:pipeline -- hotfix-release` (`docs/change-requests/cr-01-hotfix-policy.md:59`-`docs/change-requests/cr-01-hotfix-policy.md:61`).

## Assumptions

- `MINIMUM_COVERAGE` continua a representar o threshold canonico para `standard` (`apps/api/src/constants.ts:5`), enquanto thresholds especificos para `hotfix` sao implementados na logica do motor sem alterar o contrato de `/api/v1/policy`.
- `HIGH_SECURITY_RISK` so sera introduzido em `REASON_CODES` se a equipa decidir explicitamente, com testes dedicados; caso contrario, razoes atuais serao usadas para representar vulnerabilidades `high`.
