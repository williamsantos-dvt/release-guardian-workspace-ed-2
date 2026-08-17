# Instrução — Validação e definição de done

"Done" não é uma opinião do agente. É output de comandos.

## `npm run validate` — 5 camadas

`scripts/validate.mjs` corre, por ordem, e só sai `0` se **todas** passarem:

| # | Camada | O que faz |
|---|---|---|
| 1 | `typecheck` | `tsc --noEmit` em `apps/api` e `apps/dashboard` |
| 2 | `lint` | `eslint .` |
| 3 | `testes` | `vitest run` |
| 4 | `coverage` | `vitest run --coverage` |
| 5 | `smoke funcional` | arranca a API real em `:3199` e exercita-a por HTTP |

O validador **reporta pass/fail sem revelar a causa nem o local**. Quando falha, reproduzir a camada isoladamente (`npm run typecheck`, `npm run lint`, `npm test`) para ver o erro completo.

### O que a camada de smoke exige

1. A API arranca e `GET /health` responde (até 10s de espera).
2. `POST /api/v1/evaluations` com evidência saudável devolve `decision` (string) e `reasons` (array).
3. `POST /api/v1/evaluations` com payload incompleto devolve **400**.
4. `GET /api/v1/evaluations` devolve **≥ 19** entradas (18 da seed + a do smoke).

Ou seja: quebrar a validação por JSON Schema na fronteira, ou a seed, faz falhar o smoke mesmo com os testes verdes.

## Recalcular as contagens da seed após mexer em limiares

A seed é reavaliada a cada boot, logo as contagens agregadas mudam com a policy. Procedimento:

```bash
npm run dev:api                                   # noutro terminal
curl -s localhost:3000/api/v1/statistics           # byDecision e topBlockingReasons reais
curl -s localhost:3000/api/v1/evaluations | head   # histórico
```

Comparar com o que `apps/api/test/api.test.ts` espera e atualizar o teste **com justificação escrita na spec** — a mudança de contagens tem de ser consequência declarada da nova policy, não um ajuste silencioso para o teste passar.

## Demonstração funcional (obrigatória)

Validar pelo caminho de um pipeline real, não só por testes:

```bash
npm run dev                                        # API :3000 + dashboard :5173
npm run simulate:pipeline -- healthy-release
npm run simulate:pipeline -- low-coverage
npm run simulate:pipeline -- critical-security
npm run simulate:pipeline -- incomplete-evidence   # espera-se 400 na fronteira
npm run simulate:pipeline -- hotfix-release
```

Confirmar no dashboard (`http://localhost:5173`): contadores por decisão, avaliação recente no topo, detalhe auditável ao clicar (evidência + razões + policy version). Endpoints executáveis em `http://localhost:3000/docs`.

O simulador sai com código `1` em `NO_GO` e `0` em `GO`/`REVIEW` — é o comportamento de um pipeline real e conta como evidência.

## Regras de reporte

- **Nunca declarar "done", "corrigido" ou "a passar" sem colar o output real do comando.**
- Se uma camada falhou, dizê-lo explicitamente com o output — não resumir como "quase tudo verde".
- Se algo ficou fora de âmbito, declarar o que ficou e porquê.
- Existem testes de avaliação fora do repo (`npm run test:organizer` aponta para um config ausente). Implementar o comportamento correto, não o mínimo que satisfaz os testes locais.
