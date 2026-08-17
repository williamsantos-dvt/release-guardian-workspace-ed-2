# Release Policy - Referencia Funcional

> Versao atual: **Policy v2.0.0**

## Visao geral

O Guardian avalia evidencias submetidas por pipelines CI/CD e devolve uma
decisao auditavel (`GO`, `REVIEW` ou `NO_GO`) com as razoes aplicaveis.

## Decisoes

| Decisao | Significado operacional |
|---|---|
| `GO` | Release aprovada para deployment |
| `REVIEW` | Release bloqueada ate aprovacao humana manual e auditavel |
| `NO_GO` | Release bloqueada por violacao de regra hard-stop |

## Policy v2.0.0

### Cobertura por bandas e tipo de release

| Cobertura | `standard` | `hotfix` | Razao |
|---|---|---|---|
| `< 70` | `NO_GO` | `NO_GO` | `COVERAGE_BELOW_MINIMUM` (bloqueante) |
| `70-79.999...` | `REVIEW` | `GO` | `COVERAGE_BELOW_MINIMUM` (bloqueante em `standard`, nao bloqueante em `hotfix`) |
| `>= 80` | sem bloqueio de cobertura | sem bloqueio de cobertura | sem razao de cobertura |

### Outros bloqueios hard-stop

- `tests.failed > 0` -> `MANDATORY_TEST_FAILURE` -> `NO_GO`
- `security.critical > 0` -> `CRITICAL_SECURITY_VULNERABILITY` -> `NO_GO`
- `lintErrors > 0` -> `LINT_ERRORS` -> `NO_GO`

Se qualquer hard-stop estiver presente, a decisao final e sempre `NO_GO`, mesmo
quando a cobertura cairia em `REVIEW`.

### Ordem canonica das razoes

As razoes sao sempre devolvidas nesta ordem:

1. `COVERAGE_BELOW_MINIMUM`
2. `MANDATORY_TEST_FAILURE`
3. `CRITICAL_SECURITY_VULNERABILITY`
4. `LINT_ERRORS`

`COVERAGE_BELOW_MINIMUM` pode aparecer tambem em decisoes `GO` (caso de hotfix
na banda 70-79), como sinal de risco nao bloqueante.

## Diferenca v1 vs v2

- **v1**: cobertura `< 70` -> `NO_GO`; cobertura `>= 70` nao influencia; engine
  nao emitia `REVIEW`.
- **v2**: cobertura tiered por banda + `releaseType`; `REVIEW` passa a ser usado
  para `standard` na banda 70-79; hotfix na mesma banda segue `GO` com razao
  nao bloqueante.

## Contrato da API

O contrato de `POST /api/v1/evaluations` permanece congelado em estrutura.
Esta mudanca altera semantica de decisao e uso de razoes, sem mudar o shape da
request/response.
