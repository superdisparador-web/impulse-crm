# Impulse CRM Architecture Guide

This document is the official architecture guide for Impulse CRM. It is the primary reference for future implementation decisions, and no future feature may intentionally contradict it without explicit authorization.

## 1. Product Context

Impulse CRM is a customer relationship management platform focused on lead capture, contact management, campaign operations, WhatsApp integrations, dashboards, reports, uploads, settings, users, queues, and AI agents.

The product is structured as a web application with:

- A Next.js frontend responsible for user experience and client-facing workflows.
- A NestJS backend responsible for business capabilities, persistence access, integrations, and API boundaries.
- Shared contracts expressed through TypeScript types and DTOs where applicable.

## 2. Architectural Principles

All implementation work must follow these principles:

1. **Separation of responsibilities**: UI, transport, business rules, integration code, and persistence access must remain clearly separated.
2. **Backend as authority**: Server-side modules own business rules, validation, authorization, integration orchestration, and persistence boundaries.
3. **Typed contracts first**: Data exchanged between layers must be represented with explicit TypeScript types or DTOs.
4. **Feature modularity**: New capabilities must be implemented inside cohesive feature modules rather than scattered across unrelated files.
5. **Secure by default**: Authentication, authorization, secrets, credentials, and external integrations must be handled defensively.
6. **Operational clarity**: Features must be testable, observable, and maintainable without relying on hidden behavior.
7. **No architecture drift**: Any deviation from this document requires explicit approval before implementation.

## 3. Repository Structure

The repository is organized around a Next.js frontend at the project root and a NestJS backend under `backend/`.

```text
.
├── app/                 # Next.js route segments and pages
├── components/          # Reusable frontend UI and feature components
├── services/            # Frontend API clients and browser-side service adapters
├── types/               # Frontend/shared TypeScript contracts
├── backend/             # NestJS backend application
│   └── src/             # Backend modules, controllers, services, DTOs, and providers
├── public/              # Static frontend assets
└── ARCHITECTURE.md      # Official architecture guide
```

### 3.1 Frontend Directory Responsibilities

- `app/`: Owns routing, page composition, layouts, and route-level orchestration.
- `components/`: Owns reusable UI elements and feature-specific presentational components.
- `services/`: Owns frontend HTTP clients and browser-side API access helpers.
- `types/`: Owns TypeScript contracts used by frontend components and services.
- `public/`: Owns static assets served by the frontend.

### 3.2 Backend Directory Responsibilities

- `backend/src/*/*.module.ts`: Wires dependencies for each feature area.
- `backend/src/*/*.controller.ts`: Exposes HTTP endpoints and delegates work to services.
- `backend/src/*/*.service.ts`: Owns business workflows and integration orchestration for the module.
- `backend/src/*/dto/*.dto.ts`: Defines API input contracts and validation shape.
- `backend/src/prisma/`: Owns database access provider boundaries.

## 4. Frontend Architecture

The frontend must remain a route-driven Next.js application.

### 4.1 Routing and Pages

- Route files in `app/` should compose screens from reusable components.
- Route files should avoid embedding large business workflows directly in page components.
- Pages should delegate API communication to `services/` helpers.
- Shared visual elements should live in `components/`.

### 4.2 Components

- `components/ui/` is reserved for reusable primitives such as buttons, inputs, selects, and modals.
- Feature components should live in feature folders such as `components/agents/` or `components/leads/`.
- Components should be typed with explicit props.
- Components should avoid duplicating API logic that belongs in frontend services.

### 4.3 Frontend Services

- Frontend service files should centralize calls to backend APIs.
- API clients should expose named functions that describe domain actions.
- API response and request shapes should use explicit TypeScript types.
- Authentication concerns should be centralized rather than duplicated across pages.

### 4.4 Styling and UX

- Styling should remain consistent with the established global styling and component conventions.
- UI primitives should be preferred over one-off repeated markup.
- New perceptible UI changes should be validated visually before delivery when practical.

