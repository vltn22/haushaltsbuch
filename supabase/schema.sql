-- ============================================================================
-- Haushaltsbuch - Datenbankschema für Supabase
-- ----------------------------------------------------------------------------
-- Einmalig ausführen: Supabase Dashboard -> SQL Editor -> "New query" ->
-- diesen kompletten Inhalt einfügen -> "Run".
-- ============================================================================

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  type text not null check (type in ('Einnahme', 'Ausgabe')),
  category text not null,
  description text,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx on transactions (user_id);
create index if not exists transactions_date_idx on transactions (date);

-- Row Level Security: jede*r Nutzer*in sieht und bearbeitet ausschließlich
-- die eigenen Buchungen. Ohne diese Regeln wäre die Tabelle für alle
-- eingeloggten Nutzer*innen komplett sichtbar.
alter table transactions enable row level security;

create policy "select_own_transactions"
  on transactions for select
  using (auth.uid() = user_id);

create policy "insert_own_transactions"
  on transactions for insert
  with check (auth.uid() = user_id);

create policy "update_own_transactions"
  on transactions for update
  using (auth.uid() = user_id);

create policy "delete_own_transactions"
  on transactions for delete
  using (auth.uid() = user_id);
