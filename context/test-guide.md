# Manual Test Guide — Step by Step

One file: the data to type and the steps to click, together, so there's no flipping
between documents mid-test. Every value here satisfies the real Zod validation in
`apps/api/src/modules/*/*.schema.ts` as of 2026-07-25 — dates are `YYYY-MM-DD`, times are
24h `HH:MM`, passwords are 8+ chars.

Not a build-plan or progress doc — delete or ignore once you're done testing.

**Legend:** 🅐 Administrator · 🅔 Executive Council · 🅣 Troop Leader

---

## Entity Glossary — what each thing in the system actually is

Read this once before testing. It tells you what each entity *is*, whether it's a
**group of people**, a **tag/category**, an **individual record**, a **join/transaction**,
or a **derived rollup you never create by hand** — so you know what you're actually
testing when a step says "create a Troop" vs. "create a Member."

### Organizational hierarchy — the "groups"

```
Council (1) ──< Troop (many) ──< Member (many)
```

| Entity | Is it a group? | What it is | Purpose |
| --- | --- | --- | --- |
| **Council** | Administrative container, not a "join" a person visibly belongs to on screen | The top-level org unit (e.g. "Catanduanes Council") | Groups troops for reporting; scopes what an Executive Council role sees |
| **Troop** | **Yes — the real group.** This is the unit scouts/leaders belong to | A named, coded group (e.g. "Troop 12 — Virac") belonging to one Council, with one assigned leader | **The scoping boundary.** Everything troop-scoped — a Troop Leader's "my troop" roster, badge picker, activity reports — filters by this |
| **Member** | No — an individual, not a group | One person: either type **Scout** (has a Scout Level) or **Adult Leader** (no Scout Level). Belongs to exactly one Troop | The person being tracked — distinct from a **User** (see below); they can be linked (Liza Bagadiong is both a Member *and* a User) but don't have to be |

### Classification tags (not groups of people — just labels on other records)

| Entity | Tags what | Purpose |
| --- | --- | --- |
| **Scout Level** | A Member (Scout only) | Age-band/rank ladder — Twinkler → Cadet — ordered for display, used in breakdowns |
| **Badge Category** | A Badge (catalog entry) | Organizes/filters the badge catalog (e.g. "Health & Safety") |
| **Activity Category** | An Event | Classifies events (e.g. "Camping," "Training") for filtering |
| **Fee Type** | A Payment | A chargeable line item Payments are recorded against (e.g. "Camp Fee — ₱450") |
| **Member Status** | A Member's current state | pending / active / expiring / expired / archived — drives what appears in pickers (only *active* shows up in event/badge pickers) |

### Auth entities (who can log in — separate from who's a Member)

| Entity | What it is | Purpose |
| --- | --- | --- |
| **User** | A portal login account (email + password hash) | The account you sign in with. Not the same record as a Member — a User doesn't have to correspond to a scout/leader in the roster, though seeded leaders do |
| **Role** | One of exactly three: Administrator, Executive Council, Troop Leader | Assigned to a User via `user_roles` — v1 enforces **exactly one role per user** |
| **Permission** | A single granted capability (e.g. `members:write`, `badges:verify`) | Granted to a Role via `role_permissions` — this is what actually gates every button/screen in this guide's RBAC checks |

### Events, registration & attendance

```
Event ──< Event Registration >── Member
Event Registration ──< Attendance Record
```

| Entity | What it is | Purpose |
| --- | --- | --- |
| **Event** | A single dated, scheduled occurrence (camp, ceremony, training) tied to one Activity Category | What people register for and attend |
| **Event Registration** | Join record: "this Member signed up for this Event," with its own status (registered/cancelled) | The roster for one event — separate from whether they showed up |
| **Attendance Record** | Whether a registered Member actually showed (present/absent) | Created at or after the event, per registered member |
| **Attendance Summary** | An aggregated count/rate per event | **Derived** — generated from Attendance Records, never hand-created |
| **Activity Report** | A free-text write-up (summary/notes/outcomes) a Troop Leader files about one *completed* Event | One submission per submitter per event — not a group, a document |

### Badges & achievements

