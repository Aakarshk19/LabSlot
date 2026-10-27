# Project overview

## Problem statement

College laboratories typically share scarce workstations and instruments. Paper logs and informal messaging cannot prevent two students from claiming the same bench at the same time, hide equipment that is under maintenance, or give staff a reliable history of who used which resource.

## Proposed solution

LabSlot is a browser-based reservation system. Each independently bookable unit is a `Resource` document. Students authenticate, inspect availability calculated by the server, and create a `Booking` for a half-open time interval `[startTime, endTime)`. Administrators maintain inventory, place equipment into maintenance, review reservations when approval is enabled, and inspect usage statistics.

## Objectives

1. Digitize laboratory reservations.
2. Prevent overlapping bookings of the same resource.
3. Authenticate users and enforce student vs admin permissions on the API.
4. Keep reservation history without deleting resources that have been used.
5. Demonstrate a maintainable MERN architecture suitable for interview discussion.

## Scope

**In scope:** registration, login, resource catalogue, availability, booking, cancellation, student/admin dashboards, history, profile, resource CRUD (soft deactivate), maintenance, optional approval workflow, tests, documentation.

**Out of scope:** email/SMS, payment, waitlists, QR check-in, mobile native apps, multi-tenant SaaS billing.

## Intended users

- **Students** who need a workstation or instrument for a lab session or project.
- **Administrators** (lab technicians or faculty coordinators) who own the inventory.

## Core features

See the README feature list. Booking integrity is the primary feature: the UI may suggest free slots, but only the API decides whether a reservation is stored.

## Functional requirements

Covered by modules A–G in the original product brief: auth, resources, scheduling, student dashboard, admin dashboard, history, in-app feedback.

## Non-functional requirements

- Responsive layout for laptop and phone.
- JSON APIs with consistent `{ success, data|message }` envelopes.
- Passwords hashed with bcrypt; JWTs in HttpOnly cookies.
- Meaningful HTTP status codes (`400`, `401`, `403`, `409`, `429`).
- Automated tests around auth, overlap, concurrency, and core UI flows.

## Assumptions and limitations

- One MongoDB database per deployment.
- Each resource is a single bookable unit (not a pool of N interchangeable items).
- Laboratory operating hours are stored per resource and assumed to be in the server's local timezone.
- Demo passwords in `.env.example` are for local development only.
