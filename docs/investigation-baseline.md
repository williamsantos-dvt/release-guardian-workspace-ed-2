# Investigação de baseline — Release Guardian

- **Branch:** `participant/ricardoparreirafaria`
- **Data:** 2026-08-17
- **Fase:** 1 — investigação e baseline (antes de qualquer alteração de código)

> Nenhum ficheiro de implementação foi alterado durante esta fase. A delegação à
> IA foi feita em modo read-only (`/opsx-explore`, agente `plan` / GPT-5.1),
> cujo contrato proíbe explicitamente escrever código.

---

## 1. Método

Por esta ordem, e deliberadamente:

1. **Baseline verde primeiro.** Estabelecer o estado inicial antes de analisar
   qualquer coisa. Sem isto, não é possível distinguir uma regressão introduzida
   por mim de um defeito pré-existente.
2. **Sondas HTTP ao sistema em execução.** Interrogar o serviço a funcionar em
   valores de fronteira, em vez de inferir comportamento a partir do código.
3. **Delegação read-only à IA.** Pedir análise e relatório, nunca alterações.
4. **Reconciliação.** Cruzar três fontes independentes: as minhas sondas, a
   leitura de código da IA, e as afirmações do harness (`AGENTS.md`).

O ponto 2 é o que sustenta todas as conclusões: o endpoint devolve o que
devolve, e é a única fonte que não pode estar desatualizada.

---

## 2. Baseline

```
npm test              → 2 ficheiros, 15 testes, todos verdes (464ms)
npm run validate      → VALIDAÇÃO COMPLETA: PASS — 5.9s
                        ✓ typecheck  ✓ lint  ✓ testes  ✓ coverage  ✓ smoke funcional
```

O sistema arranca, decide, persiste histórico e alimenta o dashboard. A dívida
técnica existe **sem** quebrar nenhuma verificação automática — o que é
precisamente o problema.

---

## 3. Evidência de runtime (sondas HTTP)

API em `127.0.0.1:3199`, arranque limpo.

```
GET /health
  {"status":"ok","service":"release-guardian","version":"1.0.0"}

GET /api/v1/policy
  {"policyVersion":"1.2.0","minimumCoverage":70,"supportedReleaseTypes":["standard","hotfix"]}

POST /api/v1/evaluations  (tests 10/0, critical 0, lintErrors 0)
  coverage=69  → NO_GO  ["COVERAGE_BELOW_MINIMUM"]
  coverage=70  → GO     []
  coverage=74  → GO     []
  coverage=75  → GO     []

POST /api/v1/evaluations  (coverage 90, critical 0, high 1)
  → GO  []

GET /api/v1/evaluations?limit=5
  → 4 itens

POST /api/v1/evaluations  --data-binary @examples/incomplete-evidence.json
  → HTTP 400

GET /api/v1/statistics  (arranque limpo, sem submissões)
  {"total":18,"byDecision":{"GO":13,"REVIEW":0,"NO_GO":5},
   "topBlockingReasons":[COVERAGE_BELOW_MINIMUM 2, LINT_ERRORS 2,
                         MANDATORY_TEST_FAILURE 2, CRITICAL_SECURITY_VULNERABILITY 1]}
```

**A sonda decisiva é `coverage=74 → GO`.** Se a policy em vigor fosse a
documentada (mínimo 75%), teria de devolver `NO_GO`. Devolveu `GO`. Logo o
limiar efetivamente aplicado em produção é **70**, e a documentação está errada.
Isto é observação do sistema, não interpretação de código.

---

## 4. Achados

### 4.1 Divergências entre fontes

