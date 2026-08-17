## ADDED Requirements

### Requirement: Coverage thresholds per release type

A policy de avaliação de cobertura SHALL aplicar thresholds distintos
dependendo do tipo de release (`STANDARD` vs `HOTFIX`), preservando o contrato
HTTP do endpoint principal e mantendo todas as regras de vulnerabilidades,
testes mandatórios, lint e precedência de decisão.

#### Scenario: Standard release coverage thresholds

- **WHEN** a release é do tipo `STANDARD`
- **AND** a cobertura de testes é estritamente inferior a 70%
- **AND** os restantes sinais de qualidade não impõem uma decisão mais forte
  (por exemplo, não há vulnerabilidades `critical`, nem testes mandatórios
  falhados)
- **THEN** a decisão de cobertura SHALL ser `NO_GO`
- **AND** a razão `COVERAGE_BELOW_MINIMUM` SHALL ser incluída.

- **WHEN** a release é do tipo `STANDARD`
- **AND** a cobertura de testes é maior ou igual a 70% e menor ou igual a
  79.99%
- **AND** os restantes sinais de qualidade não impõem `NO_GO`
- **THEN** a decisão de cobertura SHALL ser `REVIEW`
- **AND** a razão de cobertura SHALL indicar que a cobertura está na faixa
  de revisão.

- **WHEN** a release é do tipo `STANDARD`
- **AND** a cobertura de testes é maior ou igual a 80%
- **AND** os restantes sinais de qualidade não impõem `NO_GO` ou `REVIEW`
- **THEN** a decisão de cobertura SHALL não impor restrição adicional
- **AND** nenhuma razão de `COVERAGE_BELOW_MINIMUM` SHALL ser devolvida.

#### Scenario: Hotfix release coverage thresholds (integration with core policy)

- **WHEN** a release é do tipo `HOTFIX`
- **AND** a cobertura de testes é 67%
- **AND** não há vulnerabilidades `critical`
- **AND** não há testes mandatórios falhados
- **AND** não há vulnerabilidades `high` em número suficiente para `REVIEW`
- **AND** não há erros de lint
- **THEN** a decisão de cobertura SHALL ser `REVIEW`
- **AND** a razão de cobertura SHALL indicar que a cobertura do hotfix está na
  faixa de revisão
- **AND** a decisão global SHALL ser `REVIEW`.

#### Scenario: Standard release with 67% coverage remains NO_GO

- **WHEN** a release é do tipo `STANDARD`
- **AND** a cobertura de testes é 67%
- **AND** não há vulnerabilidades `critical`
- **AND** não há testes mandatórios falhados
- **AND** não há vulnerabilidades `high` em número suficiente para `REVIEW`
- **AND** não há erros de lint
- **THEN** a decisão de cobertura SHALL ser `NO_GO`
- **AND** a razão `COVERAGE_BELOW_MINIMUM` SHALL ser incluída
- **AND** a decisão global SHALL ser `NO_GO`.
