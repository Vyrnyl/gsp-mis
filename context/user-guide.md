# GSP Management Information System — User Guide

**Girl Scouts of the Philippines — Membership, Activities & Administration Portal**
Version 1.0 · 2026-07-25

---

## 1. Introduction

The GSP Management Information System is a web portal for running Girl Scouts of the
Philippines council and troop operations online: membership registration and approval,
events and attendance, badges and achievements, announcements, finances, reports, and
analytics — all under role-based access so each person only sees and does what their
role allows.

The system serves three roles:

| Role | Who they are | Focus |
| --- | --- | --- |
| **Administrator** | Council/system staff running the platform | Full access — membership, events, finance, users, system settings |
| **Executive Council** | Council leadership overseeing operations | Approvals, monitoring, reporting, analytics, announcements |
| **Troop Leader** | Leader of a single troop | Their troop's members, attendance, activity reports, badges |

Every screen adapts to the signed-in role automatically — there is no way to view another
role's data by changing a menu or a URL. Access is enforced on the server, not just hidden
in the menu.

---

## 2. Getting Started

### 2.1 Creating an account (Sign Up)

Open the portal and select the **Sign Up** tab on the login screen, then choose your role.
Each role collects different account details:

| Field | Troop Leader | Executive Council | Administrator |
| --- | --- | --- | --- |
| First / Last name | ✅ | ✅ | ✅ |
| Email address | ✅ | ✅ | ✅ |
| Password (8+ characters) | ✅ | ✅ | ✅ |
| Troop number | ✅ | — | — |
| Primary scout level | ✅ | — | — |
| Home council | ✅ | — | — |
| Council name | — | ✅ | — |
| Region | — | ✅ | — |
| Council code | — | ✅ | — |
| Employee ID | — | — | ✅ |
| Admin secret key | — | — | ✅ (issued by IT/system owner) |

> A new account is created immediately and signs you in — but a Troop Leader or
> Executive Council signup is not yet linked to a real troop/council record. An
> Administrator must assign you to your troop/council afterward (**Councils & Troops**
> screen) before troop- or council-scoped data (dashboard, roster) will show anything.

### 2.2 Logging in

Enter your email and password on the **Log In** tab and select your role. If your
credentials are wrong, the system shows a generic "Invalid email or password" message —
it never reveals whether the email itself exists, as a security precaution.

### 2.3 Forgot your password?

Click **Forgot password?** on the login screen and enter your email. If the address is
registered and active, you'll receive an email with a one-time reset link that expires in
**1 hour** and can only be used **once**. For privacy, the on-screen message is identical
whether or not the email is actually registered — this prevents outsiders from using the
form to discover valid accounts.

Opening the link takes you to a page to set a new password (minimum 8 characters).
Completing a reset **signs you out of every device** you were previously logged into, as
a security measure — sign back in with the new password afterward.

### 2.4 Signing out

Use **Sign out** at the bottom of the sidebar. This ends your session on this device; it
does not affect other devices unless you've just completed a password reset.

---

## 3. Navigating the Portal

- **Sidebar** — grouped into Main, Activities, Administration, and Account sections.
  Only the items your role has permission for appear; everything else is hidden, not just
  disabled.
- **Topbar** — page title, and a notification bell with your personal notifications.
- **My Profile / Settings** — always in the Account section at the bottom; Settings only
  appears for Administrators.
- **Mobile / tablet** — below 900px the sidebar collapses behind a menu button; tap it to
  open an overlay panel, tap the backdrop or press Escape to close it.
- **Direct links** — if you paste or bookmark a URL for a screen your role can't use,
  you're redirected back to the Dashboard rather than shown an error.

---

## 4. Roles & Permissions (RBAC)

Access is controlled by a fixed set of **permissions**, and each role is granted a fixed
list of them. A user has exactly one role. This table is the authoritative reference for
what each role can see and do anywhere in the system.

