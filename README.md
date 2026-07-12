# TransitOps — Smart Transport Operations Platform

An end-to-end transport operations platform that digitizes vehicle, driver,
dispatch, maintenance, and expense management while enforcing business rules and
providing operational insights.

> Built for logistics teams that still juggle spreadsheets and manual logbooks.
> TransitOps centralizes the full lifecycle — from vehicle registration and
> driver management to dispatching, maintenance, fuel logging, and analytics.

---

## Tech Stack

| Layer     | Choice                          |
| --------- | ------------------------------- |
| Framework | React 19 + Vite                 |
| Styling   | Tailwind CSS v4                 |
| Routing   | React Router                    |
| Linting   | Oxlint                          |

---

## Target Users (RBAC)

- **Fleet Manager** — fleet assets, maintenance, vehicle lifecycle, efficiency.
- **Driver** — creates trips, assigns vehicles/drivers, monitors deliveries.
- **Safety Officer** — driver compliance, license validity, safety scores.
- **Financial Analyst** — expenses, fuel consumption, maintenance costs, ROI.

---

## Features

**Core**

- Secure email/password login with Role-Based Access Control
- Dashboard with KPIs (active/available vehicles, trips, drivers on duty, fleet utilization)
- Vehicle Registry (CRUD) — status: Available, On Trip, In Shop, Retired
- Driver Management (CRUD) — status: Available, On Trip, Off Duty, Suspended
- Trip Management with validations — lifecycle: Draft → Dispatched → Completed → Cancelled
- Automatic status transitions across vehicles, drivers, and maintenance
- Maintenance workflow (active log → vehicle switches to In Shop)
- Fuel & Expense tracking with computed operational cost per vehicle
- Reports & Analytics with CSV export

**Bonus**

- Charts & visual analytics
- PDF export
- Email reminders for expiring licenses
- Vehicle document management
- Search, filters, and sorting
- Dark mode

---

## Business Rules

- Vehicle registration number must be unique.
- Retired / In Shop vehicles never appear in dispatch selection.
- Drivers with expired licenses or Suspended status can't be assigned to trips.
- A driver or vehicle already On Trip can't be assigned to another trip.
- Cargo weight must not exceed the vehicle's max load capacity.
- Dispatching a trip sets both vehicle and driver to On Trip.
- Completing / cancelling a trip restores both to Available.
- Creating an active maintenance record sets the vehicle to In Shop.
- Closing maintenance restores the vehicle to Available (unless retired).

---

## Getting Started

Prerequisites: **Node.js 18+** and npm.

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed in the terminal (default `http://localhost:5173`).

### Scripts

| Command           | Description                      |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start the Vite dev server        |
| `npm run build`   | Production build into `dist/`    |
| `npm run preview` | Preview the production build     |
| `npm run lint`    | Run Oxlint                       |

---

## Project Structure

```
Odoo26/
├─ .gitignore
├─ README.md
└─ frontend/
   ├─ index.html
   ├─ vite.config.js
   ├─ package.json
   └─ src/
      ├─ main.jsx
      ├─ App.jsx            # routes
      ├─ index.css          # Tailwind entry
      ├─ layouts/
      │  └─ DashboardLayout.jsx
      ├─ components/
      │  └─ PlaceholderPage.jsx
      └─ pages/
         ├─ Login.jsx
         ├─ Dashboard.jsx
         ├─ Vehicles.jsx
         ├─ Drivers.jsx
         ├─ Trips.jsx
         ├─ Maintenance.jsx
         ├─ Expenses.jsx
         └─ Reports.jsx
```

---

## Design Reference

Mockups: https://link.excalidraw.com/l/65VNwvy7c4X/1FHGDNgD2td
