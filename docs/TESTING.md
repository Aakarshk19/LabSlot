# Testing

## Strategy

- **Backend:** HTTP-level tests with Supertest against `createApp()`, using `mongodb-memory-server` so tests do not share the development database.
- **Frontend:** Vitest + React Testing Library with mocked Axios modules for forms, lists, cancellation, and navigation.
- **Manual integration:** run `npm run seed` and `npm run dev`, then exercise register → book → conflict → cancel → admin maintenance.

## Commands

```bash
cd server && npm test
cd client && npm test
# from root
npm test
```

Jest is configured with `--runInBand` and ES modules (`type: module` + `--experimental-vm-modules`).

## Important backend scenarios

- Student registration and password hashing
- Duplicate email `409`
- Login success/failure
- Protected `/auth/me`
- Role cannot be set on register
- Admin-only resource create
- Valid booking `201`
- Overlap `409`, adjacent interval `201`
- Simultaneous conflicting posts: `{201, 409}`
- Maintenance `409`
- Past/invalid times `400`
- Foreign booking `403`
- Student cancel
- Invalid ObjectId `400`
- Admin dashboard counts from the database

## Frontend scenarios

- Login and register validation
- Resource list loading then cards
- Booking conflict message
- Cancel confirmation dialog
- Role-specific navbar
- Empty state copy

## Execution results

Recorded after the implementation test run (see the handover notes in chat / README if numbers differ after later edits).

Known gaps: there is no Cypress/Playwright E2E suite. Concurrent tests depend on timing of the resource lock; they run in-process against the real service.

## Isolated test database

Memory server URI is generated per run. Optionally `MONGODB_TEST_URI` exists in `.env.example` for a future persistent test DB; the current Jest setup does not use it.
