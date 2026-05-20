-- ════════════════════════════════════════════════════════════════════
-- VibeCheck — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ════════════════════════════════════════════════════════════════════

-- 1. Enable pgvector extension
create extension if not exists vector;

-- ── Core table ────────────────────────────────────────────────────────────────
create table if not exists attendees (
  id                uuid        primary key default gen_random_uuid(),
  name              text        not null,
  role              text,
  mandate           text        not null,
  tags              text[]      default '{}',
  embedding         vector(1536),
  telegram_username text,
  wallet_address    text,
  attestation_id    text,                   -- Sign Protocol attestation ID
  match_cache       jsonb       default '{}', -- optimisation: cached top-3 matches
  created_at        timestamptz default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- IVFFlat index for fast approximate cosine similarity search
-- NOTE: only build after table has ≥100 rows (ignored until then)
create index if not exists attendees_embedding_idx
  on attendees using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Index on created_at for live feed ordering
create index if not exists attendees_created_at_idx
  on attendees (created_at desc);

-- ── Connection attestations log ───────────────────────────────────────────────
create table if not exists connections (
  id              uuid        primary key default gen_random_uuid(),
  from_id         uuid        references attendees(id) on delete cascade,
  to_id           uuid        references attendees(id) on delete cascade,
  match_score     float       not null,
  attestation_id  text,
  tx_hash         text,
  event_name      text        default 'SEABW 2026',
  created_at      timestamptz default now(),
  unique(from_id, to_id)      -- prevent duplicate connections
);

create index if not exists connections_from_idx on connections(from_id);
create index if not exists connections_to_idx   on connections(to_id);

-- ── RPC: vector similarity search ─────────────────────────────────────────────
create or replace function match_attendees(
  query_embedding vector(1536),
  match_threshold float,
  match_count     int,
  exclude_id      uuid
)
returns table(
  id                uuid,
  name              text,
  role              text,
  mandate           text,
  tags              text[],
  telegram_username text,
  wallet_address    text,
  similarity        float
)
language sql stable as $$
  select
    id, name, role, mandate, tags, telegram_username, wallet_address,
    1 - (embedding <=> query_embedding) as similarity
  from attendees
  where id != exclude_id
    and embedding is not null
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- ── RPC: total connections counter (for live counter in demo) ─────────────────
create or replace function count_connections(event text default 'SEABW 2026')
returns int language sql stable as $$
  select count(*)::int from connections where event_name = event;
$$;

-- ── Enable Realtime ───────────────────────────────────────────────────────────
-- In Supabase Dashboard: Database → Replication → toggle "attendees" and "connections"
-- Or run:
alter publication supabase_realtime add table attendees;
alter publication supabase_realtime add table connections;

-- ── Row Level Security (minimal — conference is public) ───────────────────────
alter table attendees  enable row level security;
alter table connections enable row level security;

-- Allow anyone to read (conference is public)
create policy "attendees_select" on attendees  for select using (true);
create policy "connections_select" on connections for select using (true);

-- Allow insert from authenticated service role only (API routes use service role key)
create policy "attendees_insert" on attendees
  for insert with check (true);  -- service role bypasses RLS anyway

create policy "connections_insert" on connections
  for insert with check (true);