```
Badge ──< Badge Requirement
Badge ──< Member Badge >── Member
```

| Entity | What it is | Purpose |
| --- | --- | --- |
| **Badge** | A catalog definition (e.g. "Trailblazer") with a category and required points | The master reference list — not tied to any one member until recorded against them |
| **Badge Requirement** | One checklist line belonging to a single Badge | Defines what "earning" that badge actually requires |
| **Member Badge** | Join record: "this Member is working on / has earned this Badge," status `in_progress`/`earned`/`verified` | This is what you're actually creating when a step says "record a badge" |
| **Achievement Record** | A free-form accomplishment logged against a Member (e.g. "Leadership Summit Delegate") | Independent of the badge catalog entirely — no Badge link |

### Finance

| Entity | What it is | Purpose |
| --- | --- | --- |
| **Payment** | One transaction: a Member paying for a Fee Type, with method/status/date | The income ledger |
| **Expense** | One outgoing transaction, not tied to any Member | The spending ledger |
| **Financial Period / Financial Summary** | Aggregated income/expense/balance over a date range | **Derived** — like Attendance Summary, never hand-created |

### Reports, analytics, notifications & settings

| Entity | What it is | Scoped to |
| --- | --- | --- |
| **Report** | A generated, exportable, point-in-time snapshot (Membership/Attendance/Badge/Financial/Activity/Executive) | Saved to Report History after generation |
| **Analytics Snapshot** | A stored metric value powering the Analytics dashboards | **Derived** — never hand-created, just observed |
| **Notification** | A personal alert to exactly **one** User (e.g. "your badge was verified") | One recipient only |
| **Announcement Post** | A council-wide broadcast message | Everyone — not scoped to one user, unlike Notification |
| **System Setting** | A single global key/value config row (org name, renewal window, etc.) | The whole system — not per-user, not per-troop |
| **Audit Log** | An immutable "who did what, when" record | **Derived/read-only** — the system writes it automatically as a side effect of approvals, user changes, and settings edits; you never create one directly |

**The one relationship worth internalizing before §3–§9:** a **Council** groups **Troops**;
a **Troop** groups **Members**; a **Member** is one person who can have many
**Memberships** (enrollment periods, over time), many **Event Registrations**, many
**Member Badges**, many **Achievement Records**, and many **Payments** — but belongs to
only **one** Troop at a time. Everything else in the glossary (Scout Level, Badge
Category, Activity Category, Fee Type) is a label, not a container of people.

---

## 0. Seeded accounts & reference data

Keep this section open/pinned — you'll come back to it for every login and every select
dropdown below.

### Login accounts (already in Neon)

Password for all of them: **`GspDemo!2026`** (or your `SEED_PASSWORD` env override).

| Email | Role | Name |
| --- | --- | --- |
| `admin@gsp-catanduanes.ph` | Administrator | Marisol Tabuena |
| `council@gsp-catanduanes.ph` | Executive Council | Rosario Verceles |
| `leader.virac@gsp-catanduanes.ph` | Troop Leader (Troop 12 — Virac) | Liza Bagadiong |
| `leader.bato@gsp-catanduanes.ph` | Troop Leader (Troop 4 — Bato) | Grace Tapel |

### Existing dropdown options (seeded — pick these in selects, don't retype)

- **Council:** Catanduanes Council
- **Troops:** Troop 12 — Virac · Troop 4 — Bato · Troop 7 — San Andres (no leader yet)
- **Scout levels:** Twinkler (4–6) · Star Scout (7–9) · Junior Girl Scout (10–12) · Senior Girl Scout (13–16) · Cadet Girl Scout (17–19)
- **Badge categories:** Community Service · Outdoor Skills · Health & Safety · Leadership · Arts & Culture
- **Activity categories:** Camping · Community Outreach · Training · Ceremony
- **Fee types:** Annual Membership Fee · Camp Fee (₱450) · Uniform & Insignia (₱900) · Training Fee (₱300)
- **Badges:** Community Helper · Trailblazer · First Aider · Troop Mentor · Heritage Keeper · Camp Cook

