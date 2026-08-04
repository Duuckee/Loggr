# Loggr requirements traceability

This matrix connects the supplied SRS, context diagram, Level 1 data-flow diagram, and detailed design to the implemented solution. “Configured” means the feature is complete but requires the owner’s service credentials or database policies.

| ID | Requirement | Implementation evidence | Verification |
|---|---|---|---|
| FR01 | Log date/time, callsign, band, frequency and signal reports | `AddContactModal.jsx`, session contact records | Validation and ADIF tests |
| FR02 | Automatically fill UTC date/time | Contact timestamp generated as ISO UTC; dashboard/report render UTC | ADIF test asserts date/time |
| FR03 | Callsign validation and QRZ/HamQTH lookup | `validation.js`, `callsign.js`, `api/callsign.js`; cached for offline use | Callsign tests; live provider requires configured credentials |
| FR04 | Duplicate detection with cooldown | `findDuplicate`; configurable whole-session/5/10/30/60-minute window and save override | Duplicate unit test |
| FR05 | Edit and delete contacts | Dashboard row actions; App immutable update/delete handlers | Manual alpha scenarios A07-A08 |
| FR06 | Autosave and database upload | `storage.js` saves every active update in an account-scoped store; `sync.js` uses the signed-in Supabase owner and owner-scoped RLS | Storage isolation/migration tests; manual reload/offline check |
| FR07 | Easy/normal and activator/hunter modes | Session setup and live session controls; guided three-step form | Manual alpha scenario A04 |
| FR08 | ADIF export | `adif.js` includes ADIF/POTA/QSO fields | ADIF unit test |
| FR09 | Multi-operator support | Multiple aliases/callsigns per session; active operator attributed per contact; report totals | Manual alpha scenario A06 |
| NFR01 | Usable, attractive UI | High-contrast responsive Modern Globe design, labelled controls, reduced-motion support | Browser/mobile visual check |
| NFR02 | Fast response | Local POTA search, local writes, deferred cloud sync, cached callsign data | Production build and beta timing task |
| NFR03 | Competition-portal-compatible ADIF | ADIF 3.1.4 header, standard QSO and POTA fields | ADIF unit test; final portal upload remains a beta task |
| C01 | No youth-identifying information | Aliases/callsigns only; explicit setup warning; no age/email/name fields | Data model inspection |
| C02 | Offline operation | Local persistence, cached lookup data, network status, service worker runtime caching | Manual alpha scenario A09 |
| C03 | Secure transfer/storage | HTTPS services; passwords in Supabase Auth only; server-side provider secrets; explicit grants and owner-scoped RLS | Account/schema tests and configuration review before deployment |
| USER 1 | Username/password accounts | `AuthLanding.jsx`, `auth.js`, Supabase Auth profile trigger; internal identifier is never shown | Username/password validation tests; manual create/sign-in/sign-out scenarios |
| USER 2 | Public and linked Scout accounts | `profiles.account_type`, group join-code workflow, `ProfilePage.jsx` | Schema role test; manual group join/leave scenario |
| USER 3 | Group and local admin | `groups`, `group_memberships`, protected group RPCs; local-admin member list/removal | Schema/RLS inspection; manual local-admin scenario |
| USER 4 | Leaderboard admin | Protected `leaderboard_admin` enum role assigned only through trusted SQL | Schema role test; privilege review |
| USER 5 | Rank users by QSOs logged | `get_leaderboard` aggregate RPC and `Leaderboard.jsx` all-time/month/week views | Schema/RPC test; manual multi-account ranking scenario |
| DFD 1.0 | Contact validation/storage | Validation module and contact store | Unit and manual tests |
| DFD 2.0 | Callsign lookup/cache | Serverless provider fallback and 30-day browser cache | Provider/configuration test |
| DFD 3.0 | Session management/POTA validation | Session state/store and bundled POTA park index | Manual alpha scenarios A01-A02 |
| DFD 4.0 | Dashboard/statistics/reports | Globe dashboard, contact log, live statistics, end-of-session breakdown | Manual alpha scenarios A05/A10 |
| DFD 5.0 | ADIF export | Browser `.adi` download for manual POTA upload | ADIF unit test |
| DFD 6.0 | Guided mode | Three clear steps, field-level feedback, beginner tip | Manual alpha scenario A04 |

## Deliberate boundaries

- Automatic upload to the POTA portal remains out of scope exactly as specified; the user uploads the exported ADIF manually.
- The bundled POTA dataset validates Australian parks offline. Expanding to worldwide parks requires additional official datasets.
- Accounts, cloud sync and live rankings remain disabled safely until the Supabase URL/key, schema and password-auth provider are configured.
- Username-only accounts intentionally do not support email password recovery. A recovery method should be added before using Loggr beyond the current controlled prototype.
- Actual beta-test results and user feedback must be collected from real intended users; they are not invented in this repository.
