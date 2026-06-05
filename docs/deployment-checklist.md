# Deployment checklist — ManualForLife

## Domain architecture

| Host | Role | Hosting |
|------|------|---------|
| `app.manualfor.life` | **Public app domain** — Next.js app (write traces, Live/Saved, `/trace/[id]`) | **Vercel** |
| `manualforlife.vercel.app` | Technical Vercel fallback alias — **not for sharing**; redirects to `app.manualfor.life` | Vercel |
| `www.manualfor.life` | Informational landing / marketing site | External (not Vercel app) |
| `manualfor.life` (apex) | Landing or redirect to `www` — **not** the app | External |
| Supabase | Database, realtime, API backend | Supabase cloud |

The Vercel app must **not** be served from apex `manualfor.life`. Landing CTAs should link to **`https://app.manualfor.life`**.

Generated public links (canonical, Open Graph, Copy link, Native Share) always use **`https://app.manualfor.life`** via `NEXT_PUBLIC_SITE_URL`. Never share `*.vercel.app` URLs.

### Vercel `.vercel.app` redirect (code-level)

Committed in repo — no Vercel Dashboard step required:

1. **`vercel.json`** — permanent redirect `manualforlife.vercel.app/*` → `https://app.manualfor.life/*`
2. **`proxy.ts`** — in **production only**, any other `*.vercel.app` host on this deployment redirects to `app.manualfor.life` (preview deployments are excluded)
3. **`CanonicalHostRedirect`** (client) — production-only fallback so iOS share UI never shows a `.vercel.app` document host if edge redirect was skipped

After changing redirect config, redeploy production for rules to take effect.

## Before deploy

### Supabase

- [ ] Run idempotent migration: `supabase/migrations/20260604120000_add_entries_tone.sql`
- [ ] Confirm `entries.tone` exists and `entries_tone_check` constraint is active
- [ ] Verify `supabase/schema/current_schema.sql` matches production after migration

**Note:** The app degrades if `tone` is missing (lists/submit work; tone is not stored). For full Sprint 5 behavior, **apply migration before deploy**.

### Environment variables (Vercel Production)

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client-side Supabase (realtime) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server only; never expose to client |
| `NEXT_PUBLIC_SITE_URL` | Yes | **`https://app.manualfor.life`** — canonical, OG, and share trace URLs |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | If using Turnstile | Match Cloudflare site |
| `TURNSTILE_SECRET_KEY` | If using Turnstile | Server secret |
| `OPENAI_API_KEY` | If using translation | Server only |

- [ ] Confirm `NEXT_PUBLIC_SITE_URL` is **`https://app.manualfor.life`** (not apex `manualfor.life`)
- [ ] Pull env locally: `vercel env pull` (optional sanity check)
- [ ] No secrets committed to git

### Code quality

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Sprint 6 manual tests: `docs/manual-test-sprint-6.md`

## Deploy

- [ ] Push to main (or merge PR)
- [ ] Vercel production deployment succeeds
- [ ] Vercel domain alias includes `app.manualfor.life`
- [ ] `vercel.json` redirect and `proxy.ts` deployed (`.vercel.app` → `app.manualfor.life`)
- [ ] No build warnings that block runtime

## After deploy — smoke tests

### Core flows (on `https://app.manualfor.life`)

- [ ] Homepage loads over HTTPS
- [ ] Submit trace without tone
- [ ] Submit trace with tone (after migration)
- [ ] Live panel loads entries
- [ ] Save / unsave trace
- [ ] No errors in browser console on `/`

### URLs

- [ ] App origin is `https://app.manualfor.life`
- [ ] Open `/trace/<valid-uuid>` — card and copy link use **`https://app.manualfor.life/trace/<id>`**
- [ ] Open `/trace/not-a-uuid` — not-found page
- [ ] Copy link from Live panel produces `https://app.manualfor.life/trace/<id>`
- [ ] Trace page `canonical` and `og:url` use `app.manualfor.life`
- [ ] Visiting `https://manualforlife.vercel.app/` redirects to `https://app.manualfor.life/`
- [ ] Favicon/icon `<link>` tags in HTML use `app.manualfor.life`, not `*.vercel.app`

### Landing site (external — manual)

- [ ] `www.manualfor.life` loads landing (not the Next app)
- [ ] Primary CTA points to `https://app.manualfor.life`

### Share & mobile

- [ ] Mobile Safari: Native Share on trace page and post-submit modal (if supported)
- [ ] Copy link / Copy text feedback visible
- [ ] Mobile bottom nav does not cover submit area

### OG / social preview (manual)

- [ ] Paste **`https://app.manualfor.life/trace/<id>`** in iMessage / Slack / X
- [ ] Title: “A trace left on manualfor.life”; URL in preview should be app host

### Observability

- [ ] Vercel function logs: no repeated 500s on `/api/entries` or `/api/submit`
- [ ] Supabase dashboard: inserts and selects succeed

## Rollback

- [ ] Previous Vercel deployment promotion path known
- [ ] Migration rollback only if needed: `ALTER TABLE entries DROP COLUMN tone` (data loss for tone values)

## Out of scope (do not deploy expecting these)

- SEO blog / tone landing pages
- Email collection
- Analytics dashboards
- Auth / moderation
- Dynamic OG images
- Serving the Next app from apex `manualfor.life`
