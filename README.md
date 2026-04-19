# LandEase Frontend

Frontend web application for **LandEase**, a migration support platform with service discovery, bookings, KYC, community features, real-time SOS alerts, and AI-assisted tools.

## Project overview

This repository contains the **React (Vite) UI** for LandEase. It connects to the LandEase backend API (separate repository) and provides role-based experiences for:
- **Migrant** users (services, bookings, KYC, SOS, AI tools, community)
- **Helper** users (service creation/management, incoming bookings, SOS acknowledgements)
- **Agency** users (admin dashboard for KYC + fraud/moderation)

## Features (UI)

- **Authentication**: login/register and protected routes
- **Dashboard**: role-aware navigation
- **Profile** page
- **Services**: browse services, view details, helper creates services
- **Bookings**: migrant bookings and helper incoming bookings
- **KYC**: submit KYC + view status
- **Community**: communities, join/leave, posts, create post
- **SOS**: emergency flow + real-time updates (SignalR via backend)
- **AI tools**:
  - AI chat
  - Voice translator
  - Immigration predictor UI
  - Place recognition integration
- **Admin (Agency)**: fraud flags + moderation tools

## Tech stack

- **React 19** + **Vite**
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **HTTP**: Axios
- **UX**: lucide-react, react-hot-toast

## Setup & installation

### Prerequisites
- Node.js 20+
- Backend API running locally or deployed

### Install and run

```bash
npm install
npm run dev
```

Local dev uses a Vite proxy:
- `/api` → `http://localhost:5153` (configured in `vite.config.js`)

## Configuration

### API base URL

For production deployments (e.g., Azure Static Web Apps), set:
- `VITE_API_BASE_URL`

See `.env.example` for guidance.

If `VITE_API_BASE_URL` is not set, the app defaults to `/api` (works with the Vite dev proxy locally).

## Usage

1. Start the backend API (or use a deployed URL).
2. Run this frontend and register/login.
3. Use the dashboard pages based on your assigned role (Migrant/Helper/Agency).

## Future improvements

- Harden auth token storage (consider httpOnly cookies + CSRF strategy)
- Add end-to-end tests (Playwright/Cypress) for core flows
- Add i18n for multilingual UI (pairs well with translator feature)

## Author / credits

- **Author**: Nethma D. Tharuka (`@nethmadtharuka`)
