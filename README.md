# LabSlot — Smart Lab & Equipment Booking System

LabSlot is a full-stack university lab reservation app. Students can browse resources, check time-slot availability, reserve workstations and equipment, and manage their bookings. Administrators can manage resources, review reservations, and view usage reports.

## What is included

- Student registration and login with bcrypt password hashes and JWTs in secure, HTTP-only cookies; CSRF protection is enabled for state-changing requests.
- Student and administrator roles with protected React routes and API endpoints.
- Searchable, filterable resource catalogue, resource detail pages, operating-hour-aware availability, and booking forms.
- Server-side conflict detection for overlapping reservations. A short-lived atomic lock on each resource serializes concurrent booking requests.
- Configurable booking review: when enabled, a reservation starts as `PENDING`; otherwise it is immediately `CONFIRMED`.
- Cancellation rules, booking history, status history with timestamps and responsible user, and automatic completion of elapsed confirmed bookings when dashboard data loads.
- In-app notifications for reservation requests, approvals, rejections, cancellations, and reservations starting within 24 hours. The notification page supports marking one or all as read.
- Admin resource and booking management, student directory, dashboard, and analytics charts for booking trends, popular resources, and status counts.
- Seed data and backend/frontend test suites.

## Technology

- **Client:** React 18, Vite, React Router, Axios, Recharts, Lucide, responsive CSS
- **API:** Node.js, Express, Mongoose, MongoDB, JWT, bcrypt, express-validator
- **Tests:** Jest, Supertest, mongodb-memory-server, Vitest, React Testing Library

The existing repository is implemented in JavaScript/JSX with regular CSS. It does not currently use TypeScript or Tailwind CSS.

## Prerequisites

- Node.js 20 or later and npm 10 or later
- MongoDB 6 or later running locally, or Docker Desktop

## Start from a fresh checkout

1. Open a terminal in the repository root (`LabSlot`).
2. Install root, server, and client dependencies:

   ```bash
   npm run install:all
   ```

3. Create your local environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

   On macOS/Linux, use `cp .env.example .env`.

4. Open `.env`. Set `JWT_SECRET` to a long random value. Set `ADMIN_PASSWORD` to a password for your local demo administrator. Keep `.env` private and do not commit it.
5. Start MongoDB using one option:

   - **Local MongoDB:** make sure the MongoDB service is running. The default URI is `mongodb://127.0.0.1:27017/labslot`.
   - **Docker:** run `docker compose up -d` from the project root.

6. Create the administrator and sample data:

   ```bash
   npm run seed
   ```

7. Start the API and web client together:

   ```bash
   npm run dev
   ```

8. Open **http://localhost:5173**. The API health check is **http://localhost:5000/api/v1/health**.

The Vite development server proxies `/api` to Express so authentication cookies work from the client origin. Use `localhost` consistently for the browser URL.

### Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@labslot.local` (or `ADMIN_EMAIL` from `.env`) | `ADMIN_PASSWORD` from `.env` |
| Student | `student@labslot.local` | `StudentPass123` |

Demo accounts are for local evaluation only. Choose a private administrator password before running the seed script in any shared environment.

### Booking approval setting

Set `REQUIRE_BOOKING_APPROVAL=true` in `.env` to put new requests into the pending review queue. With the default `false`, valid bookings are immediately confirmed. Restart the API after changing environment settings.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run Express and Vite together |
| `npm run dev:server` | Run only the API |
| `npm run dev:client` | Run only the web client |
| `npm run seed` | Create the demo administrator, student, and resources |
| `npm run build` | Build the production web client |
| `npm run test:server` | Run backend API tests |
| `npm run test:client` | Run frontend component tests |
| `npm test` | Run both test suites |
| `npm run lint` | Lint server and client source |

## API outline

All API routes use the `/api/v1` prefix and return JSON with a `success` flag and `data` or `message`.

| Route | Access | Purpose |
| --- | --- | --- |
| `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | Public/current user | Authentication and current profile |
| `GET /resources`, `GET /resources/:id`, `GET /resources/:id/availability` | Signed in | Browse resources and available slots |
| `POST /bookings`, `GET /bookings/my`, `GET /bookings/history`, `PATCH /bookings/:id/cancel` | Signed in | Create and manage personal reservations |
| `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` | Signed in | In-app notifications |
| `/admin/resources`, `/admin/bookings`, `/admin/users` | Admin | Manage resources, reservations, and students |
| `GET /admin/dashboard`, `GET /admin/reports` | Admin | Dashboard metrics and analytics data |

For request payload details and example workflows, see [API documentation](docs/API_DOCUMENTATION.md) and the [Postman collection](postman/LabSlot.postman_collection.json).

## Project layout

```text
client/       React application and responsive styles
server/       Express API, Mongoose models, services, routes, and tests
scripts/      Seed entry point
docs/         Architecture, API, schema, user, testing, and deployment guides
postman/      API collection
```

## Configuration reference

See [.env.example](.env.example) for all variables. The main settings are:

| Variable | Use |
| --- | --- |
| `MONGODB_URI` | MongoDB database connection |
| `JWT_SECRET` | Secret used to sign auth tokens; replace the example value |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `CLIENT_ORIGIN` | Allowed browser origin for CORS |
| `COOKIE_SECURE` | Set `true` when serving over HTTPS |
| `REQUIRE_BOOKING_APPROVAL` | Require admin review for new reservations |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | First-run administrator created by seed |
| `VITE_API_BASE_URL` | Optional public API base URL; leave empty for local Vite proxy |

## Known limitations

- Email and SMS delivery are not implemented; notifications are stored in-app. Upcoming reminders are generated when the notification list is requested and cover the next 24 hours.
- No background worker is configured. Elapsed reservations are marked completed when dashboard/report services load.
- Resource locks serialize booking requests through the MongoDB resource document and are suitable for this coursework app. A distributed lock or transaction-backed design would be appropriate for a multi-instance production deployment.
- Analytics show reservation counts and status breakdowns; they do not estimate physical occupancy from check-in data.
- Laboratories and equipment are represented by one `Resource` collection; lab names/locations are resource attributes rather than a separate `Lab` model.
- The UI uses JSX and CSS rather than the requested TypeScript and Tailwind stack.

## Further documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database schema](docs/DATABASE_SCHEMA.md)
- [User guide](docs/USER_GUIDE.md)
- [Testing guide](docs/TESTING.md)
- [Deployment guide](docs/DEPLOYMENT.md)
