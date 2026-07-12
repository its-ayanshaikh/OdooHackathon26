# TransitOps — Smart Transport Operations Platform

An end-to-end transport operations platform that digitizes vehicle, driver,
dispatch, maintenance, and expense management while enforcing business rules and
providing operational insights.

> Built for logistics teams that still juggle spreadsheets and manual logbooks.
> TransitOps centralizes the full lifecycle — from vehicle registration and
> driver management to dispatching, maintenance, fuel logging, and analytics.

---

## Tech Stack

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Frontend   | React 19 + Vite, Tailwind CSS v4, React Router, Recharts, Lucide icons |
| Backend    | Django 6 + Django REST Framework                              |
| Auth       | JWT (SimpleJWT) stored in httpOnly cookies, auto-refresh      |
| Database   | MySQL (`odoohack26`)                                          |
| Linting    | Oxlint (frontend)                                             |

---

## Repository Structure

```
Odoo26/
├─ .gitignore
├─ README.md
├─ backend/                     # Django REST API
│  ├─ manage.py
│  ├─ requirements.txt
│  ├─ .env                      # local secrets (not committed)
│  ├─ .env.example
│  ├─ transitops/               # project settings / urls
│  ├─ common/                   # custom User + auth (login/refresh/logout/me)
│  ├─ vehicles/                 # vehicle registry
│  ├─ drivers/                  # driver management
│  ├─ trips/                    # trips + dispatch/complete/cancel
│  ├─ maintenance/              # maintenance logs
│  └─ expenses/                 # fuel logs & expenses
└─ frontend/                    # React app
   ├─ index.html
   ├─ vite.config.js
   ├─ package.json
   └─ src/
      ├─ main.jsx
      ├─ App.jsx                # routes + guards
      ├─ layouts/               # collapsible sidebar + mobile bottom-nav
      ├─ components/            # UI kit, responsive table, toast, logo
      ├─ pages/                 # dashboard, vehicles, drivers, trips, …
      ├─ store/                 # Auth + App (data) contexts
      └─ lib/                   # api client, resources, rbac, nav
```

---

## Prerequisites

- **Python 3.11+** (developed on 3.14)
- **Node.js 18+** and npm
- **MySQL** running locally with a database named `odoohack26`
  (default dev credentials: user `root`, empty password)

---

## 1. Backend Setup (run this first)

```bash
cd backend

# create & activate a virtual environment
python3 -m venv venv
source venv/bin/activate            # macOS / Linux
# venv\Scripts\activate             # Windows

# install dependencies
pip install -r requirements.txt

# create the .env file (copy the example and adjust if needed)
cp .env.example .env

# apply database migrations
python manage.py migrate

# seed demo login accounts (password: demo1234)
python manage.py seed_users

# seed demo fleet data (vehicles, drivers, trips, maintenance, fuel, expenses)
python manage.py seed_data

# run the server (bind to 0.0.0.0 so it's reachable on your LAN IP)
python manage.py runserver 0.0.0.0:8000
```

The API is now available at `http://127.0.0.1:8000/api/`.

### `.env` reference

```env
SECRET_KEY=change-me
DEBUG=True

DB_NAME=odoohack26
DB_USER=root
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=3306

ALLOWED_HOSTS=localhost,127.0.0.1,172.20.10.3
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://172.20.10.3:5173

ACCESS_TOKEN_LIFETIME_MIN=30
REFRESH_TOKEN_LIFETIME_DAYS=7
AUTH_COOKIE_SECURE=False
```

### Useful management commands

| Command                                   | Description                          |
| ----------------------------------------- | ------------------------------------ |
| `python manage.py seed_users`             | Create the 5 demo role accounts      |
| `python manage.py seed_data`              | Seed demo fleet data                 |
| `python manage.py seed_data --fresh`      | Wipe fleet data and reseed           |
| `python manage.py createsuperuser`        | Create a Django admin user           |

---

## 2. Frontend Setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev -- --host        # --host exposes it on your LAN (e.g. 172.20.10.3:5173)
```

Open the printed URL (default `http://localhost:5173`).

