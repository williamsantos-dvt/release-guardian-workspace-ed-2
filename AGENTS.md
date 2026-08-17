# AGENTS.md — Release Guardian

Projeto: Release Guardian (servico de release readiness).

## Monorepo Layout

- Node.js >= 20 com npm workspaces; runtime em `apps/api` (API + policy engine), `apps/dashboard` (dashboard React/Vite) e contratos partilhados em `packages/contracts`.
- Entrypoint da API: `apps/api/src/index.ts` chama `buildApp` de `apps/api/src/server.ts`.
- Motor de decisao (release policy): `apps/api/src/services/releaseService.ts` com constantes em `apps/api/src/constants.ts`.
- Contratos e JSON Schemas partilhados (API, dashboard, simulador): `packages/contracts/src/index.ts` e a unica fonte de verdade para shapes de requests/responses.

## Comandos

- Instalar dependencias: `npm install` na raiz (prepara todos os workspaces).
- Dev servers: `npm run dev` (API em `http://localhost:3000` + dashboard em `http://localhost:5173`), ou `npm run dev:api` / `npm run dev:dashboard` para focar num so app.
- Testes (API + contratos): `npm test` para uma execucao unica; `npm run test:watch` para modo watch.
- Teste focado da policy: `npx vitest run apps/api/test/policy.test.ts` ou `npm test -- apps/api/test/policy.test.ts` para iterar so sobre o motor de decisao.
- Typecheck: `npm run typecheck` (TS em `apps/api` e `apps/dashboard`).
- Lint: `npm run lint` usa `eslint.config.mjs` (configuracao legacy-friendly; ver secao de lint).
- Build: `npm run build` constroi primeiro `packages/contracts` e depois `apps/api`; build do dashboard via `npm run build -w apps/dashboard`.
- Simulador de pipeline: `npm run simulate:pipeline -- <cenario>` com `examples/*.json` (`healthy-release`, `low-coverage`, `critical-security`, `incomplete-evidence`, `hotfix-release`); requer API a correr (`npm run dev:api`) ou `GUARDIAN_URL` a apontar para o Guardian.
- Validacao completa: `npm run validate` (gate local em camadas; ver secao seguinte).
- Formatacao: `npm run format` aplica Prettier a todo o repositorio; usa com intencao, evita correr automaticamente em branches partilhadas.
- Nao usar no starter: `npm run test:organizer` referencia `vitest.organizer.config.ts`, que nao existe.

## Validacao (`npm run validate`)

- `npm run validate` e o gate local canonico antes de considerar uma mudanca "done"; nao confies apenas em agentes ou em `npm test`.
- Ordem das camadas na validacao: `npm run typecheck` -> `npm run lint` -> `npm test` -> `npx vitest run --coverage` -> smoke funcional (`scripts/validate.mjs`).
- Smoke funcional: sobe a API com `npx tsx apps/api/src/index.ts` no porto 3199, verifica `GET /health`, testa `POST /api/v1/evaluations` com evidencia saudavel e invalida (espera 201 e 400 respetivamente) e exige que o historico tenha pelo menos 19 avaliacoes (18 seed + 1 smoke).
- Qualquer mudanca na policy ou no repositorio que quebre estas verificacoes e considerada bug; ao alterar comportamento, atualiza codigo, seeds, testes e documentacao em conjunto para manter `npm run validate` a passar.

## Contratos e Fronteira HTTP

- O contrato HTTP de `POST /api/v1/evaluations` esta congelado para consumidores externos; nao alteres request ou response shapes sem atualizar tambem `packages/contracts/src/index.ts`, testes, docs e simulador de pipeline.
- Todos os consumidores (API routes, dashboard, simulador) devem importar tipos e JSON Schemas de `@release-guardian/contracts`; duplicar estes shapes num consumidor e drift de contrato.
- Configuracao Ajv em `apps/api/src/server.ts` desativa coerção de tipos; evidencia invalida ou mal tipada deve falhar com 400 na fronteira HTTP, nao ser "corrigida" dentro do servico.
- O tipo `Decision` e `evaluateResponseSchema` ja incluem `REVIEW`; o motor baseline (`evaluateRelease`) so emite `GO` ou `NO_GO`. Ao evoluir a policy para suportar `REVIEW`, mantem o contrato consistente e ajusta testes, seeds e docs para que dashboard, estatisticas e simulador reflitam o novo comportamento.

