# Baseline — Divergências Registadas

Levantamento do estado do sistema **antes** de qualquer alteração de comportamento, feito por leitura direta de código, testes e documentação.

**Estas divergências estão registadas, não resolvidas.** A decisão sobre qual fonte é a verdade em cada caso é humana e depende dos requisitos da nova policy. Nenhum agente deve escolher um valor por iniciativa própria — ver a hierarquia de confiança em `AGENTS.md`.

Hierarquia de confiança em uso: **contrato** (`packages/contracts`) > **runtime observado** > **testes** > **documentação**.

## Policy e decisão

### D-01 — Limiar de cobertura: três valores diferentes

| Fonte | Afirma |
|---|---|
| `docs/release-policy.md:22` | mínimo **75%** |
| `apps/api/src/constants.ts:5` | `MINIMUM_COVERAGE = 70` |
| `apps/api/src/services/releaseService.ts:19` | `if (data.coverage < 70)` — literal, ignora a constante |

O comportamento em produção é **70**. A constante existe mas não é usada pelo motor.

**Decisão:** 
O código está funcional e em produção, utilizar código para validar cobertura.
Alterar o hard-coded 70 pela global variable MINIMUM_COVERAGE

### D-02 — `GET /api/v1/policy` pode mentir ao dashboard

`getMinimumCoverage()` (`releaseService.ts:60-62`) devolve `MINIMUM_COVERAGE` e alimenta `GET /api/v1/policy` (`routes/index.ts:24`), que o dashboard mostra como "Cobertura mínima". Hoje coincide com o literal (70) por acidente; qualquer alteração a um sem o outro publica um valor que o motor não aplica.

**Decisão:** 
Corrigido pela policy D-01

### D-03 — `HIGH_SECURITY_RISK` documentado, inexistente no sistema

`docs/release-policy.md:32-33` descreve que qualquer vulnerabilidade **high** exige revisão pela equipa de segurança, com o código `HIGH_SECURITY_RISK`. Esse código **não existe** em `REASON_CODES` (`packages/contracts/src/index.ts:27-32`) e `data.security.high` **nunca é lido** pelo motor. A documentação descreve um comportamento que o sistema não tem.

**Decisão:**
Documentação está extremamente desatualizada, utilizar código para validar segurança.

### D-04 — Documentação omite `REVIEW`, que já é contrato público

`docs/release-policy.md:13-16` lista apenas `GO` e `NO_GO`. Mas `REVIEW` já existe em:
`Decision` (`packages/contracts:10`), `evaluateResponseSchema.decision.enum` (`:126`), `byDecision` (`routes/index.ts:80`), dashboard (`App.tsx:12`) e simulador (`simulate-pipeline.cjs:84`).
O contrato e os consumidores estão prontos; só o motor não emite `REVIEW` — `DecisionResult.decision` está tipado como `'GO' | 'NO_GO'` (`releaseService.ts:11`).

**Decisão:**
NO_GO: < 70
REVIEW: >= 70 and < 80
GO: >= 80

### D-05 — Ordem das razões: doc consistente, mas incompleta face à doc de segurança

`docs/release-policy.md:41-48` define a ordem das razões com 4 códigos, coerente com `REASON_CODES`. Não inclui `HIGH_SECURITY_RISK`, apesar de o mesmo documento o descrever em D-03 — a própria documentação é internamente inconsistente.

**Decisão:**
Documentação está extremamente desatualizada e inconsistente. Utilizar código para validação já que o mesmo está em funcionamente em produção. 
Criar actualizar o not_implemented_yet.md com a feature em falta


### D-06 — Testes fixam o comportamento, não a intenção

`apps/api/test/policy.test.ts:20-23` — "approves coverage of 72" espera `GO`, o que só é verdade com limiar 70. `api.test.ts:36-41` fixa `minimumCoverage: 70`. Os testes documentam o código atual e contradizem a documentação funcional; não são prova de intenção.

