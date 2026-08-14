## ADDED Requirements

### Requirement: Lembrete antes da devolução
O sistema DEVERÁ enviar um email de lembrete ao leitor 2 dias antes da data de devolução de cada empréstimo ativo.

#### Scenario: Lembrete enviado com antecedência
- **QUANDO** um empréstimo ativo tem data de devolução em exatamente 2 dias
- **ENTÃO** o sistema envia um email de lembrete ao leitor nesse dia

### Requirement: Lembrete no dia da devolução
O sistema DEVERÁ enviar um segundo email no próprio dia da devolução.

#### Scenario: Lembrete no dia
- **QUANDO** a data de devolução é hoje
- **ENTÃO** o leitor recebe o lembrete de devolução até às 09:00

### Requirement: Opt-in explícito
As notificações DEVERÃO ser enviadas apenas a leitores com email registado e consentimento ativo.

#### Scenario: Leitor sem email
- **QUANDO** um leitor não tem email registado
- **ENTÃO** nenhuma notificação é enviada e o empréstimo decorre normalmente
