# Internal documentation and architecture rationale

## Solution structure

Loggr uses React functional components because the interface is a state-driven browser application. Composition and pure functions are more relevant here than inventing class inheritance: `App` owns session state; screen components receive explicit data and callbacks; pure library modules validate, transform, store, synchronise, and export that data. Three.js objects are used where object-oriented scene graphs are genuinely relevant.

## Data types and structures

- **Strings:** callsign, band, mode, RST reports, operator alias, park reference, notes, and ISO UTC timestamps. Strings preserve exact radio identifiers and leading report digits.
- **Numbers:** latitude, longitude, frequency, cooldown minutes, and computed counts. Numeric coordinates are required by Three.js and range validation.
- **Booleans:** `isP2p` and online/configuration states represent two-state decisions directly.
- **Arrays:** ordered session contacts and operators support append, filter, map, report, and export operations.
- **Objects/records:** each contact and session keeps related fields together under a stable UUID, matching the SRS data dictionaries.
- **Set/Map:** `Set` calculates unique callsigns/bands efficiently; the POTA `Map` provides direct reference lookup.

## Data sources

- **User input:** contact/session form data; existence, format, range, and consistency checks are applied before storage.
- **Browser clock/network:** ISO UTC timestamps and connection status; UTC avoids daylight-saving/time-zone ambiguity.
- **Bundled POTA Australia dataset:** fast, deterministic park validation while offline.
- **QRZ/HamQTH:** optional server-side callsign details; credentials stay off the client and results are cached.
- **LocalStorage:** active/archived sessions and settings; selected for reliable offline recovery in modern browsers.
- **Supabase:** optional durable cloud copy over HTTPS; anonymous auth plus owner-scoped Row Level Security avoids collecting identity data.

## Main code structures

- `validation.js`: pure validation and duplicate-detection functions, kept independent for straightforward alpha testing.
- `storage.js`: defensive JSON read/write functions; failures return safe fallbacks so storage restrictions cannot crash the UI.
- `callsign.js` and `api/callsign.js`: cache-first client lookup plus server-side provider fallback.
- `sync.js`: local-first synchronisation boundary; contacts are reconciled after session upsert.
- `adif.js`: deterministic conversion of internal contact records to ADIF 3.1.4 fields.
- `Globe.jsx`: lifecycle-managed Three.js scene, markers, arcs, pointer input, rendering loop, and cleanup.

Naming follows JavaScript conventions: PascalCase components, camelCase variables/functions, UPPER_SNAKE_CASE constants, descriptive Boolean `is…` names, and stable lower-case database columns. Comments explain non-obvious intent and trade-offs rather than restating syntax.

