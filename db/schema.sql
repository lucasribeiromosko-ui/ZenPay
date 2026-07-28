-- ============================================================
--  ZenPay — schema do banco (Neon / PostgreSQL)
--  Cole este arquivo inteiro no SQL Editor do Neon e execute.
--  Pode rodar mais de uma vez sem quebrar nada.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
--  Vendedores (quem entra no painel)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  senha_hash    TEXT        NOT NULL,   -- nunca guarde a senha em texto puro
  documento     TEXT,                   -- CPF ou CNPJ do vendedor
  telefone      TEXT,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
--  Dados de recebimento (tela Recebimento / Saque em Cripto)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payout_settings (
  user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  chave_pix        TEXT,
  saque_automatico BOOLEAN     NOT NULL DEFAULT true,
  banco            TEXT,
  agencia          TEXT,
  conta            TEXT,
  titular          TEXT,
  documento        TEXT,
  cripto_rede      TEXT,                -- TRC20 | ERC20 | BEP20
  cripto_carteira  TEXT,
  atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
--  Produtos (tela Produtos & Checkouts)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome       TEXT        NOT NULL,
  descricao  TEXT,
  valor      INTEGER     NOT NULL CHECK (valor > 0),  -- em CENTAVOS
  modo       TEXT        NOT NULL DEFAULT 'rapido'
             CHECK (modo IN ('rapido', 'completo')),
  aceita_pix     BOOLEAN NOT NULL DEFAULT true,
  aceita_credito BOOLEAN NOT NULL DEFAULT true,
  aceita_debito  BOOLEAN NOT NULL DEFAULT false,
  max_parcelas   SMALLINT NOT NULL DEFAULT 12
                 CHECK (max_parcelas BETWEEN 1 AND 12),
  ativo      BOOLEAN     NOT NULL DEFAULT true,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT products_forma_pagamento_obrigatoria
    CHECK (aceita_pix OR aceita_credito OR aceita_debito)
);

CREATE INDEX IF NOT EXISTS products_user_idx ON products(user_id);

-- ------------------------------------------------------------
--  Links de pagamento avulsos (tela Links de Pagamento)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_links (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug       TEXT        NOT NULL UNIQUE,  -- o que vai na URL /pay/<slug>
  descricao  TEXT        NOT NULL,
  valor      INTEGER     NOT NULL CHECK (valor > 0),  -- em CENTAVOS
  aceita_pix     BOOLEAN NOT NULL DEFAULT true,
  aceita_credito BOOLEAN NOT NULL DEFAULT true,
  aceita_debito  BOOLEAN NOT NULL DEFAULT false,
  max_parcelas   SMALLINT NOT NULL DEFAULT 1
                 CHECK (max_parcelas BETWEEN 1 AND 12),
  ativo      BOOLEAN     NOT NULL DEFAULT true,
  expira_em  TIMESTAMPTZ,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payment_links_forma_pagamento_obrigatoria
    CHECK (aceita_pix OR aceita_credito OR aceita_debito)
);

CREATE INDEX IF NOT EXISTS payment_links_user_idx ON payment_links(user_id);

-- ------------------------------------------------------------
--  Compradores / leads (tela Clientes)
--  Só é preenchido no checkout modo "completo".
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  documento  TEXT,                       -- CPF do comprador
  telefone   TEXT,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, email)
);

CREATE INDEX IF NOT EXISTS customers_user_idx ON customers(user_id);

-- ------------------------------------------------------------
--  Transações (Dashboard, Análises, Transações)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id      UUID        REFERENCES products(id) ON DELETE SET NULL,
  payment_link_id UUID        REFERENCES payment_links(id) ON DELETE SET NULL,
  customer_id     UUID        REFERENCES customers(id) ON DELETE SET NULL,

  referencia   TEXT    NOT NULL UNIQUE,      -- ex: ZP-000001
  metodo       TEXT    NOT NULL CHECK (metodo IN ('pix', 'credito', 'debito')),
  parcelas     SMALLINT NOT NULL DEFAULT 1,
  status       TEXT    NOT NULL DEFAULT 'pendente'
               CHECK (status IN ('pendente','paga','recusada','expirada','estornada')),

  valor_bruto  INTEGER NOT NULL CHECK (valor_bruto > 0),  -- em CENTAVOS
  taxa         INTEGER NOT NULL DEFAULT 0,                -- em CENTAVOS
  valor_liquido INTEGER NOT NULL DEFAULT 0,               -- em CENTAVOS

  -- Preenchido quando houver processador de pagamento de verdade
  psp_id       TEXT,
  pix_copia_cola TEXT,
  pix_qr_base64  TEXT,

  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
  pago_em      TIMESTAMPTZ,
  expira_em    TIMESTAMPTZ,

  CONSTRAINT transactions_origem_obrigatoria
    CHECK (product_id IS NOT NULL OR payment_link_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS transactions_user_criado_idx
  ON transactions(user_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS transactions_status_idx
  ON transactions(user_id, status);

-- ------------------------------------------------------------
--  Saques
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS withdrawals (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo       TEXT        NOT NULL CHECK (tipo IN ('pix', 'cripto')),
  valor      INTEGER     NOT NULL CHECK (valor > 0),  -- em CENTAVOS
  destino    TEXT        NOT NULL,   -- chave PIX ou endereço da carteira
  status     TEXT        NOT NULL DEFAULT 'processando'
             CHECK (status IN ('processando','concluido','falhou')),
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  concluido_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS withdrawals_user_idx ON withdrawals(user_id);

-- ------------------------------------------------------------
--  Endpoints de webhook (tela API & Webhooks)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhooks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url        TEXT        NOT NULL,
  secret     TEXT        NOT NULL,
  ativo      BOOLEAN     NOT NULL DEFAULT true,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
--  Chaves de API (tela API & Webhooks)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chave_publica TEXT       NOT NULL UNIQUE,
  chave_secreta_hash TEXT  NOT NULL,   -- guarde só o hash da secreta
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
  revogada_em  TIMESTAMPTZ
);

-- ------------------------------------------------------------
--  Pixels de trackeamento (tela Trackeamento)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tracking_pixels (
  user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  meta_pixel    TEXT,
  google_ads    TEXT,
  tiktok_pixel  TEXT,
  gtm_container TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
--  Conferência: lista as tabelas criadas
-- ------------------------------------------------------------
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