### Seeded members, by troop (needed for role-scoped testing)

Who belongs to which troop matters — Badges and Activity Reports only show a Troop Leader
**their own troop's** members. (Members Registry and the event-registration picker are
org-wide for every role.)

| Member | Troop | Type | Status |
| --- | --- | --- | --- |
| Althea Ramos | Troop 12 — Virac | Scout (Senior) | active |
| Cristina Ople | Troop 12 — Virac | Scout (Cadet) | expiring |
| Elena Sarmiento | Troop 12 — Virac | Scout (Star) | active |
| **Liza Bagadiong** | Troop 12 — Virac | Adult leader | active *(the leader)* |
| Bea Delfin | Troop 4 — Bato | Scout (Junior) | **pending** |
| Faith Bermundo | Troop 4 — Bato | Scout (Twinkler) | active |
| **Grace Tapel** | Troop 4 — Bato | Adult leader | active *(the leader)* |
| Dana Villar | Troop 7 — San Andres | Scout (Senior) | archived |
| Marites Tuazon | Troop 7 — San Andres | Adult leader | **pending** |
| Nadine Sorreda | Troop 7 — San Andres | Scout (Junior) | expired |

Only **active** members appear in the event-registration and badge-recording pickers — so
Bea Delfin (pending), Dana Villar (archived) and Nadine Sorreda (expired) are deliberately
excluded there and are useful for testing those exclusions.

### Prep

- [ ] Keep a scratch note of anything you create this pass (new council/troop names, new
      user emails) so you can tell "test junk" from real seed data later.
- [ ] Test at least one module (e.g. Members) at **900px, 768px, 480px** — no need to
      repeat all 21 modules at every width.

---

## 1. Authentication (no login required to start)

### 1.1 Sign up — Create

**Troop Leader**
| Field | Value |
| --- | --- |
| First name | Imelda |
| Last name | Cadag |
| Email | imelda.cadag@example.ph |
| Password | Scout#2026 |
| Troop number | CAT-SOR-009 |
| Primary scout level | Junior Girl Scout |
| Home council | Catanduanes Council |

**Executive Council**
| Field | Value |
| --- | --- |
| First name | Precious |
| Last name | Molina |
| Email | precious.molina@example.ph |
| Password | Council#2026 |
| Council name | Catanduanes Council |
| Region | Region V — Bicol |
| Council code | CAT-EC-02 |

**Administrator**
| Field | Value |
| --- | --- |
| First name | Ronald |
| Last name | Buenaflor |
| Email | ronald.buenaflor@example.ph |
| Password | Admin#2026 |
| Employee ID | GSP-EMP-1044 |
| Admin secret key | *(the real `ADMIN_SIGNUP_KEY` from `apps/api/.env`, not a placeholder)* |

- [ ] Open **Sign Up**, pick **Troop Leader**, fill with the row above → submit → land
      signed-in on the Dashboard.
- [ ] Log out. Sign up as **Executive Council** using the EC row above.
- [ ] Log out. Sign up as **Administrator** using the Admin row above.
- [ ] For the new **Troop Leader**: confirm the dashboard shows **"No Troop Assigned"**
      rather than roster numbers — expected (not linked to a real troop yet, that's a 1.6
      admin action), not a bug.
