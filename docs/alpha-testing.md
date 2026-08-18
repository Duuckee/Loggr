# Alpha testing record

## Automated tests

Run `npm test`, `npm run lint`, and `npm run build`. Record the command output or screenshot with the assessment evidence after each material change.

### Latest recorded run — 18 August 2026

| Check | Result | Notes |
|---|---|---|
| `npm test` | Pass | 9 test files passed, including domain/OOP, Guided-step validation, park existence, storage, API, globe and export coverage. |
| `npm run lint` | Pass | ESLint reported no errors. |
| `npm run build` | Pass | Vite production build completed successfully with 100 modules transformed. The POTA dataset remains a deliberately separate large chunk. |

This run found and corrected explicit-extension errors in the Node ESM dependency chain and an invalid park fixture (`AU-0001` was replaced with existing park `AU-0002`). These corrections are debugging evidence, not hidden failed attempts.

## Manual test table

| ID | Test data/action | Expected result | Actual result | Status |
|---|---|---|---|---|
| A01 | Search and select an Australian POTA park | Valid park resolves and session can start | To be recorded by student | Pending |
| A02 | Type an unselected/invalid park reference | Clear validation prevents session start | To be recorded by student | Pending |
| A03 | Enter invalid callsign `ABC`, 20m frequency `7.100`, SSB RST `599` | Field-specific callsign, frequency and RST errors | Covered by automated validation and Guided-step tests | Pass |
| A04 | Start Guided mode and add a valid contact | Three steps appear in order; valid contact saves | To be recorded by student | Pending |
| A05 | Add contact with coordinates and a selected POTA park | Contact appears in log/on globe and P2P arc is shown | To be recorded by student | Pending |
| A06 | Switch active operator and add contact | Contact/report names the selected operator alias | To be recorded by student | Pending |
| A07 | Edit band/RST on an existing contact | Same contact ID updates without adding another row | To be recorded by student | Pending |
| A08 | Delete contact and confirm | Contact disappears and statistics decrease | To be recorded by student | Pending |
| A09 | Add a contact, reload, disconnect network, reload again | Active session and contacts recover locally; offline state shown | To be recorded by student | Pending |
| A10 | End session and export ADIF | Summary totals are correct and `.adi` downloads | ADIF structure covered by automated test; download pending | Partial |
| A11 | Re-enter same callsign/band/mode inside selected cooldown | Duplicate warning appears; cancel or save-anyway works | Duplicate logic covered by unit test; UI pending | Partial |
| A12 | Use at 390px and 1024px viewport widths | Controls remain readable without clipped content | To be recorded by student | Pending |
| A13 | Create two username accounts, sign out/in between them | Each account restores only its own active/archive data | Storage isolation covered automatically; browser flow pending | Partial |
| A14 | Create a group and join from a second account with its code | Creator becomes local admin; second account becomes linked Scout user | Schema role coverage; browser flow pending | Partial |
| A15 | Sync different QSO totals from two opted-in accounts | Leaderboard orders users by QSO total; privacy toggle removes a user | RPC/schema coverage; live Supabase test pending | Partial |

Keep breakpoint screenshots, browser console evidence, and corrected before/after results as Criterion 8 evidence. Do not mark pending scenarios as passed until they have actually been run.
