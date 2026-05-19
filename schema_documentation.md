# trafficviolation — Database Documentation

This document explains the schema, business logic, triggers, stored procedure, and report queries in `trafficviolation.sql`.

---

## Table of Contents

1. [Overview](#overview)
2. [Schema](#schema)
   - [driver](#driver)
   - [vehicle](#vehicle)
   - [vehicle_registration](#vehicle_registration)
   - [traffic_violation](#traffic_violation)
   - [violation_type](#violation_type)
3. [Views](#views)
   - [v_driver](#v_driver)
   - [v_active_registrations](#v_active_registrations)
4. [Triggers](#triggers)
   - [trg_driver_before_insert](#trg_driver_before_insert)
   - [trg_driver_before_update](#trg_driver_before_update)
   - [trg_registration_before_insert](#trg_registration_before_insert)
   - [trg_violation_before_insert](#trg_violation_before_insert)
   - [trg_violation_before_update](#trg_violation_before_update)
   - [trg_violation_after_insert](#trg_violation_after_insert)
5. [Stored Procedure: sp_renew_license](#stored-procedure-sp_renew_license)
6. [Session Variable: @lto_renewal_override](#session-variable-lto_renewal_override)
7. [Business Rules Summary](#business-rules-summary)
8. [Report Queries](#report-queries)
9. [Seed Data](#seed-data)

---

## Overview

The database models the LTO (Land Transportation Office) traffic violation system in the Philippines. It tracks drivers and their licenses, vehicles and their registrations, and traffic violations issued against a driver-vehicle pair. Key legal references throughout the schema are R.A. 4136 (Land Transportation and Traffic Code), R.A. 10930 (IRR for license validity), and MMDA ordinance codes.

**There is no `fine_amount` column in `traffic_violation`.** Fine computation is intentionally handled at the application layer using a constants/config object, not stored in the database. This prevents stale amounts if the fine schedule changes.

---

## Schema

### driver

The central table. Every other table traces back to a driver via `license_number`.

| Column | Type | Notes |
|---|---|---|
| `license_number` | `VARCHAR(13)` | Primary key. Format: `N##-YY-NNNNNN` (Non-Pro/Pro) or `S##-YY-NNNNNN` (Student). |
| `first_name` | `VARCHAR(50)` | Required. |
| `last_name` | `VARCHAR(50)` | Required. |
| `middle_name` | `VARCHAR(50)` | Nullable. |
| `birth_date` | `DATE` | Required. Used to compute license expiry. |
| `sex` | `CHAR(1)` | `'M'` or `'F'`. |
| `address` | `VARCHAR(255)` | Required. |
| `license_type` | `ENUM` | `'Student Permit'`, `'Non-Professional'`, `'Professional'`. |
| `license_status` | `ENUM` | `'Active'`, `'Expired'`, `'Suspended'`, `'Revoked'`. |
| `license_issue_date` | `DATE` | The most recent issue date. Updated on each renewal. |
| `license_expiry_date` | `DATE` | **Never set manually.** Computed by `trg_driver_before_insert` on insert, and by `trg_driver_before_update` when `license_issue_date` changes. Direct edits are blocked unless `@lto_renewal_override = 1`. Default is `'9999-12-31'` as a placeholder only — the trigger always overwrites it. |

**Expiry computation logic (per IRR R.A. 10930 Section 9.3.1):**
- Student Permit: `license_issue_date + 1 year`
- Non-Professional / Professional: the driver's birth month and day, in the 5th year after `license_issue_date`. Example: issued `2022-03-10`, born `1990-06-15` → expiry `2027-06-15`. February 29 birthdays fall back to February 28 via a `LAST_DAY` guard.

---

### vehicle

Owned by a driver via `owner_license_number`. A driver can own multiple vehicles.

| Column | Type | Notes |
|---|---|---|
| `plate_number` | `VARCHAR(10)` | Primary key. Validated by `chk_plate_format`. |
| `make` | `VARCHAR(50)` | e.g. `'Toyota'` |
| `model` | `VARCHAR(50)` | e.g. `'Vios'` |
| `engine_number` | `VARCHAR(20)` | Required. |
| `chassis_number` | `VARCHAR(20)` | Required. |
| `vehicle_type` | `ENUM` | `'Sedan'`, `'Hatchback'`, `'Coupe'`, `'SUV'`, `'Van'`, `'Pickup Truck'`, `'Motorcycle'`, `'Tricycle'`, `'Jeepney'`, `'Bus'`, `'Truck'`, `'Trailer'`. |
| `year` | `YEAR` | Manufacturing year. |
| `color` | `VARCHAR(20)` | Required. |
| `owner_license_number` | `VARCHAR(13)` | FK → `driver.license_number`. |

**Plate format constraint (`chk_plate_format`):**

| Pattern | Description |
|---|---|
| `XXX-####` | Current standard — cars, post-2018 |
| `XXX-###` | Legacy — cars, pre-2018 |
| `XX-####` | Current standard — motorcycles, post-2018 |
| `XX-###` | Legacy — motorcycles, pre-2018 |

---

### vehicle_registration

Tracks registration history for each vehicle. A vehicle can have multiple registration records over time (one per renewal period).

| Column | Type | Notes |
|---|---|---|
| `registration_number` | `VARCHAR(20)` | Primary key. Format: `REG-YYYY-NNN`. |
| `plate_number` | `VARCHAR(10)` | FK → `vehicle.plate_number`. |
| `registration_date` | `DATE` | The date the registration was filed. |
| `expiration_date` | `DATE` | **Never set manually.** Computed by `trg_registration_before_insert`. Default `'9999-12-31'` is a placeholder only. |
| `registration_status` | `ENUM` | `'Active'`, `'Expired'`, `'Suspended'`. |

**Expiry computation logic (LTO staggered renewal schedule):**

The last digit of `plate_number` determines the renewal month:

| Last digit | Renewal month |
|---|---|
| 1 | January |
| 2 | February |
| 3 | March |
| 4 | April |
| 5 | May |
| 6 | June |
| 7 | July |
| 8 | August |
| 9 | September |
| 0 | October |
| Letter (non-numeric) | 12 months flat from `registration_date` |

Expiry is set to the **last day** of the renewal month. The year is determined by: if the registration month is on or before the renewal month, expiry falls in `year + 1`; if the registration month is past the renewal month, expiry falls in `year + 2`.

Example: plate ends in `4` (April renewal), registered `2024-06-10` (June, past April) → expiry `2026-04-30`.

---

### traffic_violation

One row per apprehension incident. Identified by the UOVR (Unified Ordinance Violation Receipt) number.

| Column | Type | Notes |
|---|---|---|
| `uovr_number` | `VARCHAR(20)` | Primary key. Format: `[prefix][YY]-[7-digit]-[1-digit checksum]`. Prefix indicates region: `M` = MMDA/NCR, `C` = Cebu, `D` = Davao, `B` = Baguio, `I` = Iloilo. |
| `officer` | `VARCHAR(100)` | Nullable. The apprehending officer. |
| `violation_status` | `ENUM` | `'Pending'`, `'Resolved'`, `'Contested'`, `'Dismissed'`. Default `'Pending'`. |
| `violation_location_city` | `VARCHAR(100)` | Required. |
| `violation_location_region` | `VARCHAR(100)` | Required. |
| `violation_date` | `DATE` | Required. |
| `payment_status` | `ENUM` | `'Paid'`, `'Unpaid'`, `'Waived'`. Default `'Unpaid'`. |
| `license_number` | `VARCHAR(13)` | FK → `driver.license_number`. The driver apprehended. |
| `plate_number` | `VARCHAR(10)` | FK → `vehicle.plate_number`. The vehicle involved. |
| `registration_number` | `VARCHAR(20)` | FK → `vehicle_registration.registration_number`. Nullable — some apprehensions occur without a linked registration (e.g. no registration on hand). |

**Valid status/payment combinations** — enforced by `trg_violation_before_insert` and `trg_violation_before_update`:

| `violation_status` | Allowed `payment_status` |
|---|---|
| `Pending` | `Unpaid` only |
| `Resolved` | `Paid` or `Waived` |
| `Contested` | `Unpaid` only |
| `Dismissed` | `Waived` only |

---

### violation_type

Each traffic violation incident can have **multiple violation types** (e.g. one apprehension for both reckless driving and no seatbelt). This table is a child of `traffic_violation` — one row per violation type per incident.

| Column | Type | Notes |
|---|---|---|
| `uovr_number` | `VARCHAR(20)` | FK → `traffic_violation.uovr_number`. Part of composite PK. |
| `violation_type` | `ENUM` | The specific offense. Part of composite PK. |

The composite primary key `(uovr_number, violation_type)` prevents the same offense from being listed twice on one incident.

**All valid violation types:**

`Illegal parking (attended)`, `Illegal parking (unattended)`, `Violation of loading zones`, `Obstruction to traffic`, `Colorum tricycles`, `50/50 scheme`, `Non display of Not-for-hire`, `Violation of one way street`, `Driving under the influence of liquor`, `Truck ban`, `No drivers license`, `No professional drivers license`, `Expired drivers license`, `No seatbelt`, `Noisy muffler`, `Disobedience to traffic officer`, `Disregarding traffic sign/signal`, `Discourteous and disrespectful conduct to passer`, `Others`, `Untidy attire of driver`, `Reckless driving`, `No U-turn`, `No interior light`, `Over speeding`, `No safety helmet`, `Unauthorized driver`, `Not posting of current passenger fare matrix`, `Refusal to convey passenger`, `No overloading`, `No Mayor permit`, `Overcharging`, `Without proper light`, `Jaywalking`, `Expired TCT`, `Driving through funeral or other processions`, `Smoking inside PUV`, `Violation of emission standard`, `Driving against traffic`, `Illegal counterflow`, `Anti-Distracted Driving Act violation`, `No contact overspeeding`, `Overspeeding physical apprehension`, `Unified Vehicular Volume Reduction Program`, `Failure to use seatbelt`, `Children safety on motorcycle`, `No ICC/PS mark sticker on helmet`, `Smoke belching`, `Driving without license`, `Driving with suspended drivers license`, `Driving with revoked drivers license`, `Using motor vehicle in commission of crime`

Note: `Illegal parking (attended)` and `Illegal parking (unattended)` are separate values because their fines differ.

---

## Views

### v_driver

A read-only view over `driver` that adds a computed `age` column (`TIMESTAMPDIFF(YEAR, birth_date, CURDATE())`). Used by the driver filter report query instead of querying `driver` directly, so age is always current without storing it.

### v_active_registrations

A view over `vehicle_registration` joined to `vehicle`, filtered to `registration_status = 'Active'` only. Exposes `owner_license_number` from `vehicle` so the caller does not need to join again.

---

## Triggers

### trg_driver_before_insert

**Fires:** BEFORE INSERT on `driver`

1. Validates minimum age against the license type being issued (age is computed at `license_issue_date`, not today):
   - Student Permit: minimum 16
   - Non-Professional: minimum 17
   - Professional: minimum 18
2. Computes and sets `license_expiry_date` — Student Permit gets 1 year; others get birth-date-reckoned expiry in the 5th year after issuance (per IRR R.A. 10930 Section 9.3.1).

---

### trg_driver_before_update

**Fires:** BEFORE UPDATE on `driver`

1. If `license_type` is being changed, re-validates minimum age against today's date (not issue date).
2. If `@lto_renewal_override != 1`:
   - If `license_issue_date` changed: recomputes `license_expiry_date` using the same logic as the insert trigger.
   - If `license_expiry_date` was changed directly (without changing `license_issue_date`): reverts `license_expiry_date` back to its old value. **Direct edits to expiry are blocked.**

This means `license_expiry_date` can only be changed through `sp_renew_license` (which sets the override) or by changing `license_issue_date`.

---

### trg_registration_before_insert

**Fires:** BEFORE INSERT on `vehicle_registration`

Computes and sets `expiration_date` based on the LTO staggered renewal schedule (last digit of plate number → renewal month). See the [vehicle_registration](#vehicle_registration) section for the full logic.

---

### trg_violation_before_insert

**Fires:** BEFORE INSERT on `traffic_violation`

Rejects logically inconsistent status/payment combinations:
- `Dismissed` + `Paid` → error
- `Contested` + `Paid` → error
- `Resolved` + `Unpaid` → error

---

### trg_violation_before_update

**Fires:** BEFORE UPDATE on `traffic_violation`

Same checks as `trg_violation_before_insert`, applied to the updated values.

---

### trg_violation_after_insert

**Fires:** AFTER INSERT on `traffic_violation`

Counts how many `Pending` violations the driver has within their current license period (`violation_date BETWEEN license_issue_date AND GREATEST(license_expiry_date, CURDATE())`). If the count reaches 3 or more, the driver's `license_status` is set to `'Suspended'` — but only if it is currently `'Active'` or `'Expired'` (i.e. already-revoked licenses are not touched).

The `GREATEST(license_expiry_date, CURDATE())` part ensures violations issued after the license has expired are still counted, preventing a loophole where an expired-license driver accumulates pending violations that don't trigger suspension.

---

## Stored Procedure: sp_renew_license

```sql
CALL sp_renew_license(p_license_number, @message);
SELECT @message;
```

Renews a driver's license. All outcomes are returned through the `OUT p_message` parameter.

**Pre-renewal checks (in order):**

1. Driver not found → error
2. `license_status = 'Revoked'` → error, cannot renew
3. `license_status = 'Suspended'` → error, must serve suspension first
4. `license_issue_date` is in the future → error, bad record
5. Non-student license expired more than 730 days ago → error, must retake exams
6. Driver has any `Unpaid` violations where `violation_status NOT IN ('Dismissed', 'Contested')` → error, must settle fines first

**If all checks pass:**

- **Student Permit:** new issue date = today, new expiry = today + 1 year.
- **Non-Professional / Professional:** counts non-dismissed violations in the current license period. If zero violations → renewed for **10 years**. If any violations → renewed for **5 years**. Expiry is birth-date-reckoned (same formula as the insert trigger, but using `v_renewal_years` instead of 5).

The procedure sets `@lto_renewal_override = 1` before updating `license_expiry_date`, then resets it to `0` immediately after. This bypasses the expiry-block in `trg_driver_before_update`, which would otherwise revert a direct change to `license_expiry_date`.

---

## Session Variable: @lto_renewal_override

```sql
SET @lto_renewal_override = 0;  -- initialized at the top of the file
```

A session-scoped boolean flag. Its only purpose is to allow `sp_renew_license` to write `license_expiry_date` directly, bypassing the guard in `trg_driver_before_update`. It is always reset to `0` immediately after the update. Nothing else in the system should set this to `1`.

---

## Business Rules Summary

| Rule | Enforced by |
|---|---|
| Minimum age per license type on issue | `trg_driver_before_insert` |
| Minimum age on license type upgrade | `trg_driver_before_update` |
| `license_expiry_date` cannot be set directly | `trg_driver_before_update` |
| License expiry auto-computed on insert | `trg_driver_before_insert` |
| License expiry recomputed when issue date changes | `trg_driver_before_update` |
| Registration expiry auto-computed from plate number | `trg_registration_before_insert` |
| Invalid status/payment combinations blocked | `trg_violation_before_insert`, `trg_violation_before_update` |
| 3 pending violations → auto-suspend license | `trg_violation_after_insert` |
| Suspended/revoked licenses cannot be renewed | `sp_renew_license` |
| Unpaid fines block license renewal | `sp_renew_license` |
| License expired 2+ years → must retake exams | `sp_renew_license` |
| Renewal duration: 10 years (clean record), 5 years (with violations) | `sp_renew_license` |
| Plate number must match LTO format | `chk_plate_format` CHECK constraint on `vehicle` |
| One violation type cannot appear twice on the same incident | Composite PK on `violation_type` |

---

## Report Queries

These queries reflect the logic implemented in `report.controller.ts`. All parameters are supplied by the backend at runtime — `license_type`, `license_number`, etc. are placeholders for bound values, not session variables.

**1. Filter drivers**
```sql
-- All filters are optional; omit any WHERE clause whose parameter is absent
SELECT * FROM v_driver
WHERE license_type = ?          -- if license_type supplied
  AND license_status = ?        -- if license_status supplied
  AND sex = ?                   -- if sex supplied
  AND age BETWEEN ? AND ?       -- if both age_min and age_max supplied
  AND age >= ?                  -- if only age_min supplied
  AND age <= ?                  -- if only age_max supplied
```
All filters are independent and optional. Uses `v_driver` so `age` is always computed live. Age range supports a lower bound only, an upper bound only, or both.

**2. Vehicles owned by a driver**
```sql
-- Requires: license_number
SELECT v.*,
       CONCAT(d.first_name, ' ', d.last_name) AS owner_name
FROM vehicle v
JOIN driver d ON v.owner_license_number = d.license_number
WHERE v.owner_license_number = ?
```
Joins `driver` to include the owner's full name alongside vehicle columns.

**3. Vehicles with expired registrations as of a given date**
```sql
-- Requires: as_of_date
SELECT v.*,
       CONCAT(d.first_name, ' ', d.last_name) AS owner_name,
       vr.registration_number,
       vr.expiration_date AS expired_registration_date,
       vr.registration_status
FROM vehicle v
JOIN vehicle_registration vr ON v.plate_number = vr.plate_number
JOIN driver d ON v.owner_license_number = d.license_number
WHERE vr.expiration_date < ?
  AND vr.registration_status = 'Expired'
```
Joins `driver` to include owner name. Filters on `registration_status = 'Expired'` in addition to the date check so superseded-but-not-yet-expired records are excluded.

**4. Drivers with expired or suspended licenses**
```sql
SELECT * FROM v_driver
WHERE license_status IN ('Expired', 'Suspended')
```
Uses `v_driver` (not `driver` directly) so the computed `age` column is available in results. No parameters required.

**5. Violations by a driver, optionally filtered by date range**
```sql
-- Requires: license_number
-- Optional: start_date, end_date (each independently optional)
SELECT tv.uovr_number, tv.officer, tv.violation_status,
       tv.violation_location_city, tv.violation_location_region,
       tv.violation_date, tv.payment_status,
       tv.plate_number, tv.registration_number,
       GROUP_CONCAT(vt.violation_type SEPARATOR ', ') AS violation_types
FROM traffic_violation tv
JOIN violation_type vt ON tv.uovr_number = vt.uovr_number
WHERE tv.license_number = ?
  AND tv.violation_date BETWEEN ? AND ?   -- if both start_date and end_date supplied
  AND tv.violation_date >= ?              -- if only start_date supplied
  AND tv.violation_date <= ?              -- if only end_date supplied
GROUP BY tv.uovr_number
ORDER BY tv.violation_date DESC
```
Uses `GROUP_CONCAT` to collapse multiple violation types onto a single row per incident. The date range is fully optional — each bound can be supplied independently or omitted entirely.

**6. Total violations per type for a given year**
```sql
-- Requires: year
SELECT vt.violation_type,
       CAST(COUNT(*) AS UNSIGNED) AS total_violations
FROM violation_type vt
JOIN traffic_violation tv ON vt.uovr_number = tv.uovr_number
WHERE YEAR(tv.violation_date) = ?
GROUP BY vt.violation_type
ORDER BY total_violations DESC
```
`CAST(... AS UNSIGNED)` ensures the count is returned as a plain integer rather than a BigInt, which some MariaDB connectors emit by default.

**7. Vehicles involved in violations within a city or region**
```sql
-- Requires: exactly one of city or region
-- When city is supplied:
SELECT DISTINCT v.plate_number, v.make, v.model, v.engine_number,
                v.chassis_number, v.vehicle_type, v.year, v.color,
                v.owner_license_number
FROM vehicle v
JOIN traffic_violation tv ON v.plate_number = tv.plate_number
WHERE tv.violation_location_city = ?

-- When only region is supplied (city absent):
SELECT DISTINCT v.plate_number, v.make, v.model, v.engine_number,
                v.chassis_number, v.vehicle_type, v.year, v.color,
                v.owner_license_number
FROM vehicle v
JOIN traffic_violation tv ON v.plate_number = tv.plate_number
WHERE tv.violation_location_region = ?
```
City takes precedence: if `city` is provided it is used exclusively; `region` is only used when `city` is absent. Returns explicit columns instead of `v.*`. At least one of the two parameters is required.

---

## Seed Data

The file includes dummy data for testing. Summary:

- **13 drivers** — mix of Active, Expired, Suspended (Felix Navarro, auto-suspended by trigger), and Revoked (Victor Tan) statuses; includes 2 Student Permit holders.
- **18 vehicles** — covers all vehicle types in the ENUM; some drivers own multiple vehicles.
- **20 vehicle registration records** — includes Active, Expired, and one Suspended registration. Expiry dates are trigger-computed from the plate last digit.
- **16 traffic violations** — covers all `violation_status` and `payment_status` combinations; Felix Navarro (N08) has 3 pending violations, which triggers his auto-suspension on the 3rd insert.
- **19 violation type rows** — some incidents have multiple types (e.g. `M23-0000001-1` has both `Reckless driving` and `No seatbelt`).