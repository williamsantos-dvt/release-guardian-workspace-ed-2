# Templates de delegação

Prompts reutilizáveis para delegar em agentes (OpenCode Plan/Build) sem perder controlo. Cada um assume que o harness está carregado: `AGENTS.md`, `.opencode/instructions/*.md`, `docs/baseline-findings.md`.

Regra transversal: **uma tarefa, um âmbito, critérios de aceitação explícitos.**

---

## 1. Investigar (read-only — reportar, não alterar)

```text
Modo: investigação. NÃO alteres nenhum ficheiro.

Contexto já curado (lê primeiro, não redescubras):
- AGENTS.md — mapa do sistema, invariantes, hierarquia de confiança
- docs/baseline-findings.md — divergências já registadas (D-01..D-14)

Tarefa: <pergunta concreta, ex.: "que caminhos leem data.security.high?">

Entrega um relatório com:
1. Resposta direta à pergunta
2. Evidência: ficheiro:linha para cada afirmação
3. Divergências novas que não estejam já em docs/baseline-findings.md
4. O que NÃO consegues determinar a partir do código

Não proponhas correções. Não escolhas entre fontes divergentes.
```

---

## 2. Plan (OpenCode Plan sobre a spec)

```text
Modo: Plan. Não escrevas código.

Especificação a implementar: openspec/changes/<nome>/
(proposal.md, specs/**/spec.md, design.md, tasks.md)

Contexto obrigatório:
- AGENTS.md (invariantes e definição de done)
- .opencode/instructions/policy-engine.md (checklist de coerência, efeito na seed)
- .opencode/instructions/guardrails.md (o que está congelado)
- docs/baseline-findings.md (não "corrijas" divergências fora do âmbito da spec)

Produz um plano com:
1. Ficheiros exatos a alterar e o que muda em cada um
2. Como cada requisito da spec fica verificável (que teste, que comando)
3. Impacto nas contagens agregadas da seed (byDecision) e nos testes que as fixam
4. Riscos face aos invariantes: contrato congelado, REASON_CODES, formato de ids
5. Perguntas abertas — o que a spec não decide e tu não deves decidir sozinho

Não incluas alterações não exigidas pela spec.
```

---

## 3. Build (tarefa delimitada)

```text
Modo: Build. Âmbito estrito.

Tarefa: <uma tarefa de openspec/changes/<nome>/tasks.md>

Âmbito autorizado: <lista explícita de ficheiros>
Fora de âmbito: dashboard, simulador, scripts/validate.mjs, qualquer refactor
oportunista, qualquer divergência de docs/baseline-findings.md não mencionada aqui.

Critérios de aceitação:
- <comportamento observável 1: evidência → decisão + reasons esperados>
- <comportamento observável 2>
- Contrato de POST /api/v1/evaluations inalterado (request e resposta)
- npm run validate sai PASS

Antes de terminares:
1. Corre npm run validate e cola o output real
2. Se mexeste em limiares, recalcula as contagens da seed (ver
   .opencode/instructions/validation-and-done.md) e diz o que mudou e porquê
3. Lista o que alteraste, ficheiro a ficheiro
4. Declara explicitamente o que NÃO fizeste

Se a tarefa exigir decidir entre fontes divergentes: pára e pergunta.
```

---

## 4. Verificar (validação independente)

```text
Modo: verificação adversarial. Assume que a implementação está errada até prova.

Objeto: as alterações em <branch/diff> face a openspec/changes/<nome>/

Verifica, com evidência de comandos:
1. Cada requisito da spec — está implementado? Que teste o prova?
2. npm run validate — cola o output completo das 5 camadas
3. Comportamento real via pipeline:
   npm run simulate:pipeline -- healthy-release | low-coverage |
   critical-security | incomplete-evidence | hotfix-release
4. GET /api/v1/policy publica o mesmo limiar que o motor aplica?
5. Casos-fronteira do limiar: abaixo, exatamente igual, acima
6. Invariantes intactos: forma do request/resposta, Decision, EV-\d{4},
   18 avaliações seed, dashboard e simulador não alterados

Reporta discrepâncias entre o que foi declarado como feito e o que se observa.
Não corrijas nada — só reporta.
```
