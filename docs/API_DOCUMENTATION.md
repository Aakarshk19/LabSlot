# API documentation

Base URL (local): `http://localhost:5000/api/v1`

Envelope:

```json
{ "success": true, "data": {} }
```

Errors:

```json
{ "success": false, "message": "…", "details": [] }
```

Authentication: session cookie `labslot_token`. Mutating requests also send header `X-CSRF-Token` equal to cookie `labslot_csrf`. Login and register are CSRF-exempt because they issue the cookies.

| Status | Meaning |
| --- | --- |
| 400 | Validation / malformed id |
| 401 | Missing or expired session |
| 403 | Authenticated but wrong role, CSRF, or foreign booking |
| 409 | Duplicate email/code or booking conflict |
| 429 | Resource lock busy or rate limit |

## Health

`GET /health` and `GET /api/v1/health` — public.

## Auth

### POST `/auth/register`

Public. Body: `{ name, email, password, department? }`. Role cannot be sent. `201` + cookies.

### POST `/auth/login`

Public. Body: `{ email, password }`. `200` user + cookies. `401` on bad credentials.

### POST `/auth/logout`

Cookie session. Clears cookies.

### GET `/auth/me`

Authenticated. Current user without `passwordHash`.

## Users

### GET `/users/me` — same as `/auth/me`

### PATCH `/users/me`

Body: `{ name?, department? }`. Role is ignored.

## Resources

### GET `/resources`

Query: `search`, `category`, `location`, `status`, `sort` (`name|location|newest`), `page`, `limit`. Deactivated hidden.

### GET `/resources/:id`

### GET `/resources/:id/availability?date=YYYY-MM-DD`

Returns operating hours, occupied intervals, and slot array with `available` computed on the server.

### POST `/resources` (ADMIN)

Create. Body includes `name`, `resourceCode`, `description`, `category`, `location`, optional `specifications`, `imageUrl`, `bookingConfig`.

### PATCH `/resources/:id` (ADMIN)

### PATCH `/resources/:id/status` (ADMIN)

Body `{ status: AVAILABLE|MAINTENANCE|DEACTIVATED }`.

Admin list (includes deactivated): `GET /admin/resources`.

## Bookings

### POST `/bookings`

Body `{ resourceId, startTime, endTime, purpose }`. `201` or `409`.

### GET `/bookings/my`

### GET `/bookings/history`

Student: own rows. Admin: all. Query `status`, `from`, `to`, `page`.

### GET `/bookings/dashboard`

Student stats and lists.

### GET `/bookings/:id`

Owner or admin.

### PATCH `/bookings/:id/cancel`

Body `{ reason? }`. Students must own the booking and respect cutoff hours.

Responses include `statusHistory`, with the status, timestamp, responsible user (or `null` for automatic completion), and note for each transition.

## Notifications

All notification routes require authentication and return only the current user's notifications.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/notifications?page=1&limit=20` | List recent notifications and unread count. Upcoming reservations within 24 hours receive a reminder when this route is requested. |
| PATCH | `/notifications/:id/read` | Mark one owned notification as read |
| PATCH | `/notifications/read-all` | Mark all current user's notifications as read |

Booking creation, approval, rejection, and cancellation create in-app notifications for the affected user(s).

## Administration

All require `ADMIN`.

| Method | Path |
| --- | --- |
| GET | `/admin/dashboard` |
| GET | `/admin/bookings` |
| PATCH | `/admin/bookings/:id/approve` |
| PATCH | `/admin/bookings/:id/reject` |
| PATCH | `/admin/bookings/:id/cancel` |
| GET | `/admin/resources` |
| POST | `/admin/resources` |
| PATCH | `/admin/resources/:id` |
| PATCH | `/admin/resources/:id/status` |
| GET | `/admin/users` |
| GET | `/admin/reports` |

Dashboard totals are `countDocuments` / aggregations, not hardcoded numbers.

Import `postman/LabSlot.postman_collection.json` for runnable examples. Enable cookie persistence in Postman.
