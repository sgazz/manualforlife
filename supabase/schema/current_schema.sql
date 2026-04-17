-- Current schema snapshot extracted from live Supabase project (public schema).
-- Source of truth date: 2026-04-17
-- Tables covered: entries, entry_stars

create table if not exists public.entries (
  id uuid not null default gen_random_uuid(),
  text varchar(175) not null,
  created_at timestamptz not null default now(),
  stars integer not null default 0,
  signature text null,
  constraint entries_pkey primary key (id),
  constraint entries_text_length_check check (char_length(text::text) >= 1 and char_length(text::text) <= 175),
  constraint entries_stars_nonnegative check (stars >= 0),
  constraint entries_signature_max_len check (signature is null or char_length(signature) <= 30)
);

create table if not exists public.entry_stars (
  id bigint generated always as identity not null,
  entry_id uuid not null,
  visitor_id uuid not null,
  starred_at timestamptz not null default now(),
  constraint entry_stars_pkey primary key (id),
  constraint entry_stars_entry_id_fkey foreign key (entry_id) references public.entries(id) on delete cascade,
  constraint entry_stars_entry_id_visitor_id_key unique (entry_id, visitor_id)
);

create index if not exists entries_created_at_desc_idx
  on public.entries using btree (created_at desc);

create index if not exists entries_signature_lower_idx
  on public.entries using btree (lower(signature))
  where signature is not null;

create index if not exists entry_stars_visitor_id_starred_at_idx
  on public.entry_stars using btree (visitor_id, starred_at desc);
