TABLE: entries

### Columns
- `id`
  - type: `uuid`
  - nullability: `not null`
  - default: `gen_random_uuid()`
  - notes: primary key, generated UUID default
- `text`
  - type: `varchar(175)`
  - nullability: `not null`
  - default: none
  - notes: bounded by check constraint (`1..175`)
- `created_at`
  - type: `timestamptz`
  - nullability: `not null`
  - default: `now()`
  - notes: used for sorting/pagination
- `stars`
  - type: `integer`
  - nullability: `not null`
  - default: `0`
  - notes: constrained to nonnegative values
- `signature`
  - type: `text`
  - nullability: `null`
  - default: none
  - notes: constrained to max length 30 when present

### Constraints
- Primary key:
  - `entries_pkey` on (`id`)
- Foreign keys:
  - none
- Unique constraints:
  - none beyond PK
- Check constraints:
  - `entries_text_length_check`: `char_length(text::text) >= 1 AND <= 175`
  - `entries_stars_nonnegative`: `stars >= 0`
  - `entries_signature_max_len`: `signature IS NULL OR char_length(signature) <= 30`

### Indexes
- `entries_pkey`
  - columns: `id`
  - order: default ASC
  - unique: yes
- `entries_created_at_desc_idx`
  - columns: `created_at DESC`
  - unique: no
- `entries_signature_lower_idx`
  - columns: `lower(signature)`
  - order: default ASC
  - unique: no
  - partial: `WHERE signature IS NOT NULL`

### Relationships
- Referenced by `entry_stars.entry_id` (`ON DELETE CASCADE`)

### Current Usage (infer from code if visible)
- API routes:
  - `app/api/entries/route.ts` (read, order by `created_at`, cursor pagination by `created_at`)
  - `app/api/submit/route.ts` (insert `text`, `stars`, `signature`)
  - `app/api/entries/[id]/star/route.ts` (read/update `stars`)
  - `app/api/entries/starred/route.ts` (joined through `entry_stars`)
- Hooks:
  - `hooks/useLiveTraces.ts` realtime subscribe on `entries` INSERT/UPDATE

### Potential Risks (ONLY factual from current schema)
- No composite index on (`created_at DESC`, `id DESC`) at present (only `created_at DESC` exists).


TABLE: entry_stars

### Columns
- `id`
  - type: `bigint`
  - nullability: `not null`
  - default: `generated always as identity`
  - notes: primary key, identity column
- `entry_id`
  - type: `uuid`
  - nullability: `not null`
  - default: none
  - notes: foreign key to `entries.id`
- `visitor_id`
  - type: `uuid`
  - nullability: `not null`
  - default: none
  - notes: logical visitor identity
- `starred_at`
  - type: `timestamptz`
  - nullability: `not null`
  - default: `now()`
  - notes: used for ordering starred list

### Constraints
- Primary key:
  - `entry_stars_pkey` on (`id`)
- Foreign keys:
  - `entry_stars_entry_id_fkey` (`entry_id`) -> `entries(id)` with `ON DELETE CASCADE`
- Unique constraints:
  - `entry_stars_entry_id_visitor_id_key` on (`entry_id`, `visitor_id`)
- Check constraints:
  - none custom

### Indexes
- `entry_stars_pkey`
  - columns: `id`
  - order: default ASC
  - unique: yes
- `entry_stars_entry_id_visitor_id_key`
  - columns: `entry_id`, `visitor_id`
  - order: default ASC
  - unique: yes
- `entry_stars_visitor_id_starred_at_idx`
  - columns: `visitor_id`, `starred_at DESC`
  - unique: no

### Relationships
- Many star records point to one `entries` row via `entry_id`.
- Joins used as:
  - `entry_stars` -> `entries` (`entries!inner(...)` in API)

### Current Usage (infer from code if visible)
- API routes:
  - `app/api/entries/starred/route.ts` (list by visitor, ordered by `starred_at`)
  - `app/api/entries/[id]/star/route.ts` (insert/delete/check star relation)
- Hooks:
  - no realtime subscriptions on `entry_stars` in current code

### Potential Risks (ONLY factual from current schema)
- No standalone index on `visitor_id` (covered by left-most column of `entry_stars_visitor_id_starred_at_idx`, so basic filter is still indexed).
- No separate non-unique helper index on (`entry_id`, `visitor_id`) because unique index already exists on same key.


FINAL SUMMARY:
- strengths
  - Core integrity is present: PKs, FK (`ON DELETE CASCADE`), uniqueness on (`entry_id`, `visitor_id`), and key checks on `entries`.
  - Defaults are in place for generated IDs/timestamps/counter baseline.
  - Existing indexes support current read patterns (`created_at`, visitor-star history).
- possible weaknesses
  - Requested composite time cursor index (`entries(created_at desc, id desc)`) is not present.
- immediate priorities
  - If you want deterministic tie-break cursor pagination under identical timestamps, add composite index (`created_at desc, id desc`) in a follow-up migration.


Missing constraints/indexes checklist (requested set):
- [x] `entries.id` as primary key
- [x] `entries.text` length constraint
- [x] `entries.stars` default `0` and `not null`
- [x] `entries.created_at` default `now()`
- [ ] index on `entries(created_at desc, id desc)`
- [x] foreign key `entry_stars.entry_id` -> `entries.id`
- [x] unique constraint on `entry_stars(entry_id, visitor_id)`
- [x] index on `entry_stars(visitor_id)` (via `entry_stars_visitor_id_starred_at_idx`)
- [x] index on `entry_stars(entry_id, visitor_id)` (unique index)
