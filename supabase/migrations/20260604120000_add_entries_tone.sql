-- Sprint 5: optional tone tagging for entries
alter table public.entries
  add column if not exists tone text;

alter table public.entries
  drop constraint if exists entries_tone_check;

alter table public.entries
  add constraint entries_tone_check
  check (
    tone is null
    or tone in ('love', 'courage', 'regret', 'work', 'loss', 'gratitude', 'other')
  );
