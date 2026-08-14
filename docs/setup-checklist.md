# Checklist de Setup Pré-Evento

Confirma cada ponto **antes** do dia do hackathon. No arranque do evento não haverá tempo para instalar ferramental.

## Ferramental

- [ ] **Node.js LTS** (≥ 20): `node --version`
- [ ] **npm** (≥ 10): `npm --version`
- [ ] **OpenCode** instalado e com o modelo de IA configurado: `opencode --version`
- [ ] **OpenSpec** instalado: `openspec --version`
- [ ] Acesso ao modelo de IA testado (uma pergunta de teste rápida)

## Repositório

- [ ] Clone do repositório do desafio feito
- [ ] `npm install` concluído sem erros
- [ ] `npm test` passa (suite verde)
- [ ] `npm run dev:api` sobe a API em `http://localhost:3000`
- [ ] `GET /health` responde `{"status":"ok"}`
- [ ] Swagger acessível em `http://localhost:3000/docs`
- [ ] `npm run dev:dashboard` sobe o dashboard em `http://localhost:5173`
- [ ] `npm run simulate:pipeline -- healthy-release` devolve `GO`

## Git

- [ ] Autenticação no GitHub funcionando (`git push` de teste para a tua branch `participant/<prefixo-do-email>`)

Se algo falhar, contacta a organização pelo canal de suporte **antes** do evento.
