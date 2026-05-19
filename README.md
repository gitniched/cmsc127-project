# 🚙 BiyaheDB, LTO Traffic Management System

A full-stack web application for managing LTO (Land Transportation Office) driver records, vehicle registrations, and traffic violation tracking in the Philippines. Built as a course project for **CMSC 127: File Processing and Database Systems**.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Database Design](#database-design)
6. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Running the App](#running-the-app)
7. [Environment Variables](#environment-variables)
8. [Database Setup](#database-setup)
9. [API Endpoints](#api-endpoints)
10. [Reports](#reports)
11. [Business Rules](#business-rules)
12. [Legal References](#legal-references)
13. [Authors](#authors)

---

## Project Overview

This system digitizes the workflow of an LTO traffic enforcement office. It allows officers and clerks to:

- Register and manage driver profiles with license tracking
- Record and manage vehicle ownership and registrations
- Issue and track traffic violations (apprehensions)
- Renew driver licenses with automatic eligibility checking
- Generate reports on drivers, vehicles, and violations

The database schema strictly follows Philippine LTO regulations, including **R.A. 4136** (Land Transportation and Traffic Code), **R.A. 10930** (IRR for driver's license validity), and **MMDA revised fines and penalties**.

---
 
## Screenshots
 
### Dashboard
 
| Dashboard |
|---|
|<img width="1918" height="917" alt="image" src="https://github.com/user-attachments/assets/92fd9e10-34d7-4469-84e3-cf9f039e76d4" />|
 
---
 
### Drivers
 
| Driver List | Driver Profile | Add / Edit Driver | Renew License |
|---|---|---|---|
|<img width="1918" height="915" alt="image" src="https://github.com/user-attachments/assets/23f4ead3-8834-4d57-b91f-a1c6d2977439" />|<img width="1918" height="917" alt="image" src="https://github.com/user-attachments/assets/9746b324-d429-4f5a-b337-e19d3d419169" />|<img width="1918" height="917" alt="image" src="https://github.com/user-attachments/assets/619794d1-e0f3-4773-aa28-7a74c03255fc" />|<img width="495" height="442" alt="image" src="https://github.com/user-attachments/assets/33fec872-0fe5-4279-92f4-ceca63659a1c" />|
 
---
 
### Vehicles
 
| Vehicle List | Vehicle Detail | Add / Edit Vehicle | Add Registration |
|---|---|---|---|
|<img width="1918" height="916" alt="image" src="https://github.com/user-attachments/assets/0af15997-7d42-4cfc-8861-f2951d6e34ea" />|<img width="1918" height="917" alt="image" src="https://github.com/user-attachments/assets/15b28165-7261-402c-af96-6f35c671c810" />|<img width="846" height="750" alt="image" src="https://github.com/user-attachments/assets/c314b91e-9dd3-46c7-8dc8-3453ebcf3aa8" />|<img width="490" height="728" alt="image" src="https://github.com/user-attachments/assets/ae9ae3b8-96a5-4eef-90dd-6094cb93fd14" />|
 
---
 
### Violations
 
| Violation List | Violation Detail | Add / Edit Violation |
|---|---|---|
|<img width="1918" height="917" alt="image" src="https://github.com/user-attachments/assets/be9531e5-9377-4341-ac30-3321466fd051" />|<img width="775" height="705" alt="image" src="https://github.com/user-attachments/assets/314b1288-361f-4697-81b1-ff202b5de311" />|<img width="842" height="832" alt="image" src="https://github.com/user-attachments/assets/3937a2cd-4cc4-4212-8375-e4a5e7599c19" />|
 
---
 
### Reports
 
| Report 1 — Filter Drivers | Report 2 — Vehicles by Driver | Report 3 — Expired Registrations |
|---|---|---|
|<img width="1918" height="917" alt="image" src="https://github.com/user-attachments/assets/0256390d-dcc7-4f9d-9e38-f1b6e49b0102" />|<img width="1918" height="912" alt="image" src="https://github.com/user-attachments/assets/3cb414fa-7ad3-4fce-b569-e6a20249808b" />|<img width="1918" height="917" alt="image" src="https://github.com/user-attachments/assets/cd52d7b7-6357-45f9-8f7d-a93732c802d6" />|
 
| Report 4 — Expired/Suspended Licenses | Report 5 — Violations by Driver | Report 6 — Violations per Type |
|---|---|---|
|<img width="1918" height="917" alt="image" src="https://github.com/user-attachments/assets/0cdb905a-00cc-46b5-a0dd-c70a828d9837" />|<img width="1918" height="912" alt="image" src="https://github.com/user-attachments/assets/44a9242c-2e90-46f3-99a8-1bff66c9db88" />|<img width="1918" height="913" alt="image" src="https://github.com/user-attachments/assets/828a3e74-0b5d-423e-b870-cd4f39590f2f" />|
 
| Report 7 — Vehicles by Location |
|---|
|<img width="1918" height="916" alt="image" src="https://github.com/user-attachments/assets/46545568-b1a1-414a-b019-c2088658030b" />|

---

## Features

### Driver Management
- Add, edit, and view driver profiles
- Track license type (`Student Permit`, `Non-Professional`, `Professional`), status, and expiry
- Automatic license expiry computation based on R.A. 10930 (based on birth-date, 5 or 10 years)
- License renewal via stored procedure with full eligibility checks
- Auto-suspension after 3 pending violations

### Vehicle Management
- Register vehicles under driver ownership
- Support for 12 vehicle types (Sedan, SUV, Motorcycle, Jeepney, Bus, etc.)
- LTO-compliant plate number format validation

### Vehicle Registration
- Track registration history per vehicle
- Automatic expiry computed from the plate number's last digit (LTO staggered renewal schedule)
- Registration status tracking (`Active`, `Expired`, `Suspended`)

### Violation Tracking
- Record apprehensions with UOVR (Unified Ordinance Violation Receipt) number
- Support multiple violation types per incident (e.g., reckless driving + no seatbelt)
- Enforce valid status/payment combinations at the database level
- Link violations to driver, vehicle, and registration

### Dashboard
- At-a-glance summary counts
- Alerts for drivers with suspended/expired licenses
- Quick links to flagged records

### Reports (7 total)
1. Filter drivers by license type, status, sex, and age range
2. Vehicles owned by a specific driver
3. Vehicles with expired registrations as of a given date
4. Drivers with expired or suspended licenses
5. Violations by a driver, optionally filtered by date range
6. Total violations per violation type for a given year
7. Vehicles involved in violations within a city or region

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite |
| Styling | Tailwind |
| Backend | Node.js + TypeScript, Express |
| Database | MariaDB |

---

## Project Structure

```
cmsc127-project/
├── backend/
│   ├── config/
│   │   └── mariadb.ts                   # DB connection pool
│   ├── features/
│   │   ├── drivers/
│   │   │   ├── driver.controllers.ts    # Driver CRUD + renew license
│   │   │   └── driver.route.ts
│   │   ├── registrations/
│   │   │   ├── registration.controller.ts
│   │   │   └── registration.route.ts
│   │   ├── reports/
│   │   │   ├── report.controller.ts     # All 7 report queries
│   │   │   └── report.route.ts
│   │   ├── vehicles/
│   │   │   ├── vehicle.controller.ts
│   │   │   └── vehicle.route.ts
│   │   └── violations/
│   │       ├── violation.controller.ts
│   │       └── violation.route.ts
│   ├── package.json
│   ├── server.ts                        # Express app entry point
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── api/                         # Raw fetch functions per resource
│   │   │   ├── base.api.ts
│   │   │   ├── driver.api.ts
│   │   │   ├── registrations.api.ts
│   │   │   ├── reports.api.ts
│   │   │   ├── vehicles.api.ts
│   │   │   └── violations.api.ts
│   │   ├── components/
│   │   │   ├── drivers/
│   │   │   │   ├── DriverForm.tsx
│   │   │   │   ├── DriverTable.tsx
│   │   │   │   └── RenewLicenseModal.tsx
│   │   │   ├── registrations/
│   │   │   │   ├── RegistrationForm.tsx
│   │   │   │   └── RegistrationTable.tsx
│   │   │   ├── reports/
│   │   │   │   ├── ReportRunner.tsx
│   │   │   │   └── ReportTable.tsx
│   │   │   ├── ui/                      # Shared presentational components
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── FilterBar.tsx
│   │   │   │   ├── Layout.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── NavBar.tsx
│   │   │   │   ├── SearchInput.tsx
│   │   │   │   ├── StatCard.tsx
│   │   │   │   └── Table.tsx
│   │   │   ├── vehicles/
│   │   │   │   ├── VehicleForm.tsx
│   │   │   │   └── VehicleTable.tsx
│   │   │   └── violations/
│   │   │       ├── AutoSuspensionBanner.tsx
│   │   │       ├── ViolationForm.tsx
│   │   │       └── ViolationTable.tsx
│   │   ├── constants/
│   │   │   ├── enums.ts                 # Single source of truth for all ENUM values
│   │   │   ├── fineSchedule.ts          # Violation type, fine amount
│   │   │   └── routes.ts
│   │   ├── hooks/                       # Custom React hooks (wrap API calls)
│   │   │   ├── useDrivers.ts
│   │   │   ├── useRegistrations.ts
│   │   │   ├── useReports.ts
│   │   │   ├── useVehicles.ts
│   │   │   └── useViolations.ts
│   │   ├── pages/                       # Full-page route components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DriverList.tsx
│   │   │   ├── DriverProfile.tsx
│   │   │   ├── Reports.tsx
│   │   │   ├── VehicleDetail.tsx
│   │   │   ├── VehicleList.tsx
│   │   │   ├── ViolationDetail.tsx
│   │   │   └── ViolationList.tsx
│   │   ├── App.tsx                      # Router setup, all route definitions
│   │   ├── index.css
│   │   └── main.tsx                     # React entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.ts
│   └── vite.config.ts
│
├── shared/
│   └── types/                           # TypeScript interfaces shared across packages
│       ├── driver.types.ts
│       ├── registration.types.ts
│       ├── vehicle.types.ts
│       └── violation.types.ts
│
├── schema_documentation.md             # Full DB schema and business logic docs
└── trafficviolation.sql                 # Schema, triggers, stored procedure, seed data
```

---

## Database Design

### Tables

| Table | Description |
|---|---|
| `driver` | Driver profiles with license info |
| `vehicle` | Vehicles linked to an owner/driver |
| `vehicle_registration` | Registration history per vehicle |
| `traffic_violation` | Apprehension incidents (one per UOVR) |
| `violation_type` | Child table, one row per violation type per incident |

### Views

| View | Description |
|---|---|
| `v_driver` | `driver` + computed `age` column |
| `v_active_registrations` | Only currently active registration records |

### Key Triggers

| Trigger | Purpose |
|---|---|
| `trg_driver_before_insert` | Enforce minimum age, compute license expiry |
| `trg_driver_before_update` | Block direct expiry edits, recompute on issue date change |
| `trg_registration_before_insert` | Compute registration expiry from plate last digit |
| `trg_violation_before_insert/update` | Enforce valid status + payment combinations |
| `trg_violation_after_insert` | Auto-suspend license after 3 pending violations |

### Stored Procedure: `sp_renew_license`

Handles license renewal with full eligibility checks: no revoked/suspended status, no unpaid fines, not expired over 2 years, valid issue date. Renewal duration is **10 years** for a clean record, **5 years** if any violations exist in the current license period.

---

## Getting Started

### Prerequisites

Ensure the following are installed on your machine:

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher
- [MariaDB](https://mariadb.org/) v10.6 or higher

Verify installations:

```bash
node --version
npm --version
mariadb --version
```

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/gitniched/cmsc127-project.git
cd cmsc127-project
```

2. **Install all dependencies** (root, backend, frontend, shared):

```bash
npm install
```

3. **Set up environment variables** (see [Environment Variables](#environment-variables) below).

4. **Set up the database** (see [Database Setup](#database-setup) below).

### Running the App

```bash
# Terminal 1, Backend (Express, default port 3000)
npm run dev --workspace=backend

# Terminal 2, Frontend (Vite, default port 5173)
npm run dev --workspace=frontend
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mariadb_user
DB_PASSWORD=your_mariadb_password
DB_NAME=trafficviolation
PORT=3000
```

A `.env.example` template is included in `backend/` for reference.

---

## Database Setup

**Linux / macOS:**
 
```bash
mariadb -u root -p < trafficviolation.sql
```
 
**Windows (Command Prompt):**
 
```cmd
mariadb -u root -p < trafficviolation.sql
```
 
**Windows (PowerShell):**
 
```powershell
Get-Content trafficviolation.sql | mariadb -u root -p
```
 
**Verify the setup:**
 
```bash
mariadb -u root -p trafficviolation -e "SHOW TABLES;"
```

---

## API Endpoints

All endpoints are prefixed with `/api`.

### Drivers, `/api/drivers`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List all drivers |
| `GET` | `/:license_number` | Get a single driver |
| `POST` | `/` | Add a new driver |
| `PUT` | `/:license_number` | Update a driver |
| `DELETE` | `/:license_number` | Delete a driver |
| `POST` | `/:license_number/renew` | Renew a driver's license |

### Vehicles, `/api/vehicles`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List all vehicles |
| `GET` | `/:plate_number` | Get a single vehicle |
| `POST` | `/` | Add a new vehicle |
| `PUT` | `/:plate_number` | Update a vehicle |
| `DELETE` | `/:plate_number` | Delete a vehicle |

### Registrations, `/api/registrations`

| Method | Path | Description |
|---|---|---|
| `GET` | `/vehicle/:plate_number` | Get registration history for a vehicle |
| `POST` | `/` | Add a new registration |

### Violations, `/api/violations`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List all violations |
| `GET` | `/:uovr_number` | Get a single violation |
| `POST` | `/` | Add a new violation |
| `PUT` | `/:uovr_number` | Update a violation |
| `DELETE` | `/:uovr_number` | Delete a violation |

### Reports, `/api/reports`

| Method | Path | Description |
|---|---|---|
| `GET` | `/drivers` | Filter drivers (query params: `license_type`, `license_status`, `sex`, `age_min`, `age_max`) |
| `GET` | `/vehicles-by-driver` | Vehicles owned by driver (param: `license_number`) |
| `GET` | `/expired-registrations` | Expired registrations as of date (param: `as_of_date`) |
| `GET` | `/expired-suspended-licenses` | Drivers with expired or suspended licenses |
| `GET` | `/violations-by-driver` | Violations by driver (params: `license_number`, `start_date`, `end_date`) |
| `GET` | `/violations-by-type` | Violation counts per type for a year (param: `year`) |
| `GET` | `/vehicles-by-location` | Vehicles in violations by city/region (params: `city`, `region`) |

---

## Reports

The Reports page (`/reports`) presents all 7 reports as tabs. Each report has a parameter input panel and a results table with links to relevant detail screens.

Reports are backed by the queries documented in `README.md` (database documentation) and implemented in `backend/features/reports/report.controller.ts`.

---

## Business Rules

These rules are enforced at the **database level** (triggers, stored procedure, CHECK constraints) and are therefore consistent regardless of the API or application layer:

| Rule | Enforced By |
|---|---|
| Driver must be ≥ 17 for Student Permit, ≥ 18 for Non-Pro, ≥ 18 for Professional | `trg_driver_before_insert` |
| License expiry auto-computed (birth-date-reckoned, per R.A. 10930) | `trg_driver_before_insert`, `trg_driver_before_update` |
| `license_expiry_date` cannot be set directly, must go through `sp_renew_license` | `trg_driver_before_update` |
| Registration expiry computed from plate last digit (LTO staggered schedule) | `trg_registration_before_insert` |
| Invalid violation status + payment combinations are blocked | `trg_violation_before_insert/update` |
| 3 pending violations -> driver license auto-suspended | `trg_violation_after_insert` |
| Suspended/revoked drivers cannot renew | `sp_renew_license` |
| Unpaid fines block license renewal | `sp_renew_license` |
| License expired > 2 years → must retake LTO exams (blocked from renewing) | `sp_renew_license` |
| Clean record renewal = 10 years; with violations = 5 years | `sp_renew_license` |
| Plate number must match LTO format (`XXX-####`, `XXX-###`, `XX-####`, `XX-###`) | `chk_plate_format` CHECK constraint |
| One violation type cannot appear twice on the same incident | Composite PK on `violation_type` |

Fine amounts are **not stored in the database**. They are maintained in `frontend/src/constants/fineSchedule.ts` and computed client-side to avoid stale data when the official fine schedule changes.

---

## Legal References

This project's schema design and business logic are based on the following Philippine laws and regulations:

| Reference | Description | Link |
|---|---|---|
| **R.A. 4136** | Land Transportation and Traffic Code (1964), the primary law governing vehicle registration, driver licensing, and traffic violations in the Philippines | [lawphil.net](https://lawphil.net/statutes/repacts/ra1964/ra_4136_1964.html) |
| **R.A. 10930 IRR** | Implementing Rules and Regulations of R.A. 10930, Section 9.3.1 governs driver's license validity periods (1 year for Student Permit, 5 years for Non-Pro/Pro, birth-date-reckoned) | [lto.gov.ph](https://lto.gov.ph/wp-content/uploads/2023/09/IRR-RA10930.pdf) |
| **LTO APL Form v3** | Application for Driver's License, official LTO form, basis for driver data fields | [lto.gov.ph](https://lto.gov.ph/wp-content/uploads/2023/09/APL-Form_v3.pdf) |
| **LTO License Types** | Overview of LTO driver's license categories (A = Motorcycle, B/C/D/E = vehicles by gross weight), conditions, and requirements | [Globe Blog / LTO](https://www.globe.com.ph/blog/lto-drivers-license-application-and-renewal) |
| **MMDA Revised Fines and Penalties** | MMDA's revised schedule of traffic fines and penalties (as of April 2019), basis for violation types and fine amounts used in `fineSchedule.ts` | [mmda.gov.ph](https://mmda.gov.ph/images/pdf/Home/REVISED-FINES-and-PENALTIES-by-alphabet-new-4-11-2019-01.pdf) |

---

## Authors

Developed as a group project for **CMSC 127, File Processing and Database Systems**  
Institute of Computer Science, University of the Philippines Los Baños

| Name | Role |
|---|---|
| *Simone Pauline Dagondon* | *Fullstack* |
| *Nicholas Pacoma* | *Fullstack* |
| *Justin Lawrence Cruz* | *Fullstack* |

---

*This project is for academic purposes only. It is not affiliated with or endorsed by the Land Transportation Office (LTO) of the Philippines.*
