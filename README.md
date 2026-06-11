# ⚽ Bolão da Copa 2026

Bolão da família para a Copa do Mundo 2026 — Next.js + Postgres (Neon/Vercel) + Tailwind.

## Funcionalidades

- **Palpites** nos 104 jogos, travados automaticamente no apito inicial
- **Pontuação**: 3 pts placar exato · 1 pt vencedor/empate · mata-mata vale os 90 minutos
- **Campeão** (+5 pts, trava antes das oitavas) e **bolões extras** (artilheiro, craque, zebra)
- **Classificação** com os critérios de desempate do regulamento
- **Estatísticas**: evolução da pontuação, aproveitamento, pé quente/pé frio
- **Anti-cola**: palpites dos outros só aparecem depois que o jogo começa
- **Admin**: lança resultados (manual ou sync com football-data.org), define o mata-mata, gerencia participantes
- Login simples por **nome + PIN de 4 dígitos**

## Rodando local

```bash
npm install
cp .env.example .env.local   # preencha DATABASE_URL e SESSION_SECRET
npm run db:push              # cria as tabelas
npm run db:seed              # 48 seleções + 104 jogos
npm run add-participant -- "Seu Nome" 1234 --admin --avatar 👑
npm run dev
```

## Deploy (Vercel)

1. Suba o repositório para o GitHub e importe na Vercel
2. Em **Storage**, crie um banco Postgres (Neon) e conecte ao projeto
3. Em **Settings → Environment Variables**, adicione `SESSION_SECRET` (e `FOOTBALL_DATA_API_KEY`, opcional)
4. Localmente, com o `DATABASE_URL` de produção no `.env.local`: `npm run db:push && npm run db:seed`
5. Crie os participantes da família pelo painel **Admin**

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Testes do motor de pontuação |
| `npm run db:push` | Aplica o schema no banco |
| `npm run db:seed` | Popula seleções e jogos (idempotente) |
| `npm run add-participant -- "Nome" 1234 [--admin]` | Cria participante via CLI |
