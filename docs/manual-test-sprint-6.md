# Manual test checklist — Sprint 6

Use this after Sprints 1–5 and before/after production deploy. Test on real devices when possible (especially mobile Safari).

## Environment

- [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Optional: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` if Turnstile is enabled
- [ ] `NEXT_PUBLIC_SITE_URL=https://app.manualfor.life` on Vercel (see deployment checklist)
- [ ] Supabase migration `20260604120000_add_entries_tone.sql` applied (required for tone to persist; app degrades without it)

## Homepage

- [ ] Page loads without console errors
- [ ] Hero, social proof counter, and featured traces render
- [ ] Inspiration hint animates and pauses when typing
- [ ] Theme scroll / mood hint (desktop) does not break layout
- [ ] “Leave a trace” submit works with empty tone
- [ ] Tone selector toggles on/off; default is none selected
- [ ] Submit with each tone (Love, Courage, Regret, Work, Loss, Gratitude, Other)
- [ ] Character counter and validation still work at 175 chars
- [ ] Error message shows on failed submit (network/API)
- [ ] Mobile bottom padding: textarea and submit not hidden behind bottom nav

## Post-submit modal

- [ ] “Saved for the future.” appears
- [ ] Trace card readable; tone label shown only when selected
- [ ] Optional name field saves (or shows retry message on failure)
- [ ] “Read what others left for you” opens Live panel
- [ ] Copy link / Copy text show confirmation (“Link copied”, “Text copied”)
- [ ] Native Share appears only when `navigator.share` is available (mobile Safari)
- [ ] Done / Escape closes modal and refocuses textarea
- [ ] Copy Link/Text still work when `entryId` is present

## Live panel

- [ ] Opens from desktop trigger and mobile bottom nav
- [ ] Escape and scrim close panel
- [ ] Focus moves into panel; Tab trap works
- [ ] Loading state, then list of traces
- [ ] Tone badge muted; hidden when entry has no tone
- [ ] Browse-by-tone row: All default; each tone filters client-side
- [ ] Empty state: “No traces in this tone yet.” when filter has no matches
- [ ] Star / unstar works; star count updates
- [ ] Copy link on row works
- [ ] “Earlier traces” loads more when available
- [ ] Realtime: new trace increases badge when panel closed
- [ ] Badge clears when Live opens

## Saved panel

- [ ] Opens from desktop trigger and mobile bottom nav
- [ ] Empty state copy when nothing saved
- [ ] Saved traces show tone when present
- [ ] Remove star removes from list
- [ ] Copy link works

## Mobile bottom nav

- [ ] Visible only below `md` breakpoint
- [ ] Safe-area inset respected
- [ ] Live / Saved buttons min 44px tap height
- [ ] `aria-current` reflects open panel
- [ ] Live badge `+N` when new traces and panel closed
- [ ] First-visit nudge: “See what others just left” above nav; dismisses / auto-hides

## Trace permalink `/trace/[id]`

- [ ] Valid UUID shows share card, date, tone (if any), share actions
- [ ] Invalid or missing id shows not-found page with “Leave your own trace”
- [ ] Copy link / Copy text / Share work on trace page
- [ ] OG/meta: inspect after deploy (manual, no dynamic OG in app)

## Backward compatibility (no tone column)

- [ ] With migration **not** applied: list/submit still work; tone not stored until migration runs
- [ ] Old entries without tone: no badge, appear under All filter

## localStorage

- [ ] `visitor-id` created for starring
- [ ] `manualforlife:saved-traces` persists starred traces
- [ ] `mfl-live-nudge-done` after nudge dismissed
- [ ] `theme-hint-dismissed` after theme hint

## Regression (must not break)

- [ ] Social proof counter loads
- [ ] Featured traces static section
- [ ] Supabase realtime (or graceful skip on non-HTTPS localhost)
- [ ] Turnstile when configured
- [ ] No `[browser] Missing server Supabase env` on homepage (client must not import `supabaseServer`)

## Lint / build

- [ ] `npm run lint`
- [ ] `npm run build`
