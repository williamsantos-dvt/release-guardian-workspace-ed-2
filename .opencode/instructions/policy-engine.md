# Instrução — Motor de policy

Contexto obrigatório para qualquer trabalho que toque na decisão de release.

## Onde está o quê

- **Motor:** `apps/api/src/services/releaseService.ts` → `evaluateRelease(data)`.
- **Limiares e versão:** `apps/api/src/constants.ts` (`MINIMUM_COVERAGE`, `POLICY_VERSION`, `SUPPORTED_RELEASE_TYPES`).
- **Contrato (tipos, JSON Schemas, `REASON_CODES`):** `packages/contracts/src/index.ts`.
- **Exposição da policy:** `GET /api/v1/policy` em `apps/api/src/routes/index.ts`, que lê `getMinimumCoverage()` de `releaseService.ts`.

## Como funciona hoje (baseline)

1. `evaluateRelease` recebe a evidência e acumula `reasons` numa ordem fixa de escrita: cobertura → testes → critical → lint.
2. A decisão é derivada **depois**, por uma escada de `if`s que atribui `NO_GO` a cada razão presente. Efetivamente: **qualquer razão ⇒ `NO_GO`**; sem razões ⇒ `GO`.
3. Não existe hoje nenhum ponto de extensão para um veredito intermédio — a escada de `if`s trata todas as razões como bloqueantes com o mesmo peso.
4. `data` está tipado como `any` (o tipo `ReleaseEvidence` existe e não é usado no motor).
5. `vulnerabilidades high` (`data.security.high`) **não são lidas** pelo motor, apesar de fazerem parte da evidência e da documentação.

A ordem canónica das razões é a de `REASON_CODES` em `packages/contracts` e está fixada por teste (`policy.test.ts`, "returns all applicable reasons in a stable order"). Qualquer razão nova tem de ser inserida nessa lista na posição correta.

## Onde a evidência é avaliada (duas vezes)

- `routes/index.ts` chama `evaluateRelease(evidence)` para construir a resposta;
- `evaluationRepository.save()` chama `evaluateRelease(evidence)` outra vez para persistir.

Consequência: o motor tem de ser **puro e determinístico**. Nada de estado, contadores ou timestamps lá dentro.

## Efeito colateral crítico: a seed

`EvaluationRepository` reavalia as 18 evidências de `seeds/seedData.ts` **a cada arranque**, contra a policy corrente. Mexer num limiar muda retroativamente o histórico e, com ele:

- `api.test.ts` → `byDecision` esperado `{ GO: 13, REVIEW: 0, NO_GO: 5 }`;
- `api.test.ts` → `evaluations.length` esperado `18`;
- `scripts/validate.mjs` → histórico `>= 19` após a avaliação de smoke.

**Antes de fechar qualquer alteração de limiares, recalcular as contagens da seed** (ver `validation-and-done.md`). Casos-fronteira já presentes na seed, úteis para raciocinar: `EV-0011` (coverage 76, high 1), `EV-0012` (coverage 72), `EV-0013` (coverage 78.9, high 2), `EV-0014` (coverage 63), `EV-0016` (critical 1, high 4, lint 12), `EV-0018` (hotfix, coverage 67).

## Checklist de coerência (correr mentalmente em toda a evolução de policy)

Uma mudança de policy só está coerente se **todos** estes pontos concordarem:

1. `apps/api/src/constants.ts` — o limiar declarado.
2. `apps/api/src/services/releaseService.ts` — o limiar efetivamente comparado (hoje há um literal no código; não assumir que lê a constante).
3. `getMinimumCoverage()` / `GET /api/v1/policy` — o que a API publica ao dashboard tem de ser o que o motor aplica.
4. `packages/contracts` → `REASON_CODES` e `Decision` — códigos e vereditos usados existem no contrato, na ordem certa.
5. `apps/api/test/policy.test.ts` — casos-fronteira do novo limiar (abaixo, igual, acima).
6. `apps/api/test/api.test.ts` — `minimumCoverage` publicado e contagens agregadas da seed.
7. `docs/release-policy.md` — a referência funcional deixa de divergir.
8. `POLICY_VERSION` — incrementado se o comportamento observável mudou.

## Regras

- Ler/escrever tipos apenas via `@release-guardian/contracts`.
- Não alterar a forma do request nem da resposta de `POST /api/v1/evaluations`.
- Não "arrumar" código adjacente (código morto, `any`, bugs de outros endpoints) dentro de uma tarefa de policy — reportar, não corrigir de passagem.
- Divergências entre fontes: consultar `docs/baseline-findings.md` e a hierarquia de confiança em `AGENTS.md`. Não escolher o valor "certo" sozinho.
