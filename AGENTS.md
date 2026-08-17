# AGENTS.md — Release Guardian

Projeto: Release Guardian (serviço interno de release readiness usado por pipelines CI/CD).

## Contexto e Arquitetura

- Monorepo npm workspaces: `apps/*`, `packages/*`, `scripts/`, `examples/`, `docs/`, `openspec/`.
- API Fastify (`apps/api`):
  - Entry point: `apps/api/src/index.ts` (usa `buildApp` em `apps/api/src/server.ts`).
  - Rotas em `apps/api/src/routes/index.ts` — expoem `GET /health`, `GET /api/v1/policy`, `POST /api/v1/evaluations`, `GET /api/v1/evaluations`, `GET /api/v1/evaluations/:id`, `GET /api/v1/statistics`.
  - Repositorio em memoria: `apps/api/src/repository/evaluationRepository.ts` com seeds deterministicos em `apps/api/src/seeds/seedData.ts` (18 avaliacoes sempre presentes em cada arranque).
- Policy engine:
  - Servico de decisao: `apps/api/src/services/releaseService.ts`.
  - Constantes de policy: `apps/api/src/constants.ts` (`POLICY_VERSION`, `MINIMUM_COVERAGE`, tipos de release suportados).
- Contratos:
  - Fonte unica de verdade para tipos e JSON Schemas: `packages/contracts/src/index.ts`.
  - Todos os consumidores (API, dashboard, simulador) devem importar contratos a partir daqui para evitar drift.
- Dashboard:
  - React/Vite em `apps/dashboard` — apenas consome a API; nao contem logica de decisao propria.
- Simulador:
  - `scripts/simulate-pipeline.cjs` reproduz o comportamento de um pipeline CI/CD a partir de cenarios `examples/*.json`.

## Setup e Ambiente

- `Node.js >= 20` e `npm >= 10` sao obrigatorios (scripts usam `fetch` nativo e ES modules).
- Instalacao: `npm install` na raiz prepara todos os workspaces.
- Se o baseline falhar, confirmar `docs/setup-checklist.md` antes de investigar problemas de codigo.

## Comandos Uteis

- Desenvolvimento:
  - `npm run dev` — API em `http://localhost:3000` + dashboard em `http://localhost:5173`.
  - `npm run dev:api` — apenas API.
  - `npm run dev:dashboard` — apenas dashboard.
- Build:
  - `npm run build` — build de `packages/contracts` + `apps/api`.
  - `npm run build -w apps/dashboard` — build do dashboard (nao incluido no build root).
- Testes e verificacao:
  - `npm test` — Vitest (`vitest.config.ts` inclui `apps/api/test/**/*.test.ts`).
  - `npm run test:watch` — modo watch.
  - `npm run coverage` — testes com cobertura.
  - `npm run typecheck` — `tsc --noEmit` em API e dashboard.
  - `npm run lint` — ESLint sobre todo o repo.
  - `npm run validate` — validador local em camadas (`scripts/validate.mjs`):

    Sequencia de camadas: 1. typecheck; 2. lint; 3. testes; 4. coverage; 5. smoke funcional contra a API em `http://127.0.0.1:3199`.

- Simulador de pipeline:
  - `npm run simulate:pipeline` — cenario `healthy-release` por defeito.
  - `npm run simulate:pipeline -- <cenario>` — carrega `examples/<cenario>.json` (cenarios existentes: `healthy-release`, `low-coverage`, `critical-security`, `incomplete-evidence`, `hotfix-release`).
  - `GUARDIAN_URL` controla o endpoint da API (por defeito `http://localhost:3000`).

## Contratos e Release Policy

- `POST /api/v1/evaluations`:
  - Request e response sao contrato publico consumido por pipelines e dashboard — **nao alterar forma** sem uma mudanca OpenSpec explicita + atualizacao de contratos + testes + docs.
  - Request: `ReleaseEvidence` com campos obrigatorios `releaseId`, `releaseType`, `tests`, `coverage`, `security`, `lintErrors` (ver JSON Schema `releaseEvidenceSchema` em `packages/contracts/src/index.ts`).
  - Response: `EvaluateResponse` com campos `evaluationId`, `releaseId`, `decision`, `reasons`, `policyVersion`, `evaluatedAt` (ver `evaluateResponseSchema`).
- Decisoes:
  - Tipo de decisao em contratos: `Decision = 'GO' | 'REVIEW' | 'NO_GO'`.
  - Baseline engine (`evaluateRelease`) so emite `GO` ou `NO_GO`; `REVIEW` ja faz parte do contrato e e esperado quando a policy evoluir.