> The frontend auto-detects the API host from the browser location
> (`http://<hostname>:8000/api`). To override, set `VITE_API_URL` in a
> `frontend/.env` file.

### Google Maps (route search & maps)

Trips use Google Maps for source/destination **Places autocomplete** and a
themed **route map** (with a “Route” button on each trip). To enable it:

1. Get a Google Maps JavaScript API key with **Places** and **Directions** enabled.
2. Add it to `frontend/.env`:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_key_here
   ```
3. Restart `npm run dev`.

Without a key the fields still work as plain text inputs and the map shows a
friendly “add your key” message.

### Frontend scripts

| Command           | Description                   |
| ----------------- | ----------------------------- |
| `npm run dev`     | Start the Vite dev server     |
| `npm run build`   | Production build into `dist/` |
| `npm run preview` | Preview the production build  |
| `npm run lint`    | Run Oxlint                    |

---

## Demo Accounts (RBAC)

All accounts use the password **`demo1234`**. Use the quick-login buttons on the
sign-in screen or type the email manually.

| Role              | Email                     | Access                                    |
| ----------------- | ------------------------- | ----------------------------------------- |
| Admin             | admin@transitops.com      | Everything                                |
| Fleet Manager     | fleet@transitops.com      | Dashboard, Fleet, Trips, Maintenance, Reports |
| Driver            | driver@transitops.com     | Dashboard, Trips                          |
| Safety Officer    | safety@transitops.com     | Dashboard, Drivers                        |
| Financial Analyst | finance@transitops.com    | Dashboard, Fuel & Expenses, Reports       |

---

## API Endpoints

```
POST   /api/auth/login/            email + password → sets httpOnly JWT cookies
POST   /api/auth/refresh/          new access token from the refresh cookie
POST   /api/auth/logout/           clears cookies
GET    /api/auth/me/               current authenticated user

GET  POST            /api/vehicles/          | GET PATCH DELETE  /api/vehicles/<id>/
GET  POST            /api/drivers/           | GET PATCH DELETE  /api/drivers/<id>/
GET  POST            /api/trips/             | GET DELETE        /api/trips/<id>/
POST                 /api/trips/<id>/dispatch/  |  /complete/  |  /cancel/
GET  POST            /api/maintenance/       | DELETE            /api/maintenance/<id>/
POST                 /api/maintenance/<id>/close/
GET  POST DELETE     /api/fuel/     , /api/fuel/<id>/
GET  POST DELETE     /api/expenses/ , /api/expenses/<id>/
```

Authentication is cookie-based: the access token lives in an httpOnly cookie and
is refreshed transparently by the frontend when it expires — so a page reload
keeps you signed in.

---

## Features

**Core**

- Secure email/password login with Role-Based Access Control
- Dashboard KPIs (active/available vehicles, trips, drivers on duty, utilization)
- Vehicle Registry & Driver Management (full CRUD, search, filter, sort)
- Trip Management with validations — lifecycle: Draft → Dispatched → Completed → Cancelled
- Automatic, server-enforced status transitions across vehicles, drivers, maintenance
- Fuel & Expense tracking with computed operational cost per vehicle
- Reports & Analytics with charts and CSV export

**Experience**

- Responsive, mobile-app-style layout (bottom navigation + bottom-sheet detail views)
- Collapsible sidebar, dark mode, rich SVG icons, animated toasts

---

## Business Rules (enforced server-side)

- Vehicle registration number must be unique.
- Retired / In Shop / On Trip vehicles never appear in dispatch selection.
- Drivers with expired licenses or Suspended status can't be assigned to trips.
- A vehicle or driver already On Trip can't be assigned to another trip.
- Cargo weight must not exceed the vehicle's max load capacity.
- Dispatching a trip sets vehicle + driver to On Trip.
- Completing / cancelling a trip restores both to Available.
- Creating an active maintenance record sets the vehicle to In Shop.
- Closing maintenance restores the vehicle to Available (unless retired).

---

## Design Reference

Mockups: https://link.excalidraw.com/l/65VNwvy7c4X/1FHGDNgD2td
