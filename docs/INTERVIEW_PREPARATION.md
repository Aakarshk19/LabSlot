# Interview preparation — LabSlot

Use this document to explain the **actual** codebase. Do not claim production traffic, public deployment, or features that are listed as future work.

## 1. Sixty-second introduction

LabSlot is a full-stack lab booking platform I built with the MERN stack. Students register, browse laboratory resources, and reserve time slots. The important part is integrity: the server detects overlapping intervals, blocks maintenance, and uses a per-resource lock so two people cannot confirm the same bench at once. Administrators manage inventory and see statistics computed from MongoDB, not hardcoded numbers. Authentication uses HttpOnly JWT cookies plus a CSRF token.

## 2. Two-minute technical explanation

The React client (Vite) talks to an Express API under `/api/v1`. Axios sends cookies and copies the CSRF cookie into `X-CSRF-Token`. Express middleware handles Helmet, CORS, rate limits, validation, JWT auth, and roles. Mongoose models are User, Resource, and Booking. Booking rules live in `bookingService`: half-open intervals, operating hours, duration limits, overlap query `start < otherEnd && end > otherStart`, excluding cancelled/rejected. Before insert, the service takes a MongoDB conditional lock on the resource document. Dashboards run aggregations. Tests use Jest/Supertest with an in-memory MongoDB and Vitest on the UI.

## 3. Problem and motivation

Shared lab equipment is easy to double-book with chat or paper. Institutions need a system that is understandable, auditable, and conservative about conflicts.

## 4. Architecture

React pages → Axios → Express routes → controllers → services → Mongoose → MongoDB. See `docs/ARCHITECTURE.md`.

## 5. Why MERN

One language (JavaScript) across UI and API, JSON documents that match booking records, a huge ecosystem (JWT, bcrypt, Mongoose), and it is the stack most Indian college full-stack interviews expect. Alternatives like PostgreSQL would also work; range exclusion constraints are even stronger there. MongoDB was chosen to match the assigned stack and to keep resource metadata flexible.

## 6. How React talks to Express

The browser never touches MongoDB. Pages call functions in `client/src/api/client.js`. In development Vite proxies `/api` to `localhost:5000` so cookies are first-party.

## 7. REST in this project

Nouns (`/bookings`, `/resources`) and verbs (GET list, POST create, PATCH cancel). Version prefix `/api/v1`. Status codes communicate outcome: 409 for conflicts.

## 8. Why MongoDB and Mongoose

MongoDB stores JSON-like documents. Mongoose adds schemas, enums, indexes, and `populate` to join a booking with its resource. Bookings are a separate collection because embedding unbounded history inside a resource is a poor write pattern.

## 9. Authentication and authorization

Login hashes comparison via bcrypt, then `jwt.sign({ sub, role, email })`. Cookie is HttpOnly. `authenticate` middleware verifies JWT and loads the user. `authorize('ADMIN')` guards admin routes. Students cannot read another user’s booking (`403`).

## 10. Password storage

`bcrypt.hash(password, 12)`. The hash is `select: false`. APIs never return it.

## 11. Overlap detection

Active statuses are PENDING and CONFIRMED.

```
existing.startTime < requested.endTime AND existing.endTime > requested.startTime
```

Half-open intervals allow back-to-back slots.

## 12. Concurrent requests

Two handlers can both pass the overlap query. LabSlot uses `findOneAndUpdate` with “lock expired or empty” as the filter so only one request owns `bookingLockUntil`. The owner inserts; the other retries or receives 409/429. This is not a full distributed consensus algorithm, but it is stronger than a single unprotected insert.

## 13. Unauthorized access

Frontend route guards only hide UI. The API enforces cookies, roles, and ownership. CSRF blocks cross-site form posts.

## 14. Dashboard statistics

`Booking.aggregate` / `countDocuments` in `adminService.getDashboard` and `bookingService.studentDashboard`. Confirmed bookings whose `endTime` is past are marked COMPLETED when those endpoints run.

## 15. Errors

Services throw `ApiError(status, message)`. `errorHandler` maps duplicate key `11000` to 409 and bad ObjectIds to 400. The UI shows `error.response.data.message`.

## 16. Testing

Jest + Supertest for API; Vitest + Testing Library for forms and mocked lists. A dedicated concurrency test fires two overlapping POSTs.

## 17. Limitations and future work

No email, waitlist, QR check-in, CSV export, or Playwright E2E. Timezones are server-local. Capacity pools of N identical units are intentionally not implemented. Transactions on a replica set would be a next hardening step. A worker for COMPLETED status would be better than lazy updates.

## 18. Likely questions (25)

1. **What is LabSlot?** A MERN lab resource reservation system with conflict prevention.
2. **MERN?** MongoDB, Express, React, Node.
3. **Why JWT in a cookie?** Steal-resistant vs localStorage; needs CSRF.
4. **What is CSRF here?** Double-submit cookie `labslot_csrf` + header.
5. **How do you hash passwords?** bcrypt cost 12.
6. **Can a student become admin via the register API?** No; validator rejects `role`, service forces STUDENT.
7. **What is a half-open interval?** Occupies `[start, end)` so 11:00 is free for the next booking.
8. **Why not delete resources?** History integrity; we deactivate.
9. **Indexes you added?** email unique, resourceCode unique, booking time + resource.
10. **Why a service layer?** Keep overlap rules in one place.
11. **Helmet?** HTTP security headers.
12. **Rate limiting?** express-rate-limit on `/api` and stricter on auth (skipped in tests).
13. **populate?** Mongoose join-like lookup of referenced documents.
14. **Aggregation?** Group bookings by day/status/resource for charts.
15. **Vite vs CRA?** Faster native ESM dev server.
16. **Context API vs Redux?** Auth and toasts are small; no Redux.
17. **How is availability computed?** Server subtracts active bookings from operating hours.
18. **Pending vs confirmed?** Env flag; pending still blocks the slot.
19. **429 vs 409?** 429 lock busy; 409 real overlap/maintenance.
20. **CORS?** Explicit origin + credentials.
21. **ObjectId validation?** `isMongoId()` in express-validator.
22. **How do you test concurrency?** `Promise.all` two POSTs, expect one 201 and one 409.
23. **Why ES modules on the server?** `"type": "module"` matches modern Node.
24. **Recharts?** Admin trend and utilization only, from API data.
25. **Biggest bug class you guarded?** Double booking under race.

## 19. Scenario questions (10)

1. **Two students click Book together.** Resource lock; one insert; the other 409/429.
2. **JWT expired.** `jwt.verify` fails → 401; UI sends user to login.
3. **MongoDB down.** `connectDb` fails at startup; requests would 500 if the connection drops later — document that a process manager should restart.
4. **Resource enters maintenance.** New POSTs 409; old bookings remain.
5. **Student GETs someone else’s `/bookings/:id`.** 403.
6. **Student PATCHes `/admin/resources`.** 403 from `authorize`.
7. **Booking in the past.** 400 from `validateBookingWindow`.
8. **Cancel one hour before start with cutoff=1.** Student 400; admin can still cancel.
9. **Approval enabled and two pending same slot.** First pending occupies; second 409.
10. **Invalid id `abc`.** 400 from validator, not a 500 CastError for those routes.

## 20. Implemented vs future

**Implemented:** auth, CSRF cookies, student/admin UI, resources, availability, booking engine + lock, cancel, dashboards, history, profile, seed, Postman, docs, Jest/Vitest tests.

**Not implemented:** email, SMS, waitlists, QR, CSV, calendar heatmap, CI badges, public cloud URL, replica-set transactions.
