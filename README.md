# Manualfor.life

Minimalisticka web aplikacija gde korisnici ostavljaju jednu kratku zivotnu lekciju (do 175 karaktera) za buduce generacije.

## Stack

- Next.js (App Router + React + TypeScript)
- Tailwind CSS
- Supabase (database)

## Pokretanje lokalno

1. Instaliraj dependencies:

```bash
npm install
```

2. Napravi env fajl:

```bash
cp .env.example .env.local
```

3. Popuni `.env.local` vrednosti:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TURNSTILE_SECRET_KEY=optional-turnstile-secret
NEXT_PUBLIC_TURNSTILE_SITE_KEY=optional-turnstile-site-key
TURNSTILE_EXPECTED_HOSTNAME=optional-domain.com
TURNSTILE_EXPECTED_ACTION=submit
LOG_HASH_SALT=optional-random-salt
UPSTASH_REDIS_REST_URL=optional-upstash-rest-url
UPSTASH_REDIS_REST_TOKEN=optional-upstash-rest-token
```

4. Pokreni razvojni server:

```bash
npm run dev
```

5. Otvori [http://localhost:3000](http://localhost:3000)

## Supabase schema

Pokreni sledeci SQL u Supabase SQL editoru:

```sql
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  text varchar(175) not null check (char_length(text) between 1 and 175),
  created_at timestamptz not null default now()
);

create table if not exists public.abuse_logs (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  user_agent text not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

## Production security setup

Pokreni i ovaj SQL da ukljucis Row Level Security i ogranicis upis/citanje:

```sql
alter table public.entries enable row level security;

drop policy if exists "Public can insert entries" on public.entries;
drop policy if exists "Public can read entries" on public.entries;

create policy "Public can read entries"
on public.entries
for select
to anon, authenticated
using (true);

alter table public.abuse_logs enable row level security;
```

Ako zelis striktno da anon ne cita direktno iz baze (samo preko server API), ukloni SELECT policy:

```sql
drop policy if exists "Public can read entries" on public.entries;
```

Hardening koji je implementiran u kodu:

- Upis ide iskljucivo preko `app/api/submit/route.ts` (direktan anon `INSERT` policy je uklonjen).
- Server-side validacija (`lib/validation.ts`): trim, empty check, max 175, basic keyword filter.
- Rate limit (`lib/rateLimit.ts`): 1 submit / 15 sekundi po IP (Upstash Redis kada je konfigurisan, in-memory fallback).
- Content-Length guard: payload > 1024 bajta vraca `413`.
- Optional Turnstile feature flag (`TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY`) sa strogim check-om (`success`, `hostname`, `action`).
- Abuse logging (`lib/logger.ts`): timestamp, hashovan IP, user-agent, reason + dedupe/sampling.
- Soft shadow-ban: nakon vise prekrsaja vraca `success` bez upisa u bazu.
- Abuse logovi se cuvaju i u `public.abuse_logs` (plus console fallback).
- Server Supabase klijent sa service role key (`lib/supabaseServer.ts`).
- Security headers (CSP, HSTS, X-Frame-Options, itd.) u `next.config.ts`.

## File structure (security layer)

```txt
app/api/submit/route.ts
lib/rateLimit.ts
lib/validation.ts
lib/logger.ts
lib/supabaseServer.ts
```

## API responses

Success:

```json
{ "success": true }
```

Error:

```json
{ "error": "Rate limit exceeded" }
```

```json
{ "error": "Invalid input" }
```

## Example requests

Client submit:

```ts
await fetch("/api/submit", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    text: "Be kind when no one is watching.",
    website: "", // honeypot, mora ostati prazno
    turnstileToken: "", // opciono
  }),
});
```

Load latest entries:

```ts
await fetch("/api/entries");
```

## Alternative visual styles (predlog)

1. Dark mode (filozofski ton)
   - Duboka crna pozadina sa blagim sivim akcentima
   - Off-white tipografija i suptilni staklasti paneli
   - Sporije i mekse tranzicije za kontemplativni osecaj

2. Paper-like mode (book feel)
   - Topla beige pozadina i blago zrnasta tekstura
   - Serif naslov + sans body copy za “knjiga” utisak
   - Tanke sepia linije i diskretan kontrast
