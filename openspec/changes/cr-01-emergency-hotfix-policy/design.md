## Context

O Release Guardian já possui uma policy central que decide `GO`/`REVIEW`/`NO_GO`
com base em cobertura de testes, vulnerabilidades, testes mandatórios, erros de
lint e precedência entre motivos. Atualmente, a avaliação de cobertura é
aplicada uniformemente a qualquer release, sem distinguir `STANDARD` de
`HOTFIX`, e o contrato HTTP do endpoint principal encontra-se congelado.

CR-01 exige que a policy passe a considerar explicitamente o tipo de release
ao avaliar cobertura, introduzindo thresholds específicos para hotfixes, sem
alterar:

- O contrato HTTP do endpoint.
- As regras de vulnerabilidade (critical/high).
- As regras de testes mandatórios e lint.
- A precedência `NO_GO > REVIEW > GO`.
- A lista de razões devolvidas e sua ordem estabelecida.

## Goals / Non-Goals

**Goals:**

- Introduzir uma distinção explícita entre releases `STANDARD` e `HOTFIX` na
  avaliação de cobertura.
- Definir thresholds de cobertura para hotfix:
  - `< 65`: `NO_GO`
  - `65 – 79.99`: `REVIEW`
  - `>= 80`: sem restrição adicional de cobertura.
- Preservar os thresholds existentes para releases `STANDARD`.
- Garantir que o cenário canon `hotfix-release` com 67% de cobertura e sinais
  restantes saudáveis passe a ser avaliado como `REVIEW`.
- Manter inalteradas as regras de vulnerabilidade, testes mandatórios, lint e
  a precedência de decisão.
- Não alterar o contrato HTTP do endpoint principal.

**Non-Goals:**

- Não introduzir novos endpoints HTTP.
- Não adicionar nova persistência de dados ou alterar modelos persistidos.
- Não modificar UI ou experiência de utilizador.
- Não redefinir a semântica das razões existentes nem introduzir novas
  categorias de decisão.
- Não alterar o modelo de autenticação ou autorização associado ao endpoint.

## Decisions

1. **Modelar o tipo de release como input lógico da policy (não como mudança
   de contrato HTTP).**

   - Decisão: Reutilizar um campo já existente (ou derivável) no modelo de
     pipeline que indique se a release é `STANDARD` ou `HOTFIX`, sem alterar a
     forma como o endpoint expõe esse dado. Se o tipo já existir na estrutura
     de simulação (`simulate:pipeline`), usá-lo como fonte de verdade.
   - Alternativa considerada: Introduzir um novo campo no payload HTTP da
     request. Rejeitada porque violaria a restrição de contrato congelado.
   - Racional: Mantém o contrato estável e limita a alteração à lógica interna
     de policy e à camada de simulação.

2. **Isolar a lógica de thresholds por tipo em uma função/módulo de policy.**

   - Decisão: Criar ou ajustar uma função responsável por decidir a faixa de
     cobertura com base em:
     - Tipo da release (`STANDARD` vs `HOTFIX`).
     - Percentual de cobertura.
   - Alternativa considerada: Espalhar condicionais de tipo (`if hotfix`) por
     toda a lógica de decisão. Rejeitada por dificultar manutenção e revisão.
   - Racional: Uma função localizada torna explícito o comportamento por tipo
     e facilita testar cenários de fronteira (LIMITS SHORT OF 65/70/80).

3. **Preservar gates de segurança e qualidade como etapa anterior ao
   threshold de cobertura.**

   - Decisão: Manter vulnerabilidades `critical`, testes mandatórios falhados,
     vulnerabilidades `high` acima do threshold e erros de lint como gates
     que impõem `NO_GO` ou `REVIEW` independentemente do tipo de release ou
     da cobertura.
   - Alternativa considerada: Aliviar alguns gates em hotfix (por exemplo,
     aceitar mais vulnerabilidades `high`). Rejeitada pelo risco de degradar
     segurança em incidentes.
   - Racional: CR-01 trata apenas de cobertura; os demais sinais permanecem
     inalterados por requisito.

