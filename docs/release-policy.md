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

### Cobertura por tipo de release

**STANDARD**

| Cobertura | Decisao |
|---|---|
| `< 70` | `NO_GO` (`COVERAGE_BELOW_MINIMUM`) |
| `70 - 79.99` | `REVIEW` |
| `>= 80` | sem restricao de cobertura |

**HOTFIX**

| Cobertura | Decisao |
|---|---|
| `< 65` | `NO_GO` (`COVERAGE_BELOW_MINIMUM`) |
| `65 - 79.99` | `REVIEW` |
| `>= 80` | sem restricao de cobertura |

### Testes

- Qualquer teste mandatorio falhado bloqueia a release (`MANDATORY_TEST_FAILURE`).

### Seguranca

- Qualquer vulnerabilidade **critical** bloqueia a release (`CRITICAL_SECURITY_VULNERABILITY`).
- Vulnerabilidades **high** (`>= 3`) sem bloqueios resultam em `REVIEW`.

### Lint

- Erros de lint (`> 0`) resultam em `REVIEW` (`LINT_ERRORS`) quando nao existe
  condicao de bloqueio.

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

A policy diferencia `standard` e `hotfix` nos thresholds de cobertura, mantendo
as restantes regras de testes, seguranca e lint.

## Contrato da API

O contrato de `POST /api/v1/evaluations` esta congelado: pipelines em producao
dependem dele. Evolucoes da policy nao podem alterar o pedido nem a forma da
resposta.
