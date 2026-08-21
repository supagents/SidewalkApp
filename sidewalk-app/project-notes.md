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
CSV/TXT file upload, deduping against existing numbers
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
Free vs. paid for campaigns using it
Whether to build the lean MVP first (auth + core canvassing + sharing,
skip map/offline/dashboard) or the full feature set before shipping —
the lean path was recommended: ship, get one real campaign using it,
then decide what to build next based on actual use