4. **Expressar thresholds com comparações explícitas e cobrir bordas em
   testes.**

   - Decisão: Implementar comparações com operadores claros:
     - `coverage < 65` (HOTFIX → `NO_GO`).
     - `65 <= coverage <= 79.99` (HOTFIX → `REVIEW`).
     - `coverage >= 80` (HOTFIX → sem restrição).
     - `coverage < 70` (STANDARD → `NO_GO`).
     - `70 <= coverage <= 79.99` (STANDARD → `REVIEW`).
     - `coverage >= 80` (STANDARD → sem restrição).
   - Alternativa considerada: Usar apenas faixas aproximadas (por exemplo,
     arredondar para inteiros). Rejeitada porque introduz ambiguidade em
     valores decimais próximos das bordas.
   - Racional: Comparações explícitas são fáceis de revisar e permitem
     cenários de teste que garantam o comportamento em limites (64.99, 65,
     69.99, 70, 79.99, 80).

## Risks / Trade-offs

- **Risk:** Configurações incorretas de tipo de release (hotfix marcado como
  standard ou vice-versa) podem levar a decisões de cobertura inesperadas.
  - Mitigation: Cobrir cenários de simulação para ambos tipos e documentar bem
    o campo de tipo; incluir testes que garantam que o cenário canon
    `hotfix-release` usa efetivamente `HOTFIX`.

- **Risk:** Bugs na lógica de comparação de thresholds (por exemplo, uso de
  `>` quando se espera `>=`) podem criar buracos de cobertura em bordas.
  - Mitigation: Adicionar testes unitários e de simulação para valores
    adjacentes às bordas (64.99, 65, 69.99, 70, 79.99, 80) para ambos tipos de
    release.

- **Risk:** Alterações futuras na policy podem esquecer de atualizar os
  thresholds por tipo, causando regressões silenciosas.
  - Mitigation: Centralizar thresholds em uma função ou constante única e
    referenciar explicitamente o tipo de release em testes; manter cenários
    canônicos (`hotfix-release`, `standard-release-67`) como guarda contra
    regressão.

- **Trade-off:** Manter gates de segurança rígidos em hotfix evita relaxamento
  indevido, mas pode impedir algumas mitigações quando o problema está
  precisamente nas vulnerabilidades ou testes mandatórios.
  - Mitigation: Deixar explícito que CR-01 não trata desses gates e que
    eventual policy de exceção exigiria um novo change específico.

## Migration Plan

- Introduzir/ajustar a função de decisão de thresholds de cobertura por tipo
  de release na camada de policy.
- Atualizar os testes unitários de policy para cobrir cenários:
  - `STANDARD` com coberturas 64.99, 65, 69.99, 70, 79.99, 80.
  - `HOTFIX` com coberturas 64.99, 65, 69.99, 70, 79.99, 80.
- Atualizar o cenário canon `hotfix-release` na simulação de pipeline para
  verificar que:
  - Com cobertura 67% e restantes sinais saudáveis, a decisão global é
    `REVIEW`.
- Adicionar um cenário de simulação equivalente para release `STANDARD` com
  67% de cobertura e sinais saudáveis, assertando que a decisão permanece
  `NO_GO`.
- Executar `npm run validate`, `npm run test` e `npm run simulate:pipeline -- hotfix-release`
  para garantir que a policy e os cenários se comportam conforme o CR-01.
- Garantir que não há alterações em contratos HTTP, APIs externas ou modelos
  persistidos como parte desta change.

## Open Questions

- Qual a fonte de verdade do tipo de release (`STANDARD` vs `HOTFIX`) na
  pipeline atual (campo explícito, naming convention, branch, tag)?  
  Esta decisão não muda os thresholds definidos, mas influencia onde a lógica
  lê o tipo. Assim que confirmarmos onde o tipo está representado no modelo de
  pipeline, o design pode referenciar esse campo explicitamente na
  implementação.
