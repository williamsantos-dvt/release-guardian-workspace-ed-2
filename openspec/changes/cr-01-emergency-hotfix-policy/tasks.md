## 1. Policy thresholds by release type

- [x] 1.1 Identificar no código da policy de release readiness o ponto onde a
        cobertura é avaliada e como o tipo de release é atualmente
        representado (se disponível).
- [x] 1.2 Introduzir ou ajustar uma função/módulo que, dado o tipo de release
        (`STANDARD` vs `HOTFIX`) e a cobertura numérica, devolva a decisão de
        cobertura (`NO_GO`, `REVIEW`, ou ausência de restrição) segundo os
        thresholds definidos em CR-01.
- [x] 1.3 Garantir que a função de thresholds é chamada após os gates de
        vulnerabilidades `critical`, testes mandatórios e outros motivos de
        `NO_GO`, mantendo a precedência `NO_GO > REVIEW > GO`.

## 2. Testes unitários de policy

- [x] 2.1 Adicionar testes unitários para releases `STANDARD` cobrindo
        coberturas 64.99, 65, 69.99, 70, 79.99 e 80, verificando que:
        - `< 70` resulta em `NO_GO` com `COVERAGE_BELOW_MINIMUM`.
        - `70 – 79.99` resulta em `REVIEW`.
        - `>= 80` não impõe restrição adicional de cobertura.
- [x] 2.2 Adicionar testes unitários para releases `HOTFIX` cobrindo
        coberturas 64.99, 65, 69.99, 70, 79.99 e 80, verificando que:
        - `< 65` resulta em `NO_GO` com `COVERAGE_BELOW_MINIMUM`.
        - `65 – 79.99` resulta em `REVIEW`.
        - `>= 80` não impõe restrição adicional de cobertura.
- [x] 2.3 Verificar que vulnerabilidades `critical`, testes mandatórios e
        vulnerabilidades `high`/lint continuam a forçar `NO_GO` ou `REVIEW`
        independentemente do tipo de release ou da cobertura.

## 3. Simulação de pipeline

- [x] 3.1 Atualizar o cenário canon `hotfix-release` para garantir que:
        - Tipo de release é `HOTFIX`.
        - Cobertura está na faixa de revisão (65-79.99) com sinais
          restantes saudáveis.
        - A decisão global passa a ser `REVIEW` e a razão de cobertura reflete
          a faixa de revisão de hotfix.
- [x] 3.2 Adicionar ou ajustar um cenário de pipeline para release `STANDARD`
        com cobertura na faixa de revisão (70-79.99) e sinais saudáveis,
        garantindo que a decisão global permanece `NO_GO` ou `REVIEW`
        conforme os thresholds definidos.
- [x] 3.3 Executar `npm run simulate:pipeline -- hotfix-release` e cenários
        adicionais, confirmando que os resultados estão alinhados com o
        CR-01.

## 4. Verificação e validação

- [x] 4.1 Executar `npm run test`, `npm run validate`, `npm run lint` e
        `npm run typecheck` para garantir que a change não introduz regressões
        nem violações de policy de qualidade.
- [x] 4.2 Revisar o código e os testes para confirmar que:
        - O contrato HTTP do endpoint principal permanece inalterado.
        - Nenhum novo endpoint, persistência ou alteração de UI foi
          introduzido.
        - As razões devolvidas seguem a ordem estabelecida e todas as razões
          aplicáveis são incluídas.
