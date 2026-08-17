## Porque

O change request CR-01 introduz thresholds de cobertura diferentes para
`standard` e `hotfix` para reduzir bloqueios desnecessarios em hotfixes sem
enfraquecer as regras de seguranca e testes.

Referencia oficial: `docs/change-requests/cr-01-hotfix-policy.md`.

## O que muda

- Cobertura passa a depender de `releaseType`:
  - standard: `<70` NO_GO, `70-79.99` REVIEW, `>=80` sem restricao de coverage
  - hotfix: `<65` NO_GO, `65-79.99` REVIEW, `>=80` sem restricao de coverage
- `security.high` passa a sinalizar review apenas quando `>= 3`.
- `lintErrors > 0` passa a produzir `REVIEW` (na ausencia de blockers).
- Precedencia mantida: `NO_GO > REVIEW > GO`.
- Contrato HTTP inalterado.

## Escopo

Inclui:

- Atualizacao do motor de policy em `apps/api/src/services/releaseService.ts`
- Atualizacao de testes (`policy.test.ts`, `api.test.ts`)
- Atualizacao de docs de policy
- Ajuste/validacao de exemplos do simulador

Nao inclui:

- Novos endpoints
- Nova persistencia
- Alteracoes de UI
- Mudanca de shape da API principal

## Capacidades

### Capacidades Modificadas

- `release-policy`: thresholds por tipo de release e novas condicoes de review