| Permission | What it governs | Administrator | Executive Council | Troop Leader |
| --- | --- | :---: | :---: | :---: |
| `members:read` / `write` | View & register/edit members | ✅ | ✅ | ✅ |
| `members:approve` | Approve/reject pending registrations | ✅ | ✅ | ❌ |
| `members:archive` | Archive/restore a member | ✅ | ✅ | ❌ |
| `organizations:read` | Browse councils/troops/levels/categories | ✅ | ✅ | ✅ |
| `organizations:write` | Create/edit/delete councils/troops/levels/categories | ✅ | ❌ | ❌ |
| `events:read` | View events, register/mark attendance | ✅ | ✅ | ✅ |
| `events:write` | Create/edit/delete events | ✅ | ❌ | ❌ |
| `attendance:read` | View attendance | ✅ | ✅ | ✅ |
| `attendance:write` | Register participants & mark attendance | ✅ | ❌ | ✅ |
| `badges:read` | View badge catalog & progress | ✅ | ✅ | ✅ |
| `badges:write` | Manage catalog / record earned badges & achievements | ✅ (catalog + record) | ❌ | ✅ (record only) |
| `badges:verify` | Verify an earned badge | ✅ | ❌ | ❌ |
| `activity-reports:read` | View activity reports | ✅ | ✅ | ✅ |
| `activity-reports:write` | Submit an activity report | ✅ | ❌ | ✅ |
| `finance:read` | View payments, expenses, summaries | ✅ | ✅ | ❌ |
| `finance:write` | Record payments/expenses, manage fee types | ✅ | ❌ | ❌ |
| `reports:read` | Generate/view reports | ✅ | ✅ | ✅ (scoped) |
| `reports:export` | Export a report to PDF/Excel | ✅ | ✅ | ❌ |
| `analytics:read` | View the Analytics dashboard | ✅ | ✅ | ❌ |
| `notifications:read` | Personal notification bell/history | ✅ | ✅ | ✅ |
| `announcements:write` | Post a council announcement | ✅ | ✅ | ❌ |
| `users:manage` | Create/edit/deactivate/delete portal users | ✅ | ❌ | ❌ |
| `settings:manage` | Edit system settings, run backups | ✅ | ❌ | ❌ |
| `audit-logs:read` | View the audit log | ✅ | ❌ | ❌ |

Notes:
- The **Administrator** holds every permission.
- **Membership** data (register, edit) is open to all three roles because troop leaders
  are the primary source of new registrations; **approval and archiving** require Executive
  Council or Administrator judgment.
- **Attendance and badge recording** are hands-on troop-level tasks, so Troop Leaders can
  do them; **Executive Council is read-only / monitoring-only** across Events, Attendance,
  Badges, and Finance.
- **Financial Tracking, Analytics, Settings, and User Management** are not visible to
  Troop Leaders at all.
- **Report Generation** is visible to everyone, but a Troop Leader can only generate
  Membership, Attendance, Badge, and Activity reports for their own troop — **Financial**
  and **Executive** report types are Administrator/Executive Council only, and exporting
  (PDF/Excel) is restricted to Administrator and Executive Council.

---

## 5. Module Guide

### 5.1 Dashboard

Landing page after login. Content is chosen by your role — never by anything you can
control on screen:

- **Administrator** — org-wide stat cards, a 6-month Membership Growth chart, a Members
  by Status donut, a Recent Activity feed, and a Troops Overview list.
- **Executive Council** — council-scoped stat cards, the same Troops Overview, and a
  Membership by Scout Level breakdown.
- **Troop Leader** — troop-scoped stat cards, "My Troop" roster, and the same Scout Level
  breakdown for their own troop.

If a Troop Leader account hasn't been assigned to a troop yet (see §2.1), the dashboard
shows a "No Troop Assigned" message instead of numbers — this is expected, not an error;
ask an Administrator to link the account under **Councils & Troops**.

### 5.2 Councils & Troops (`Organizations`)

Browsable by everyone; only Administrators see the Add/Edit/Delete controls. Five tabs:

- **Councils** — name, description
- **Troops** — troop code, name, parent council, assigned leader
- **Scout Levels** — the age-band ladder (Twinkler → Cadet, extendable), with a display
  order
- **Badge Categories** — groupings used by the Badges catalog
- **Activity Categories** — groupings used when creating Events

Deleting a council, troop, or category is blocked if anything still references it (e.g. a
troop with members, a category with badges) — resolve or reassign those first.

### 5.3 Membership Registry (`Members`)

