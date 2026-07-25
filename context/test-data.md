# Manual Test Data

Copy-paste fodder for exercising every form by hand, organized by screen/domain.
Every value here satisfies the real Zod validation in `apps/api/src/modules/*/*.schema.ts`
as of 2026-07-25 — dates are `YYYY-MM-DD`, times are 24h `HH:MM`, passwords are 8+ chars.

Not a build-plan or progress doc — delete or ignore once you're done testing.

---

## 0. Seeded accounts (already in Neon — use for login, not signup)

Password for all of them: **`GspDemo!2026`** (or your `SEED_PASSWORD` env override).

| Email | Role | Name |
| --- | --- | --- |
| `admin@gsp-catanduanes.ph` | Administrator | Marisol Tabuena |
| `council@gsp-catanduanes.ph` | Executive Council | Rosario Verceles |
| `leader.virac@gsp-catanduanes.ph` | Troop Leader (Troop 12 — Virac) | Liza Bagadiong |
| `leader.bato@gsp-catanduanes.ph` | Troop Leader (Troop 4 — Bato) | Grace Tapel |

Use `leader.virac@gsp-catanduanes.ph` for forgot/reset-password testing so you don't touch the shared admin account.

### Existing dropdown options (seeded — pick these in selects, don't retype)

- **Council:** Catanduanes Council
- **Troops:** Troop 12 — Virac · Troop 4 — Bato · Troop 7 — San Andres (no leader yet)
- **Scout levels:** Twinkler (4–6) · Star Scout (7–9) · Junior Girl Scout (10–12) · Senior Girl Scout (13–16) · Cadet Girl Scout (17–19)
- **Badge categories:** Community Service · Outdoor Skills · Health & Safety · Leadership · Arts & Culture
- **Activity categories:** Camping · Community Outreach · Training · Ceremony
- **Fee types:** Annual Membership Fee · Camp Fee (₱450) · Uniform & Insignia (₱900) · Training Fee (₱300)
- **Badges:** Community Helper · Trailblazer · First Aider · Troop Mentor · Heritage Keeper · Camp Cook

### Seeded members, by troop (needed for role-scoped testing)

Who belongs to which troop matters — Badges and Activity Reports only show a Troop Leader **their own troop's** members. (Members Registry and the event-registration picker are org-wide for every role.)

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

Only **active** members appear in the event-registration and badge-recording pickers — so Bea Delfin (pending), Dana Villar (archived) and Nadine Sorreda (expired) are deliberately excluded there and are useful for testing those exclusions.

---

## 0.5 Role-based test plan — log in as each role and verify

The three sections below are the *what to do as whom*. The numbered sections after them (§1–§13) are the raw data bank you copy values from. Do a full pass as each role to confirm both the happy paths **and** that the walls between roles hold.

### A. As **Administrator** (`admin@gsp-catanduanes.ph`)

The only role that sees everything. Use this login for all Admin-only data below.

- **Should see every sidebar item**, including Pending Approvals, Financial Tracking, Analytics, and Settings.
- **Do:** create a council/troop/scout-level/category (§3); register members incl. an adult leader (§4); approve or reject a pending member — Bea Delfin or Marites Tuazon (§4 rejection reason); create every event (§5); record payments/expenses and a fee type (§10); edit system settings and add the two portal users (§11); **verify** an earned badge (§8 — verification is Admin-only); post an announcement (§9).
- **RBAC self-check:** try to deactivate the *last* remaining admin under Settings → Users (§11) → the guard must block it.

### B. As **Executive Council** (`council@gsp-catanduanes.ph`)

Oversight and monitoring — read-only across operations, but owns approvals and can post announcements.

