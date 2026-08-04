# Alpha testing record

## Automated tests

Run `npm test`, `npm run lint`, and `npm run build`. Record the command output or screenshot with the assessment evidence after each material change.

## Manual test table

| ID | Test data/action | Expected result | Actual result | Status |
|---|---|---|---|---|
| A01 | Search and select an Australian POTA park | Valid park resolves and session can start | To be recorded by student | Pending |
| A02 | Type an unselected/invalid park reference | Clear validation prevents session start | To be recorded by student | Pending |
| A03 | Enter invalid callsign `ABC`, 20m frequency `7.100`, SSB RST `599` | Field-specific callsign, frequency and RST errors | Covered by automated validation test | Pass |
| A04 | Start Guided mode and add a valid contact | Three steps appear in order; valid contact saves | To be recorded by student | Pending |
| A05 | Add contact with coordinates and a selected POTA park | Contact appears in log/on globe and P2P arc is shown | To be recorded by student | Pending |
| A06 | Switch active operator and add contact | Contact/report names the selected operator alias | To be recorded by student | Pending |
| A07 | Edit band/RST on an existing contact | Same contact ID updates without adding another row | To be recorded by student | Pending |
| A08 | Delete contact and confirm | Contact disappears and statistics decrease | To be recorded by student | Pending |
| A09 | Add a contact, reload, disconnect network, reload again | Active session and contacts recover locally; offline state shown | To be recorded by student | Pending |
| A10 | End session and export ADIF | Summary totals are correct and `.adi` downloads | ADIF structure covered by automated test; download pending | Partial |
| A11 | Re-enter same callsign/band/mode inside selected cooldown | Duplicate warning appears; cancel or save-anyway works | Duplicate logic covered by unit test; UI pending | Partial |
| A12 | Use at 390px and 1024px viewport widths | Controls remain readable without clipped content | To be recorded by student | Pending |

Keep breakpoint screenshots, browser console evidence, and corrected before/after results as Criterion 8 evidence. Do not mark pending scenarios as passed until they have actually been run.

