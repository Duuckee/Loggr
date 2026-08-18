# Loggr

Loggr is an offline-ready amateur-radio field contact logger for POTA activators, hunters, multi-operator teams, and supervised beginner/youth users. It implements the Modern Globe Map design in the supplied design folio and the functional requirements in the Loggr SRS.

## Included features

- Full QSO records: UTC date/time, callsign, band, frequency, mode, sent/received RST, operator, park, coordinates, and notes
- Local callsign validation plus server-side QRZ/HamQTH lookup with a 30-day offline cache
- Configurable duplicate detection with an explicit “save anyway” path
- Contact editing and deletion
- Automatic local persistence, session recovery, and an installable service worker for field use
- Optional Supabase synchronisation over HTTPS
- Guided three-step entry and normal fast-entry modes
- Activator/hunter roles and per-contact multi-operator attribution
- POTA park validation from the bundled Australian park dataset
- 3D contact map, P2P arcs, live statistics, session reports, and ADIF 3.1.4 export
- Natural Earth country geometry with screen-space-consistent dotted globe detail
- Username/password accounts backed by Supabase Auth (passwords never enter Loggr tables)
- Public user and linked Scout user profiles, groups, local-admin membership controls, and a protected leaderboard-admin role
- Public all-time/month/week leaderboard ranked by synced QSO count, with a per-profile privacy toggle
- Account-scoped offline sessions and archives, including one-time migration of older local logs

## Run locally

```bash
npm ci
npm run dev
```

Production checks:

```bash
npm test
npm run lint
npm run build
```

The globe geometry is already included. If its Natural Earth source or detail levels are changed, regenerate the binary assets with `npm run generate:globe`.

## Account and service setup

Copy `.env.example` to `.env.local`.

- Accounts, groups, leaderboards and cloud sync require `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Run the complete `supabase/schema.sql` in Supabase SQL Editor.
- In **Authentication → Providers → Email**, keep Email enabled and turn **Confirm email off**. Loggr converts the username into an internal Auth identifier; no real email is requested or stored.
- Create your own account in Loggr, then grant the first protected leaderboard-admin role in SQL Editor: `update public.profiles set system_role = 'leaderboard_admin' where username = 'your_username';`
- Use only a publishable/anon key in `VITE_SUPABASE_ANON_KEY`. Never put a `service_role` or secret key in a browser variable.
- Set either `QRZ_USERNAME`/`QRZ_PASSWORD` or `HAMQTH_USERNAME`/`HAMQTH_PASSWORD` in Vercel to enable `/api/callsign`. Credentials are used only by the serverless function and are never bundled into the browser.

After a first successful sign-in, cached account details and account-scoped QSO storage remain available offline. Live sign-in, registration, group changes and leaderboard refreshes require a connection.

Youth users should be represented with usernames, callsigns or non-identifying aliases. The application does not require names, dates of birth, email addresses, or other youth-identifying data.

## Project evidence

- `docs/assessment-evidence.md` maps each Lesson 4 OOP, validation and documentation criterion to code and tests.
- `docs/gantt-progress.md` records Git-backed milestones and ongoing schedule annotations.
- `docs/requirements-traceability.md` maps the SRS and diagrams to implementation and verification evidence.
- `docs/alpha-testing.md` records automated and manual alpha checks.
- `docs/beta-test-plan.md` provides the required real-user testing plan without fabricating results.

Live project: <https://loggrapp-dev.vercel.app>
