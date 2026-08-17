# Release Guardian - Introducao do veredito REVIEW

## 1) Contexto

O Release Guardian recebe evidencias de qualidade de pipelines CI/CD via `POST /api/v1/evaluations` e devolve uma decisao de readiness para deployment.

No estado atual:

- O contrato publico ja suporta `GO | REVIEW | NO_GO`.
- O simulador e o dashboard ja sabem mostrar `REVIEW`.
- O motor de policy ainda emite apenas `GO` ou `NO_GO`.

Este documento define o baseline atual, a policy alvo com `REVIEW` e como a mudanca deve ser organizada e verificada.

## 2) Baseline atual (fonte: codigo + testes)

### 2.1 Regras atuais do motor

Regra de bloqueio (`NO_GO`) quando existir qualquer um dos pontos abaixo:

- `coverage < 70` -> `COVERAGE_BELOW_MINIMUM`
- `tests.failed > 0` -> `MANDATORY_TEST_FAILURE`
- `security.critical > 0` -> `CRITICAL_SECURITY_VULNERABILITY`
- `lintErrors > 0` -> `LINT_ERRORS`

Sem motivos, a decisao e `GO`.

### 2.2 Observacoes de baseline

- `security.high` nao influencia a decisao no baseline atual.
- `releaseType` (`standard` ou `hotfix`) nao altera a policy.
- O historico seed e reavaliado em cada arranque com a policy corrente.
- Distribuicao atual nos testes de API: `GO=13`, `REVIEW=0`, `NO_GO=5`.

### 2.3 Fronteira HTTP

Payloads invalidos sao rejeitados na validacao JSON Schema com `400 Bad Request`.
Exemplo: `coverage: null` em `incomplete-evidence`.

## 3) Policy alvo com REVIEW

Decisoes desejadas:

- `GO`: sem problemas relevantes.
- `REVIEW`: requer aprovacao manual antes do deployment.
- `NO_GO`: bloqueia deployment automatico.

### 3.1 Regras funcionais propostas

1. Se qualquer condicao de bloqueio ocorrer (`coverage < 70`, falha de testes, `critical > 0`, lint), a decisao e `NO_GO`.
2. Se nao houver bloqueios e `security.high > 0`, a decisao e `REVIEW`.
3. Se nao houver bloqueios nem high risk, a decisao e `GO`.

### 3.2 Prioridade

- `NO_GO` tem prioridade sobre `REVIEW`.
- `REVIEW` so pode ocorrer sem blockers.

### 3.3 Ordem de reasons

Quando houver multiplos blockers, manter ordem estavel:

1. `COVERAGE_BELOW_MINIMUM`
2. `MANDATORY_TEST_FAILURE`
3. `CRITICAL_SECURITY_VULNERABILITY`
4. `LINT_ERRORS`

## 4) OpenSpec: estrutura canonica da mudanca

Change sugerida: `openspec/changes/introduzir-review-verdict/`

Ordem dos artefactos:

1. `proposal.md`
   - Intencao, motivacao e escopo.
2. `specs/release-policy/spec.md`
   - Requisitos verificaveis (GO/REVIEW/NO_GO com condicoes explicitas).
3. `design.md`
   - Decisoes tecnicas e pontos de alteracao.
4. `tasks.md`
   - Tarefas pequenas e delegaveis.

Cada requisito da spec deve mapear para pelo menos um teste/verificacao.

## 5) Harness (AGENTS) - o que incluir

### 5.1 Incluir

- Comandos de validacao: `npm test`, `npm run validate`, `npm run simulate:pipeline -- <cenario>`.
- Restricoes do briefing:
  - sem persistencia externa
  - sem dependencias novas sem justificacao forte
  - dashboard/simulador sao observacao, nao local de policy
  - manter contrato HTTP estavel
- Ponteiros para ficheiros relevantes (nao colar codigo):
  - `apps/api/src/services/releaseService.ts`
  - `apps/api/src/constants.ts`
  - `packages/contracts/src/index.ts`
  - `apps/api/src/repository/evaluationRepository.ts`
  - `apps/api/src/seeds/seedData.ts`
  - `apps/api/test/policy.test.ts`
  - `apps/api/test/api.test.ts`
  - `examples/*.json`
- Estado da baseline e decisoes tomadas.
- Referencia explicita a change OpenSpec como fonte de verdade.

### 5.2 Nao incluir

- Dumps de codigo fonte completo.
- Listas longas de ficheiros irrelevantes.
- Instrucoes vagas sem criterios verificaveis.

## 6) Definicao de done para esta mudanca

Uma implementacao da change so esta concluida quando:

1. `evaluateRelease` emite `GO | REVIEW | NO_GO` conforme a spec.
2. Testes de policy e API cobrem casos de `REVIEW` e prioridade de `NO_GO`.
3. Estatisticas (`/api/v1/statistics`) refletem contagens atualizadas de `REVIEW`.
4. Documentacao de policy esta alinhada com o comportamento implementado.
5. `npm run validate` passa.

## 7) Anti-padroes a evitar

- Assumir que "testes verdes" significa "policy correta" sem verificar intencao de negocio.
- Declarar que "tudo esta obsoleto" sem evidencias.
- Implementar `REVIEW` sem requisitos mensuraveis.