**Decisão:**
Utilizar código como fonte de verdade ns testes.


## Estrutura do motor

### D-07 — Sem ponto de extensão para veredito intermédio

`releaseService.ts:36-48` deriva a decisão com quatro `if`s sequenciais, todos a atribuir `NO_GO`. É equivalente a "qualquer razão ⇒ `NO_GO`". Não existe distinção entre razão bloqueante e razão que exige revisão.

**Decisão:**
Futura implmentação para o estado REVIEW


### D-08 — Evidência entra sem tipo

`releaseService.ts:16` — `evaluateRelease(data: any)`, apesar de `ReleaseEvidence` existir no contrato e ser usado na rota (`routes/index.ts:39`). O motor não tem proteção de tipos.

**Decisão:**
Implementar tipagem na função.

### D-09 — Dupla avaliação por request

`routes/index.ts:40` chama `evaluateRelease(evidence)` e `repo.save(evidence)` (`evaluationRepository.ts:44` → `:23`) chama-o outra vez. Funciona porque o motor é puro; deixa de funcionar se alguém introduzir estado.
**Estado: registado — comportamento a preservar.**

## Outros defeitos observados

### D-10 — `?limit=` devolve N-1 itens

`routes/index.ts:57` — `all.slice(0, Number(query.limit) - 1)`. `?limit=5` devolve 4; `?limit=1` devolve 0. Nenhum teste cobre o parâmetro.

**Decisão:**
Implementar testes para validação de limit

### D-11 — Código morto

`apps/api/src/utils.ts` — `formatPercentage` e `deepMerge` não são usados em nenhum ponto do repo (os próprios comentários o admitem).

**Decisão:**
Manter para futura implementação

### D-12 — Seed reavaliada acopla policy a testes

`evaluationRepository.ts:12-20` reavalia as 18 evidências de seed a cada arranque contra a policy corrente. Logo, alterar limiares muda retroativamente o histórico e quebra:
`api.test.ts:103` (`byDecision` = `{ GO: 13, REVIEW: 0, NO_GO: 5 }`), `api.test.ts:76` (18 avaliações) e `scripts/validate.mjs:84` (histórico ≥ 19).
Casos-fronteira na seed: `EV-0011` (76, high 1), `EV-0012` (72), `EV-0013` (78.9, high 2), `EV-0014` (63), `EV-0016` (critical 1, high 4, lint 12), `EV-0018` (hotfix, 67).
**Estado: registado — consequência a declarar em qualquer mudança de limiares.**

### D-13 — Existem testes de avaliação fora do repo

`package.json:25` — `test:organizer` invoca `vitest.organizer.config.ts`, que não existe no repositório. A suite local não é a suite completa de avaliação.
**Estado: registado — não otimizar contra os testes locais.**

### D-14 — Segredo do modelo sem proteção no git

`.opencode/azure.token` existe no working tree, não está tracked **e não está coberto por nenhum `.gitignore`** (`.opencode/.gitignore` ignora `node_modules`, `package.json`, `package-lock.json`, `bun.lock`, `.gitignore`). Risco direto de vazar a chave num commit.
**Estado: mitigado pelo harness (regra em `guardrails.md` + entrada no `.gitignore`).**

## Notas de baseline confirmadas (não são defeitos)

- Tipos de release: `standard` e `hotfix` são tratados de forma idêntica pelo motor — coerente com `docs/release-policy.md:51`.
- `coverage` aceita decimais (`EV-0013` = 78.9) e é validado como `number` 0–100 no schema.
- `incomplete-evidence.json` tem `coverage: null` e é rejeitado com 400 na fronteira (`coerceTypes: false` em `server.ts:15`) — o cenário existe para provar a validação, não para ser avaliado.
- `topBlockingReasons` só conta razões de avaliações com decisão diferente de `GO` (`routes/index.ts:84`).
