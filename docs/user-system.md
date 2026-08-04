# Loggr user system

This implementation follows the supplied user-system diagram while keeping the first release limited to username/password access.

| Diagram entity | Loggr implementation | Capability |
|---|---|---|
| Public User Account | `profiles.account_type = 'public_user'` | Owns sessions/QSOs, manages its profile and may appear on the leaderboard |
| Linked ScoutUser Account | `profiles.account_type = 'scout_user'` plus `group_memberships` | Owns its own login and QSO history while being linked to one group |
| Group | `groups` and `group_memberships` | Connects one local admin with linked Scout users through an eight-character join code |
| Local Admin | `system_role = 'local_admin'` and group membership role `local_admin` | Creates the group, shares its code, reviews group QSO totals and removes linked users |
| Leaderboard Admin | `system_role = 'leaderboard_admin'` | Protected global role assigned through trusted SQL, never by the browser |
| User profile | `profiles` | Username, optional display name/callsign, account type, role and leaderboard privacy choice |

## Authentication

Supabase Auth stores and verifies passwords. The UI converts each normalized username to a stable internal Auth email identifier; the internal value is never displayed and no real email is collected. Hosted Supabase must have email/password enabled and email confirmation disabled for this username-only prototype.

## Ownership and scoring

Every `sessions.owner_id` references the signed-in Supabase user. Each QSO belongs to a session through `contacts.session_id`. `get_leaderboard` counts contacts through that ownership chain, ranks opted-in profiles by QSO count, and returns only safe public fields. The leaderboard supports all-time, current-month and current-week totals.

## Access control

- RLS restricts profiles, sessions and contacts to their owner.
- Passwords never enter `profiles`, browser storage or application logs.
- Group mutations use narrowly scoped `security definer` functions with an empty `search_path`.
- Direct table grants are revoked and replaced with the minimum required grants.
- A local admin can manage only their own group and cannot remove themselves.
- Ordinary users cannot assign or modify system roles.
- The public leaderboard reveals only opted-in usernames/display names, optional group names and aggregate counts.

## Prototype boundary

Username-only access has no email-based password recovery. Add an owner-approved recovery or supervised reset process before moving beyond the controlled prototype.
