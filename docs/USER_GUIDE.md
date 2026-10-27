# User guide

## Students

### Register and log in

1. Open http://localhost:5173
2. Choose **Register**, enter name, email, and a password with letters and numbers (min 8 characters).
3. You are signed in as a **student**. You cannot register as an administrator.
4. Later, use **Log in** with the same email.

### Find resources

Open **Resources**. Search by name or code (for example `EL-DSO-04`). Filter by category and laboratory location. Cards show availability status.

### Check availability

Open a resource. Pick a date. Green slots are calculated by the server from existing PENDING/CONFIRMED reservations and operating hours. Grey slots are in the past or already taken.

### Create a reservation

Select a start time, duration, and a purpose of at least five characters. Submit **Confirm reservation**. Duplicate clicks are disabled while the request is in flight. You receive a booking reference such as `LS-20261020-A1B2C3`.

If someone else booked the same interval, you see a conflict message and your form values remain.

### View and cancel bookings

**My bookings** lists your reservations. **History** supports status and date filters. Cancel is allowed only for your pending/confirmed bookings and only before the cutoff (default one hour before start).

### Profile

Update display name and department. Email and role cannot be changed in the UI.

## Administrators

Sign in with the seeded admin account. The navigation switches to Overview, Resources, Reservations, and Users.

### Manage resources

Create or edit name, code, category, location, and description. **Maintenance** blocks new bookings. **Deactivate** hides the resource from students but keeps history. Do not expect a hard delete.

### Review reservations

Filter by status. If `REQUIRE_BOOKING_APPROVAL=true`, pending rows can be approved or rejected. Admins may cancel with a reason regardless of cutoff.

### Maintenance

Put a unit into maintenance before servicing. Existing reservations stay visible so staff can contact students if needed.

### Reports

The overview charts count bookings created in the last 14 days and resources with the most reservations. `/api/v1/admin/reports` exposes the same aggregations for a date range.
