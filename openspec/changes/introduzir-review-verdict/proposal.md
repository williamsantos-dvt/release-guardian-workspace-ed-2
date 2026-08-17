## Porque

O Release Guardian ja possui contrato publico para `GO | REVIEW | NO_GO`, e o
dashboard/simulador ja suportam `REVIEW`, mas o motor de policy ainda decide
apenas entre `GO` e `NO_GO`.

Sem `REVIEW`, o sistema nao diferencia risco intermediario (requer aprovacao
manual) de bloqueio total de release.

## O que muda

- Introduzir o veredito `REVIEW` no motor de policy.
- Manter bloqueios atuais (`NO_GO`) para cobertura, testes, critical e lint.
- Emitir `REVIEW` para vulnerabilidades `high` quando nao houver blockers.
- Alinhar testes, seeds/estatisticas e docs com a nova policy.
- Preservar o contrato HTTP de `POST /api/v1/evaluations`.

## Decisoes de baseline adotadas

- Cobertura minima oficial da mudanca: `70%`.
- `NO_GO` continua a ter prioridade maxima.
- `REVIEW` ocorre apenas sem blockers e com `security.high > 0`.
- `releaseType` (`standard`/`hotfix`) nao altera regra de decisao.

## Escopo

Inclui:

- `apps/api/src/services/releaseService.ts`
- `apps/api/test/policy.test.ts`
- `apps/api/test/api.test.ts`
- `docs/release-policy.md`
- Ajustes esperados em distribuicao de estatisticas pela reavaliacao dos seeds

Nao inclui:

- Alteracao de shape de request/response da API
- Novas dependencias externas
- Persistencia externa (DB/Redis/etc.)
- Implementacao de policy no dashboard ou no simulador

## Capacidades

### Novas Capacidades

- `release-policy`: decisao de release com terceiro veredito (`REVIEW`).

### Capacidades Modificadas

- `release-policy`: regras de decisao e semantica de risco intermediario.