- **Should see:** Pending Approvals, Financial Tracking, Analytics — but **not** Settings.
- **Do:** approve/reject a pending member (§4); post an announcement (§9); open Analytics and each of its 6 tabs; open Reports and **export** one (export is allowed for this role).
- **RBAC self-check (should be blocked / hidden):**
  - Events, Attendance, Badges, Finance screens open but show **no** create/record/edit buttons (read-only).
  - Directly visiting `/settings` → redirected to the Dashboard.
  - No "Record Payment", "Record Expense", "Record Badge", "Verify", or event "Create" controls anywhere.

### C. As **Troop Leader** (`leader.virac@gsp-catanduanes.ph` — Liza, Troop 12 — Virac)

Hands-on for their own troop only. This is where scoping matters most.

- **Should see:** Membership Registry, Events, Attendance, Activity Reports, Badges, Announcements, Reports, My Profile — but **not** Pending Approvals, Financial Tracking, Analytics, or Settings.
- **Do:**
  - Register a member (§4) — the Registry shows **all** troops' members, and the troop picker lists all troops.
  - Record attendance for a past event using an **active** member (§6).
  - Submit an activity report for a completed event (§7).
  - Record a badge (§8) — **note:** the member picker only offers **Troop 12** members (Althea Ramos, Cristina Ople, Elena Sarmiento). It will *not* list Troop 4 or Troop 7 members.
  - Open Badges → Member Progress and Achievement History → you see **only Troop 12** rows.
  - Open Activity Reports → you see **only reports you submitted**, not other troops'.
- **RBAC self-check (should be blocked / hidden):**
  - Directly visiting `/finance`, `/approvals`, `/analytics`, or `/settings` → redirected to the Dashboard.
  - No Event create/edit/delete controls (view-only for events).
  - No **Verify** button on badges (Admin-only), even for their own troop's earned badges.
  - Reports screen offers only Membership/Attendance/Badge/Activity types — **no** Financial or Executive — and **no** Export button.

> Optionally repeat section C as **Grace Tapel** (`leader.bato@gsp-catanduanes.ph`, Troop 4 — Bato) to confirm she sees Troop 4's members (Faith Bermundo, Bea Delfin) and *not* Troop 12's — proving the scope follows the logged-in leader, not a fixed troop.

---

## 1. Auth — Signup

One row per role (the form fields change based on the role you pick).

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
| Admin secret key | *(use whatever `ADMIN_SIGNUP_KEY` is set to in `apps/api/.env`)* |

## 2. Auth — Forgot / Reset Password

- Forgot-password email: `leader.virac@gsp-catanduanes.ph`
- Reset form new password: `NewPass#2026`

---

## 3. Organizations (Administrator only, `/organizations`)

**New council**
| Field | Value |
| --- | --- |
| Name | Albay Council |
| Description | Council covering Albay province troops |

**New troop** (pick a council from the select)
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

---

## 4. Members — Create (`/members`)

**Scouts** (pick Troop + Scout Level from the selects)

| First | Middle | Last | Birthdate | Gender | Email | Phone | Troop | Scout Level | Emergency contact | Emergency phone |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sofia | Reyes | Bautista | 2021-03-14 | female | *(leave blank)* | 0917-234-5601 | Troop 12 — Virac | Twinkler | Mario Bautista | 0917-234-5602 |
| Angela | Cruz | Marasigan | 2017-11-02 | female | angela.marasigan@example.ph | 0917-234-5603 | Troop 4 — Bato | Star Scout | Teresa Marasigan | 0917-234-5604 |
| Kyla | | Odtuhan | 2014-06-21 | female | kyla.odtuhan@example.ph | 0917-234-5605 | Troop 7 — San Andres | Junior Girl Scout | Ramon Odtuhan | 0917-234-5606 |
| Trisha | Anne | Formento | 2010-09-08 | female | trisha.formento@example.ph | 0917-234-5607 | Troop 12 — Virac | Senior Girl Scout | Carmela Formento | 0917-234-5608 |
| Denise | | Villaruel | 2008-01-30 | other | denise.villaruel@example.ph | 0917-234-5609 | Troop 4 — Bato | Cadet Girl Scout | Josefa Villaruel | 0917-234-5610 |