| # | Achado | Evidência | Classificação |
|---|---|---|---|
| 1 | O motor decide cobertura com o literal `< 70` e **ignora** a constante `MINIMUM_COVERAGE`, que importa mas não usa | `releaseService.ts:8,19` · `constants.ts:5` | BUG |
| 2 | `GET /api/v1/policy` devolve a constante, enquanto as decisões usam o literal. Alterar a constante faz a API anunciar um limiar que não aplica, **sem nenhum teste falhar** | `releaseService.ts:60` · `routes/index.ts:24` | BUG |
| 3 | A documentação fixa a cobertura mínima em **75%**; código, testes e runtime aplicam **70%** | `release-policy.md:22` vs `constants.ts:5`, `api.test.ts:38`, sonda `cov=74 → GO` | DOC_DESATUALIZADA |
| 4 | A documentação define a razão `HIGH_SECURITY_RISK`, que **não existe** no código nem em `REASON_CODES` | `release-policy.md:32-33` vs `contracts/src/index.ts:26-32`; sonda `high=1 → GO []` | DOC_DESATUALIZADA |
| 5 | A documentação é **incoerente consigo própria**: define `HIGH_SECURITY_RISK` na secção de Segurança e omite-a na "Ordem das razões" | `release-policy.md:32-33` vs `:44-47` | DOC_DESATUALIZADA |
| 6 | A tabela "Decisões possíveis" da documentação lista apenas `GO` e `NO_GO`, enquanto o contrato público, as estatísticas, o dashboard e o simulador já contemplam `REVIEW` | `release-policy.md:11-17` vs `contracts:9-10`, `routes:80`, `App.tsx:12`, `styles.css:34,42`, `simulate-pipeline.cjs:84` | DOC_DESATUALIZADA |
| 7 | `examples/incomplete-evidence.json` usa `"coverage": null`, que viola o JSON Schema do próprio contrato (`type: number`). É rejeitado com HTTP 400 | `examples/incomplete-evidence.json:5` vs `contracts:106` | REQUER_DECISÃO_DE_NEGÓCIO |
| 8 | Off-by-one na paginação: `?limit=N` devolve `N-1` itens | `routes/index.ts:57`; sonda `limit=5 → 4` | BUG |
| 9 | `topBlockingReasons` conta as razões de **qualquer** decisão diferente de `GO`. No momento em que `REVIEW` existir, razões de revisão passam a ser contadas como bloqueantes | `routes/index.ts:84` | BUG ativado pela mudança |
| 10 | `evaluateRelease(data: any)` — o motor não tipa a evidência, opondo-se ao contrato que devia honrar | `releaseService.ts:16` | DÍVIDA |

### 4.2 Propriedade estrutural (não é defeito, mas condiciona tudo)

`EvaluationRepository` **re-avalia os 18 seeds em cada arranque** contra a policy
corrente (`evaluationRepository.ts:12-20`), em vez de persistir decisões. É
intencional e está documentado no próprio ficheiro.

Consequência: qualquer alteração à policy **reescreve retroativamente** o
histórico e as estatísticas. É o facto com maior impacto no planeamento da
mudança, e é o que faz o teste das estatísticas falhar de forma legítima.

### 4.3 Testes que fixam o comportamento atual

| Teste | O que fixa | Quebra se |
|---|---|---|
| `api.test.ts:103` | `byDecision = {GO:13, REVIEW:0, NO_GO:5}` | qualquer avaliação passar a `REVIEW` |
| `api.test.ts:38` | `minimumCoverage: 70` | o limiar mudar |
| `policy.test.ts:20` | *"approves coverage of 72"* → `GO` | o limiar subir acima de 72 |

Nenhum destes testes exercita a fronteira do limiar (o mais próximo é 72 contra
um limiar de 70), razão pela qual o achado #2 passa despercebido.

---

## 5. Que fonte segui, e porquê

O briefing avisa que implementação, testes e documentação se contradizem. A
resolução exige separar **duas perguntas diferentes**:

**"O que é que o sistema faz hoje?"** — o runtime é a única fonte inquestionável.
As sondas da secção 3 resolvem-na sem ambiguidade: limiar 70, sem
`HIGH_SECURITY_RISK`, sem `REVIEW`.

**"O que é que o sistema devia fazer?"** — aqui o runtime não diz nada, e a
hierarquia inverte-se: contratos e documentação expressam intenção, o código só
expressa o que alguém escreveu. O `packages/contracts` é a fonte mais fiável
desta segunda pergunta, porque `REVIEW` já lá está no enum congelado e o
dashboard já o renderiza — é intenção que chegou antes da implementação.

### As três âncoras de resolução falham todas neste repositório