## Seeded History e Repositorio em Memoria

- O historico de avaliacoes e em memoria e deterministico: cada arranque da API reavalia a seed evidence de `apps/api/src/seeds/seedData.ts` com a policy atual.
- Seeds definem 18 avaliacoes com `evaluationId` fixos (`EV-0001`..`EV-0018`); `EvaluationRepository` preserva esses IDs e atribui novos a partir de `EV-0019`.
- Testes dependem deste historico: `apps/api/test/api.test.ts` espera 18 avaliacoes em `GET /api/v1/evaluations` (a comecar em `EV-0001`) e estatisticas consistentes em `GET /api/v1/statistics`.
- Qualquer mudanca na policy que altere decisoes para as seeds exige atualizacao coordenada de `apps/api/src/seeds/seedData.ts`, `apps/api/src/services/releaseService.ts`, testes API/policy e `docs/release-policy.md` / `docs/architecture.md`.
- O starter contem divergencias intencionais entre implementacao, testes e documentacao; quando entrarem em conflito, trata codigo + testes como fonte principal e traz a documentacao de volta aos factos.

## Escopo de Testes

- Configuracao Vitest em `vitest.config.ts` inclui apenas `apps/api/test/**/*.test.ts` e `packages/contracts/test/**/*.test.ts`; nao ha testes de dashboard na baseline.
- Testes da API exercitam todos os endpoints publicos, o seeding de historico e as estatisticas; usa-os como protecao de regressao ao alterar policy, repositorio ou contratos.
- Para mudancas na policy, comeca sempre por ajustar `apps/api/test/policy.test.ts`; so depois alinha testes HTTP e seeds.

## Lint e Formatacao

- `eslint.config.mjs` e deliberadamente permissivo para codigo legacy: `@typescript-eslint/no-explicit-any` esta desligado e padroes CommonJS em `scripts/**` e `*.cjs` sao permitidos.
- Evita "apertar" o lint (ativar regras que forcam refactors extensivos) sem motivo explicito; o foco do desafio e a evolucao da policy e dos contratos, nao a reescrita do sistema.
- `.prettierrc` fixa single quotes, ponto e virgula, largura 100 colunas e trailing commas; segue estes defaults ao escrever novo codigo.

## Fluxo com IA (OpenSpec / OpenCode)

- Este repositorio esta desenhado para um fluxo OpenSpec + OpenCode; antes de implementar mudancas de policy, captura a intencao numa mudanca OpenSpec sob `openspec/` e usa-a para guiar a implementacao.
- Usa `docs/openspec-example/README.md` como referencia de forma e profundidade para proposal, design, tasks e specs; a tua mudanca deve atingir nivel semelhante.
- Ao delegar trabalho a agentes, inclui sempre no contexto `apps/api/src/services/releaseService.ts`, `apps/api/src/constants.ts`, `packages/contracts/src/index.ts`, `scripts/validate.mjs`, `scripts/simulate-pipeline.cjs` e os testes de API/policy, para que a IA trabalhe sobre o verdadeiro caminho de decisao e o validador completo.

## Git e PRs

- Trabalha numa branch `participant/<prefixo-do-email>` e abre um PR para `main` (nunca merged durante o evento), conforme o `README.md`.
- Mantem os commits pequenos e relacionaveis a mudanca OpenSpec (spec -> implementacao -> validacao); quando usares agentes, garante que o historico continua audivel e facil de rever contra os artefactos de spec.
