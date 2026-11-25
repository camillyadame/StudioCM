-- StudioCM 2.0 — esquema inicial.
-- Dinheiro sempre em centavos (integer). Horários em timestamptz (UTC),
-- exibidos em America/Sao_Paulo. Toda tabela operacional tem
-- professional_id para isolar os dados da Malu e da Carol.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE professionals (
  id                text PRIMARY KEY,                 -- 'malu' | 'carol'
  name              text NOT NULL,
  whatsapp          text NOT NULL,
  instagram         text,
  deposit_type      text NOT NULL CHECK (deposit_type IN ('percent', 'fixed')),
  deposit_value     integer NOT NULL CHECK (deposit_value > 0), -- % inteiro ou centavos
  hold_minutes      integer NOT NULL DEFAULT 10 CHECK (hold_minutes BETWEEN 1 AND 120),
  slot_step_minutes integer NOT NULL DEFAULT 15,
  calendar_id_env   text,                             -- nome da variável com o ID da agenda
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admin_users (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  login            text NOT NULL UNIQUE,
  password_hash    text NOT NULL,
  role             text NOT NULL CHECK (role IN ('professional', 'superadmin')),
  professional_id  text REFERENCES professionals(id),
  failed_attempts  integer NOT NULL DEFAULT 0,
  locked_until     timestamptz,
  last_login_at    timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CHECK ((role = 'professional') = (professional_id IS NOT NULL))
);

CREATE TABLE sessions (
  id_hash     text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL,
  ip          text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Conta recebedora de cada profissional. Guarda só NOMES de variáveis de
-- ambiente: tokens e segredos nunca vão para o banco nem para o front.
CREATE TABLE payment_accounts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id     text NOT NULL REFERENCES professionals(id),
  provider            text NOT NULL,               -- 'mercadopago' | 'fake'
  receiver_ref        text,                        -- ex.: collector_id esperado
  access_token_env    text NOT NULL,
  webhook_secret_env  text NOT NULL,
  active              boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX payment_accounts_one_active
  ON payment_accounts (professional_id) WHERE active;

CREATE TABLE service_categories (
  id               text PRIMARY KEY,
  professional_id  text NOT NULL REFERENCES professionals(id),
  name             text NOT NULL,
  sort_order       integer NOT NULL DEFAULT 0
);

CREATE TABLE services (
  id                text PRIMARY KEY,
  professional_id   text NOT NULL REFERENCES professionals(id),
  category_id       text REFERENCES service_categories(id),
  name              text NOT NULL,                 -- texto gravado na agenda
  description       text,
  kind              text NOT NULL CHECK (kind IN ('aplicacao', 'manutencao', 'adicional')),
  price_cents       integer NOT NULL CHECK (price_cents >= 0),
  duration_min      integer NOT NULL CHECK (duration_min > 0),
  duration_label    text,
  buffer_after_min  integer NOT NULL DEFAULT 0 CHECK (buffer_after_min >= 0),
  active            boolean NOT NULL DEFAULT true,
  sort_order        integer NOT NULL DEFAULT 0,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE weekly_hours (
  professional_id  text NOT NULL REFERENCES professionals(id),
  weekday          smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time       time NOT NULL,
  end_time         time NOT NULL CHECK (end_time > start_time),
  fixed_starts     time[],                         -- Malu: horários fixos de início
  PRIMARY KEY (professional_id, weekday)
);

CREATE TABLE schedule_exceptions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id  text NOT NULL REFERENCES professionals(id),
  date             date NOT NULL,
  kind             text NOT NULL CHECK (kind IN ('fechado', 'horario_especial')),
  start_time       time,
  end_time         time,
  reason           text,
  UNIQUE (professional_id, date)
);

CREATE TABLE time_blocks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id  text NOT NULL REFERENCES professionals(id),
  period           tstzrange NOT NULL,
  origin           text NOT NULL CHECK (origin IN ('painel', 'google')),
  google_event_id  text,
  note             text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id, google_event_id)
);
CREATE INDEX time_blocks_period ON time_blocks USING gist (professional_id, period);

-- A mesma pessoa atendida pelas duas vira dois registros: uma profissional
-- nunca vê os dados que a cliente deu para a outra.
CREATE TABLE clients (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id  text NOT NULL REFERENCES professionals(id),
  name             text NOT NULL,
  phone_e164       text NOT NULL,
  internal_notes   text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id, phone_e164)
);

