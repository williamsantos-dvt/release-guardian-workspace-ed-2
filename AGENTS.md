# AGENTS.md — Release Guardian

Projeto: Release Guardian (serviço interno de release readiness). Pipelines CI
submetem evidências de qualidade; o Guardian aplica a release policy em vigor e
devolve uma decisão auditável: GO / REVIEW / NO_GO.

Este ficheiro tem precedência sobre qualquer outra fonte de contexto do
repositório, incluindo `docs/release-policy.md`.

## Comandos

- Instalar: `npm install`
- Testes: `npm test`
- Validação completa: `npm run validate`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Simulador: `npm run simulate:pipeline -- <cenário>`

## Âmbito congelado

- O contrato HTTP de `POST /api/v1/evaluations` está CONGELADO: não alterar a
  forma do pedido nem da resposta. `packages/contracts` é a única fonte de
  verdade para tipos, enums e JSON Schemas.
- `apps/dashboard/` e `scripts/` são instrumentos de observação, NÃO área de
  implementação. Já suportam REVIEW.
- Sem dependências novas, sem base de dados, sem Docker, sem persistência
  externa.

## Onde vive a lógica

- Motor de decisão: `apps/api/src/services/releaseService.ts` — único local
  onde a decisão é calculada.
- Limiares e versões: `apps/api/src/constants.ts`
- Tipos, enums, JSON Schemas: `packages/contracts/src/index.ts`
- Rotas HTTP: `apps/api/src/routes/index.ts`
- Histórico em memória: `apps/api/src/repository/evaluationRepository.ts`

## Factos verificados do baseline (não re-descobrir)

> Origem: análise estática do código em 2026-08-17, com a divisão de decisões
> dos seeds reproduzida por cálculo. Confirmar com sondas HTTP ao sistema em
> execução antes de delegar implementação.

- O motor decide cobertura com o literal `< 70` e IGNORA a constante
  `MINIMUM_COVERAGE`. O `GET /api/v1/policy` devolve a constante. As duas coisas
  podem divergir em silêncio, e nenhum teste apanha isso.
- `docs/release-policy.md` está desatualizada: diz 75% (o sistema aplica 70) e
  documenta `HIGH_SECURITY_RISK`, que não existe no código nem em
  `REASON_CODES`. A própria doc é incoerente — define a regra na secção de
  Segurança e omite-a na Ordem das razões.
- `REVIEW` já existe no tipo `Decision`, no enum do schema de resposta, no
  contador de estatísticas, no dashboard e no simulador. Só o motor não o emite.
- `EvaluationRepository` RE-AVALIA os 18 seeds em cada arranque. Mudar a policy
  reescreve retroativamente o histórico e as estatísticas.
- Baseline confirmado: `byDecision` = GO 13 / REVIEW 0 / NO_GO 5.

## Regra sobre testes

Se uma mudança de policy fizer falhar um teste existente, NÃO reescrever o teste
para passar. Listar o teste, o valor que assere, e classificar: codifica o
comportamento antigo (atualizar é legítimo) ou revela regressão real (corrigir o
código). Esperar decisão humana antes de alterar qualquer teste.

Testes que dependem da policy atual: `apps/api/test/policy.test.ts` (o caso
"approves coverage of 72") e `apps/api/test/api.test.ts` (minimumCoverage 70 e
byDecision 13/0/5).

## Definição de done

1. `npm run validate` passa nas 5 camadas.
2. Nenhum teste alterado sem justificação escrita no commit.
3. Nenhum literal numérico de policy no motor — só constantes.
4. Comportamento observável no dashboard e via simulador.