**Adult leader** (no Scout Level field)
| First | Last | Birthdate | Gender | Email | Phone | Troop | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Perla | Sandoval | 1985-05-19 | female | perla.sandoval@example.ph | 0917-234-5611 | Troop 7 — San Andres | Assistant troop leader, first aid certified |

**Rejection reason** (Membership Approval queue, min 5 chars): `Birth certificate copy is missing — please resubmit with the required documents attached.`

**Renew membership dates:** Start `2026-08-01` · End `2027-07-31`

---

## 5. Events (`/events`, Administrator only writes)

| Title | Category | Date | Start | End | Location | Description |
| --- | --- | --- | --- | --- | --- | --- |
| Summer Camp Virac 2026 | Camping | 2026-08-15 | 08:00 | 17:00 | Virac Municipal Grounds | Overnight camp with fire-building and navigation badge work |
| Coastal Cleanup Drive | Community Outreach | 2026-08-02 | 06:30 | 10:00 | Baras Beach, Catanduanes | Beach cleanup and waste segregation demo |
| New Leader Orientation | Training | 2026-07-10 | 13:00 | 16:00 | GSP Regional Office | *(past — use to test "completed" status + attendance)* |
| Investiture Ceremony | Ceremony | 2026-09-05 | 09:00 | 11:30 | San Andres Parish Hall | Formal investiture for new scouts |
| Cookie Fundraiser Kickoff | Community Outreach | 2026-07-18 | 09:00 | 12:00 | Bato Barangay Hall | *(past — use for activity reports)* |

Validation-error case: set End time to `08:00` when Start time is `09:00` → expect *"End time must be after the start time."*

---

## 6. Registrations & Attendance (inside an event's detail view)

- Register participant: pick an **active** member into **New Leader Orientation** or **Cookie Fundraiser Kickoff** (both past-dated, so you can immediately mark attendance). Good active picks: **Althea Ramos**, **Elena Sarmiento** (Troop 12), or **Faith Bermundo** (Troop 4). The picker is org-wide, so a Troop Leader can register any troop's active member. *(Bea Delfin / Dana Villar / Nadine Sorreda are pending/archived/expired and won't appear — use them to confirm the exclusion.)*
- Attendance marks to try: `present` for two members, `absent` for one.
- Registration status change: set one registration to `cancelled`, confirm it drops out of the attendance-eligible list.
- **Who can write:** Administrator and Troop Leader mark attendance; Executive Council sees the screen read-only (no register/mark controls).

---

## 7. Activity Reports (`/events` → completed event → report)

Use it against **New Leader Orientation** or **Cookie Fundraiser Kickoff** (both already past 2026-07-25).

| Field | Value |
| --- | --- |
| Summary | 18 troop leaders attended the orientation; covered child-safety policy, uniform standards and the badge-verification workflow. |
| Participation notes | Strong turnout from Troop 4 and Troop 12; Troop 7 sent one representative. |
| Outcomes | All attendees passed the closing quiz; 3 leaders flagged for a follow-up refresher in September. |

---

## 8. Badges (`/badges`)

**New badge in catalog**
| Field | Value |
| --- | --- |
| Name | Water Safety |
| Category | Health & Safety |
| Required points | 40 |
| Requirements (add each as its own line) | Complete a swim assessment / Demonstrate CPR basics / Identify 5 water hazards |

**Record a member badge** (Admin + Troop Leader; pick member + badge from selects)

> **Scoping matters here.** A Troop Leader's member picker only offers their **own troop's** members. The rows below use Troop 12 members so they work when logged in as **Liza** (`leader.virac@…`). As Admin, any member is selectable.