CREATE TABLE inspirations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id    text NOT NULL REFERENCES professionals(id),
  service_id         text REFERENCES services(id),
  title              text,
  description        text,
  technique          text,
  category           text,
  crop               jsonb,
  variants           jsonb NOT NULL DEFAULT '{}'::jsonb,
  visible            boolean NOT NULL DEFAULT false,
  featured           boolean NOT NULL DEFAULT false,
  sort_order         integer NOT NULL DEFAULT 0,
  extra_price_cents  integer NOT NULL DEFAULT 0 CHECK (extra_price_cents >= 0),
  extra_minutes      integer NOT NULL DEFAULT 0 CHECK (extra_minutes >= 0),
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bookings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_token         text NOT NULL UNIQUE,
  professional_id      text NOT NULL REFERENCES professionals(id),
  client_id            uuid NOT NULL REFERENCES clients(id),
  period               tstzrange NOT NULL,
  status               text NOT NULL CHECK (status IN (
                         'aguardando_pagamento', 'confirmada', 'expirada', 'cancelada',
                         'reagendada', 'concluida', 'nao_compareceu')),
  origin               text NOT NULL CHECK (origin IN ('site', 'painel', 'whatsapp')),
  inspiration_id       uuid REFERENCES inspirations(id),
  total_cents          integer NOT NULL CHECK (total_cents >= 0),
  deposit_cents        integer NOT NULL CHECK (deposit_cents >= 0),
  balance_cents        integer NOT NULL CHECK (balance_cents >= 0),
  hold_expires_at      timestamptz,
  rescheduled_from_id  uuid REFERENCES bookings(id),
  google_event_id      text,
  sync_status          text NOT NULL DEFAULT 'pendente'
                         CHECK (sync_status IN ('pendente', 'sincronizado', 'falha')),
  terms_version        text,
  terms_accepted_at    timestamptz,
  customer_notes       text,
  status_reason        text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CHECK (deposit_cents + balance_cents = total_cents),
  -- Proteção definitiva contra duas reservas no mesmo horário: o próprio
  -- banco recusa a segunda gravação, mesmo com requisições simultâneas.
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    professional_id WITH =, period WITH &&
  ) WHERE (status IN ('aguardando_pagamento', 'confirmada'))
);
CREATE INDEX bookings_hold ON bookings (hold_expires_at) WHERE status = 'aguardando_pagamento';
CREATE INDEX bookings_prof_period ON bookings USING gist (professional_id, period);

-- Preço congelado no momento da reserva.
CREATE TABLE booking_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_id    text REFERENCES services(id),
  name          text NOT NULL,
  price_cents   integer NOT NULL CHECK (price_cents >= 0),
  duration_min  integer NOT NULL CHECK (duration_min >= 0)
);

CREATE TABLE payments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id           uuid NOT NULL REFERENCES bookings(id),
  professional_id      text NOT NULL REFERENCES professionals(id),
  payment_account_id   uuid REFERENCES payment_accounts(id),
  provider             text NOT NULL,              -- 'mercadopago' | 'fake' | 'manual'
  provider_payment_id  text,
  kind                 text NOT NULL CHECK (kind IN ('sinal', 'saldo', 'manual')),
  amount_cents         integer NOT NULL CHECK (amount_cents > 0),
  status               text NOT NULL CHECK (status IN (
                         'pendente', 'pago', 'expirado', 'em_revisao',
                         'devolucao_pendente', 'devolvido')),
  qr_code              text,
  qr_code_base64       text,
  expires_at           timestamptz,
  paid_at              timestamptz,
  received_cents       integer,
  review_reason        text,
  manual_origin        text,                       -- presencial, dinheiro, etc.
  created_by           uuid REFERENCES admin_users(id),
  last_provider_status text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_payment_id)
);
CREATE INDEX payments_booking ON payments (booking_id);

-- Idempotência dos webhooks: o mesmo evento nunca é processado duas vezes.
CREATE TABLE webhook_events (
  id            bigserial PRIMARY KEY,
  provider      text NOT NULL,
  event_key     text NOT NULL,
  professional_id text,
  signature_ok  boolean NOT NULL,
  payload       jsonb,
  received_at   timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz,
  error         text,
  UNIQUE (provider, event_key)
);

CREATE TABLE audit_log (
  id               bigserial PRIMARY KEY,
  at               timestamptz NOT NULL DEFAULT now(),
  actor            text NOT NULL,                  -- 'sistema', 'webhook', 'cliente', id do usuário
  professional_id  text,
  entity           text NOT NULL,
  entity_id        text NOT NULL,
  action           text NOT NULL,
  before           jsonb,
  after            jsonb
);
CREATE INDEX audit_entity ON audit_log (entity, entity_id);

-- Tarefas para o Google Calendar e outras integrações, gravadas na mesma
-- transação da mudança. Se o Google falhar, a reserva continua válida e a
-- tarefa é tentada de novo.
CREATE TABLE outbox (
  id            bigserial PRIMARY KEY,
  kind          text NOT NULL,                     -- 'calendar_upsert' | 'calendar_delete'
  booking_id    uuid REFERENCES bookings(id),
  attempts      integer NOT NULL DEFAULT 0,
  next_try_at   timestamptz NOT NULL DEFAULT now(),
  last_error    text,
  done_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX outbox_pending ON outbox (next_try_at) WHERE done_at IS NULL;
