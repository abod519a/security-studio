# Security Studio

Express + PostgreSQL backend with a vanilla HTML/CSS/JS frontend and a separate admin panel at `/admin`.

## Setup
1. Install Node.js 18+ (https://nodejs.org) and PostgreSQL 14+.
2. `npm install`
3. Create the database: `createdb security_studio`
4. `cp .env.example .env` and set `DATABASE_URL` (e.g. `postgres://user:pass@localhost:5432/security_studio`), `SESSION_SECRET` (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`), `ADMIN_USERNAME`, `ADMIN_PASSWORD`. Use `NODE_ENV=development` locally (secure cookies need HTTPS).
5. `npm run setup` creates the tables and the admin account (password stored as a bcrypt hash). Then remove `ADMIN_PASSWORD` from `.env`.
6. Development: `npm run dev`. Production: `NODE_ENV=production npm start`.

Open `http://localhost:3000` and `http://localhost:3000/admin`.

## HTTPS and deployment
Run behind a reverse proxy (Caddy or nginx with Let's Encrypt) that forwards to `PORT` and sets `X-Forwarded-Proto`. The app trusts one proxy and sets Secure, HttpOnly, SameSite=Strict session cookies in production. Deploy frontend and backend together: Express serves `/public` and `/admin`. Set all environment variables in your host's secret manager; never commit `.env`.

## Notes
- Project images are set by URL. File upload is not implemented yet.
- Change the initial admin password after first login by re-running `npm run setup` with a new `ADMIN_PASSWORD`.
