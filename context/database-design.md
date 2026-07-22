# GSP Management Information System Database Design

## 1. Overview

This database design supports the core business domains of the GSP Management Information System, including membership, organizations, events, attendance, badges, finance, reports, analytics, and system administration.

The design is structured to be:

- modular and extensible
- role-aware
- suitable for PostgreSQL
- compatible with Prisma ORM
- scalable for future growth

---

## 2. Database Principles

- Use relational tables for core entities and transactions
- Normalize recurring business data such as roles, categories, and statuses
- Support auditability through created/updated timestamps and audit logs
- Maintain referential integrity between related records
- Support reporting and analytics through summarized and relational data

---

## 3. Core Database Modules

### 3.1 Authentication and Users

#### Tables

- users
- roles
- permissions
- user_roles
- role_permissions
- refresh_tokens
- audit_logs

#### Purpose

Stores user accounts, authentication details, role assignments, permissions, and admin activity history.

> **Authoritative role model.** Roles are **relational** — a user's role(s) come from `user_roles`, and a role's capabilities come from `role_permissions`. There is **no role string column on `users`**. This is required because "Manage permissions" and "Assign user roles" are explicit Administrator features ([project-overview.md](project-overview.md) → Administrator → User Management), which a flat string cannot support.
>
> The join table supports many-to-many, but **v1 enforces exactly one role per user** at the service layer. The three seeded roles are `admin`, `executive_council`, and `troop_leader`.

#### Suggested Fields

users

- id (UUID, PK)
- full_name
- email
- password_hash
- phone_number
- avatar_url
- is_active
- last_login_at
- created_at
- updated_at

roles

- id (UUID, PK)
- name
- description

permissions

- id (UUID, PK)
- name
- description

user_roles

- user_id (FK → users.id)
- role_id (FK → roles.id)
- assigned_at
- (composite PK: user_id + role_id)

role_permissions

- role_id (FK → roles.id)
- permission_id (FK → permissions.id)
- (composite PK: role_id + permission_id)

refresh_tokens

- id (UUID, PK)
- user_id
- token_hash
- expires_at
- revoked_at
- created_at

audit_logs

- id (UUID, PK)
- user_id
- action
- entity_type
- entity_id
- details
- created_at

---

### 3.2 Organization and Membership

#### Tables

- councils
- troops
- scout_levels
- badge_categories
- activity_categories
- members
- member_profiles
- member_statuses
- memberships

#### Purpose

Handles the organization hierarchy, troop structure, membership records, and lifecycle states.

#### Suggested Fields

councils

- id (UUID, PK)
- name
- description
- created_at
- updated_at

troops

- id (UUID, PK)
- council_id
- name
- troop_code
- leader_id
- created_at
- updated_at

scout_levels

- id (UUID, PK)
- name
- description
- order_number

badge_categories

- id (UUID, PK)
- name
- description

activity_categories

- id (UUID, PK)
- name
- description

members

- id (UUID, PK)
- first_name
- middle_name
- last_name
- birth_date
- gender
- email
- phone_number
- address
- membership_status_id
- troop_id
- council_id
- created_at
- updated_at

member_profiles

- id (UUID, PK)
- member_id
- profile_photo_url
- emergency_contact_name
- emergency_contact_phone
- notes

member_statuses

- id (UUID, PK)
- name
- description

memberships

- id (UUID, PK)
- member_id
- start_date
- end_date
- renewal_date
- status
- created_at
- updated_at

---

### 3.3 Events and Attendance

#### Tables

- events
- event_registrations
- attendance_records
- attendance_summaries

#### Purpose

Tracks events, participant registrations, and attendance details for councils and troops.

#### Suggested Fields

events

- id (UUID, PK)
- title
- description
- event_date
- start_time
- end_time
- location
- organizer_id
- category_id
- created_at
- updated_at

event_registrations

- id (UUID, PK)
- event_id
- member_id
- registered_by
- registration_date
- status

attendance_records

- id (UUID, PK)
- event_id
- member_id
- attendance_status
- recorded_by
- recorded_at

attendance_summaries

- id (UUID, PK)
- event_id
- total_expected
- total_present
- total_absent
- attendance_rate
- generated_at

---

### 3.4 Badges and Achievements

#### Tables

- badges
- badge_requirements
- member_badges
- achievement_records

#### Purpose

