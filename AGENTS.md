# AGENTS.md — Release Guardian

Projeto: serviço de release readiness consumido por CI/CD, dashboard e simulador.

## Comandos que importam

- Pré-requisito: Node `>=20` (`package.json` engines).
- Instalar: `npm install`
- Dev completo: `npm run dev` (API Fastify `:3000` + dashboard Vite `:5173`)
- Dev focado: `npm run dev:api` ou `npm run dev:dashboard`
- Testes: `npm test` (Vitest só para `apps/api/test/**/*.test.ts` e `packages/contracts/test/**/*.test.ts`)
- Teste único: `npm test -- apps/api/test/<arquivo>.test.ts`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Coverage: `npm run coverage`
- Validação completa: `npm run validate`
- Simulação de pipeline: `npm run simulate:pipeline -- <cenario>`

## Ordem de verificação local

- Fonte da verdade: `npm run validate` executa `typecheck -> lint -> test -> coverage -> smoke funcional`.
- O smoke sobe API temporária na porta `3199` e valida `/health`, `POST /api/v1/evaluations` (válido e inválido) e histórico seed.

## Estrutura e fronteiras do monorepo

- `apps/api`: onde a lógica de negócio e policy devem ser alteradas.
- `packages/contracts`: tipos e JSON Schemas compartilhados; mudanças de contrato começam aqui.
- `apps/dashboard`: cliente de observação; no desafio, não é área principal de implementação.
- `scripts/validate.mjs` e `scripts/simulate-pipeline.cjs`: usados para validação/demo, não para mover regra de negócio.
- `examples/*.json`: cenários aceitos pelo simulador.

## Invariantes que não podem quebrar

- `packages/contracts/src/index.ts` é a fonte única dos contratos entre API, dashboard e simulador.
- `POST /api/v1/evaluations` é contrato público consumido por pipeline/dashboard; preserve shape de request/response.
- A API usa validação estrita na fronteira HTTP (`coerceTypes: false`): payload inválido deve falhar com `400`, sem coerção.
- Policy atual fica em `apps/api/src/services/releaseService.ts`; evoluções de decisão exigem consistência com `packages/contracts`.

## Detalhes fáceis de errar

- `npm run build` na raiz compila `packages/contracts` e `apps/api`; não gera build do dashboard.
- `npm run simulate:pipeline` usa `GUARDIAN_URL` quando definido; default é `http://localhost:3000`.
- Cenários existentes: `healthy-release`, `low-coverage`, `critical-security`, `review-security`, `incomplete-evidence`, `hotfix-release`.

## Referências úteis

- Visão geral e comandos: `README.md`
- Regras/limites do desafio: `docs/challenge-brief.md`
