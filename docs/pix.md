# StudioCM 2.0 — Banco de dados e Pix automático

Plano aprovado em 25/11/2026: https://claude.ai/artifact/P6z2AjALWhFAUe34F4CPBm

Esta etapa cria a **fundação no servidor**: banco Postgres, regras de reserva e
pagamento, adaptador do Mercado Pago e testes. **Nada muda no site enquanto
`PIX_MODE` estiver ausente ou `off`.** Nenhuma credencial real foi usada.

## Decisões registradas

| Assunto | Decisão |
| --- | --- |
| Fonte de verdade | Banco Postgres. Google Calendar vira espelho (tabela `outbox`). |
| Provedor | Mercado Pago, uma conta e um token por profissional (sem split). |
| Sinal | Carol 30% do total; Malu R$ 30 fixo. Configurável em `professionals`. |
| Pré-reserva | 10 minutos (`professionals.hold_minutes`). |
| Dinheiro | Sempre centavos inteiros. Preço congelado em `booking_items`. |
| Reserva dupla | Impedida pelo banco (`bookings_no_overlap`, EXCLUDE gist). |
| Regras do estúdio | Versão `regras-2026-11-25` gravada em cada reserva. |

## Como funciona

1. `POST /api/v2/bookings` recebe profissional, serviços, data, hora, nome,
   WhatsApp e o aceite das regras. Preço e sinal enviados pelo navegador são
   ignorados.
2. Numa transação: trava a profissional, valida horário, bloqueios e serviços,
   grava a reserva `aguardando_pagamento` com prazo de 10 min.
3. Fora da transação, cria a cobrança Pix na conta da profissional
   (`external_reference` = id da reserva, chave de idempotência, expiração).
   Se o provedor falhar, a reserva é cancelada e o horário fica livre.
4. `POST /api/webhooks/pix/mercadopago/:profissional` valida a assinatura
   (`x-signature`, HMAC-SHA256), grava o evento (duplicado é ignorado) e
   **consulta o pagamento no provedor**. Só confirma se status, valor,
   referência e conta recebedora conferem; senão vai para `em_revisao`.
5. `GET /api/v2/bookings/:token` é a tela da cliente (consulta a cada poucos
   segundos). Se o prazo venceu, expira na hora: consulta o provedor antes,
   cancela a cobrança e libera o horário.
6. Pagamento que chega depois da expiração confirma se o horário ainda está
   livre; se não, vira exceção financeira (`em_revisao`) para devolução.

Tarefas agendadas (cabeçalho `Authorization: Bearer $CRON_SECRET`):

- `POST /api/jobs/expire`: expira pré-reservas vencidas (a expiração também
  acontece sozinha quando alguém consulta o status ou tenta reservar).
- `POST /api/jobs/reconcile`: confere no provedor os pagamentos das últimas
  48 h, cobrindo webhooks perdidos.

Na Vercel, o cron de 1 minuto provavelmente exige plano pago; por isso a
expiração não depende dele. Um cron diário de conciliação já cobre o resto.

## Estados

- Reserva: `aguardando_pagamento → confirmada | expirada | cancelada`;
  `expirada → confirmada` (pagamento atrasado com horário livre);
  `confirmada → cancelada | reagendada | concluida | nao_compareceu`.
- Pagamento: `pendente → pago | expirado | em_revisao`; `expirado → pago |
  em_revisao`; `pago → devolucao_pendente → devolvido`; `em_revisao → pago |
  devolucao_pendente`.
- Sincronização: `pendente → sincronizado | falha`; `falha → pendente`.

Qualquer outra transição lança `InvalidTransitionError` (`src/domain/states.ts`).

## Configuração

Variáveis em `server/.env.example`. Passos para o sandbox:

1. Criar um Postgres (ex.: Neon ou Supabase, plano gratuito) e pôr a URL em
   `DATABASE_URL`. A extensão `btree_gist` precisa estar disponível.
2. `cd server && npm run db:migrate && npm run db:seed`.
3. Cadastrar a conta recebedora de cada profissional:

   ```sql
   INSERT INTO payment_accounts (professional_id, provider, receiver_ref, access_token_env, webhook_secret_env)
   VALUES ('carol', 'mercadopago', NULL, 'MP_ACCESS_TOKEN_CAROL', 'MP_WEBHOOK_SECRET_CAROL'),
          ('malu',  'mercadopago', NULL, 'MP_ACCESS_TOKEN_MALU',  'MP_WEBHOOK_SECRET_MALU');
   ```

   O banco guarda só os nomes das variáveis. Tokens ficam no ambiente do
   servidor, nunca no front nem no repositório. `receiver_ref` pode receber o
   `collector_id` da conta para a validação extra da conta recebedora.
4. No painel do Mercado Pago de cada uma, configurar o webhook de pagamentos
   para `PUBLIC_API_URL/api/webhooks/pix/mercadopago/<carol|malu>` e copiar a
   assinatura secreta para `MP_WEBHOOK_SECRET_*`.
5. `PIX_MODE=sandbox` com credenciais de TESTE.

Produção exige `PIX_MODE=live` **e** `PIX_LIVE_CONFIRMED=sim`, e só deve ser
ligada com autorização da Camilly.

## Testes

```bash
cd server
TEST_DATABASE_URL=postgres://.../studiocm_test npm test
```

O banco de teste é apagado a cada execução (o nome precisa conter `test`).
Sem `TEST_DATABASE_URL`, só os testes sem banco rodam.

Cobertos hoje: pagamento bem-sucedido; expiração; webhook atrasado;
webhook duplicado; webhook inválido; valor e conta divergentes; pagamento após
a expiração (horário livre e ocupado); três clientes no mesmo horário ao mesmo
tempo; provedor fora do ar ao criar, ao expirar e no webhook; Google Calendar
fora do ar; cancelamento antes e depois do pagamento; mudança de preço;
acesso cruzado entre profissionais; atendimento manual sobre pré-reserva;
bloqueio de horário; manipulação de preço pelo navegador.

Ainda não cobertos (dependem de etapas seguintes): alteração direta no Google
Calendar (sincronização de entrada), responsividade e acessibilidade da tela
de pagamento e do painel.

## Pendências antes do sandbox real

- **Conta PF:** confirmar que contas de pessoa física da Malu e da Carol geram
  credenciais e Pix pela API do Mercado Pago.
- **E-mail do pagador:** a API exige e-mail e o site não pede. Opções: pedir
  e-mail opcional à cliente ou usar um e-mail do estúdio (`MP_PAYER_EMAIL`).
- **Assinatura do webhook:** o formato do manifesto
  (`id:…;request-id:…;ts:…;`) segue a documentação do Mercado Pago e precisa
  ser validado com um webhook real do sandbox.
- **Expiração de 10 min:** confirmar que `date_of_expiration` curto é aceito.
- Erros de tipo antigos em `src/server.ts` (anteriores a esta etapa) seguem
  como estavam.

## Próximas etapas

1. Disponibilidade calculada pelo banco + sincronização de entrada do Google
   Calendar (bloqueios e alertas de eventos alterados).
2. Tela de pagamento no site (QR Code, Copia e Cola, contagem regressiva).
3. Painel administrativo (login, agenda, serviços, financeiro).
