Sidewalk — project notes for Claude Code
Sidewalk is a doorknocking/canvassing app for municipal candidates and other
low-budget campaigns. Volunteers log houses as they knock — supporter,
undecided, not supporting, or not home — plus a lawn-sign checkbox, a
follow-up flag, and notes.
What's in this folder
sidewalk.jsx — a working UI prototype (React), currently built as a
single-file chat artifact. It uses a fake `window.storage` API for
persistence that ONLY works inside that chat environment — it will not
work outside of it. Treat this file as the source of truth for UI/UX,
component structure, and feature logic, NOT as something that runs as-is.
Every feature in it (see below) needs to be ported to a real app wired to
Firebase instead of `window.storage`.
sidewalk-firestore.rules — the real Firestore security rules,
written and ready to deploy. Defines the data model: campaigns → members
(manager/volunteer roles) → canvasses → streets → houses, plus a
shareCodes mechanism for guest access to a single canvass without a full
account.
sidewalk-functions/index.js — Cloud Functions that back the rules:
`acceptInvite` (redeem a team invite atomically) and
`onCampaignCreated` (auto-adds the creator as manager).
Direction: web tool first
Priority is shipping this as a strong browser-based web tool, usable well
on phone, tablet, or desktop — not primarily as an installed phone app.
Build order should reflect that:
Core web app (auth, canvassing features, responsive layout across screen
sizes) — this is the priority.
Home-screen installability (manifest.json, icons) — DONE. manifest.json,
branded app icons (192/512/apple-touch/maskable), theme color, and a
minimal service worker (no offline caching yet) are wired up in
sidewalk-app/web.
Map view — DONE (see below). Offline sync and team dashboard are
still deliberately deferred until after a real campaign has used the
lean version and given feedback.
Layout should NOT just be the phone-width column from sidewalk.jsx
stretched across a bigger screen. On tablet/desktop, make better use of
the space — e.g. a persistent street list alongside the house list,
rather than the mobile street-chips-then-houses flow.
Goal
Turn sidewalk.jsx into a real, deployed, multi-user web app that can also be
installed to a phone's home screen as a lightweight PWA:
Scaffold a proper app (Next.js recommended) with Firebase Auth + Firestore.
Replace every `window.storage` call in sidewalk.jsx with the equivalent
Firestore read/write, respecting the schema in sidewalk-firestore.rules.
Deploy sidewalk-firestore.rules and sidewalk-functions/index.js to the
Firebase project.
Build real auth: email/password sign-up with Firebase's email
verification, a login screen, and anonymous auth for the "join with a
code" guest flow.
Add a manifest.json (app name, icons at standard PWA sizes, theme/
background color matching the black/white design) and register a basic
service worker, so "Add to Home Screen" produces a real app icon
instead of a generic bookmark thumbnail. This also lays the groundwork
for the offline-sync feature listed below, which depends on a service
worker existing.
Make the layout responsive for BOTH orientations, not just phone
portrait. sidewalk.jsx was built mobile-first as a fixed single column
(max-w-md). That needs to flex for:
Phone landscape (volunteers will rotate their phone mid-canvass)
Tablets, in both orientations
Desktop browser windows, for anyone managing canvasses from a computer
Use responsive breakpoints rather than a fixed max-width shell; the
single-column layout can stay as the base/mobile-portrait case, but
should reflow (e.g. wider content area, multi-column street/house
layout, or a persistent sidebar for streets on wider screens) rather
than just stretching the same narrow column across a big screen.
Deploy to Vercel or Firebase Hosting — NOT done yet, no hosting config
in the repo. Next step once ready to ship.
Features already designed in sidewalk.jsx (port all of these)
Sign up / log in (currently a placeholder name-only flow — needs real
Firebase Auth with email verification)
Sign-in flow: campaign list (create/select) > that campaign's canvass
list, each canvass showing street/door counts — DONE. An account can
run canvasses for several different campaigns; each gets its own
canvass list, gated by the same campaigns/{id}/members Firestore rules
Create a campaign or canvass, rename either inline (tap the name in its
own header)
Delete a campaign or canvass — cascades through everything under it
(streets/houses, or canvasses/streets/houses), gated behind re-entering
the account password (Firebase reauthentication), not just a plain
confirm
Add streets to a canvass, rename them inline, delete with confirmation
Add houses to a street: single entry, or bulk import via pasted list or
CSV/TXT file upload (plain house-number list, one street at a time),
deduping against existing numbers
Canvass-wide voter list import: upload a real multi-column CSV
(first_name, last_name, house_number, street, city, state, phone,
email) with no street pre-selected — houses are grouped by street
automatically (creating streets that don't exist yet), sorted by house
number, deduped against what's already logged, with name/phone/email
folded into each house's notes
Per-house: four status icons (supporter/undecided/not supporting/not
home — custom SVG icons, colors green/yellow/red/gray, black outlines),
a lawn-sign toggle (custom icon, not a generic flag), a follow-up flag,
and expandable notes
Delete a house with confirmation
Filter a street's house list to just follow-ups
Results panel: stacked bar + percentages (supporter/undecided/not
supporting/not home, lawn signs, follow-ups), toggle between "this
street" and "whole canvass"; the campaign page has its own results
panel aggregating every canvass in the campaign (+ street count)
CSV export, per-canvass (with per-status-category filters), and "export
everything"
Make a canvass shareable: generates a join code, guests join via that
code + a display name (no account) and all their logging goes into that
one shared canvass
Log out
Map view: geocode each house's address (server-side, rate-limited Cloud
Function), plot color-coded pins with Leaflet.js + OpenStreetMap tiles
Boundary layer overlays on the map: upload a ward, riding, poll
division, or any other district file (GeoJSON, KML, or zipped
Shapefile — not tied to any one country's electoral geography, since
the goal is any candidate anywhere), toggle each on/off. Parsed and
size-capped client-side, stored per canvass; members can upload/
delete, guests can see them
Home-screen installability: manifest.json, branded app icons, theme
color, minimal service worker (no offline caching yet)
Features discussed but NOT yet built anywhere (build these next)
Offline-first sync: queue edits locally when there's no connection,
sync when it returns, with a visible "unsynced" indicator. Requires a
service worker + IndexedDB — only works once actually deployed to a real
domain.
Team progress dashboard: for a campaign manager — doors knocked per
volunteer, per day, across all of a campaign's canvasses. A Firestore
aggregation query once real multi-user accounts exist.
Design language (keep this consistent)
Strictly black/white/gray monochrome, color used ONLY for the four
status faces (green/yellow/red/gray) — never as general UI accent color
Font: Helvetica Neue / Helvetica / Arial / sans-serif stack
"Chunky" cards: a solid black rectangle offset a few pixels behind
white bordered cards/buttons, for a hard-shadow sticker effect
Rounded pill chips for streets, rounded number chips for house numbers
Faces are pale gray ghost outlines until tapped, then pop to full color
Lawn sign icon: a custom sign-on-two-posts glyph, not a flag
Not Home icon: a plain house silhouette with an X through it
The whole app follows a "canvass = chat, street/house entry = compose
bar" metaphor, echoing a ChatGPT-style new-chat pattern
Known open decisions (ask the user, don't assume)
Free vs. paid for campaigns using it — currently free (see Terms of
Service, Section 9), with the right reserved to introduce fees later.
Whether to build the lean MVP first (auth + core canvassing + sharing,
skip map/offline/dashboard) or the full feature set before shipping —
the lean path was recommended: ship, get one real campaign using it,
then decide what to build next based on actual use

=====================================================================
UPDATE — security hardening, sign-up/legal, routing fix (this phase)
=====================================================================
Everything below was built and pushed to git branch
claude/nextjs-firebase-setup-htzzrx across one long session. Read this
whole section before assuming anything about current state — several
things are CODED but NOT YET DEPLOYED (see "Deploy status" below,
which is the single most important thing to check first).

### Security hardening (full audit + fixes)
- shareCodes/profiles collections: split `allow read` into `allow get`
  only, closing an enumeration hole (allow read also grants list/query).
- Stored XSS in map popups (map-view.tsx): bindPopup() was passed raw
  HTML strings; fixed by building a real DOM node with .textContent.
- CSV formula injection: cells starting with =+-@ or tab/CR get a
  leading single-quote prefix (lib/csv.ts, OWASP-recommended mitigation).
- Map overlay upload: added a raw-file size cap (20MB) before parsing.
- Email verification enforcement: Firestore rules now require
  request.auth.token.email_verified == true (isVerified()) for all
  member/manager access — previously only enforced client-side by
  VerifyEmailScreen, bypassable via direct SDK calls.
- Delete-recency check: campaign/canvass/member deletes require
  recentlyReauthenticated() (auth_time within 300s) in Firestore rules,
  not just a client-side password modal — auth.ts's reauthenticate()
  calls getIdToken(true) to force a fresh token immediately after.
- Join rate limiting: joinCanvassByCode (Cloud Function) now calls
  checkJoinRateLimit() — 8 attempts per 10-minute window per uid, via a
  Firestore transaction on joinAttempts/{uid}. New joinAttempts
  collection rule: allow read, write: if false (deny all — only the
  Cloud Function's Admin SDK touches it).
- Timing-safe invite token comparison: acceptInvite uses
  crypto.timingSafeEqual (timingSafeStringEqual helper) instead of !==.
- Content-Security-Policy: nonce-based CSP via proxy.ts (NOT
  middleware.ts — see "Non-standard Next.js version" note below). Every
  route in the app must be dynamically rendered (export const dynamic =
  "force-dynamic" + await connection() from next/server in a thin
  server-component page.tsx) for the nonce to reach that page's
  scripts — a statically-prerendered page breaks under this CSP with
  every script (including Next's own chunks) refused. This has bitten
  us more than once when adding new routes — don't forget it.
- 18+ age gate at sign-up: birthday is now a required field;
  isAtLeast18() blocks account creation (calendar-based, not just year
  subtraction) with a clear error. Self-attested, not ID-verified —
  same as virtually every consumer platform.

### Sign-up now collects real profile data
First/last name, phone, birthday (see age gate above), organization/
campaign name, role (dropdown). Stored in a NEW profiles/{uid}
Firestore doc (lib/profile.ts) — this collection existed in the rules
before but was unused; now it's real. Auth displayName is also set.
Campaign dashboard header now greets by first name (falls back to
email for accounts that predate this feature and have no profile doc
yet). Sign-up form is responsive: fields pair up side-by-side from the
md: breakpoint instead of stacking one-per-row on a wide screen.

### Terms of Service + Privacy Policy — live pages, required checkbox
- /terms and /privacy are real routes (LegalLayout component, numbered
  sections, jump nav) — same dynamic-rendering requirement as above.
- Entity: "Sidewalk Strategy". Governing law: Ontario, Canada.
- Linked from the landing page footer AND required at sign-up: a
  checkbox ("I agree to Sidewalk's Terms of Service and Privacy
  Policy") is part of signupReady — the SIGN UP button is disabled
  until it's checked. This was upgraded from passive footer text after
  the user couldn't find/see the text version.
- THESE ARE DRAFTS. Explicitly flagged to the user multiple times: not
  a substitute for a real lawyer, especially given this is a political
  canvassing tool touching election/privacy law across potentially
  many jurisdictions. Do not treat as final without that review.
- Copyright line added to landing page footer: "Copyright © 2026
  Sidewalk Strategy - All Rights Reserved" (small, light gray, bottom
  of page).

### Real logo + favicon (replaced the placeholder "S")
The user's actual logo (a black 3-layer "stacked diamond/chevron"
mark) is at sidewalk-app/web/public/logo-mark.png — got there by
having the user upload it directly to the GitHub repo web UI, since
this remote session cannot pull files from Google Drive links or
extract bytes from images pasted into chat (both are hard
environment limitations, confirmed by testing, not just unconfigured).
All icon assets (favicon.ico, icon-192/512, apple-touch-icon,
maskable) are generated FROM this real file via a Playwright-render +
composite script (not hand-drawn) — bare mark on transparent
background for the browser favicon/app icons (no white card/border —
an earlier version had one and the user asked for it removed), full
mark inverted to white on solid black for the maskable icon (needs a
filled background for Android's icon masking). The Logo component
(next to "SIDEWALK" wordmark) renders this same file via a plain
<img src="/logo-mark.png">.

### Routing fix: campaigns/canvasses now have real URLs
Previously the entire signed-in app lived at "/" with which
campaign/canvass was open tracked only in AppShell's React state —
refreshing always dropped back to the campaign list, since the URL
never changed. Fixed with real routes:
  /campaigns
  /campaigns/[campaignId]
  /campaigns/[campaignId]/canvasses/[canvassId]
Each is a thin async server page.tsx (dynamic="force-dynamic" +
await connection(), per the CSP requirement above) delegating to a
"use client" component. A shared useAuthGate() hook (lib/use-auth-gate.ts)
re-checks auth on each of these routes and bounces to "/" if the
visitor doesn't belong there (signed out, anonymous, or unverified).
"/" itself now redirects a fully-authed member into /campaigns instead
of rendering AppShell directly — AppShell was deleted, no longer used.
Guest/volunteer flow (GuestCanvassScreen, anonymous auth via share
code) is untouched — still lives entirely at "/", no deep navigation
needed since a guest is locked to one canvass anyway.

### Follow-up flags + lawn signs now have visible counts
revisitCount and lawnSignCount are maintained as live Firestore
counters on both street and canvass docs (same increment/decrement
pattern as the pre-existing houseCount/doorCount) — updated via
dedicated toggleHouseRevisit / toggleHouseLawnSign functions (split out
of the generic updateHouse, which can't compute a delta). Red badges
showing the flagged count now appear in StreetNav (per street), the
canvass header, and campaign-screen's canvass cards. CSV export gained
a "Lawn signs" category alongside the status-based ones. Caveat: houses
that were already flagged before this shipped won't count until
toggled again — the counters only track changes going forward, no
backfill was possible from this environment (no admin DB access).

### A landing page now exists (signed-out users see this first)
Marketing copy + Sign Up/Log In/Join-by-code buttons before the actual
auth form (components/landing-screen.tsx). AuthScreen gained
initialMode/initialScreen/onBack props to support this entry flow. A
"running tally" of site-wide stats (campaigns/accounts/doors/lawn
signs) was built, then explicitly REMOVED at the user's request — if
asked to re-add it, the pattern (computeGlobalStats Cloud Function on
a schedule, aggregation count()/sum() queries, public-read stats/global
Firestore doc) is fully designed and was verified working before
removal; just re-derive it rather than starting from scratch.

### Profile menu + header spacing
campaign-screen.tsx header: "Hi {email}" text + separate "Log out" link
replaced with a profile icon (initials avatar, components/profile-menu.tsx)
whose dropdown shows name/email/Log out. Top padding increased (was
sitting flush against the viewport edge).

### Non-standard Next.js version — READ AGENTS.md BEFORE ROUTING/CSP WORK
This Next.js install (16.3.1) has undocumented-to-training-data breaking
changes. Two concrete ones hit this session: (1) middleware.ts is
actually named proxy.ts, exported function named proxy not middleware;
(2) nonce-based CSP requires per-request dynamic rendering — a
statically prerendered page gets zero nonce and every script breaks.
AGENTS.md instructs consulting node_modules/next/dist/docs/ before
writing routing/rendering code — this is not optional, it has caught
real bugs mid-session (twice).

### DEPLOY STATUS — check this before doing anything else
Everything above is committed and pushed to
claude/nextjs-firebase-setup-htzzrx. As of this note:
- Cloud Functions (join rate limiting, timing-safe compare): NEVER
  DEPLOYED this session despite being coded — user needs to run
  `cd sidewalk-app/sidewalk-functions && firebase deploy --only functions`
  themselves. This remote environment's network policy hard-blocks
  auth.firebase.tools, so this cannot be done from within a Claude
  session running here — confirmed, not just untried.
- Firestore rules (email verification, delete-recency, joinAttempts
  deny-all): user has been walked through pasting into the Firebase
  Console rules editor multiple times; NOT CONFIRMED published as of
  last check. Always re-verify rather than assuming.
- Vercel: assumed to auto-deploy from this branch on push, but this
  was NEVER independently confirmed — the user reported seeing a stale
  build once (missing a feature that was definitely pushed). Check the
  Vercel dashboard's latest deployment commit hash against
  `git log --oneline -1` on this branch before trusting anything is
  actually live.
- No end-to-end real sign-up has ever been completed FROM THIS SESSION
  — this remote sandbox's network cannot complete real Firebase Auth
  calls (confirmed via direct testing: both signUp and
  signInWithPassword hang then fail with net::ERR_FAILED after ~12s,
  reproduced on the app's pre-existing login flow too, so it's an
  environment limitation, not a bug introduced here). The user needs to
  be the first real test of the full sign-up → verify → profile →
  dashboard flow.
- Legal pages (/terms, /privacy) are live in the sense that the code is
  deployed once Vercel picks up the branch, but the CONTENT is a draft
  pending real legal review — flagged repeatedly, do not let this
  quietly get treated as finished.
