# GSP Management Information System Architecture

## 1. Overview

The GSP Management Information System will be built as a modular, scalable web application with a clear separation between frontend presentation, backend business logic, data access, and shared infrastructure.

The system will support:

- Membership management
- Event and attendance tracking
- Badge and achievement progress
- Financial records and reporting
- Executive analytics and dashboards
- Role-based access control

---

## 2. Architectural Goals

- Modular domain-based structure for easy maintenance and scaling
- Clear separation of concerns between frontend and backend
- Centralized shared services for authentication, errors, logging, and validation
- Reusable API patterns for all modules
- Secure and role-based access control
- Support for future expansion into mobile or additional integrations

---

## 3. Overall System Architecture

### 3.1 Frontend

- Next.js
- TypeScript
- Tailwind CSS
- React Icons
- Feature-based module organization
- Centralized API services and shared UI components

### 3.2 Backend

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT-based authentication
- Modular domain services and repositories

### 3.3 Shared Infrastructure

- Authentication middleware
- Role-based access control
- Validation layer
- Error handling layer
- Logging and audit support
- Prisma database layer

---

## 4. Backend Architecture

### 4.1 Core Backend Structure

```text
src/
├── app.ts
├── server.ts
├── config/
├── shared/
│   ├── handlers/
│   │   ├── asyncHandler.ts
│   │   └── errorHandler.ts
│   ├── middleware/
│   ├── utils/
│   ├── constants/
│   └── types/
├── modules/
│   ├── auth/
│   ├── members/
│   ├── organizations/
│   ├── events/
│   ├── attendance/
│   ├── badges/
│   ├── finance/
│   ├── reports/
│   ├── dashboard/
│   ├── analytics/
│   ├── notifications/
│   └── settings/
└── prisma/
```

### 4.2 Singleton Handlers

The backend will use singleton-style shared handlers for common request flow concerns:

- Singleton async handler
  - Wraps controller methods and ensures consistent error propagation
  - Prevents duplicate async wrapper implementations across modules

- Singleton error handler
  - Centralizes HTTP error formatting and response handling
  - Ensures consistent error messages for API clients

These handlers will live in the shared infrastructure layer and be reused by all modules.

### 4.3 Backend Module Pattern

Each domain module will follow a consistent structure:

```text
modules/
└── auth/
    ├── auth.controller.ts
    ├── auth.service.ts
    ├── auth.repository.ts
    ├── auth.routes.ts
    ├── auth.validator.ts
    ├── auth.schema.ts
    ├── auth.types.ts
    ├── auth.middleware.ts
    └── index.ts
```

### 4.4 Module Responsibilities

Each module will contain:

- Controller: handles HTTP requests and responses
- Service: business logic
- Repository: database access via Prisma
- Routes: route definitions
- Validator: request validation
- Schema: database or DTO structure
- Types: TypeScript interfaces/types
- Middleware: domain-specific middleware

---

## 5. Frontend Architecture

### 5.1 Frontend Structure

```text
src/
├── app/
│   ├── (auth)
│   ├── dashboard/
│   ├── members/
│   ├── events/
│   ├── attendance/
│   ├── badges/
│   ├── finance/
│   ├── reports/
│   └── settings/
├── features/
│   ├── auth/
│   ├── members/
│   ├── organizations/
│   ├── events/
│   ├── attendance/
│   ├── badges/
│   ├── finance/
│   ├── reports/
│   ├── analytics/
│   └── notifications/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── utils/
│   └── types/
└── styles/
```

### 5.2 Frontend Module Pattern

Each feature module will follow a modular structure:

```text
features/
└── auth/
    ├── components/
    ├── hooks/
    ├── pages/
    ├── services/
    ├── store/
    ├── types/
    └── index.ts
```

### 5.3 Frontend Responsibilities

- Pages: route-level UI screens
- Components: reusable UI building blocks
- Hooks: state and side-effect logic
- Services: API requests and data fetching
- Store: global or feature state management
- Types: domain models and request/response shapes

---

## 6. Domain Modules

### 6.1 Authentication Module

Backend:

- login
- logout
- refresh token
- password reset
- role-based access verification

Frontend:

- login page
- protected route handling
- role-based navigation
- profile management

### 6.2 Membership Module

Backend:

- register member
- update profile
- archive/restore member
- search and filter members
- membership status handling

Frontend:

- member directory
- member profile form
- search and filter UI
- membership status dashboard

### 6.3 Organization Module

Backend:

- manage councils
- manage troops
- manage scout levels
- manage badge categories
- manage activity categories

Frontend:

- organization admin pages
- troop and council management screens
- configuration forms

### 6.4 Event Module

Backend:

- create/edit/delete events
- event scheduling
- participant registration
- attendance linking

Frontend:

- event calendar
- event detail page
- event registration form
- event management UI

### 6.5 Attendance Module

Backend:

- record attendance
- view attendance history
- event attendance summaries

Frontend:

- attendance checklist UI
- attendance history table
- attendance summary reports

### 6.6 Badge and Achievement Module

Backend:

- badge catalog management
- badge requirement tracking
- progress updates
- achievement verification

Frontend:

- badge overview page
- progress tracker
- achievement history view

### 6.7 Finance Module

Backend:

- record payments
- record expenses
- financial summaries
- budget and collection tracking

Frontend:

- financial dashboard
- payment form
- expense log UI
- financial summary charts

### 6.8 Report Module

Backend:

- generate reports by domain
- export as PDF and Excel

Frontend:

- reports page
- export actions
- report filters and previews

### 6.9 Dashboard and Analytics Module

Backend:

- aggregate statistics
- growth metrics
- attendance trends
- financial analytics

Frontend:

- dashboard widgets
- charts and analytics views
- KPI summaries

### 6.10 Notification Module

Backend:

- announcements
- event reminders
- council notices

Frontend:

- notification center
- announcement feed
- reminder panel

### 6.11 Settings Module

Backend:

- application configuration
- backup management
- audit log access
- access control configuration

Frontend:

- system settings UI
- admin configuration forms

---

## 7. API Design Principles

- RESTful routing structure
- Versioned APIs such as `/api/v1`
- Consistent response format
- Centralized validation and error handling
- Standardized controller-service-repository flow
- Role-based route protection

Example:

```text
/api/v1/auth/login
/api/v1/members
/api/v1/events
/api/v1/attendance
/api/v1/badges
/api/v1/finance/reports
```

---

## 8. Security Architecture

- Role-based access control (RBAC)
- JWT authentication
- Refresh token support
- Protected routes and middleware
- Password hashing and secure storage
- Audit logging for critical actions
- Request validation on both frontend and backend

---

## 9. Data Flow

1. User interacts with the frontend UI
2. Frontend sends a request through a feature service
3. Backend route receives the request
4. Controller delegates to the service layer
5. Service uses repository layer for data access
6. Prisma interacts with PostgreSQL
7. Response is returned through shared handlers
8. Frontend displays updated state

---

## 10. Recommended Implementation Strategy

### Phase 1

- Authentication
- Membership management
- Basic dashboard

### Phase 2

- Events and attendance
- Badge tracking
- Notifications

### Phase 3

- Finance management
- Reports and analytics
- Advanced admin settings

---

## 11. Summary

This architecture is designed to make the GSP system:

- modular
- secure
- scalable
- easy to maintain
- ready for future enhancement

The separation of modules across both frontend and backend ensures that each domain feature can evolve independently while sharing common infrastructure such as authentication, validation, error handling, and API standards.