Every role can register a new member and edit existing ones, and the registry shows
members across **all** troops (it is not narrowed to your own troop). The **one
registration form** handles both member types — pick **Scout** or **Adult Leader** at the
top; the Scout Level field only appears (and is only required) for scouts.

Required fields: First name, Last name, Birthdate, Troop, and Scout Level (scouts only).
Everything else — email, phone, address, emergency contact, notes — is optional.

New registrations start in **Pending** status and do not become active until approved
(§5.4). From a member's profile you can also:

- **Renew** their membership (choose a new start/end date; this appends a new membership
  period rather than overwriting the old one — history is preserved)
- **Archive** — removes them from the active registry without deleting the record
  (Administrator/Executive Council only)
- **Restore** an archived member back to active

### 5.4 Pending Approvals (`Approvals`, Administrator + Executive Council only)

A queue of members awaiting review. Opening a row shows their full submitted profile.

- **Approve** — moves the member to Active immediately.
- **Reject** — requires a reason of at least 5 characters, so the applicant/troop leader
  knows what to fix; the reason is stored and shown on the member's profile afterward.

### 5.5 Event Management (`Events`)

Everyone can browse events (list or calendar view, with search/status/category filters).
Only Administrators can create, edit, or delete an event.

Required fields: Title, Event Date, Category. Start/End time are optional but if both are
given, End must be after Start. From an event's detail page you can also open **Manage
Attendance**, which deep-links into the Attendance screen for that event.

### 5.6 Attendance

Pick an event, then work from one combined table of registered participants:

- **Register a participant** — Administrator and Troop Leader only; opens a search
  picker limited to active members not already registered for that event.
- **Mark present/absent** — Administrator and Troop Leader only.
- Executive Council can view the same screen (stat cards + table) but has no write
  controls.

Cancelling a registration removes that member from the attendance-eligible list for the
event.

### 5.7 Activity Reports

Troop Leaders see "My Activity Reports" — only the reports they themselves submitted — and
a Submit button; Administrator and Executive Council see every troop's reports with
Submitted By/Troop columns. Executive Council is read-only here.

Submitting a report requires picking a **completed** event (the picker only offers events
whose date has passed) and writing a Summary; Participation Notes and Outcomes are
optional.

### 5.8 Badges

One screen, three tabs, plus a page-level **Record Badge** action:

- **Badge Catalog** — the master list of badges (name, category, required points,
  requirement checklist). Create/edit/delete is Administrator-only.
- **Member Progress** — a per-member table of badge status (`in_progress` / `earned` /
  `verified`). Opening a member shows their full badge list; **Verify** an earned badge
  is Administrator-only. A Troop Leader sees (and can record badges for) only **their own
  troop's** members here; Administrator and Executive Council see every troop.
- **Achievement History** — a free-form log of notable accomplishments (not tied to the
  badge catalog), e.g. delegate appointments or awards.

**Record Badge** (Administrator + Troop Leader) logs a member as `in_progress` or
`earned` against a catalog badge. A separately-recorded **Achievement** just needs a
member, a name, and a date.

### 5.9 Announcements & Notifications

- The **notification bell** (every page, every role) shows your personal alerts —
  approvals, badge verifications, and similar events addressed to you.
- **Announcements** (sidebar, Activities section) is a council-wide feed. Administrator
  and Executive Council can post (Title, Content, optional expiry date); Troop Leaders
  are read-only recipients.

### 5.10 Financial Tracking (`Finance`, Administrator + Executive Council only)

Four tabs:

- **Overview** — income-vs-expense trend, expense-by-category breakdown, budget &
  collection summary.
- **Payments** — paginated ledger; **Record Payment** (Administrator only) needs a
  Member, Fee Type, amount greater than 0, and payment date; method (cash / bank
  transfer / GCash / cheque) and status (pending / paid / refunded / cancelled) default
  to cash/paid if left alone.
- **Expenses** — paginated ledger; **Record Expense** (Administrator only) needs a
  Description, amount greater than 0, and date; category is optional free text.
- **Fee Types** — Administrator-only CRUD (e.g. Annual Membership Fee, Camp Fee). A fee
  type already used by a payment can't be deleted until reassigned.

Executive Council can view every tab but has no record/edit controls anywhere in this
module.

### 5.11 Report Generation (`Reports`)