## 5. Backend Architecture

The backend must remain a modular NestJS application.

### 5.1 Module Boundaries

Each backend capability should be implemented as a module with a clear domain boundary. Existing domains include:

- Authentication
- Campaigns
- Contacts
- Dashboard
- Evolution integration
- Prisma data access
- Queues
- Reports
- Settings
- Uploads
- Users
- WhatsApp

New backend domains should follow the same module/controller/service structure unless an explicit architecture decision approves a different shape.

### 5.2 Controllers

Controllers must:

- Define transport-level HTTP routes.
- Validate and type incoming request payloads through DTOs where applicable.
- Delegate business logic to services.
- Avoid direct database or external integration logic.

### 5.3 Services

Services must:

- Own business workflows for their module.
- Coordinate persistence through approved providers such as Prisma services.
- Coordinate external systems through dedicated integration services.
- Keep controller methods thin and predictable.

### 5.4 DTOs and Validation

DTOs must be used for request payloads that cross the API boundary. DTOs should document expected input shape and support validation strategies as the backend evolves.

### 5.5 Persistence Boundary

Database access must be centralized through the backend persistence layer. Frontend code must never connect directly to the database.

The `backend/src/prisma/` module is the approved persistence provider boundary. Future persistence work should extend this boundary rather than bypassing it.

## 6. Integration Architecture

External integrations must be isolated behind backend services.

- WhatsApp functionality belongs in the WhatsApp backend module.
- Evolution API functionality belongs in the Evolution backend module.
- Upload handling belongs in the Uploads backend module.
- Integration credentials must not be hardcoded in source files.
- Integration failures must be handled explicitly and surfaced with safe error messages.

## 7. Authentication and Authorization

Authentication belongs in the backend authentication module and frontend authentication service boundary.

Future authorization rules must be enforced on the backend. Frontend route protection may improve user experience, but it must not be the only authorization control.

Secrets, tokens, and credentials must be stored outside committed source code and provided through environment configuration.

## 8. Data Flow

The approved request flow is:

```text
User Interface
  → Next.js page or component
  → Frontend service in services/
  → Backend controller
  → Backend service
  → Persistence provider or integration service
```

Responses should flow back through the same layers. Business rules should not be duplicated between frontend pages and backend services unless explicitly justified.

## 9. Error Handling

- Backend errors should use framework-appropriate exceptions and safe response messages.
- Frontend errors should be displayed in user-appropriate language.
- Sensitive implementation details, stack traces, credentials, and provider responses must not be exposed to users.
- Integration errors should preserve enough diagnostic context for maintainers without leaking secrets.

## 10. Configuration and Environments

Configuration must be environment-driven.

- Do not commit real secrets.
- Environment-specific values belong in environment variables or deployment configuration.
- Local `.env` files must remain local unless explicitly provided as templates without secrets.
- Frontend public environment variables must be treated as public information.

## 11. Testing Expectations

Future changes should include the most appropriate level of validation for the affected layer:

- Static checks such as TypeScript and linting for frontend changes.
- Unit or module tests for backend service logic where available.
- Integration tests for critical API flows where available.
- Manual or screenshot validation for visible UI changes when practical.

If a test cannot be run because of an environment limitation, the limitation must be reported clearly.

## 12. Implementation Rules for Future Work

Before implementing a future feature, contributors must:

1. Check this architecture guide for relevant boundaries and rules.
2. Place new code in the correct frontend or backend module.
3. Reuse existing services, DTOs, components, and providers where appropriate.
4. Avoid introducing hidden coupling across unrelated modules.
5. Document any approved architecture deviation in this file or in a linked decision record.

## 13. Change Governance

This document is the official architecture baseline for Impulse CRM.

Changes to this guide require explicit approval. Implementation work that conflicts with this guide must not proceed until the conflict is resolved and approved.
