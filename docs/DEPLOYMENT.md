# Deployment

LabSlot has **not** been deployed to a public host as part of this implementation. The notes below are for when you choose a host.

## Local deployment

1. Install Node.js and MongoDB (or Docker).
2. Copy `.env.example` to `.env` and set `JWT_SECRET`.
3. `npm run install:all`
4. `npm run seed`
5. `npm run dev` — UI `5173`, API `5000`.

Production-like local check:

```bash
npm run build
npm run start --prefix server
npm run preview --prefix client
```

Point the preview origin in `CLIENT_ORIGIN` if you serve the UI separately.

## Production considerations

- Serve the Vite `client/dist` files behind HTTPS (Nginx, a Node static host, or a CDN).
- Run `node server/src/server.js` as a process (`systemd`, PM2, or a container).
- Set `NODE_ENV=production`.
- Use MongoDB Atlas or a managed replica set if you later add multi-document transactions.
- Set `COOKIE_SECURE=true` and `COOKIE_SAMESITE=none` only if the API and UI are on different sites over HTTPS. If they share a domain (API at `api.example.edu`, UI at `lab.example.edu`), prefer `lax` plus a shared parent domain cookie configuration.
- Set `CLIENT_ORIGIN` to the exact UI origin for CORS.
- Rotate `JWT_SECRET` and admin passwords; never ship `.env`.
- Keep rate limits enabled.

## Environment variables

See `.env.example`. Required in production: `JWT_SECRET`, `MONGODB_URI`, `CLIENT_ORIGIN`, `COOKIE_SECURE`.

`VITE_API_BASE_URL` is baked in at **build** time. If the browser talks to a different API host, set it before `npm run build`. Empty means same-origin `/api/v1`.

## Common failures

- **Cookies missing:** mixed HTTP/HTTPS or wrong `SameSite`.
- **CORS errors:** `CLIENT_ORIGIN` does not match the browser origin exactly (scheme, host, port).
- **Mongo network timeout:** Atlas IP allowlist.
- **CSRF 403:** frontend not sending `X-CSRF-Token`.
