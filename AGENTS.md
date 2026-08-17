# AGENTS.md — Release Guardian

Projeto: serviço de release readiness consumido por pipelines CI/CD.

## Fonte de verdade

- Este repo foi desenhado com inconsistencias entre docs e implementacao; para mudar comportamento, priorize `apps/api/src/**`, `apps/api/test/**`, `packages/contracts/src/index.ts` e `scripts/validate.mjs`.
- Exemplo real de drift: `docs/release-policy.md` cita cobertura minima 75, mas a implementacao e testes estao em 70 (`apps/api/src/constants.ts`, `apps/api/test/policy.test.ts`).

## Layout que importa

- Monorepo npm workspaces (`apps/*`, `packages/*`); execute comandos a partir do root.
- `apps/api`: Fastify + engine de policy + repositorio em memoria (entrada: `apps/api/src/index.ts`, factory: `apps/api/src/server.ts`).
- `apps/dashboard`: frontend React/Vite, apenas consumidor da API.
- `packages/contracts`: contratos compartilhados (tipos + JSON schema) usados por API, dashboard e simulador.
- `scripts`: automacoes principais (`validate.mjs` e `simulate-pipeline.cjs`).

## Comandos essenciais

- Instalar: `npm install`
- Dev completo: `npm run dev` (API em `:3000` + dashboard em `:5173`)
- Dev focado: `npm run dev:api` e `npm run dev:dashboard`
- Testes: `npm test`; teste unico: `npx vitest run apps/api/test/api.test.ts` (ou outro arquivo)
- Validacao completa: `npm run validate`
- Simular pipeline: `npm run simulate:pipeline -- healthy-release` (cenarios em `examples/*.json`)

## Ordem de validacao (igual ao gate local)

- `npm run typecheck` -> `npm run lint` -> `npm test` -> `npx vitest run --coverage` -> smoke HTTP da API.
- O smoke de `scripts/validate.mjs` exige: `/health` ok, `POST /api/v1/evaluations` valido, payload invalido retornando 400, e historico com seed carregada.

## Regras de implementacao

- Contrato de `POST /api/v1/evaluations` e schemas em `packages/contracts/src/index.ts` sao estaveis; nao mude shape de request/response sem atualizar consumidores e testes.
- Mudancas de policy devem ficar no backend (`apps/api/src/constants.ts` e `apps/api/src/services/releaseService.ts`), nao no dashboard/simulador.
- Historico e deterministico em memoria com 18 seeds (`apps/api/src/seeds/seedData.ts`); alteracoes de policy afetam testes de API e estatisticas.

## Testes e limites atuais

- Vitest do root so inclui `apps/api/test/**/*.test.ts` e `packages/contracts/test/**/*.test.ts`.
- Hoje nao ha testes em `packages/contracts/test`; se criar, use esse path para entrar na suite.

## Workflow do desafio

- Baseline recomendado antes de mudar codigo: `npm test`, `npm run dev`, `GET /health`, Swagger em `/docs`, simulador retornando decisao.
- Use OpenSpec para orientar mudancas (artefatos em `openspec/`), depois implemente e valide com `npm run validate`.
- Entrega do evento: branch `participant/<prefixo-do-email>` e PR para `main` (sem merge durante o hackathon).
