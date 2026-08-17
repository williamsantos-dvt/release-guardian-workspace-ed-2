# AGENTS.md — Release Guardian

Serviço interno de **release readiness**. Pipelines CI/CD submetem evidência de qualidade; o Guardian aplica a release policy em vigor e devolve uma decisão auditável.

**O Guardian não produz evidência** — não corre testes nem scans. Só avalia o que recebe.

```text
CI/CD Pipeline ──POST /api/v1/evaluations──▶ Guardian ──▶ GO | REVIEW | NO_GO (+ reasons)
```

É um **sistema legado em produção**. Contém dívida técnica e divergências reais entre implementação, testes e documentação. Antes de alterar comportamento, lê `docs/baseline-findings.md`.

## Mapa do sistema

| Caminho | Responsabilidade |
|---|---|
| `apps/api/src/routes/index.ts` | Todos os endpoints HTTP. Validação por JSON Schema na fronteira. |
| `apps/api/src/services/releaseService.ts` | **Motor de decisão** (`evaluateRelease`). É aqui que a policy vive. |
| `apps/api/src/constants.ts` | `POLICY_VERSION`, `MINIMUM_COVERAGE`, `SUPPORTED_RELEASE_TYPES`. |
| `apps/api/src/repository/evaluationRepository.ts` | Histórico em memória. Reavalia a seed a cada boot. |
| `apps/api/src/seeds/seedData.ts` | 18 evidências seed (`EV-0001..EV-0018`), determinísticas. |
| `apps/api/src/server.ts` | Fábrica da app Fastify (usada pelo entrypoint e pelos testes via `inject`). |
| `packages/contracts/src/index.ts` | **Contrato partilhado**: tipos + JSON Schemas + `REASON_CODES`. Fonte de verdade. |
| `apps/api/test/policy.test.ts` | Testes do motor (unitários, chamam `evaluateRelease` diretamente). |
| `apps/api/test/api.test.ts` | Testes HTTP, incluindo contagens agregadas da seed. |
| `scripts/validate.mjs` | Validador local em 5 camadas. |
| `scripts/simulate-pipeline.cjs` | Simulador de pipeline (observação). |
| `apps/dashboard/` | Dashboard React (observação). |

**Caminho de decisão (o que importa):**
`POST /api/v1/evaluations` → `routes/index.ts` valida contra `releaseEvidenceSchema` → `evaluateRelease(evidence)` → `repo.save(evidence)` (que **reavalia** internamente) → resposta.

Nota: a rota chama `evaluateRelease` e o repositório chama-o outra vez dentro de `save`. Qualquer alteração ao motor afeta ambos os caminhos.

## Hierarquia de confiança do contexto

Quando as fontes divergem, esta é a ordem de confiança:

1. **`packages/contracts/src/index.ts`** — contrato congelado, consumido por API, dashboard e simulador.
2. **Comportamento observado em runtime** — `npm run dev:api` + Swagger/simulador. É o que produção faz hoje.
3. **Testes existentes** — descrevem o que o código **faz**, não o que **deveria** fazer. Podem estar a fixar bugs.
4. **`docs/*.md`** — desatualizada em pontos concretos e verificados (ver `docs/baseline-findings.md`).

**Regra para agentes:** ao encontrar uma divergência, **reporta-a e pára** — não escolhas o valor "certo" por iniciativa própria. A resolução é decisão humana, informada pelos requisitos da policy dados pelo facilitador. As divergências já conhecidas estão registadas em `docs/baseline-findings.md`; não é preciso redescobri-las.

## Invariantes (não negociáveis)

- **Contrato de `POST /api/v1/evaluations` congelado** — nem o request (`ReleaseEvidence`) nem a forma da resposta (`EvaluateResponse`) podem mudar. Pipelines em produção dependem deles.
- **`Decision` é `'GO' | 'REVIEW' | 'NO_GO'`** — já definido em `packages/contracts`. Não inventar outros valores nem renomear.
- **`REASON_CODES`** vive em `packages/contracts` e define a **ordem canónica** das razões. Novos códigos entram lá primeiro.
- **Dashboard e simulador são instrumentos de observação, não área de implementação.** Consomem a API; mudanças corretas aparecem lá automaticamente.
- **Sem novas dependências, persistência externa, base de dados ou Docker** sem justificação forte.
- **`evaluationId` no formato `EV-\d{4}`**; a seed mantém-se determinística (18 avaliações, `EV-0001..EV-0018`).
- **Duplicar formas de dados fora de `packages/contracts` é um bug de contract drift.**

## Comandos

| Comando | Para quê |
|---|---|
| `npm run dev` | API (:3000) + dashboard (:5173) |
| `npm run dev:api` / `npm run dev:dashboard` | Individualmente |
| `npm test` | Suite de testes (vitest) |
| `npm run typecheck` | `tsc --noEmit` para api e dashboard |
| `npm run lint` | ESLint |
| `npm run validate` | **Validação completa em 5 camadas** (typecheck → lint → testes → coverage → smoke) |
| `npm run simulate:pipeline -- <cenário>` | `healthy-release`, `low-coverage`, `critical-security`, `incomplete-evidence`, `hotfix-release` |

Swagger executável: `http://localhost:3000/docs`.

## Definição de done

Uma tarefa só está concluída quando:

1. `npm run validate` sai **PASS** nas 5 camadas — com output real colado, não presumido.
2. O comportamento novo é demonstrável pelo caminho de um pipeline real: `npm run simulate:pipeline -- <cenário>` e/ou o formulário do dashboard.
3. A mudança OpenSpec (`openspec/changes/<nome>/`) está coerente com o que foi implementado.
4. Se um teste existente mudou, a razão está escrita na spec — não basta "estava a falhar".

**Aviso:** `package.json` tem `test:organizer`, que aponta para um config ausente no repo — existem testes de avaliação não visíveis localmente. **Não otimizar contra os testes locais**; implementar o comportamento correto.

## Convenções

- TypeScript ESM: imports relativos usam sufixo **`.js`** (`../constants.js`), mesmo em ficheiros `.ts`.
- Importar tipos e schemas de `@release-guardian/contracts`, nunca redeclarar.
- Prosa e documentação em **português**; código, identificadores e comentários em **inglês**.
- Formatação: `npm run format` (prettier). O ESLint é deliberadamente permissivo (`no-explicit-any` off) — isso **não** é licença para introduzir `any` novo.

## Processo

- **OpenSpec antes de código.** Especificar (proposal → spec → design → tasks) e só depois implementar. Ver `docs/openspec-example/` como referência de forma e profundidade.
- **Delegação delimitada.** Templates prontos em `docs/harness/delegation-prompts.md`.
- Branch de trabalho: `participant/fabiocarmo-dvt`. Submissão = PR para `main`, **nunca merged**. Commits incrementais que evidenciem as fases (spec → build → validação).
- **Nunca commitar segredos.** `.opencode/azure.token` contém a chave do modelo e fica fora do git.

Contexto adicional carregado em sessões OpenCode: `.opencode/instructions/*.md`.
