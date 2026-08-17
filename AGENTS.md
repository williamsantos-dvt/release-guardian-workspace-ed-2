# AGENTS.md — Release Guardian

## Escopo real

- Monorepo npm workspaces (`apps/*`, `packages/*`), Node `>=20`.
- Implementacao principal: `apps/api` (Fastify + policy engine) e `packages/contracts` (tipos + JSON schemas).
- `apps/dashboard` e `scripts/simulate-pipeline.cjs` sao instrumentos de observacao; no desafio, nao mexer neles sem pedido explicito (`docs/challenge-brief.md`).

## Comandos que importam

- Instalar: `npm install`
- Dev completo: `npm run dev` (API `:3000`, dashboard `:5173`)
- Dev focado: `npm run dev:api` | `npm run dev:dashboard`
- Testes: `npm test`
- Teste unico (Vitest): `npm test -- apps/api/test/policy.test.ts`
- Typecheck: `npm run typecheck` (API + dashboard)
- Lint: `npm run lint`
- Validacao completa: `npm run validate`
- Simular pipeline: `npm run simulate:pipeline -- <healthy-release|low-coverage|critical-security|incomplete-evidence|hotfix-release>`

## Fluxo de validacao (fonte: `scripts/validate.mjs`)

- Ordem fixa: `typecheck -> lint -> test -> coverage -> smoke funcional`.
- Smoke sobe API em `PORT=3199`, testa `/health`, faz POST valido/invalido em `/api/v1/evaluations`, e espera historico com pelo menos 19 itens (18 seeds + 1 novo).
- Se alterar seeds ou contrato HTTP, atualizar checks de smoke e testes.

## Arquitetura e pontos de entrada

- Boot API: `apps/api/src/index.ts` -> `buildApp()` em `apps/api/src/server.ts`.
- Rotas HTTP: `apps/api/src/routes/index.ts`.
- Regra de decisao: `apps/api/src/services/releaseService.ts`.
- Persistencia: memoria em `apps/api/src/repository/evaluationRepository.ts`, com seed deterministico `EV-0001..EV-0018` em `apps/api/src/seeds/seedData.ts`.
- Contrato compartilhado e schemas de validacao HTTP: `packages/contracts/src/index.ts`.

## Gotchas verificados

- Ha inconsistencias intencionais entre docs e codigo; priorizar codigo + testes como fonte de verdade.
- Exemplo atual: `docs/release-policy.md` fala em cobertura minima 75 e risco `high`; baseline real (codigo/testes) usa cobertura 70 e nao trata `security.high`.
- O contrato publico ja inclui `REVIEW` (`packages/contracts`), mas a engine baseline em `releaseService.ts` ainda retorna so `GO`/`NO_GO`.
- `npm run test:organizer` referencia `vitest.organizer.config.ts`, arquivo inexistente no repo atual.

## Fluxo de entrega do desafio

- OpenSpec faz parte da entrega: manter `openspec/` atualizado e coerente com implementacao.
- PR deve seguir `.github/pull_request_template.md`, incluindo evidencias de validacao (`npm run validate`).
