# Internal documentation and architecture rationale

## Solution structure

Loggr combines object-oriented domain code with React functional components. Domain classes own contact/session behavior and frequency policies, while React components remain responsible for rendering and user interaction. `App` owns session state; screen components receive explicit data and callbacks; library modules validate, transform, store, synchronise, and export plain records. Three.js also provides an object-oriented scene graph for the globe.

## Object-oriented design

- **Classes and constructors:** `Contact` and `LoggingSession` constructors turn input records into consistent domain objects. `FrequencyPolicy`, `HuntFrequencyPolicy`, and `StayFrequencyPolicy` construct the frequency-reset strategies.
- **Objects:** the running app creates class instances whenever contacts are saved or sessions are changed. Classes convert back to plain records for React state, LocalStorage, Supabase, and ADIF export.
- **Encapsulation:** `Contact`, `LoggingSession`, and `FrequencyPolicy` use JavaScript private `#record`/`#mode` fields. Public getters and methods expose controlled behavior, and `toRecord()` returns copies rather than the private object.
- **Inheritance:** `HuntFrequencyPolicy` and `StayFrequencyPolicy` extend `FrequencyPolicy` and share its public interface.
- **Polymorphism:** `frequencyAfterSubmit` retrieves either subclass and calls `nextFrequency()` without conditional reset logic. Hunt clears the frequency; Stay retains it.
- **Responsibility split:** domain classes manage state transitions, validation functions check user input, and UI components handle presentation. This avoids placing unrelated behavior in one large class.

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

- `domain/models.js`: encapsulated `Contact` and `LoggingSession` classes used by the live application.
- `domain/frequencyPolicies.js`: base/subclasses demonstrating inheritance and polymorphic frequency behavior.
- `validation.js`: pure validation and duplicate-detection functions, kept independent for straightforward alpha testing.
- `storage.js`: defensive JSON read/write functions; failures return safe fallbacks so storage restrictions cannot crash the UI.
- `callsign.js` and `api/callsign.js`: cache-first client lookup plus server-side provider fallback.
- `sync.js`: local-first synchronisation boundary; contacts are reconciled after session upsert.
- `adif.js`: deterministic conversion of internal contact records to ADIF 3.1.4 fields.
- `Globe.jsx`: lifecycle-managed Three.js scene, markers, arcs, pointer input, rendering loop, and cleanup.

## Naming and commenting conventions

- React components and classes use `PascalCase` (`ContactEntryForm`, `LoggingSession`).
- Variables, functions, methods, and instances use `camelCase` (`frequencyMode`, `addContact`).
- Fixed configuration constants use `UPPER_SNAKE_CASE` (`MAX_GLOBE_PITCH`).
- Boolean values use question-like prefixes such as `is…`, `has…`, or `show…` (`isP2p`).
- Database columns use stable `lower_snake_case` names (`profile_id`).
- Modules begin with a short purpose comment. Inline comments explain intent, constraints, and non-obvious algorithms rather than repeating syntax.
