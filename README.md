# Manualfor.life

Minimalistička web aplikacija za ostavljanje kratkih životnih poruka (do 175 karaktera), sa opcionalnim potpisom, live prikazom i star/unstar podrškom.

## Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS
- Supabase (Postgres + Realtime)

## Potrebne env promenljive

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# opciono (anti-abuse)
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_EXPECTED_HOSTNAME=
TURNSTILE_EXPECTED_ACTION=submit
LOG_HASH_SALT=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Napomene

- `visitor_id` se čuva na klijentu (`localStorage`) i koristi za perzistentan starred panel.
- Realtime feed prati nove unose i update broja zvezdica.
