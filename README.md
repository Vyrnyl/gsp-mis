<p align="center">
  <img src="apps/web/public/logo.jpg" alt="Girl Scouts of the Philippines logo" width="120" />
</p>

<h1 align="center">GSP Management Information System</h1>

<p align="center">
  A web portal for running Girl Scouts of the Philippines council and troop operations online:<br />
  membership, events, attendance, badges, finance, reports and analytics, all behind role-based access.
</p>

<p align="center">
  <a href="https://gsp-mis-web.vercel.app">Live site</a> ·
  <a href="context/user-guide.md">User guide</a> ·
  <a href="#run-it-locally">Run it locally</a>
</p>

---

## What it does

The system replaces paper records and spreadsheets with one shared, secure portal. Each person signs in with a role, and the portal shows only what that role is allowed to see and do.

| Module | What you can do there |
| --- | --- |
| **Dashboard** | See member counts, growth and distribution charts, recent activity, and your troop roster. The content changes with your role. |
| **Membership Registry** | Register scouts and adult leaders, edit their records, renew memberships, archive and restore members. Expiring and expired memberships are flagged. |
| **Pending Approvals** | Review new registrations and approve or reject them, with a reason. |
| **Councils & Troops** | Manage councils, troops and their leaders, municipalities and schools, scout levels, and badge and activity categories. |
| **Events & Attendance** | Schedule events on a calendar, choose which scout levels attend, register participants and mark who was present. |
| **Activity Reports** | Troop leaders submit a report after an event; the council reviews it. |
| **Badges** | Browse the badge catalog, record earned badges, verify them, and track each member's progress. |
| **Announcements & Notifications** | Post council announcements and get in-app notifications about registrations, badges and events. |
| **Financial Tracking** | Record payments and expenses, manage fee types, and see collections and balances. |
| **Reports** | Generate Membership, Attendance, Badge, Financial, Activity and Executive reports, and download them as PDF with the GSP logo. |
| **Analytics** | Break down population, membership, attendance, participation, badges, finances and troop performance by school, scout level, troop and activity. Includes a population benchmark and a Decisions tab that ranks what needs attention. |
| **Settings** | Manage users and their access, edit system settings, and read the audit log. |
| **My Profile** | Update your own details and password. Available to every role. |

## Who uses it

| Role | Who they are | What they can do |
| --- | --- | --- |
| **Administrator** | Council or system staff running the platform | Everything, including users, settings and finance |
| **Executive Council** | Council leadership | Approve registrations, monitor activity, read finances, generate and export reports, view analytics, post announcements |
| **Troop Leader** | The leader of one troop | Manage their own troop's members, attendance, badges and activity reports |
| **Council Board** | Board members who need to see council data but not change it | View the Dashboard, Councils & Troops, Events and Analytics |

Access is checked on the server for every request. Hiding a menu item is not what keeps a role out, so changing a URL or a request does not reveal another role's data. The full permission table is in the [user guide](context/user-guide.md#4-roles--permissions-rbac).

### Getting an account

Open the portal, choose **Sign Up**, and pick your role.

- **Troop Leader, Executive Council and Council Board** accounts are created **inactive**. An Administrator has to activate them in **Settings → Users & Access** before you can log in. Until then, logging in shows "Invalid email or password". That is expected.
- **Administrator** sign-up needs an admin secret key from the system owner.
- After activation, an Administrator still has to link a Troop Leader or Executive Council account to its troop or council. Until that happens, troop and council data will be empty.

Forgotten passwords are reset by email. The reset link expires after one hour and works once.

The [user guide](context/user-guide.md) ([PDF](context/user-guide.pdf)) walks through every screen, role by role, and has a troubleshooting section.

---

## Run it locally

### Requirements