One screen covering six report types — **Membership, Attendance, Badge, Financial,
Activity, Executive** — presented as a picker already filtered to what your role may
generate (Troop Leaders never see Financial or Executive). Choose a report type, a date
range, and optionally a Troop, then preview stat cards and a data table before exporting.

**Export to PDF or Excel** is Administrator and Executive Council only. Every export is
recorded in a **Report History** table you can revisit and re-download later.

### 5.12 Analytics (Administrator + Executive Council only)

Six tabs of aggregate, org-wide insight — **Membership**, **Attendance**, **Participation**,
**Badges**, **Financial**, **Organization** (per-troop performance) — each with stat cards
and a chart. This module is read-only; nothing here is editable.

### 5.13 Settings & System Administration (Administrator only)

Four tabs:

- **System Settings** — organization name, membership term length (months), renewal
  window (days), and whether email notifications are enabled.
- **Users & Access** — the Portal Users table (search, filter by role, pagination). **Add
  User** needs Full Name, Email, Role, and an 8+ character temporary password. From a
  user row you can edit their details/role, reset their password, activate/deactivate,
  or delete them. The system will not let you deactivate, delete, or demote the **last
  remaining Administrator** — this guard exists so the portal can never be left with no
  one able to manage it.
- **Audit Log** — a read-only, searchable, paginated record of who did what and when
  (approvals, user changes, settings changes, backups, etc.).
- **Backups** — a manual "Run Backup Now" action and a history of past runs, both sourced
  from the same audit trail.

### 5.14 My Profile (every role)

Your own account only — there's no way to view or edit anyone else's profile here (use
**Settings → Users & Access** for that, Administrator only).

- **Account Information** — edit your Full Name, Email, and Phone; Role and Member Since
  are shown read-only.
- **Change Password** — requires your current password plus a new one (8+ characters).
  An incorrect current password is rejected without changing anything.

---

## 6. Data Constraints Quick Reference

These rules are enforced on both the screen (immediate feedback) and the server (so they
can never be bypassed by skipping the form):

| Data | Rule |
| --- | --- |
| Dates | `YYYY-MM-DD`. Any "end" date must be on/after its matching "start" date (renewals, report ranges). |
| Times (events) | 24-hour `HH:MM`. End time must be after start time if both are set. |
| Passwords | Minimum 8 characters — signup, new portal users, password reset, and password change. |
| Email addresses | Must be a valid email format; must be unique per account (no two users share one email). |
| Member registration | First name, last name, birthdate, and troop are always required; Scout Level is required only for member type "Scout". |
| Rejection reason | Minimum 5 characters. |
| Money amounts (payments, expenses, fee types) | Must be greater than 0. |
| Badge required points | Whole number, 0 or higher. |
| Badge requirements | At least one requirement line. |
| Deletes with dependents | Blocked, not cascaded — e.g. a fee type in use, a troop with members, a category in use. Reassign or remove the dependents first. |

---

## 7. Troubleshooting / FAQ

**"I was sent back to the Dashboard when I tried to open a page."**
That screen isn't included in your role's permissions (§4). This is expected behavior,
not a bug — if you believe your role is wrong, ask an Administrator to check your account
under **Settings → Users & Access**.

**"A menu item I expected to see is missing."**
The sidebar only shows what your role can use. Compare against the permission table in
§4 — if it's genuinely missing for a role that should have it, that's worth reporting.

**"My Troop Leader/Executive Council dashboard shows no data."**
Your account likely isn't linked to a troop/council yet. This happens for self-signed-up
accounts (§2.1) until an Administrator assigns you under **Councils & Troops**.

**"I got signed out unexpectedly."**
Sessions expire after a period of inactivity for security. Simply log back in — nothing
is lost, since the system saves as you go (there are no unsaved drafts to lose).

**"The form won't submit / shows a red error."**
Check the specific field(s) called out — the message tells you exactly what to fix (a
missing field, an invalid email, a date out of order, etc.). See §6 for the full rule
list.

**"I can see a screen but the buttons to add/edit/delete are missing or disabled."**
That's read-only access for your role on that screen (e.g. Executive Council on Finance,
Troop Leader on Events) — viewing and doing are governed by separate permissions.

---

*This guide reflects the system as of 2026-07-25. If a screen you're using doesn't match
this description, check with your system administrator — the portal may have been
updated since.*