- [ ] For the new **Executive Council** and **Administrator** signups: the dashboard shows
      real, non-zero numbers even though the account isn't linked to anything — also
      expected. There's no per-user council assignment yet, so both roles fall back to
      council-wide data (there's only one council in the schema/seed today). Not a bug.
- [ ] Validation: retry any one signup with a password under 8 characters → rejected.
- [ ] Validation: sign up again with an email you just used → conflict error.

### 1.2 Log in — Read

- [ ] Log in as 🅐 `admin@gsp-catanduanes.ph`. Log out.
- [ ] Log in as 🅔 `council@gsp-catanduanes.ph`. Log out.
- [ ] Log in as 🅣 `leader.virac@gsp-catanduanes.ph` (Liza). Log out.
- [ ] Log in as 🅣 `leader.bato@gsp-catanduanes.ph` (Grace). Log out.
- [ ] Negative: correct email + wrong password → generic **"Invalid email or password."**
- [ ] Negative: correct email/password but wrong role picked → still fails generically.

### 1.3 Forgot / reset password — Update

- Forgot-password email: `leader.virac@gsp-catanduanes.ph`
- Reset form new password: `NewPass#2026`

- [ ] Log out. Click **Forgot password?**, enter the email above.
- [ ] Confirm the on-screen message is identical whether or not the email is real — try
      once more with a fake address and compare wording.
- [ ] Open the reset email, follow the link, set the new password from above.
- [ ] Confirm you're signed out everywhere — old password fails, new one works.
- [ ] Negative: reuse the same reset link a second time → rejected (single-use).
- [ ] Afterward, reset Liza's password back to `GspDemo!2026` so the shared login keeps
      working for the rest of this guide.

### 1.4 Sign out

- [ ] From any role, use **Sign out** in the sidebar → returns to the login screen.

---

## 2. Dashboard (read-only, role-aware — no CRUD, just verify content)

- [ ] 🅐 Admin: org-wide stat cards, 6-month Membership Growth chart, Members by Status
      donut, Recent Activity feed, Troops Overview list.
- [ ] 🅔 EC: council-scoped stat cards, same Troops Overview, Membership by Scout Level
      breakdown.
- [ ] 🅣 Liza: troop-scoped stat cards, "My Troop" roster (Troop 12 only), Scout Level
      breakdown for Troop 12 only.
- [ ] 🅣 Grace: same panel now shows Troop 4 data — confirms scope follows the logged-in
      leader, not a hardcoded troop.

---

## 3. Organizations (`/organizations`) — 🅐 writes, 🅔/🅣 read-only

Log in as 🅐 Admin for all Create/Update/Delete steps.

**New council**
| Field | Value |
| --- | --- |
| Name | Albay Council |
| Description | Council covering Albay province troops |

**New troops** (pick a council from the select)
| Troop code | Name | Council | Leader |
| --- | --- | --- | --- |
| CAT-PAN-015 | Troop 15 — Pandan | Catanduanes Council | *(leave unassigned)* |
| CAT-VIG-021 | Troop 21 — Viga | Catanduanes Council | Grace Tapel |

**New scout level**
| Name | Description | Order |
| --- | --- | --- |
| Ambassador Girl Scout | Ages 20–21, college-level program | 6 |

**New badge category**
| Name | Description |
| --- | --- |
| Environmental Stewardship | Ecology, recycling and conservation projects |

**New activity category**
| Name | Description |
| --- | --- |
| Fundraising | Cookie drives and sponsorship events |

- [ ] **Councils**: create Albay Council. Read: appears in list. Update: edit its
      description. Delete: try deleting **Catanduanes Council** (has troops) → blocked.
- [ ] **Troops**: create both rows above. Update: edit a troop's name. Delete: try
      deleting a troop that has members → blocked.
- [ ] **Scout Levels**: create "Ambassador Girl Scout". Update its order number. Delete:
      try deleting a level in use by a member → blocked.
- [ ] **Badge Categories**: create "Environmental Stewardship". Same update/delete-in-use
      checks.
- [ ] **Activity Categories**: create "Fundraising". Same checks.
- [ ] 🅔 EC: browse all five tabs → everything visible, **no** Add/Edit/Delete buttons.
- [ ] 🅣 Liza: same read-only check.

---

## 4. Membership Registry (`/members`) — all three roles write; approve/archive is 🅐/🅔 only

**Scouts** (pick Troop + Scout Level from the selects)
| First | Middle | Last | Birthdate | Gender | Email | Phone | Troop | Scout Level | Emergency contact | Emergency phone |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sofia | Reyes | Bautista | 2021-03-14 | female | *(blank)* | 0917-234-5601 | Troop 12 — Virac | Twinkler | Mario Bautista | 0917-234-5602 |
| Angela | Cruz | Marasigan | 2017-11-02 | female | angela.marasigan@example.ph | 0917-234-5603 | Troop 4 — Bato | Star Scout | Teresa Marasigan | 0917-234-5604 |
| Kyla | | Odtuhan | 2014-06-21 | female | kyla.odtuhan@example.ph | 0917-234-5605 | Troop 7 — San Andres | Junior Girl Scout | Ramon Odtuhan | 0917-234-5606 |
| Trisha | Anne | Formento | 2010-09-08 | female | trisha.formento@example.ph | 0917-234-5607 | Troop 12 — Virac | Senior Girl Scout | Carmela Formento | 0917-234-5608 |
| Denise | | Villaruel | 2008-01-30 | other | denise.villaruel@example.ph | 0917-234-5609 | Troop 4 — Bato | Cadet Girl Scout | Josefa Villaruel | 0917-234-5610 |

**Adult leader** (no Scout Level field)
| First | Last | Birthdate | Gender | Email | Phone | Troop | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Perla | Sandoval | 1985-05-19 | female | perla.sandoval@example.ph | 0917-234-5611 | Troop 7 — San Andres | Assistant troop leader, first aid certified |

- **Rejection reason** (min 5 chars): `Birth certificate copy is missing — please resubmit with the required documents attached.`
- **Renew membership dates:** Start `2026-08-01` · End `2027-07-31`

- [ ] 🅣 Liza: **Create** the Sofia (Troop 12), Angela (Troop 4), and Perla (Troop 7, adult
      leader) rows — confirm the troop picker lists **all** troops, not just Troop 12
      (registry write is org-wide even for a leader).
- [ ] **Read**: confirm the registry table lists members from **all** troops while logged
      in as Liza — a deliberate exception to the troop-scoping seen elsewhere.
- [ ] 🅐 Admin: **Create** the Kyla, Trisha, Denise rows. **Update**: edit one member's
      phone/email. **Renew**: open a member with expiring/expired status, renew with the
      dates above — confirm it **appends** a new membership period, not overwrite (check
      membership history on the profile).
- [ ] **Archive** (🅐/🅔 only): archive one test member you created, confirm they drop out
      of the active registry, then **Restore** them.
- [ ] 🅣 Liza: confirm there is **no** Archive control visible to her.
- [ ] Validation: member create with no Troop selected → *"Select a troop."* Scout with no
      Scout Level → required-field error.

---

## 5. Pending Approvals (`/approvals`) — 🅐/🅔 only

- [ ] 🅐 Admin: open the queue, click **Bea Delfin** → **Approve** → confirm status flips
      to Active in Members.
- [ ] Click **Marites Tuazon** → **Reject**. First try a reason under 5 characters (e.g.
      `"no"`) → expect the min-length error, then use the real reason from §4 above.
      Confirm the reason shows on her member profile afterward.
- [ ] 🅔 EC: confirm the same Approve/Reject actions work (register a new pending test
      member first if the queue is already empty).
- [ ] 🅣 Liza: directly visit `/approvals` → redirected to Dashboard, no sidebar item.

---

## 6. Events (`/events`) — 🅐 writes, everyone reads/browses

| Title | Category | Date | Start | End | Location | Description |
| --- | --- | --- | --- | --- | --- | --- |
| Summer Camp Virac 2026 | Camping | 2026-08-15 | 08:00 | 17:00 | Virac Municipal Grounds | Overnight camp with fire-building and navigation badge work |
| Coastal Cleanup Drive | Community Outreach | 2026-08-02 | 06:30 | 10:00 | Baras Beach, Catanduanes | Beach cleanup and waste segregation demo |
| New Leader Orientation | Training | 2026-07-10 | 13:00 | 16:00 | GSP Regional Office | *(past — used for attendance + activity reports)* |
| Investiture Ceremony | Ceremony | 2026-09-05 | 09:00 | 11:30 | San Andres Parish Hall | Formal investiture for new scouts |
| Cookie Fundraiser Kickoff | Community Outreach | 2026-07-18 | 09:00 | 12:00 | Bato Barangay Hall | *(past — used for activity reports)* |

Validation-error case: set End time to `08:00` when Start time is `09:00` → expect *"End
time must be after the start time."*

- [ ] 🅐 Admin: **Create** all five rows, including both past-dated ones (needed below).
      **Read**: switch between list/calendar view, try search/status/category filters.
- [ ] **Update**: edit one event's location. **Validation**: run the End-before-Start case
      above.
- [ ] **Delete**: delete a throwaway event you don't need later (not the two past ones).
- [ ] 🅔 EC, 🅣 Liza: confirm list/calendar/filters work, but **no** Create/Edit/Delete
      control anywhere.

---

## 7. Attendance (inside an event's detail view) — 🅐/🅣 write, 🅔 read-only

Good active picks to register: **Althea Ramos**, **Elena Sarmiento** (Troop 12), or
**Faith Bermundo** (Troop 4). Attendance marks to try: `present` for two, `absent` for
one. *(Bea Delfin / Dana Villar / Nadine Sorreda are pending/archived/expired and won't
appear in the picker — use them to confirm the exclusion.)*

- [ ] 🅐 Admin: open **New Leader Orientation** → **Manage Attendance**. **Create**:
      register the active members above.
- [ ] **Update**: mark two `present`, one `absent`. Change one registration's status to
      `cancelled` → confirm it drops out of the attendance-eligible list.
- [ ] **Negative picker check**: confirm Bea Delfin/Dana Villar/Nadine Sorreda don't
      appear in the register-participant picker.
- [ ] 🅣 Liza: open **Cookie Fundraiser Kickoff** → register/mark attendance for an active
      member of **any** troop (org-wide picker, even for a leader — unlike Badges below).
- [ ] 🅔 EC: open either event → stat cards + table render, but no register/mark controls.

---

## 8. Activity Reports (`/events` → completed event → report) — 🅐/🅣 write, 🅔 read-only

Use it against **New Leader Orientation** or **Cookie Fundraiser Kickoff** (both already
past 2026-07-25).

| Field | Value |
| --- | --- |
| Summary | 18 troop leaders attended the orientation; covered child-safety policy, uniform standards and the badge-verification workflow. |
| Participation notes | Strong turnout from Troop 4 and Troop 12; Troop 7 sent one representative. |
| Outcomes | All attendees passed the closing quiz; 3 leaders flagged for a follow-up refresher in September. |

- [ ] 🅣 Liza: submit a report against **New Leader Orientation** using the table above.
      Confirm it appears under **"My Activity Reports."**
- [ ] 🅣 Grace: submit a second report against **Cookie Fundraiser Kickoff** (any similar
      content). Confirm her "My Activity Reports" shows only her own, **not** Liza's.
- [ ] 🅐 Admin (or 🅔 EC): confirm the reports list shows **both** with Submitted By/Troop
      columns.
- [ ] 🅔 EC: confirm no Submit button — read-only here.
- [ ] Confirm the event picker only offers **completed** (past-dated) events.

---

## 9. Badges & Achievements (`/badges`)

### 9.1 Badge catalog — 🅐 only

**New badge in catalog**
| Field | Value |
| --- | --- |
| Name | Water Safety |
| Category | Health & Safety |
| Required points | 40 |
| Requirements (one per line) | Complete a swim assessment / Demonstrate CPR basics / Identify 5 water hazards |

- [ ] 🅐 Create the badge above. Update: edit required-points. Delete: remove a throwaway
      badge you don't need for 9.2.

### 9.2 Record a member badge — 🅐/🅣 write

> A Troop Leader's member picker only offers their **own troop's** members. As Admin, any
> member is selectable.

| Member | Troop | Badge | Status |
| --- | --- | --- | --- |
| Althea Ramos | Troop 12 — Virac | Trailblazer | in_progress |
| Elena Sarmiento | Troop 12 — Virac | First Aider | earned |

- [ ] 🅣 Liza: **Record Badge**, confirm the picker only lists Troop 12 members (Althea,
      Cristina, Elena). Record both rows above.
- [ ] 🅣 Grace: confirm her picker instead offers only Troop 4 members (e.g. record Faith
      Bermundo → any badge, `in_progress`).
- [ ] 🅐 Admin: confirm the picker offers **every** member regardless of troop.

### 9.3 Verify a badge — 🅐 only

- [ ] 🅐 Open Pending Verification, **Verify** Elena Sarmiento — First Aider.
- [ ] 🅣 Liza: confirm there is **no** Verify button, even on her own troop's earned
      badges.

### 9.4 Member Progress / Achievement History — scoped read

**Log an achievement**
| Field | Value |
| --- | --- |
| Member | Althea Ramos *(Troop 12 — visible to Liza; use a Troop 4 member as Grace)* |
| Achievement name | Regional Leadership Summit Delegate |
| Description | Represented Troop 12 at the 2026 Region V Leadership Summit |
| Date achieved | 2026-06-20 |

- [ ] 🅣 Liza: open Member Progress and Achievement History tabs → only Troop 12 rows.
- [ ] 🅐/🅔: same tabs → every troop's rows.
- [ ] 🅣 Liza logs the achievement above for Althea Ramos; 🅐 Admin logs one for any member.

---

## 10. Announcements & Notifications — 🅐/🅔 write, 🅣 read-only; bell is everyone

**New announcement**
| Field | Value |
| --- | --- |
| Title | 2026 Uniform Ordering Window Now Open |
| Content | Troop leaders may submit uniform size orders through August 10. Orders placed after the deadline will be held for the next batch. |
| Expires at | 2026-08-10 |

- [ ] 🅐 Admin: post the announcement above.
- [ ] 🅔 EC: post a second, different announcement. Confirm both appear in the feed for
      every role.
- [ ] 🅣 Liza: feed visible, but no "New Announcement" control.
- [ ] All three roles: open the notification bell, confirm it shows **personal** items
      only (e.g. Liza sees her badge-verification notification from 9.3, not Grace's).

---

## 11. Finance (`/finance`) — 🅐 writes, 🅔 read-only, 🅣 no access

**New fee type**
| Name | Amount | Description |
| --- | --- | --- |
| Badge Kit Fee | 150.00 | Covers badge, patch and requirement booklet |

**New payments** (pick member + fee type)
| Member | Fee type | Amount | Payment date | Method | Status |
| --- | --- | --- | --- | --- | --- |
| Angela Marasigan | Annual Membership Fee | 350.00 | 2026-07-20 | gcash | paid |
| Kyla Odtuhan | Camp Fee | 450.00 | 2026-07-22 | cash | pending |
| Trisha Formento | Uniform & Insignia | 900.00 | 2026-07-15 | bank_transfer | paid |

**New expenses**
| Description | Amount | Date | Category |
| --- | --- | --- | --- |
| Camp site rental deposit — Virac | 5000.00 | 2026-07-24 | Camping |
| First aid kit restock | 1250.50 | 2026-07-23 | Supplies |

- [ ] 🅐 Admin: **Fee Types**: create "Badge Kit Fee". Update its amount. Delete: try
      deleting a fee type already in use by a payment (create the payment first) →
      blocked.
- [ ] **Payments**: record all three rows. Validation: try amount `0` → *"Enter an amount
      greater than 0."*
- [ ] **Expenses**: record both rows.
- [ ] **Overview**: confirm the income-vs-expense trend and category breakdown reflect
      what you just entered.
- [ ] 🅔 EC: open all four tabs → full read, zero record/edit controls.
- [ ] 🅣 Liza: directly visit `/finance` → redirected to Dashboard, no sidebar item.

---

## 12. Reports (`/reports`) — generation scoped by role, export 🅐/🅔 only

- [ ] 🅐 Admin: generate one report of each of the 6 types (Membership, Attendance,
      Badge, Financial, Activity, Executive), each with a date range and, where
      applicable, a Troop filter. Preview stat cards + table for each.
- [ ] **Export**: export at least one to PDF and one to Excel. Confirm both show up in
      **Report History**, and re-downloading from history works.
- [ ] 🅔 EC: generate + export a report → same capability as Admin here.
- [ ] 🅣 Liza: confirm the type picker offers only **Membership, Attendance, Badge,
      Activity** (no Financial/Executive), any report is scoped to her own troop, and
      there is **no** Export button.

---

## 13. Analytics (`/analytics`) — 🅐/🅔 only, fully read-only

- [ ] 🅐 Admin: open all 6 tabs (Membership, Attendance, Participation, Badges, Financial,
      Organization) → stat cards + chart render on each, no edit controls.
- [ ] 🅔 EC: same 6 tabs, same read-only confirmation.
- [ ] 🅣 Liza: directly visit `/analytics` → redirected to Dashboard.

---

## 14. Settings & System Administration (`/settings`) — 🅐 only

**System settings**
| Field | Value |
| --- | --- |
| Organization name | Girl Scouts of the Philippines — Catanduanes Council |
| Membership term (months) | 12 |
| Renewal window (days) | 30 |
| Email notifications enabled | on |

**New portal users**
| Full name | Email | Phone | Role | Password |
| --- | --- | --- | --- | --- |
| Josefina Ramillano | josefina.ramillano@example.ph | 0917-234-5620 | troop_leader | TempPass#26 |
| Carlo Nierva | carlo.nierva@example.ph | 0917-234-5621 | executive_council | TempPass#27 |

- [ ] 🅐 Admin: **System Settings**: update org name, membership term, renewal window,
      toggle email notifications. Confirm the change persists on reload.
- [ ] **Users & Access** — **Create**: add both portal users above.
- [ ] **Update**: edit Carlo's role/details; **reset his password**; **deactivate** him
      (confirm he can no longer log in); **reactivate** him (confirm he can again).
- [ ] **Delete**: delete one of the two test users you just created.
- [ ] **RBAC guard**: try to deactivate/delete/demote the **last remaining Administrator**
      → blocked with an explanatory error.
- [ ] **Audit Log**: confirm the approvals, user changes, and settings edits you just made
      all show up, searchable and paginated.
- [ ] **Backups**: run **Run Backup Now**, confirm it appears in backup history (and in
      the Audit Log trail).
- [ ] 🅔 EC, 🅣 Liza: directly visit `/settings` → redirected to Dashboard, no sidebar item.

---

## 15. My Profile (`/profile`) — every role, own account only

**Edit account info** (do this once per role: Admin, EC, Liza, Grace)
| Field | Value |
| --- | --- |
| Full name | *(your first/last name plus a suffix, e.g. "Liza Bagadiong-Test")* |
| Email | liza.test@gsp-catanduanes.ph |
| Phone | 0917-234-5699 |

**Change password**
| Field | Value |
| --- | --- |
| Current password | GspDemo!2026 |
| New password | RotatedPass#26 |

- [ ] **Update account info**: edit Full Name/Email/Phone (append `-Test` so you can spot
      and revert it). Confirm Role and Member Since stay read-only.
- [ ] **Change password**: wrong current password first → *"Current password is
      incorrect,"* nothing changes; then the correct current password with the new one.
- [ ] Log out, log back in with the new password, then change it back to `GspDemo!2026`
      so the shared login keeps working for anyone testing after you.
- [ ] Confirm there's no way from this screen to view/edit anyone **else's** profile.

---

## 16. Final validation sweep

Confirm each of these is still rejected (easy to regress silently if a schema changes):

- [ ] Member create with no Troop selected → *"Select a troop."*
- [ ] Event with End time before Start time → *"End time must be after the start time."*
- [ ] Reject-member reason under 5 characters (e.g. `"no"`) → min-length error
- [ ] New payment with amount `0` or negative → *"Enter an amount greater than 0."*
- [ ] New user with a password under 8 characters → *"Password must be at least 8 characters."*
- [ ] New user with an email already in use (e.g. `admin@gsp-catanduanes.ph`) → conflict error
- [ ] Change password with the wrong current password → *"Current password is incorrect."*
- [ ] Renew membership with End date before Start date → *"End date must be after the start date."*

---

## 17. Cleanup (optional)

- [ ] Delete/archive the test members, events, and badges you created that aren't part of
      the original seed.
- [ ] Delete the two test portal users (Josefina, Carlo) if you added them.
- [ ] Confirm Liza's password is back to `GspDemo!2026`.
- [ ] Leave Albay Council / the extra troops/levels/categories from §3 in place or remove
      them — either is fine, they don't block future testing.