- Razoes:
  - Razoes e ordem canonica estao em `REASON_CODES` em `packages/contracts/src/index.ts`:
    - `COVERAGE_BELOW_MINIMUM`, `MANDATORY_TEST_FAILURE`, `CRITICAL_SECURITY_VULNERABILITY`, `LINT_ERRORS`.
  - `apps/api/test/policy.test.ts` garante esta ordem e a presenca de todas as razoes quando aplicaveis.
- Cobertura minima:
  - Constante `MINIMUM_COVERAGE = 70` em `apps/api/src/constants.ts`.
  - `evaluateRelease` usa actualmente o valor literal 70; testes aprovam cobertura de 72 e bloqueiam 63.
  - `docs/release-policy.md` ainda menciona 75% — em caso de conflito, usar **constants + contratos + testes** como fonte de verdade e so depois alinhar a documentacao.

## Testes, Seed e Validacao

- Testes de API (`apps/api/test/api.test.ts`):
  - Exercitam todos os endpoints principais (`/health`, `/api/v1/policy`, `POST /api/v1/evaluations`, `GET /api/v1/evaluations`, `GET /api/v1/evaluations/:id`, `GET /api/v1/statistics`).
  - Validam que o historico seed tem exactamente 18 avaliacoes e que IDs deterministicos comecam em `EV-0001`.
  - Estatisticas esperadas no baseline: `total = 18`, `byDecision = { GO: 13, REVIEW: 0, NO_GO: 5 }`.
- Seed e repositorio:
  - `SEED_EVALUATIONS` em `apps/api/src/seeds/seedData.ts` define 18 evidencias com decisoes derivadas da policy actual.
  - `EvaluationRepository` reavalia sempre o seed contra a policy corrente em cada arranque; mudar a policy muda decisoes e estatisticas.
  - Alterar policy implica rever: seed, testes de API, testes de policy, exemplos em `examples/*.json` e documentacao.
- Validacao em camadas (`scripts/validate.mjs`):
  - Usa `npm run typecheck`, `npm run lint`, `npm test`, `npx vitest run --coverage` e um smoke funcional que:
    - Sobe a API com `npx tsx apps/api/src/index.ts` em `PORT=3199`.
    - Confirma que `GET /health` e `POST /api/v1/evaluations` respondem com formatos esperados.
    - Espera `400` para evidencia incompleta.
    - Garante que o historico apos avaliacao tem pelo menos 19 entradas.
  - `npm run validate` e o gate principal de readiness — qualquer mudanca relevante deve passar aqui antes de ser considerada “done”.

## Simulador de Pipeline

- O simulador (`scripts/simulate-pipeline.cjs`) e o caminho recomendado para observar o impacto da policy como um pipeline real:
  - Le `examples/<cenario>.json` e imprime as “etapas” (Build, Testes, Cobertura, Seguranca, Lint).
  - Envia evidencia para `POST /api/v1/evaluations` na API (`GUARDIAN_URL` ou `http://localhost:3000`).
  - Reporta decisao (`GO`, `REVIEW`, `NO_GO`) e razoes, com codigos em linha com `REASON_CODES`.
- Ao introduzir novos cenarios, adicionar ficheiros JSON em `examples/` e usa-los com `npm run simulate:pipeline -- <nome-do-ficheiro-sem-.json>`.

## OpenSpec e OpenCode

- Este repositorio e pensado para um fluxo **spec-driven**:
  - Configuracao base em `openspec/config.yaml`.
  - Exemplo completo de artefactos OpenSpec em `docs/openspec-example/` (proposal, design, tasks, spec).
- Antes de alterar a policy, engine ou contratos:
  - Criar ou actualizar uma mudanca OpenSpec sob `openspec/` (proposal, specs, design, tasks).
  - Usar os skills OpenSpec do OpenCode (`openspec-new-change`, `openspec-apply-change`, `openspec-verify-change`, etc.) para guiar Plan/Build.
  - Validar implementacao contra a mudanca OpenSpec e `npm run validate` antes de considerar concluido.

## Git e Entrega

- Branch de trabalho: `participant/<prefixo-do-email>` (parte antes do `@` no email), conforme `README.md` e `docs/setup-checklist.md`.
- Entrega oficial: pull request para `main`, nunca merged durante o evento.
- Commits:
  - Devem tornar visivel o fluxo spec -> implementacao -> validacao.
  - Nao pedir a agentes para “fazer commit” sem antes garantir que `npm run validate` esta a passar e que a mudanca esta alinhada com a OpenSpec.
