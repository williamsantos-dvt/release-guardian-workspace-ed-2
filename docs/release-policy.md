# Release Policy - Referencia Funcional

> Referencia funcional da release policy do Release Guardian.
> Esta versao esta alinhada com `docs/release-policy-review.md`.

## Visao geral

O Guardian avalia cada submissao de evidencia contra a policy em vigor e devolve
uma decisao auditavel com as razoes aplicaveis.

## Decisoes possiveis

| Decisao | Significado |
|---|---|
| `GO` | Release aprovada para deployment automatico |
| `REVIEW` | Release requer aprovacao manual antes do deployment |
| `NO_GO` | Release bloqueada |

## Regras em vigor

### Cobertura

- **Cobertura minima: 70%.** Cobertura inferior a 70% bloqueia a release
  (`COVERAGE_BELOW_MINIMUM`).

### Testes

- Qualquer teste mandatorio falhado bloqueia a release (`MANDATORY_TEST_FAILURE`).

### Seguranca

- Qualquer vulnerabilidade **critical** bloqueia a release (`CRITICAL_SECURITY_VULNERABILITY`).
- Vulnerabilidades **high** sem bloqueios de cobertura, testes, critical ou lint
  resultam em `REVIEW`.

### Lint

- Erros de lint bloqueiam a release (`LINT_ERRORS`).

## Prioridade de decisao

1. Regras de bloqueio (`NO_GO`) tem prioridade maxima.
2. `REVIEW` so e emitido quando nao existe qualquer bloqueio.
3. `GO` so e emitido quando nao existe bloqueio nem condicao de review.

## Ordem das razoes

Quando varias regras de bloqueio se aplicam, as razoes sao devolvidas na ordem:

1. `COVERAGE_BELOW_MINIMUM`
2. `MANDATORY_TEST_FAILURE`
3. `CRITICAL_SECURITY_VULNERABILITY`
4. `LINT_ERRORS`

## Tipos de release

A policy aplica-se de forma identica a releases `standard` e `hotfix`.

## Contrato da API

O contrato de `POST /api/v1/evaluations` esta congelado: pipelines em producao
dependem dele. Evolucoes da policy nao podem alterar o pedido nem a forma da
resposta.
