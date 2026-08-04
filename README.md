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

## Optional external services

Copy `.env.example` to `.env.local`. The app works without these values and keeps contacts locally.

- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, apply `supabase/schema.sql`, and enable anonymous sign-ins in Supabase Auth to enable private cloud sync. The schema includes owner-scoped Row Level Security policies.
- Set either `QRZ_USERNAME`/`QRZ_PASSWORD` or `HAMQTH_USERNAME`/`HAMQTH_PASSWORD` in Vercel to enable `/api/callsign`. Credentials are used only by the serverless function and are never bundled into the browser.

Youth users should be represented with callsigns or non-identifying aliases. The application does not require names, dates of birth, email addresses, or other youth-identifying data.

## Project evidence

- `docs/requirements-traceability.md` maps the SRS and diagrams to implementation and verification evidence.
- `docs/alpha-testing.md` records automated and manual alpha checks.
- `docs/beta-test-plan.md` provides the required real-user testing plan without fabricating results.

Live project: <https://loggrapp-dev.vercel.app>