| Member | Troop | Badge | Status |
| --- | --- | --- | --- |
| Althea Ramos | Troop 12 — Virac | Trailblazer | in_progress |
| Elena Sarmiento | Troop 12 — Virac | First Aider | earned |

Then **verify** **Elena Sarmiento — First Aider** from the Pending Verification table — **Administrator only** (a Troop Leader will not see a Verify button, even for their own troop; log in as Admin to verify).

*(If you test badge recording as Grace Tapel — Troop 4 — Bato instead, use **Faith Bermundo** as the member; Troop 12 names won't appear in her picker.)*

**Log an achievement** (Admin + Troop Leader; member picker is troop-scoped for a leader)
| Field | Value |
| --- | --- |
| Member | Althea Ramos *(Troop 12 — visible to Liza; use a Troop 4 member as Grace)* |
| Achievement name | Regional Leadership Summit Delegate |
| Description | Represented Troop 12 at the 2026 Region V Leadership Summit |
| Date achieved | 2026-06-20 |

---

## 9. Announcements & Notifications (`/badges`… no, `/dashboard` bell + announcements feed)

**New announcement** (Admin / Executive Council only)
| Field | Value |
| --- | --- |
| Title | 2026 Uniform Ordering Window Now Open |
| Content | Troop leaders may submit uniform size orders through August 10. Orders placed after the deadline will be held for the next batch. |
| Expires at | 2026-08-10 |

---

## 10. Finance (`/finance`, Administrator only writes)

**New fee type**
| Name | Amount | Description |
| --- | --- | --- |
| Badge Kit Fee | 150.00 | Covers badge, patch and requirement booklet |

**New payment** (pick member + fee type)
| Member | Fee type | Amount | Payment date | Method | Status |
| --- | --- | --- | --- | --- | --- |
| Angela Marasigan | Annual Membership Fee | 350.00 | 2026-07-20 | gcash | paid |
| Kyla Odtuhan | Camp Fee | 450.00 | 2026-07-22 | cash | pending |
| Trisha Formento | Uniform & Insignia | 900.00 | 2026-07-15 | bank_transfer | paid |

**New expense**
| Description | Amount | Date | Category |
| --- | --- | --- | --- |
| Camp site rental deposit — Virac | 5000.00 | 2026-07-24 | Camping |
| First aid kit restock | 1250.50 | 2026-07-23 | Supplies |

---

## 11. Settings (`/settings`, Administrator only)

**System settings**
| Field | Value |
| --- | --- |
| Organization name | Girl Scouts of the Philippines — Catanduanes Council |
| Membership term (months) | 12 |
| Renewal window (days) | 30 |
| Email notifications enabled | on |

**New portal user**
| Full name | Email | Phone | Role | Password |
| --- | --- | --- | --- | --- |
| Josefina Ramillano | josefina.ramillano@example.ph | 0917-234-5620 | troop_leader | TempPass#26 |
| Carlo Nierva | carlo.nierva@example.ph | 0917-234-5621 | executive_council | TempPass#27 |

Then try: deactivate Carlo, reset his password, and re-activate him. Try deactivating the *last* remaining admin to confirm the guard blocks it.

---

## 12. Profile (`/profile`, any signed-in role)

**Edit account info**
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

Remember to change it back afterward if you're using a shared seeded account.

---

## 13. Deliberate validation-error cases

Quick list to confirm the forms actually reject bad input instead of silently accepting it:

- Member create with no Troop selected → *"Select a troop."*
- Event with End time before Start time → *"End time must be after the start time."*
- Reject-member reason under 5 characters (e.g. `"no"`) → min-length error
- New payment with amount `0` or negative → *"Enter an amount greater than 0."*
- New user with a password under 8 characters → *"Password must be at least 8 characters."*
- New user with an email that's already in use (e.g. `admin@gsp-catanduanes.ph`) → conflict error
- Change password with the wrong current password → *"Current password is incorrect."*
- Renew membership with End date before Start date → *"End date must be after the start date."*
