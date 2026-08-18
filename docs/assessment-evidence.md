# Lesson 4 assessment evidence

This checklist maps the Lesson 4 requirements to working Loggr code and repeatable evidence. JavaScript is an object-oriented language and the project uses modern ECMAScript classes, private fields, inheritance, and method overriding.

| Lesson | Requirement | Status | Evidence and demonstration |
|---|---|---|---|
| 4.1 | Classes, objects and constructors | Met | Construct `Contact` and `LoggingSession` objects in `src/domain/models.js`. The live `App` and contact forms instantiate them. `test/domain.test.js` verifies constructor behavior. |
| 4.2 | Implement core functionality from the SRS | Met | Inline contact logging, guided/normal entry, Hunt/Stay frequency behavior, POTA search, duplicate checks, editing/deletion, offline save, sync, globe, reports, accounts and ADIF export are mapped in `requirements-traceability.md`. |
| 4.3 | Data types, structures and sources | Met | Strings, numbers and booleans model QSO fields. Arrays store contacts/operators; objects group records; `Set` calculates unique values; `Map` indexes parks/policies. Sources include bundled POTA files, user input, LocalStorage, Supabase and QRZ/HamQTH. |
| 4.4 | Inheritance | Met | `HuntFrequencyPolicy` and `StayFrequencyPolicy` extend `FrequencyPolicy`. |
| 4.4 | Encapsulation | Met | Private `#record` and `#mode` fields can only be accessed through public getters/methods. Record-returning methods provide defensive copies. |
| 4.4 | Polymorphism | Met | Both policy subclasses override `nextFrequency()`. `frequencyAfterSubmit()` calls the shared method without needing to know which subclass it received. |
| 4.5 | Validation techniques | Met | Required/format checks cover callsign and RST; ranges cover frequency/coordinates; existence checks use the POTA index; consistency checks handle P2P parks and duplicates. `test/validation.test.js` covers each category. |
| 4.6 | Internal documentation | Met | Every maintained module has a purpose comment; complex algorithms have intent comments; architecture and data choices are documented in `internal-documentation.md`. |
| 4.6 | Naming conventions | Met | PascalCase classes/components, camelCase functions/variables, UPPER_SNAKE_CASE constants, `is…` booleans and lower_snake_case database fields are documented and used. |
| Project instruction | Alpha testing and debugging | Met for automated alpha | `npm test`, `npm run lint`, and `npm run build` are recorded in `alpha-testing.md`. Manual/user scenarios remain clearly identified instead of fabricated. |
| Project instruction | Monitor and annotate Gantt chart | Met | `gantt-progress.md` records actual Git-backed milestones, changes and current status. |

## Quick OOP demonstration

1. Open `src/domain/models.js` and point out the classes, constructors and private fields.
2. Open `src/domain/frequencyPolicies.js` and show the two `extends FrequencyPolicy` declarations.
3. Run `npm test`; the domain tests prove encapsulation and call the same method across both subclasses.
4. Start Loggr, select **Stay**, add a QSO and observe that its frequency remains. Select **Hunt**, add another QSO and observe that frequency clears. This is the polymorphic behavior visible in the interface.

## Evidence boundaries

Automated checks can prove deterministic code behavior. The pending manual and beta scenarios require a person, configured accounts, or live services, so they remain labelled pending until their evidence is collected.
