## Why

Emergency hotfixes need to reach production quickly during incidents. Today the Release Guardian treats `hotfix` releases exactly like `standard` releases, enforcing a single coverage threshold of 70% and emitting only `GO` or `NO_GO`. That behavior is too coarse:

- A `hotfix` with coverage 67% and no other risks is currently `NO_GO` (`COVERAGE_BELOW_MINIMUM`), delaying mitigation with little added safety. The change request CR-01 formaliza a necessidade de **thresholds de cobertura distintos por tipo de release** (ver `docs/change-requests/cr-01-hotfix-policy.md:18`-`docs/change-requests/cr-01-hotfix-policy.md:34`).
- The public contract ja suporta `REVIEW` (`Decision = 'GO' | 'REVIEW' | 'NO_GO'` em `packages/contracts/src/index.ts:10`), o dashboard e o simulador ja entendem REVIEW (`scripts/simulate-pipeline.cjs:82`-`scripts/simulate-pipeline.cjs:87`), mas o motor de decisao nunca emite esta decisao (`apps/api/src/services/releaseService.ts:10`-`apps/api/src/services/releaseService.ts:12`, `apps/api/src/services/releaseService.ts:36`-`apps/api/src/services/releaseService.ts:48`).

Ao mesmo tempo, a politica de seguranca nao pode ser relaxada: vulnerabilidades `critical` e falhas de testes mandatorios precisam de continuar a bloquear (`NO_GO`), com precedencia bem definida sobre qualquer regra de `REVIEW`. A seccao **Invariantes da Release Policy** em `AGENTS.md:71`-`AGENTS.md:79` fixa que:

- `NO_GO` tem precedencia sobre `REVIEW` e `GO`.
- Seeds (`apps/api/src/seeds/seedData.ts`) e snapshots (`apps/api/test/api.test.ts:96`-`apps/api/test/api.test.ts:104`) tem de ser recalculados a partir da nova policy, nunca “corrigidos” mexendo em dados.
- O contrato HTTP de `POST /api/v1/evaluations` e imutavel.

## What

Esta mudanca introduz `REVIEW` como veredito intermedio na Release Guardian policy, com thresholds de cobertura distintos para `standard` e `hotfix`, e formaliza a precedencia `NO_GO > REVIEW > GO`:

1. **Cobertura `standard`** (inteiramente alinhado com CR-01):
   - `< 70` -> `NO_GO` por cobertura (mantendo `COVERAGE_BELOW_MINIMUM`).
   - `70 – 79.99` -> `REVIEW` por cobertura (sem bloquear deployment automaticamente).
   - `>= 80` -> nenhuma restricao de cobertura (continua a ser `GO` se nao houver outras razoes).

2. **Cobertura `hotfix`** (novo, por CR-01):
   - `< 65` -> `NO_GO` por cobertura.
   - `65 – 79.99` -> `REVIEW` por cobertura.
   - `>= 80` -> sem restricao de cobertura.

3. **Regras que nao mudam** (apenas formalizadas no motor e em testes):
   - Vulnerabilidades `critical > 0` permanecem sempre `NO_GO`: `apps/api/src/services/releaseService.ts:27`-`apps/api/src/services/releaseService.ts:29`, reforcado por `apps/api/test/policy.test.ts:37`-`apps/api/test/policy.test.ts:41`.
   - Testes mandatorios falhados (`tests.failed > 0`) permanecem sempre `NO_GO`: `apps/api/src/services/releaseService.ts:23`-`apps/api/src/services/releaseService.ts:25`, `apps/api/test/policy.test.ts:31`-`apps/api/test/policy.test.ts:35`.
   - Vulnerabilidades `high` passam a seguir CR-01:
     - `high >= 3` -> `REVIEW` (nova implementacao coerente com `docs/release-policy.md:32`-`docs/release-policy.md:33` e CR-01:40).
   - Erros de lint (`lintErrors > 0`) -> `REVIEW`: alinhamento com CR-01:41 e futuramente com docs.

4. **Precedencia formal**:
   - `NO_GO` tem precedencia sobre `REVIEW`: qualquer evidencia com `MANDATORY_TEST_FAILURE` ou `CRITICAL_SECURITY_VULNERABILITY` termina em `NO_GO`, mesmo que thresholds de cobertura ou regras de lint/vulnerabilidades `high` sugerissem `REVIEW`. Isto reforca a invariancia em `AGENTS.md:74`.

5. **Seeds e estatisticas**:
   - Seeds permanecem com 18 entradas (`apps/api/src/seeds/seedData.ts:14`-`apps/api/src/seeds/seedData.ts:32`), sem adicionar nem remover linhas; o motor reavalia sempre o seed (`apps/api/src/repository/evaluationRepository.ts:13`-`apps/api/src/repository/evaluationRepository.ts:20`).
   - O snapshot `byDecision` em `apps/api/test/api.test.ts:95`-`apps/api/test/api.test.ts:104` e recalculado a partir da nova policy (esperando agora `REVIEW > 0`), nunca “ajustado” mexendo em seeds ou afinando a regra artificialmente.

6. **Contrato e superficies externas**:
   - Nenhuma mudanca ao contrato HTTP de `POST /api/v1/evaluations` (`packages/contracts/src/index.ts:47`-`packages/contracts/src/index.ts:55`).
   - Nenhuma mudanca em `apps/dashboard/**` nem em `scripts/simulate-pipeline.cjs` (invariantes em `AGENTS.md:78`).
   - O simulador continua a consumir a API e a exibir `REVIEW` naturalmente (`scripts/simulate-pipeline.cjs:82`-`scripts/simulate-pipeline.cjs:87`).

## Scope

Incluido:

- Policy engine em `apps/api/src/services/releaseService.ts` (extracao do literal 70 para `MINIMUM_COVERAGE` e novos thresholds por tipo de release).
- Tests unitarios de policy em `apps/api/test/policy.test.ts`.
- Tests de API e estatisticas em `apps/api/test/api.test.ts` (recalcular `byDecision`).
- Documentacao da release policy (`docs/release-policy.md`) e ligacao ao change request (`docs/change-requests/cr-01-hotfix-policy.md`).

Explicitamente excluido:

- Qualquer alteracao ao contrato HTTP ou aos schemas em `packages/contracts/src/index.ts`.
- Qualquer alteracao ao dashboard (`apps/dashboard/**`) ou ao simulador (`scripts/simulate-pipeline.cjs`).
- Persistencia externa ou novos endpoints na API.

## Non-goals

- Nao introduzir novas razoes fora de um eventual `HIGH_SECURITY_RISK` claramente especificado e testado; qualquer expansao de `REASON_CODES` sera feita apenas se a spec o exigir explicitamente.
- Nao alterar os seeds para “encaixar” estatisticas; seeds continuam a representar historico realista, apenas reavaliado pela nova policy.
