# Studio CM

Site de um estúdio de beleza com **agendamento online integrado ao Google Calendar** das duas profissionais, cada uma com serviços, durações e horários próprios.

🌐 **No ar:** https://studio-cm.vercel.app/ · 📄 **Estudo de caso:** https://adamedev.com.br/projetos/studio-cm

![CI](https://github.com/camillyadame/StudioCM/actions/workflows/ci.yml/badge.svg)

## O problema

O estúdio tem duas profissionais com serviços, durações e dias de trabalho diferentes. Os agendamentos chegavam pelo WhatsApp e eram conferidos à mão na agenda de cada uma. Elas já usavam o Google Calendar, então a solução foi fazer o site conversar com essa agenda em vez de criar outra.

## Arquitetura

```text
 navegador (React + Vite, na Vercel)
        │  GET /api/availability/range · POST /api/bookings
        ▼
 API (Node.js + Express)
   ├─ catálogo: serviços, durações e jornada de cada profissional
   ├─ disponibilidade: jornada − eventos ocupados, em passos de 15 min
   ├─ proteção: rate limit, campo-isca, validação e normalização de telefone
   └─ rotina de expiração (a cada minuto) das pré-reservas sem sinal
        │  conta de serviço
        ▼
 Google Calendar (agenda de cada profissional = fonte da verdade)
```

## O que a API faz

- **Disponibilidade real.** Cruza a jornada de trabalho, a duração do serviço e os eventos já existentes, no fuso `America/Sao_Paulo`. Se a profissional bloquear um horário direto no Calendar, o site deixa de oferecê-lo.
- **Pré-reserva.** O agendamento vira um evento no Calendar, com os dados da cliente em propriedades privadas do evento.
- **Expiração automática.** Uma rotina remove pré-reservas cujo sinal não foi confirmado no prazo (`PREBOOKING_TTL_MINUTES`, 24 h por padrão). A profissional confirma editando o título do evento, e a rotina passa a ignorá-lo.
- **Proteção contra abuso.** Limite de requisições por IP e por telefone, limite de pré-reservas pendentes por número, campo-isca para robôs e validação do payload.

### Endpoints

| Método | Rota | Uso |
| --- | --- | --- |
| `GET` | `/health` | verificação de saúde |
| `GET` | `/api/calendars/test` | diagnóstico do acesso às agendas; exige o cabeçalho `x-admin-key` igual a `ADMIN_KEY` (sem a variável, responde 404) |
| `GET` | `/api/availability` | horários livres de um dia |
| `GET` | `/api/availability/range` | horários livres de várias datas de uma vez |
| `POST` | `/api/bookings` | cria a pré-reserva |

## Stack

`React 19` · `TypeScript` · `Vite` · `Tailwind CSS` · `React Router` · `Node.js` · `Express 5` · `Google Calendar API` · `node:test`

## Rodando localmente

Requer Node.js 22.

```bash
# front-end
npm install
npm run dev            # http://localhost:8443 (ou a porta em PORT)

# API
cd server
cp .env.example .env   # preencha os IDs das agendas e o caminho da chave
npm install
npm run dev            # http://localhost:3001
npm test               # testes das proteções da API
```

O front-end usa `VITE_API_URL` para encontrar a API (padrão `http://localhost:3001`).

## Testes e CI

O GitHub Actions roda em cada push e pull request:

- **front-end:** `npm ci` e `npm run build`;
- **API:** checagem de tipos (`tsc --noEmit`) e os testes de `server/src/*.test.ts`.

## Próximos passos

- Pagamento do sinal via Pix automático, para reduzir o prazo da pré-reserva.
- Mover o rate limiting para um armazenamento compartilhado se a API rodar em mais de uma instância.

---

Desenvolvido por **Camilly Adame** · [portfólio](https://adamedev.com.br) · [LinkedIn](https://www.linkedin.com/in/camilly-adame)
