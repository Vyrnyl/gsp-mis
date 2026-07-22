# GSP Management Information System Code Standards

## 1. Purpose

This document defines the coding standards for the GSP Management Information System to ensure consistency, maintainability, readability, and scalability across frontend and backend development.

---

## 2. General Principles

- Write clean, readable, and self-explanatory code
- Follow consistent naming conventions across the project
- Keep functions small and focused on a single responsibility
- Prefer reusable components, services, and utilities
- Avoid duplication of logic
- Write code that is easy to test and extend
- Use TypeScript strictly and favor strong typing
- Keep security, validation, and error handling consistent

---

## 3. Language and Runtime

### Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL

---

## 4. Naming Conventions

### Files

- Use lowercase and kebab-case for file names
- Example: `auth.service.ts`, `member-profile-card.tsx`

### Folders

- Use lowercase and kebab-case
- Example: `auth/`, `member-management/`

### Variables and Functions

- Use camelCase
- Example: `userProfile`, `getMemberById()`

### Classes and Types

- Use PascalCase
- Example: `AuthService`, `MemberProfile`

### Constants

- Use UPPER_SNAKE_CASE
- Example: `DEFAULT_PAGE_SIZE`

### Environment Variables

- Use UPPER_SNAKE_CASE
- Example: `DATABASE_URL`, `JWT_SECRET`

---

## 5. TypeScript Standards

- Enable strict mode in TypeScript
- Avoid `any` unless absolutely necessary
- Prefer interfaces or type aliases for domain models
- Use enums for fixed sets of values such as roles or statuses
- Keep types close to the feature or module they belong to
- Export shared types from a central shared layer when reused broadly

### Example

```ts
export interface MemberProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}
```

---

## 6. Backend Coding Standards

### 6.1 Module Structure

Each backend module should follow this pattern:

- controller
- service
- repository
- routes
- validator
- schema
- types
- middleware
- index

### 6.2 Controller Rules

- Keep controllers thin
- Do not place business logic inside controllers
- Delegate processing to services
- Handle request/response mapping only

### 6.3 Service Rules

- Contain all business logic
- Keep services reusable and testable
- Avoid directly handling HTTP concerns

### 6.4 Repository Rules

- Encapsulate database access
- Use Prisma for queries and mutations
- Keep repository methods focused on data operations

### 6.5 Error Handling

- Use a centralized error handler
- Use a singleton async handler for all route-level async functions
- Do not swallow errors silently
- Return clear and consistent API error responses

### 6.6 Validation

- Validate all incoming request data
- Use schema-based validation for request payloads
- Reject invalid requests early

---

## 7. Frontend Coding Standards

### 7.1 Component Rules

- Build reusable, small, and focused components
- Prefer functional components
- Keep UI logic separate from business logic
- Use hooks for stateful behavior

### 7.2 Page and Feature Organization

- Group related files by feature/module
- Keep route-level pages simple and compositional
- Use shared components for common UI patterns

### 7.3 State Management

- Use local state for simple component state
- Use feature-based state or global store for shared state
- Avoid overusing global state for unrelated concerns

### 7.4 API Access

- Centralize API calls in service modules
- Avoid direct fetch calls inside components
- Handle loading, error, and empty states consistently

---

## 8. Code Organization Standards

### Backend

```text
src/
├── modules/
│   └── auth/
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       ├── auth.repository.ts
│       ├── auth.routes.ts
│       ├── auth.validator.ts
│       ├── auth.schema.ts
│       ├── auth.types.ts
│       ├── auth.middleware.ts
│       └── index.ts
├── shared/
│   ├── handlers/
│   │   ├── asyncHandler.ts
│   │   └── errorHandler.ts
│   └── middleware/
```

### Frontend

```text
src/
├── features/
│   └── auth/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── services/
│       ├── store/
│       └── index.ts
```

---

## 9. Formatting Rules

- Use 2 spaces for indentation
- Use semicolons consistently
- Keep lines reasonably short and readable
- Use meaningful comments only when necessary
- Prefer explicit code over clever shortcuts
- Maintain consistent import order

### Example

```ts
import { NextFunction, Request, Response } from "express";

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

---

## 10. Security Standards

- Never hardcode secrets in source code
- Use environment variables for sensitive values
- Hash passwords before storing them
- Validate permissions on every protected route
- Sanitize user input before processing
- Use prepared queries or ORM methods to prevent SQL injection
- Apply role-based access control consistently

---

## 11. Testing Standards

- Write tests for business logic and critical flows
- Use meaningful test names
- Test success, failure, and edge cases
- Keep tests close to the module they verify
- Prefer integration tests for API flows where possible

---

## 12. Documentation Standards

- Add comments for complex business rules
- Keep README files and module documentation up to date
- Document public functions and services when necessary
- Use clear PR descriptions for changes

---

## 13. Git and Change Management

- Use descriptive commit messages
- Keep commits focused on one change or feature
- Avoid mixing unrelated updates in one commit
- Review code for style, correctness, and security before merging

---

## 14. Summary

These standards ensure that the GSP Management Information System remains:

- maintainable
- secure
- scalable
- easy to understand
- consistent across all developers and modules
