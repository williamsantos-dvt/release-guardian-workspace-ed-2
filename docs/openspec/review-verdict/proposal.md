# Introduzir o veredito REVIEW

## Porquê

O Release Guardian opera numa base legada com evidências divergentes entre documentação, testes e código, e hoje só devolve `GO` ou `NO_GO`. Há cenários em que os pipelines não devem ser bloqueados automaticamente, mas também não devem avançar sem revisão humana (ex.: erros de lint persistentes, cobertura fragilizada, vulnerabilidades high sem critical). O desafio pede que a mudança seja guiada pela investigação e pela OpenSpec: invocamos `/opsx-explore` para mapear as inconsistências e documentamos as decisões antes de delegar.

## O que muda

- Introduzir `REVIEW` como terceiro veredito oficial.
- Definir critérios claros e testáveis que o distanciem de `GO`/`NO_GO`, mapeando para razões específicas (ex.: `COVERAGE_NEEDS_REVIEW`, `HIGH_SECURITY_RISK`).
- Atualizar o policy engine, os contratos partilhados, as rotas estatísticas e o simulador para aceitar e relatar `REVIEW`.
- Manter o contrato de `POST /api/v1/evaluations` estável: a resposta continua com `evaluationId`, `releaseId`, `decision`, `reasons`, `policyVersion`, `evaluatedAt`, apenas `decision` ganha um valor adicional.

## Escopo

Incluído:

- Policy engine (`apps/api/src/services/releaseService.ts` + `apps/api/src/constants.ts`).
- Contratos e JSON Schemas (`packages/contracts`).
- Rotas `/api/v1/policy`, `/api/v1/statistics`, `/api/v1/evaluations`.
- Simulador + `examples/*.json` para exercitar `REVIEW`.
- Documentação de policy (`docs/release-policy.md`, `docs/architecture.md`).
- Harness para agentes (AGENTS.md, notas de baseline, comandos de validação).

Excluído:

- Introduzir persistência externa, bases de dados ou dependências novas sem justificação explícita.
- Reescrever o dashboard (consome apenas a API; pode reagir a `REVIEW` sem mudanças no backend, exceto se os dados mudarem). 

## Critérios de sucesso

- `npm test`, `npm run coverage` e `npm run validate` passam nos critérios definidos (typecheck, lint, testes, coverage, smoke funcional).
- Cenários em `examples/*.json` e novos casos do simulador refletem `GO`, `REVIEW`, `NO_GO` conforme a spec.
- Documentação (`docs/release-policy.md`, `docs/architecture.md`) deixa claro o papel de `REVIEW`.
- AGENTS.md/harness explicam a investigação, os comandos e as restrições do desafio.
- O PR final cita a OpenSpec correspondente e mostra evidência do fluxo Plan → Build.