A abordagem habitual para resolver uma divergência de valor seria triangular com
âncoras externas ao código. Tentei as três:

| Âncora | Resultado |
|---|---|
| `docs/release-policy.md` | É a própria fonte desatualizada, e é incoerente consigo mesma (achado #5) |
| `git history` do limiar | **Vazio.** Um único commit toca em `constants.ts` (o inicial). 3 commits no repositório. `origin/baseline` é idêntica a `origin/main` nos ficheiros de policy |
| `examples/*.json` | **Não discriminam.** As coberturas são 63, 67, 79, 84 e `null` — nenhuma cai em [70, 75), exatamente o intervalo em disputa |

**Conclusão:** o valor do limiar não é determinável a partir do repositório. Não
é uma questão técnica — é uma regra de negócio, e escala-se (secção 7).

O que **é** determinável, e trato independentemente do valor escolhido, é o
achado #2: nada garante uma única fonte de verdade para o limiar. Isso corrige-se
com o motor a ler a constante e um teste de fronteira, e é pré-requisito para
qualquer alteração ao valor.

---

## 6. Impacto previsto de introduzir REVIEW

Sob a regra sugerida pela documentação (`high > 0` e `critical == 0` → `REVIEW`;
`critical > 0` continua a bloquear), cinco dos 18 seeds mudam de `GO` para
`REVIEW`:

`billing-svc-2.2.0` · `search-svc-1.9.3` · `mobile-bff-3.3.1` ·
`payments-api-8.2.0` · `crm-sync-1.4.9`

Estatísticas passariam de `GO 13 / REVIEW 0 / NO_GO 5` para
**`GO 8 / REVIEW 5 / NO_GO 5`**.

`payments-api-8.1.0` tem `high: 4` mas também `critical: 1`, logo permanece
`NO_GO` — critical domina.

> Esta lista foi obtida por dois métodos independentes (cálculo manual sobre
> `seedData.ts` e leitura de código delegada à IA) que chegaram ao mesmo
> resultado.

---

## 7. Questões abertas — exigem decisão de negócio

1. **Qual é o limiar de cobertura em vigor: 70 (aplicado) ou 75 (documentado)?**
   Não é determinável a partir do repositório (secção 5). Enquanto não houver
   decisão, mantenho 70, que é o comportamento observado em produção.
2. **`HIGH_SECURITY_RISK` deve produzir `REVIEW` ou continuar a não existir?**
   A documentação promete-o; o código nunca o implementou. É a hipótese mais
   provável para a nova policy, mas não a assumo sem confirmação.
3. **Que precedência entre vereditos?** A ordem proposta é
   `NO_GO > REVIEW > GO`, e a posição de `HIGH_SECURITY_RISK` na ordem canónica
   das razões precisa de ser fixada explicitamente.
4. **`examples/incomplete-evidence.json` é um exemplo válido ou um caso de erro
   propositado?** Hoje é rejeitado com 400 e nada o documenta.

---

## 8. Declarado fora de âmbito

Encontrados, não corrigidos, por não pertencerem à evolução da policy:

- Achado #8 (off-by-one no `?limit`)
- Achado #10 (`data: any` no motor)
- Achado #7 (exemplo inválido), até haver decisão

**Exceções que entram no âmbito**, com justificação:

- Achado #1 e #2 — não é possível implementar corretamente uma regra de limiar
  sobre uma constante que o motor ignora.
- Achado #9 — é um defeito **ativado** pela introdução de `REVIEW`, logo é
  consequência direta da mudança e não dívida pré-existente.

---

## 9. Nota sobre a delegação

O relatório da IA confirmou os cinco factos do `AGENTS.md` com citações exatas
(verificadas por amostragem) e acrescentou os achados #6 e #7. **Não detetou** os
achados #8 e #9, ambos encontrados por sonda de runtime e leitura manual das
rotas — o que reforça a necessidade de validação independente e de não tratar o
relatório da IA como exaustivo.

A análise de testes que a IA produziu é correta **sob a assunção** de que o
limiar de cobertura se mantém. Se a decisão da questão 1 alterar o limiar, dois
testes adicionais passam a falhar (`api.test.ts:38` e `policy.test.ts:20`).
