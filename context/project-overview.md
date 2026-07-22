# Project Overview

# GSP Management Information System with Data Analytics

## Overview

The **GSP Management Information System with Data Analytics** is a web-based platform designed for the **Girl Scouts of the Philippines (GSP)** to digitize and centralize its organizational operations.

The system replaces manual processes such as paper records and spreadsheets with a secure, role-based information system capable of managing:

- Membership
- Activities and Events
- Attendance
- Badge & Achievement Progress
- Financial Records
- Reports
- Organizational Analytics

The primary goal is to improve efficiency, transparency, reporting, and decision-making through centralized data management and interactive analytics.

---

# Objectives

- Digitize all membership records.
- Centralize organizational information.
- Reduce manual paperwork.
- Improve accuracy and consistency of records.
- Track scout achievements and participation.
- Monitor financial collections and expenditures.
- Generate reports automatically.
- Provide analytics for better decision-making.
- Implement role-based security.
- Support future scalability.

---

# Target Users

There are three primary user roles.

---

# 1. Administrator

The Administrator manages the entire system and has unrestricted access to all modules.

## Responsibilities

### User Management

- Create user accounts
- View users
- Update user information
- Delete user accounts
- Activate/Deactivate accounts
- Reset passwords
- Assign user roles
- Manage permissions

### Membership Management

- View all members
- Register new members
- Update member profiles
- Archive members
- Restore archived members
- Search members
- Filter members
- Manage membership status

### Organization Management

- Manage troops
- Manage councils
- Manage scout levels
- Manage badge categories
- Manage activity categories

### Event Management

- Create events
- Edit events
- Delete events
- Assign troop leaders
- Set event schedules
- Manage registrations
- View attendance

### Badge & Achievement

- Create badge requirements
- Update badge information
- Delete badges
- View scout progress
- Verify achievements

### Financial Management

- Record payments
- Record expenses
- Manage registration fees
- Generate financial summaries
- View collection history

### Reports

Generate:

- Membership Reports
- Attendance Reports
- Activity Reports
- Badge Reports
- Financial Reports
- Organization Reports

Export reports to:

- PDF
- Excel

### Dashboard & Analytics

View:

- Membership Growth
- Active Members
- New Registrations
- Attendance Trends
- Event Statistics
- Financial Overview
- Badge Completion
- Organization Performance

### System Administration

- Configure system settings
- Manage backups
- Audit logs
- Notification settings
- Access control
- Database maintenance

---

# 2. Executive Council

The Executive Council is responsible for monitoring organizational performance and making strategic decisions.

## Responsibilities

### Dashboard

View:

- Overall statistics
- Membership overview
- Activity overview
- Financial overview
- Organizational KPIs

### Membership Monitoring

- View all members
- Review registrations
- Approve memberships
- Monitor membership growth

### Analytics

Access:

- Membership trends
- Attendance trends
- Event participation
- Badge completion
- Financial analytics
- Organization performance

### Reports

Generate:

- Executive Reports
- Membership Reports
- Financial Reports
- Event Reports
- Analytics Reports

### Activity Monitoring

- View all activities
- Review participation
- Monitor troop performance
- View accomplishment reports

### Financial Monitoring

- View collections
- View expenses
- Monitor balances
- Review financial summaries

---

# 3. Troop Leader

Troop Leaders manage the scouts assigned to their troop.

## Responsibilities

### Member Management

- Register scouts
- Update scout information
- View troop members
- Archive members
- Search members

### Badge Tracking

- Record earned badges
- Update achievements
- Track advancement
- View badge history

### Activity Management

- View upcoming events
- Register participants
- Record attendance
- Submit activity reports

### Attendance

- Check attendance
- Update attendance
- View attendance history

### Reports

Generate:

- Troop Reports
- Attendance Reports
- Badge Reports
- Activity Reports

### Notifications

- Receive announcements
- View council notices
- Receive event reminders

---

# Core Modules

## Authentication

Features:

- Secure Login
- Role-Based Access Control
- Password Management
- Profile Management
- Session Management

---

## Membership Management

Features:

- Scout Registration
- Adult Leader Registration
- Membership Renewal
- Member Profile
- Search & Filtering
- Status Management

---

## Event Management

Features:

- Event Creation
- Scheduling
- Registration
- Attendance
- Event History

---

## Attendance Management

Features:

- Attendance Recording
- Participant Lists
- Attendance History
- Event Attendance Summary

---

## Badge & Achievement Management

Features:

- Badge Catalog
- Progress Tracking
- Achievement History
- Completion Monitoring

---

## Financial Management

Features:

- Fee Collection
- Expense Recording
- Budget Monitoring
- Financial Reports

---

## Report Management

Generate:

- Membership Reports
- Attendance Reports
- Badge Reports
- Financial Reports
- Activity Reports
- Executive Reports

Export:

- PDF
- Excel

---

## Dashboard

Provides real-time statistics including:

- Total Members
- Active Members
- New Registrations
- Events Conducted
- Attendance Rate
- Financial Summary
- Badge Completion
- Organization Growth

---

## Analytics

Interactive charts and visualizations including:

- Membership Growth
- Membership Distribution
- Attendance Trends
- Event Participation
- Financial Trends
- Badge Completion Rate
- Scout Progress
- Organization Performance

---

# Security Features

- Role-Based Access Control (RBAC)
- Secure Authentication
- Password Encryption
- Session Validation
- Audit Logs
- Permission Management
- Data Backup
- Recovery Support

---

# Technology Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- React Icons

## Backend

- Node.js
- Express.js
- TypeScript

## Database

- PostgresSQL
- Prisma ORM

## Authentication

- JWT access tokens (short-lived)
- Refresh tokens (long-lived, rotated)
- BFF (Backend-for-Frontend) pattern: the Next.js server layer sits between the browser and the API
- The **BFF issues httpOnly cookies to the browser** — the backend API itself does not set cookies; it consumes/returns tokens and stays stateless

## Analytics

- ChartJS

---

# Expected Benefits

- Faster membership processing
- Centralized information
- Reduced paperwork
- Improved transparency
- Better financial monitoring
- Faster report generation
- Improved organizational planning
- Data-driven decision making
- Better communication between councils and troops
- Scalable foundation for future enhancements