Stores badge definitions, completion requirements, and member achievement progress.

#### Suggested Fields

badges

- id (UUID, PK)
- name
- description
- category_id
- required_points
- created_at
- updated_at

badge_requirements

- id (UUID, PK)
- badge_id
- requirement_name
- requirement_description
- is_completed

member_badges

- id (UUID, PK)
- member_id
- badge_id
- earned_at
- verified_by
- status

achievement_records

- id (UUID, PK)
- member_id
- achievement_name
- description
- achieved_at
- recorded_by

---

### 3.5 Finance

#### Tables

- payments
- expenses
- fee_types
- financial_periods
- financial_summaries

#### Purpose

Tracks dues, payments, expenses, and financial summaries for the organization.

#### Suggested Fields

payments

- id (UUID, PK)
- member_id
- fee_type_id
- amount
- payment_date
- payment_method
- received_by
- status
- created_at

expenses

- id (UUID, PK)
- description
- amount
- expense_date
- category
- approved_by
- created_at

fee_types

- id (UUID, PK)
- name
- amount
- description

financial_periods

- id (UUID, PK)
- start_date
- end_date
- total_income
- total_expense
- balance

financial_summaries

- id (UUID, PK)
- period_id
- summary_type
- summary_value
- generated_at

---

### 3.6 Reports and Analytics

#### Tables

- reports
- report_templates
- analytics_snapshots

#### Purpose

Stores generated reports and reusable report structures for executive and operational analysis.

#### Suggested Fields

reports

- id (UUID, PK)
- title
- report_type
- generated_by
- generated_at
- file_path
- format

report_templates

- id (UUID, PK)
- name
- report_type
- template_json

analytics_snapshots

- id (UUID, PK)
- metric_name
- metric_value
- snapshot_date
- generated_at

---

### 3.7 Notifications and Settings

#### Tables

- notifications
- announcement_posts
- system_settings

#### Purpose

Supports announcements, reminders, and system configuration data.

#### Suggested Fields

notifications

- id (UUID, PK)
- user_id
- title
- message
- is_read
- created_at

announcement_posts

- id (UUID, PK)
- title
- content
- posted_by
- posted_at
- expires_at

system_settings

- id (UUID, PK)
- setting_key
- setting_value
- description
- updated_at

---

## 4. Relationship Overview

The main relationships are:

- councils -> troops
- troops -> members
- members -> event_registrations
- events -> attendance_records
- members -> member_badges
- badges -> badge_requirements
- members -> payments
- users -> audit_logs
- users -> notifications

---

## 5. Recommended Prisma Models

Example model grouping:

```prisma
model User {
  id            String     @id @default(uuid())
  fullName      String
  email         String     @unique
  passwordHash  String
  isActive      Boolean    @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  userRoles     UserRole[]
}

model Role {
  id              String           @id @default(uuid())
  name            String           @unique // admin | executive_council | troop_leader
  description     String?
  userRoles       UserRole[]
  rolePermissions RolePermission[]
}

model Permission {
  id              String           @id @default(uuid())
  name            String           @unique
  description     String?
  rolePermissions RolePermission[]
}

model UserRole {
  userId     String
  roleId     String
  assignedAt DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role       Role     @relation(fields: [roleId], references: [id])

  @@id([userId, roleId])
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
}

model Member {
  id            String   @id @default(uuid())
  firstName     String
  lastName      String
  email         String?  @unique
  phoneNumber   String?
  birthDate     DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Event {
  id            String   @id @default(uuid())
  title         String
  description   String?
  eventDate     DateTime
  location      String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## 6. Suggested Indexes

Recommended indexes for performance:

- users.email
- members.troop_id
- members.membership_status_id
- events.event_date
- event_registrations.event_id
- attendance_records.event_id
- payments.member_id
- payments.payment_date

---

## 7. Data Integrity Rules

- Enforce non-null fields where necessary
- Use foreign keys for relational integrity
- Restrict invalid statuses and role values via enums where possible
- Prevent duplicate membership or registration records
- Track created and updated timestamps for all major entities

---

## 8. Summary

This database design provides a strong foundation for the GSP Management Information System by organizing data into clear domain modules while keeping the overall structure relational, secure, and scalable.

It supports:

- user and role management
- organization and membership tracking
- events and attendance
- badge and achievement progress
- finance and reporting
- analytics and administration
