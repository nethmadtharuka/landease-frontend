# LandEase Frontend

React (Vite) UI for **LandEase**, a migration support platform. It talks to the LandEase ASP.NET Core API (separate repository).

## Roles

- **Migrant**: services, bookings, reviews, KYC, SOS, AI assistant, voice translator, profile-strength check, community
- **Helper**: everything above plus listing services and handling incoming bookings; responds to SOS alerts
- **Agency / Admin** (granted by LandEase staff, never self-registered): KYC review queue and fraud flags; Agency accounts also respond to SOS alerts

## What works today (verified against the backend contract)

| Area | Notes |
|---|---|
| Auth | Register (Migrant/Helper only), login, profile view and edit |
| Services | Browse/search/filter by category, details, create (KYC-verified Helpers) |
| Bookings | Requested → Accepted → In progress → Completed, cancel/decline; reviews tied to the completed booking |
| KYC | Upload ID + selfie (+ address proof); staff see time-limited document links and must give a reason to reject |
| SOS | Trigger with GPS, responders see active alerts on a map (polling every 10 s) and can acknowledge |
| AI assistant | Conversation memory per session, resumes the last session, AI disclaimer always visible |
| Profile strength | General heuristic score + optional AI document checklist (explicit consent required) |

Known gaps are tracked in `docs/LandEase_Complete_Production_Implementation_Roadmap.md` in the workspace root
(e.g. the SignalR real-time client for SOS is Stage 2; place recognition and recommendations have no UI yet).

## Tech stack

React 19, Vite 7, React Router 7, Tailwind CSS 3, Axios, Leaflet (bundled), react-hot-toast, lucide-react. Tests: Vitest.

## Run locally

```bash
npm ci
npm run dev        # http://localhost:5173, proxies /api -> http://localhost:5153
npm run lint
npm test
npm run build
```

## Configuration

`VITE_API_BASE_URL` is the API **origin** (e.g. `https://<your-app>.azurewebsites.net`). Leave it empty locally.
Every request path already begins with `/api/`; a trailing `/api` in the variable is stripped so requests can never
become `/api/api/...`. The API must list this site's origin in `Cors:AllowedOrigins`.

## Conventions

- Enum values are exchanged with the API as **strings** (e.g. `"Transport"`, `"InProgress"`); see `src/lib/enums.js`.
- Show API errors with `apiErrorMessage(err, fallback)` from `src/lib/apiError.js` — never swallow them.
- Never build HTML strings from user data; if a library requires it (Leaflet popups), use `escapeHtml`.

## CI

`.github/workflows/ci.yml`: `npm ci` → lint → unit tests → production dependency audit → build.

> Windows note: run Vitest from a path with an upper-case drive letter (`E:\...`). A lower-case drive letter in the
> shell's working directory can make Vite load Vitest twice ("failed to find the current suite").