- **Node.js 20** or newer
- A **PostgreSQL** database. A local one works, or a free [Neon](https://neon.tech) project.

### 1. Install

```bash
git clone https://github.com/Vyrnyl/gsp-mis.git
cd gsp-mis
npm install
```

### 2. Configure the API

```bash
cp apps/api/.env.example apps/api/.env
```

Fill in `apps/api/.env`. The API checks these values when it starts and **will not boot** if any required value is missing or too short.

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` | Three different random strings, 32 characters or more each |
| `ADMIN_SIGNUP_KEY` | The secret someone must enter to sign up as an Administrator |
| `CORS_ORIGINS`, `WEB_APP_URL` | The web app's address. Locally, `http://localhost:3000` |
| Email settings (optional) | Gmail API, Mailtrap or SMTP. Leave them empty locally and emails are printed to the console instead of sent. |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Every option is explained in [apps/api/.env.example](apps/api/.env.example). The web app needs no configuration if the API runs on port 4000. To use another address, see [apps/web/.env.example](apps/web/.env.example).

### 3. Set up the database

```bash
npm run db:migrate   # create the tables
npm run db:seed      # load demo councils, troops, members, events and accounts
```

The seed creates one demo login for each role, such as `admin@gsp-catanduanes.ph`, `council@gsp-catanduanes.ph`, `leader.virac@gsp-catanduanes.ph` and `board@gsp-catanduanes.ph`. Set `SEED_PASSWORD` before seeding to choose their password. The default is in [apps/api/prisma/seed.ts](apps/api/prisma/seed.ts).

### 4. Start it

Run each command in its own terminal:

```bash
npm run dev:api   # API → http://localhost:4000/api/v1/health
npm run dev       # web → http://localhost:3000
```

Open http://localhost:3000 and log in with a demo account.

### Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `npm run dev:api` | Start the web app / the API in watch mode |
| `npm run build` | Build both apps |
| `npm test` | Run the test suites for both apps |
| `npm run typecheck` | Type-check both apps |
| `npm run lint` · `npm run format` | Lint · format with Prettier |
| `npm run db:migrate` · `npm run db:seed` · `npm run db:studio` | Apply migrations · seed demo data · browse the database |

---

## How it's built

| Layer | Technology |
| --- | --- |
| Web app | Next.js 15, React, TypeScript, Tailwind CSS, react-chartjs-2, react-icons |
| API | Node.js, Express, TypeScript, Prisma 7 |
| Database | PostgreSQL, hosted on Neon |
| Sign-in | JWT access and refresh tokens, kept in httpOnly cookies set by the web app's server layer. The API itself stays stateless. |
| Tests | Vitest, with supertest for the API |
| Hosting | Web on Vercel, API on Render ([render.yaml](render.yaml)) |

```
apps/
  web/   Next.js app. Pages are in src/app/, the shared UI kit in src/shared/components/
  api/   Express API. One folder per domain in src/modules/, schema and migrations in prisma/
context/ Planning docs, the user guide, and the original static prototype
```

The browser only talks to the Next.js app. It forwards API calls to Express, which checks the user's role and permissions, applies business rules, and reads and writes PostgreSQL through Prisma. Every API response has the same shape: `{ success, data }` on success or `{ success, error }` on failure.

### Deployment notes

- **API (Render):** [render.yaml](render.yaml) builds the API, applies migrations, and starts it. Set `DIRECT_DATABASE_URL` to Neon's non-pooled address so migrations do not time out.
- **Web (Vercel):** set `API_ORIGIN` to the deployed API's address.
- `/api/v1/health` is a liveness check that never touches the database. A [GitHub Actions workflow](.github/workflows/keep-alive.yml) pings it every 10 minutes so Render's free plan does not put the API to sleep. Use `/api/v1/health/db` to check the database, and don't poll it, because each call wakes Neon.

---

## For contributors

The planning docs in [context/](context/) describe how the project is built:

- [build-plan.md](context/build-plan.md): the feature list and the build method
- [progress.md](context/progress.md): what is done, plus a log of every session
- [architecture.md](context/architecture.md) and [database-design.md](context/database-design.md): how the system fits together
- [code-standards.md](context/code-standards.md), [ui-rules.md](context/ui-rules.md) and [ui-registry.md](context/ui-registry.md): conventions, design tokens and the component catalog
- [CLAUDE.md](CLAUDE.md): the rules for AI-assisted development in this repo

All 21 planned features are built. Each one is designed as a visible page with mock data, signed off visually, and only then connected to the API and database. Changes to finished features follow the same rule: change the screen first, then the logic behind it.
