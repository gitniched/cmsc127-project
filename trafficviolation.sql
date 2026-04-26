DROP DATABASE IF EXISTS trafficviolation;
CREATE DATABASE trafficviolation;
USE trafficviolation;

SET @lto_renewal_override = 0;
 
CREATE TABLE driver (
    license_number VARCHAR(13) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    birth_date DATE NOT NULL,
    sex CHAR(1) NOT NULL,
    address VARCHAR(255) NOT NULL,
    license_type ENUM('Student Permit', 'Non-Professional', 'Professional') NOT NULL,
    license_status ENUM('Active', 'Expired', 'Suspended', 'Revoked') NOT NULL,
    license_issue_date DATE NOT NULL,
    license_expiry_date DATE NOT NULL DEFAULT '9999-12-31',
    CONSTRAINT pk_driver PRIMARY KEY (license_number)
);
 
CREATE VIEW v_driver AS
SELECT
    license_number,
    first_name,
    middle_name,
    last_name,
    TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) AS age,
    sex,
    address,
    license_type,
    license_status,
    license_issue_date,
    license_expiry_date
FROM driver;
 
-- driver DL codes: a driver may hold multiple codes simultaneously.
-- vehicle_category specifies the subcategory within each DL code per LTO classification:
--   A  → L1 (2-wheel ≤50kph), L2 (3-wheel ≤50kph), L3 (2-wheel >50kph)
--   A1 → L4 (sidecar >50kph), L5 (3-wheel symm >50kph), L6 (4-wheel ≤350kg ≤45kph), L7 (4-wheel ≤550kg ≤45kph)
--   B  → M1 (passenger ≤8 seats, GVW ≤5000kg)
--   B1 → M2 (passenger >8 seats, GVW ≤5000kg)
--   B2 → N1 (goods, GVW ≤3500kg)
--   C  → N2 (goods, GVW 3500–12000kg), N3 (goods, GVW >12000kg)
--   D  → M3 (passenger >8 seats, GVW >5000kg)
--   BE → O1 (trailer GVW ≤750kg), O2 (trailer GVW 750–3500kg)
--   CE → O3 (trailer GVW 3500–10000kg), O4 (trailer GVW >10000kg)
CREATE TABLE driver_dl_code (
    license_number VARCHAR(13) NOT NULL,
    dl_code ENUM('A', 'A1', 'B', 'B1', 'B2', 'C', 'D', 'BE', 'CE') NOT NULL,
    vehicle_category ENUM('L1','L2','L3','L4','L5','L6','L7','M1','M2','M3','N1','N2','N3','O1','O2','O3','O4') NOT NULL,
    CONSTRAINT pk_driver_dl_code PRIMARY KEY (license_number, dl_code),
    CONSTRAINT fk_dl_code_driver FOREIGN KEY (license_number) REFERENCES driver(license_number),
    -- enforces that the vehicle_category belongs to the correct DL code group
    CONSTRAINT chk_dl_category CHECK (
        (dl_code = 'A'  AND vehicle_category IN ('L1', 'L2', 'L3')) OR
        (dl_code = 'A1' AND vehicle_category IN ('L4', 'L5', 'L6', 'L7')) OR
        (dl_code = 'B'  AND vehicle_category = 'M1') OR
        (dl_code = 'B1' AND vehicle_category = 'M2') OR
        (dl_code = 'B2' AND vehicle_category = 'N1') OR
        (dl_code = 'C'  AND vehicle_category IN ('N2', 'N3')) OR
        (dl_code = 'D'  AND vehicle_category = 'M3') OR
        (dl_code = 'BE' AND vehicle_category IN ('O1', 'O2')) OR
        (dl_code = 'CE' AND vehicle_category IN ('O3', 'O4'))
    )
);

CREATE TABLE vehicle (
    plate_number VARCHAR(10) NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    engine_number VARCHAR(20) NOT NULL,
    chassis_number VARCHAR(20) NOT NULL,
    vehicle_type ENUM('Sedan', 'Hatchback', 'Coupe', 'SUV', 'Van', 'Pickup Truck', 'Motorcycle', 'Tricycle', 'Jeepney', 'Bus', 'Truck', 'Trailer') NOT NULL,
    year YEAR NOT NULL,
    color VARCHAR(20) NOT NULL,
    owner_license_number VARCHAR(13) NOT NULL,
    -- conduction sticker: issued to newly purchased vehicles before permanent plates are released.
    conduction_sticker VARCHAR(15) DEFAULT NULL,
    CONSTRAINT pk_vehicle PRIMARY KEY (plate_number),
    CONSTRAINT fk_vehicle_driver FOREIGN KEY (owner_license_number) REFERENCES driver(license_number),
    CONSTRAINT chk_plate_format CHECK (
        plate_number REGEXP '^[A-Z]{3}-[0-9]{4}$'  -- current standard (cars, post-2018)
        OR plate_number REGEXP '^[A-Z]{3}-[0-9]{3}$'  -- legacy (cars, pre-2018)
        OR plate_number REGEXP '^[A-Z]{2}-[0-9]{4}$'  -- current standard (motorcycles, post-2018)
        OR plate_number REGEXP '^[A-Z]{2}-[0-9]{3}$'  -- legacy (motorcycles, pre-2018)
    )
);
 
CREATE TABLE vehicle_registration (
    registration_number VARCHAR(20) NOT NULL,
    plate_number VARCHAR(10) NOT NULL,
    registration_date DATE NOT NULL,
    expiration_date DATE NOT NULL DEFAULT '9999-12-31',
    registration_status ENUM('Active', 'Expired', 'Suspended') NOT NULL,
    CONSTRAINT pk_vehicle_registration PRIMARY KEY (registration_number),
    CONSTRAINT fk_registration_vehicle FOREIGN KEY (plate_number) REFERENCES vehicle(plate_number)
);
 
CREATE OR REPLACE VIEW v_active_registrations AS
SELECT
    vr.registration_number,
    vr.plate_number,
    vr.registration_date,
    vr.expiration_date,
    vr.registration_status,
    v.owner_license_number
FROM vehicle_registration vr
JOIN vehicle v ON vr.plate_number = v.plate_number
WHERE vr.registration_status = 'Active';
 
-- standardized LTO fine schedule per violation type (first offense amounts).
-- source: R.A. 4136, JAO 2014-01, R.A. 10054, R.A. 8750, R.A. 10586, R.A. 10913.
-- fines may escalate on repeat offenses; this table stores the first-offense base amount.
CREATE TABLE violation_fine_schedule (
    violation_type VARCHAR(100) NOT NULL,
    base_fine_amount DECIMAL(10,2) NOT NULL,
    legal_basis VARCHAR(100) NOT NULL,
    CONSTRAINT pk_fine_schedule PRIMARY KEY (violation_type)
);

INSERT INTO violation_fine_schedule (violation_type, base_fine_amount, legal_basis) VALUES
('Violation of loading zones',                  1000.00,  'R.A. 4136 / LGU ordinances'),
('Obstruction to traffic',                      1000.00,  'MMDA OVR Code 05'),
('Colorum tricycles',                           5000.00,  'LTFRB / LGU franchise rules'),
('50/50 scheme',                                5000.00,  'LTFRB regulations'),
('Non display of Not-for-hire',                 1000.00,  'R.A. 4136 / LTO AO'),
('Violation of one way street',                 1000.00,  'R.A. 4136 Sec. 43'),
('Driving under the influence of liquor',      20000.00,  'R.A. 10586 Sec. 12'),
('Truck ban',                                   5000.00,  'MMDA / LGU truck ban ordinances'),
('No drivers license',                          3000.00,  'R.A. 4136 Sec. 20 / JAO 2014-01'),
('No professional drivers license',             3000.00,  'R.A. 4136 Sec. 20'),
('Expired drivers license',                     1000.00,  'R.A. 4136 Sec. 20 / JAO 2014-01'),
('No seatbelt',                                 1000.00,  'R.A. 8750 Sec. 5'),
('Noisy muffler',                               5000.00,  'R.A. 4136 Sec. 34'),
('Disobedience to traffic officer',             1000.00,  'R.A. 4136 Sec. 52'),
('Disregarding traffic sign/signal',             150.00,  'MMDA OVR Code 06 / R.A. 4136 Sec. 42'),
('Discourteous and disrespectful conduct to passer', 1000.00, 'LTO AO / LGU ordinances'),
('Untidy attire of driver',                     1000.00,  'LTO AO for PUV drivers'),
('Reckless driving',                            500.00,   'R.A. 4136 Sec. 48 / JAO 2014-01'),
('No U-turn',                                   1000.00,  'R.A. 4136 Sec. 43'),
('No interior light',                           1000.00,  'R.A. 4136 Sec. 34'),
('Over speeding',                               2000.00,  'R.A. 4136 Sec. 35 / JAO 2014-01'),
('No safety helmet',                            1500.00,  'R.A. 10054 Sec. 5'),
('Unauthorized driver',                         3000.00,  'R.A. 4136 Sec. 20'),
('Not posting of current passenger fare matrix',1000.00,  'LTFRB / LGU franchise rules'),
('Refusal to convey passenger',                 1000.00,  'R.A. 4136 Sec. 56 / LTFRB rules'),
('No overloading',                              5000.00,  'R.A. 4136 Sec. 32 / JAO 2014-01'),
('No Mayor permit',                             1000.00,  'LGU ordinances'),
('Overcharging',                                1000.00,  'LTFRB / LGU franchise rules'),
('Without proper light',                        5000.00,  'R.A. 4136 Sec. 34'),
('Jaywalking',                                   150.00,  'MMDA / LGU pedestrian ordinances'),
('Expired TCT',                                 5000.00,  'LTFRB franchise rules'),
('Driving through funeral or other processions',1000.00,  'R.A. 4136 Sec. 45'),
('Smoking inside PUV',                          1000.00,  'R.A. 9211 / LGU ordinances'),
('Violation of emission standard',              2000.00,  'R.A. 8749 / RA 4136 Sec. 34'),
('Driving against traffic',                     2000.00,  'MMDA Reg. No. 97-003 / OVR Code 023A'),
('Illegal counterflow',                         2000.00, 'MMDA Reg. No. 97-003 / OVR Code 023B'),
('Anti-Distracted Driving Act violation',       5000.00, 'R.A. 10913 / MMDA OVR Code 222'),
('No contact overspeeding',                     1200.00, 'MMDA Reg. No. 11-001 / OVR Code 201'),
('Overspeeding physical apprehension',          1200.00, 'MMDA MC No. 11-001 / OVR Code 201P'),
('Illegal parking (attended)',                  1000.00, 'MMDA Reg. No. 18-008 / OVR Code 226'),
('Illegal parking (unattended)',                2000.00, 'MMDA Reg. No. 18-008 / OVR Code 224'),
('Unified Vehicular Volume Reduction Program',   300.00, 'MMDA OVR Code 176'),
('Failure to use seatbelt',                      250.00, 'R.A. 8750 / MMDA OVR Code 194'),
('Children safety on motorcycle',               1500.00, 'R.A. 10666 / MMDA OVR Code 228'),
('No ICC/PS mark sticker on helmet',            3000.00, 'MMDA Res. 12-01-2012 / OVR Code 219J'),
('Smoke belching',                               200.00, 'MMDA OVR Code 171'),
('Driving without license',                      750.00, 'MMDA OVR Code 053'),
('Driving with suspended drivers license',       300.00, 'MMDA OVR Code 055'),
('Driving with revoked drivers license',         300.00, 'MMDA OVR Code 056'),
('Using motor vehicle in commission of crime', 10000.00, 'MMDA OVR Code 067');

CREATE TABLE traffic_violation (
    uovr_number VARCHAR(20) NOT NULL,
    officer VARCHAR(100),
    violation_status ENUM('Pending', 'Resolved', 'Contested', 'Dismissed') NOT NULL DEFAULT 'Pending',
    violation_location_city VARCHAR(100) NOT NULL,
    violation_location_region VARCHAR(100) NOT NULL,
    violation_date DATE NOT NULL,
    payment_status ENUM('Paid', 'Unpaid', 'Waived') NOT NULL DEFAULT 'Unpaid',
    license_number VARCHAR(13) NOT NULL,
    plate_number VARCHAR(10) NOT NULL,
    registration_number VARCHAR(20),
    CONSTRAINT pk_traffic_violation PRIMARY KEY (uovr_number),
    CONSTRAINT fk_violation_driver FOREIGN KEY (license_number) REFERENCES driver(license_number),
    CONSTRAINT fk_violation_vehicle FOREIGN KEY (plate_number) REFERENCES vehicle(plate_number),
    CONSTRAINT fk_violation_registration FOREIGN KEY (registration_number) REFERENCES vehicle_registration(registration_number)
);
 
-- violation types based on the generalized UOVR (Uniform Ordinance Violation Receipt)
CREATE TABLE violation_type (
    uovr_number VARCHAR(20) NOT NULL,
    violation_type VARCHAR(100) NOT NULL,
    CONSTRAINT pk_violation_type PRIMARY KEY (uovr_number, violation_type),
    CONSTRAINT fk_vtype_violation FOREIGN KEY (uovr_number) REFERENCES traffic_violation(uovr_number),
    CONSTRAINT fk_vtype_fine_schedule FOREIGN KEY (violation_type) REFERENCES violation_fine_schedule(violation_type)
);

-- summary view: total fine per incident, derived from the fine schedule
CREATE OR REPLACE VIEW v_violation_summary AS
SELECT
    tv.uovr_number,
    tv.violation_date,
    tv.violation_location_city,
    tv.violation_location_region,
    tv.violation_status,
    tv.payment_status,
    tv.license_number,
    tv.plate_number,
    tv.officer,
    SUM(vfs.base_fine_amount) AS total_fine_amount
FROM traffic_violation tv
JOIN violation_type vt ON tv.uovr_number = vt.uovr_number
JOIN violation_fine_schedule vfs ON vt.violation_type = vfs.violation_type
GROUP BY
    tv.uovr_number, tv.violation_date, tv.violation_location_city,
    tv.violation_location_region, tv.violation_status, tv.payment_status,
    tv.license_number, tv.plate_number, tv.officer;

-- triggers

DELIMITER $$

-- validates minimum age and auto-computes license expiry on insert.
-- minimum ages per LTO requirements: Student Permit = 16, Non-Professional = 17, Professional = 18.
CREATE TRIGGER trg_driver_before_insert
BEFORE INSERT ON driver
FOR EACH ROW
BEGIN
    DECLARE v_age INT;
    SET v_age = TIMESTAMPDIFF(YEAR, NEW.birth_date, NEW.license_issue_date);

    -- validate minimum age per license type
    IF NEW.license_type = 'Student Permit' AND v_age < 16 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'error: applicant must be at least 16 years old for a Student Permit';
    ELSEIF NEW.license_type = 'Non-Professional' AND v_age < 17 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'error: applicant must be at least 17 years old for a Non-Professional license';
    ELSEIF NEW.license_type = 'Professional' AND v_age < 18 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'error: applicant must be at least 18 years old for a Professional license';
    END IF;

    -- auto-compute expiry:
    -- Student Permit = 1 year from issue date
    -- Non-Professional / Professional = birth month/day in the 5th year after issuance
    --   per IRR RA 10930 Section 9.3.1: "valid for five (5) years reckoned from the date of birth"
    --   e.g. issued 2022-03-10, born 1990-06-15 → expiry = 2027-06-15
    --   edge case: Feb 29 birthdays fall back to Feb 28 via LAST_DAY guard
    IF NEW.license_type = 'Student Permit' THEN
        SET NEW.license_expiry_date = DATE_ADD(NEW.license_issue_date, INTERVAL 1 YEAR);
    ELSE
        SET NEW.license_expiry_date = DATE(CONCAT(
            YEAR(NEW.license_issue_date) + 5, '-',
            LPAD(MONTH(NEW.birth_date), 2, '0'), '-',
            LPAD(LEAST(DAY(NEW.birth_date),
                DAY(LAST_DAY(DATE(CONCAT(
                    YEAR(NEW.license_issue_date) + 5, '-',
                    LPAD(MONTH(NEW.birth_date), 2, '0'), '-01'
                ))))), 2, '0')
        ));
    END IF;
END$$

-- validates minimum age on license type upgrade and manages expiry on update.
-- also blocks direct edits to expiry unless the renewal override session var is set.
CREATE TRIGGER trg_driver_before_update
BEFORE UPDATE ON driver
FOR EACH ROW
BEGIN
    DECLARE v_age INT;
    SET v_age = TIMESTAMPDIFF(YEAR, NEW.birth_date, CURDATE());

    -- re-validate minimum age only when license_type is being changed
    IF NEW.license_type <> OLD.license_type THEN
        IF NEW.license_type = 'Non-Professional' AND v_age < 17 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'error: driver must be at least 17 years old to upgrade to a Non-Professional license';
        ELSEIF NEW.license_type = 'Professional' AND v_age < 18 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'error: driver must be at least 18 years old to upgrade to a Professional license';
        END IF;
    END IF;

    -- manage expiry: recompute if issue date changed, block direct edits otherwise
    IF @lto_renewal_override != 1 THEN
        IF NEW.license_issue_date <> OLD.license_issue_date THEN
            IF NEW.license_type = 'Student Permit' THEN
                SET NEW.license_expiry_date = DATE_ADD(NEW.license_issue_date, INTERVAL 1 YEAR);
            ELSE
                -- birth-date-reckoned expiry per IRR RA 10930 Section 9.3.1
                SET NEW.license_expiry_date = DATE(CONCAT(
                    YEAR(NEW.license_issue_date) + 5, '-',
                    LPAD(MONTH(NEW.birth_date), 2, '0'), '-',
                    LPAD(LEAST(DAY(NEW.birth_date),
                        DAY(LAST_DAY(DATE(CONCAT(
                            YEAR(NEW.license_issue_date) + 5, '-',
                            LPAD(MONTH(NEW.birth_date), 2, '0'), '-01'
                        ))))), 2, '0')
                ));
            END IF;
        ELSEIF NEW.license_expiry_date <> OLD.license_expiry_date THEN
            SET NEW.license_expiry_date = OLD.license_expiry_date;
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_dl_code_before_insert
BEFORE INSERT ON driver_dl_code
FOR EACH ROW
BEGIN
    DECLARE v_license_type ENUM('Student Permit', 'Non-Professional', 'Professional');

    SELECT license_type INTO v_license_type
    FROM driver
    WHERE license_number = NEW.license_number;

    IF v_license_type = 'Student Permit' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'error: DL codes cannot be assigned to Student Permit holders';
    END IF;
END$$

-- auto-compute registration expiry based on LTO staggered renewal schedule.
-- the last digit of the plate number determines the renewal month:
--   1 → January,  2 → February,  3 → March,  4 → April,
--   5 → May,      6 → June,      7 → July,   8 → August,
--   9 → September, 0 → October
-- expiry is set to the last day of the renewal month in the year following registration.
-- source: LTO staggered registration renewal system per plate ending.
CREATE TRIGGER trg_registration_before_insert
BEFORE INSERT ON vehicle_registration
FOR EACH ROW
BEGIN
    DECLARE v_plate_last_char CHAR(1);
    DECLARE v_renewal_month INT;
    DECLARE v_renewal_year INT;

    SET v_plate_last_char = RIGHT(NEW.plate_number, 1);

    SET v_renewal_month = CASE v_plate_last_char
        WHEN '1' THEN 1
        WHEN '2' THEN 2
        WHEN '3' THEN 3
        WHEN '4' THEN 4
        WHEN '5' THEN 5
        WHEN '6' THEN 6
        WHEN '7' THEN 7
        WHEN '8' THEN 8
        WHEN '9' THEN 9
        WHEN '0' THEN 10
        -- non-numeric ending (e.g. legacy plates ending in a letter): default to 12 months flat
        ELSE NULL
    END;

    IF v_renewal_month IS NULL THEN
        SET NEW.expiration_date = DATE_ADD(NEW.registration_date, INTERVAL 1 YEAR);
    ELSE
        -- renewal year: if registration month is already past the renewal month, push to next year + 1
        IF MONTH(NEW.registration_date) <= v_renewal_month THEN
            SET v_renewal_year = YEAR(NEW.registration_date) + 1;
        ELSE
            SET v_renewal_year = YEAR(NEW.registration_date) + 2;
        END IF;
        -- last day of the renewal month in the computed year
        SET NEW.expiration_date = LAST_DAY(STR_TO_DATE(CONCAT(v_renewal_year, '-', LPAD(v_renewal_month, 2, '0'), '-01'), '%Y-%m-%d'));
    END IF;
END$$

-- block logically impossible combinations of violation_status and payment_status on insert
CREATE TRIGGER trg_violation_before_insert
BEFORE INSERT ON traffic_violation
FOR EACH ROW
BEGIN
    IF NEW.violation_status = 'Dismissed' AND NEW.payment_status = 'Paid' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'error: a dismissed violation cannot be marked as paid';
    END IF;

    IF NEW.violation_status = 'Contested' AND NEW.payment_status = 'Paid' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'error: a contested violation cannot be marked as paid while still contested';
    END IF;

    IF NEW.violation_status = 'Resolved' AND NEW.payment_status = 'Unpaid' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'error: a resolved violation must have payment_status of Paid or Waived';
    END IF;
END$$

-- block logically impossible combinations of violation_status and payment_status on update
CREATE TRIGGER trg_violation_before_update
BEFORE UPDATE ON traffic_violation
FOR EACH ROW
BEGIN
    IF NEW.violation_status = 'Dismissed' AND NEW.payment_status = 'Paid' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'error: a dismissed violation cannot be marked as paid';
    END IF;

    IF NEW.violation_status = 'Contested' AND NEW.payment_status = 'Paid' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'error: a contested violation cannot be marked as paid while still contested';
    END IF;

    IF NEW.violation_status = 'Resolved' AND NEW.payment_status = 'Unpaid' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'error: a resolved violation must have payment_status of Paid or Waived';
    END IF;
END$$

-- suspend license if driver reaches 3 or more pending violations within the current license period
-- uses GREATEST(expiry, CURDATE()) to include post-expiry violations, mirroring sp_renew_license
-- suspends both Active and Expired licenses, blocking renewal for repeat offenders
CREATE TRIGGER trg_violation_after_insert
AFTER INSERT ON traffic_violation
FOR EACH ROW
BEGIN
    DECLARE v_pending_count INT;
    DECLARE v_issue_date DATE;
    DECLARE v_expiry_date DATE;

    SELECT license_issue_date, license_expiry_date
    INTO v_issue_date, v_expiry_date
    FROM driver
    WHERE license_number = NEW.license_number;

    SELECT COUNT(*) INTO v_pending_count
    FROM traffic_violation
    WHERE license_number = NEW.license_number
      AND violation_status = 'Pending'
      AND violation_date BETWEEN v_issue_date AND GREATEST(v_expiry_date, CURDATE());

    IF v_pending_count >= 3 THEN
        UPDATE driver
        SET license_status = 'Suspended'
        WHERE license_number = NEW.license_number
          AND license_status IN ('Active', 'Expired');
    END IF;
END$$

-- renew license:
-- student permit: always 1 year, blocked if unpaid violations exist
-- non-professional/professional: 10 years if no violations in current period, else 5 years
CREATE PROCEDURE sp_renew_license(
    IN p_license_number VARCHAR(13),
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_status ENUM('Active', 'Expired', 'Suspended', 'Revoked');
    DECLARE v_license_type ENUM('Student Permit', 'Non-Professional', 'Professional');
    DECLARE v_issue_date DATE;
    DECLARE v_expiry_date DATE;
    DECLARE v_violation_count INT;
    DECLARE v_unpaid_count INT;
    DECLARE v_renewal_years INT;
    DECLARE v_new_issue_date DATE;
    DECLARE v_new_expiry_date DATE;

    SELECT license_status, license_type, license_issue_date, license_expiry_date
    INTO v_status, v_license_type, v_issue_date, v_expiry_date
    FROM driver
    WHERE license_number = p_license_number;

    IF v_status IS NULL THEN
        SET p_message = CONCAT('error: no driver found with license number ', p_license_number);
    ELSEIF v_status = 'Revoked' THEN
        SET p_message = 'error: revoked licenses cannot be renewed';
    ELSEIF v_status = 'Suspended' THEN
        SET p_message = 'error: suspended licenses cannot be renewed until the suspension period is served';
    ELSEIF v_issue_date > CURDATE() THEN
        SET p_message = 'error: license_issue_date is in the future, please correct the record before renewing';
    ELSEIF v_license_type != 'Student Permit' AND DATEDIFF(CURDATE(), v_expiry_date) > 730 THEN
        SET p_message = 'error: license expired over 2 years ago. driver must retake written and practical exams before renewal';
    ELSE
        SELECT COUNT(*) INTO v_unpaid_count
        FROM traffic_violation
        WHERE license_number = p_license_number
          AND payment_status = 'Unpaid'
          AND violation_status NOT IN ('Dismissed', 'Contested');

        IF v_unpaid_count > 0 THEN
            SET p_message = CONCAT('error: driver has ', v_unpaid_count, ' unsettled fine(s). settle all unpaid violations before renewing');
        ELSEIF v_license_type = 'Student Permit' THEN
            SET v_new_issue_date = CURDATE();
            SET v_new_expiry_date = DATE_ADD(v_new_issue_date, INTERVAL 1 YEAR);

            UPDATE driver
            SET license_issue_date = v_new_issue_date,
                license_status = 'Active'
            WHERE license_number = p_license_number;

            SET @lto_renewal_override = 1;
            UPDATE driver
            SET license_expiry_date = v_new_expiry_date
            WHERE license_number = p_license_number;
            SET @lto_renewal_override = 0;

            SET p_message = CONCAT(
                'student permit ', p_license_number, ' renewed for 1 year. ',
                'new expiry: ', DATE_FORMAT(v_new_expiry_date, '%Y-%m-%d')
            );
        ELSE
            SELECT COUNT(*) INTO v_violation_count
            FROM traffic_violation
            WHERE license_number = p_license_number
              AND violation_date BETWEEN v_issue_date AND GREATEST(v_expiry_date, CURDATE())
              AND violation_status <> 'Dismissed';

            IF v_violation_count = 0 THEN
                SET v_renewal_years = 10;
            ELSE
                SET v_renewal_years = 5;
            END IF;

            SET v_new_issue_date = CURDATE();

            -- birth-date-reckoned expiry per IRR RA 10930 Section 9.3.1 and 9.4
            -- expiry falls on driver's birth month/day, v_renewal_years after new issue date
            BEGIN
                DECLARE v_birth_month INT;
                DECLARE v_birth_day INT;
                DECLARE v_expiry_year INT;
                DECLARE v_days_in_month INT;

                SELECT MONTH(birth_date), DAY(birth_date)
                INTO v_birth_month, v_birth_day
                FROM driver WHERE license_number = p_license_number;

                SET v_expiry_year = YEAR(v_new_issue_date) + v_renewal_years;
                SET v_days_in_month = DAY(LAST_DAY(DATE(CONCAT(
                    v_expiry_year, '-', LPAD(v_birth_month, 2, '0'), '-01'
                ))));
                SET v_new_expiry_date = DATE(CONCAT(
                    v_expiry_year, '-',
                    LPAD(v_birth_month, 2, '0'), '-',
                    LPAD(LEAST(v_birth_day, v_days_in_month), 2, '0')
                ));
            END;

            UPDATE driver
            SET license_issue_date = v_new_issue_date,
                license_status = 'Active'
            WHERE license_number = p_license_number;

            SET @lto_renewal_override = 1;
            UPDATE driver
            SET license_expiry_date = v_new_expiry_date
            WHERE license_number = p_license_number;
            SET @lto_renewal_override = 0;

            SET p_message = CONCAT(
                'license ', p_license_number, ' renewed for ', v_renewal_years, ' years. ',
                'new expiry: ', DATE_FORMAT(v_new_expiry_date, '%Y-%m-%d'), '. ',
                'violations in last period: ', v_violation_count
            );
        END IF;
    END IF;
END$$

DELIMITER ;

-- dummy tables
-- ─────────────────────────────────────────────────────────────────────────────
-- DRIVER ROSTER (18 drivers)
-- Statuses are what they are AT TIME OF SEEDING (2026-04-26).
-- Expiry dates are trigger-computed on INSERT; the trigger ignores the default.
--
-- Active licenses (expiry still future as of 2026-04-26):
--   N01  John Doe          Non-Pro  expiry 2027-06-15
--   N02  Jane Austen       Pro      expiry 2027-08-20
--   N04  Sarah Connor      Non-Pro  expiry 2026-12-05
--   N06  Clark Kent        Non-Pro  expiry 2027-04-18
--   N07  Diana Prince      Pro      expiry 2027-03-22
--   N08  Peter Parker      Non-Pro  expiry 2028-08-10
--   N09  Natasha Romanoff  Pro      expiry 2027-11-22
--   N11  Ramon Cruz        Non-Pro  expiry 2027-07-14
--   N12  Maria Santos      Non-Pro  expiry 2026-05-30
--   S02  Liza Santos       Student  expiry 2026-05-08
--
-- Expired licenses:
--   N03  Michael Jordan    Pro      expiry 2020-02-17
--   N13  Jose Ramos        Pro      expiry 2024-02-11
--   N14  Eduardo Reyes     Pro      expiry 2025-04-22
--   N15  Roberto Garcia    Pro      expiry 2024-09-18
--   S01  Carlo Reyes       Student  expiry 2026-04-15
--   S03  Ramon Villanueva  Student  expiry 2024-06-20
--
-- Suspended (trigger-caused — 3 pending violations within license period):
--   N05  Bruce Wayne       Pro      expiry 2023-10-24  (3 pending violations seeded below)
--
-- Revoked (manually set, predates dataset):
--   N10  Tony Stark        Pro      expiry 2015-05-29
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO driver (license_number, first_name, last_name, middle_name, birth_date, sex, address, license_type, license_status, license_issue_date) VALUES
('N01-22-123456', 'John', 'Doe', 'Smith', '1985-06-15', 'M', '123 Maple St, Manila', 'Non-Professional', 'Active', '2022-05-10'),
('N02-22-234567', 'Jane', 'Austen', 'Rose', '1990-08-20', 'F', '456 Oak Ave, Makati', 'Professional', 'Active', '2022-11-22'),
('N03-15-345678', 'Michael', 'Jordan', 'Jeffrey', '1975-02-17', 'M', '789 Colon St, Cebu City', 'Professional', 'Expired', '2015-03-14'),
('N04-21-456789', 'Sarah', 'Connor', 'Ann', '1988-12-05', 'F', '321 Ilustre St, Davao City', 'Non-Professional', 'Active', '2021-07-01'),
('N05-18-567890', 'Bruce', 'Wayne', 'Thomas', '1982-10-24', 'M', '1007 Session Rd, Baguio City', 'Professional', 'Suspended', '2018-01-15'),
('N06-22-678901', 'Clark', 'Kent', 'Joseph', '1992-04-18', 'M', '344 Iznart St, Iloilo City', 'Non-Professional', 'Active', '2022-09-09'),
('N07-22-789012', 'Diana', 'Prince', 'Marie', '1987-03-22', 'F', '890 Corrales Ave, Cagayan de Oro', 'Professional', 'Active', '2022-06-30'),
('N08-23-890123', 'Peter', 'Parker', 'Benjamin', '1995-08-10', 'M', '20 Quezon Blvd, Quezon City', 'Non-Professional', 'Active', '2023-02-14'),
('N09-22-901234', 'Natasha', 'Romanoff', 'Alianovna', '1984-11-22', 'F', '500 Burgos St, General Santos City', 'Professional', 'Active', '2022-10-05'),
('N10-10-012345', 'Tony', 'Stark', 'Edward', '1970-05-29', 'M', '108 Mabini St, Legazpi City', 'Professional', 'Revoked', '2010-12-01'),
('S01-25-111111', 'Carlo', 'Reyes', NULL, '2007-03-10', 'M', '12 Sampaguita St, Caloocan', 'Student Permit', 'Expired', '2025-04-15'),
('S02-25-222222', 'Liza', 'Santos', 'Marie', '2006-09-24', 'F', '88 Mabini Ave, Paranaque', 'Student Permit', 'Active', '2025-05-08'),
('S03-23-333333', 'Ramon', 'Villanueva', 'Cruz', '2005-11-02', 'M', '45 Rizal Blvd, Marikina', 'Student Permit', 'Expired', '2023-06-20'),
('N11-22-112233', 'Ramon', 'Cruz', 'Diego', '1993-07-14', 'M', '22 Dapitan St, Manila', 'Non-Professional', 'Active', '2022-03-20'),
('N12-21-223344', 'Maria', 'Santos', 'Luz', '1998-05-30', 'F', '77 Sto. Tomas St, Quezon City', 'Non-Professional', 'Active', '2021-08-10'),
('N13-19-334455', 'Jose', 'Ramos', 'Antonio', '1988-02-11', 'M', '5 Mabolo St, Cebu City', 'Professional', 'Expired', '2019-06-05'),
('N14-20-445566', 'Eduardo', 'Reyes', 'Manuel', '1980-04-22', 'M', '88 Rizal Ave, Manila', 'Professional', 'Expired', '2020-07-15'),
('N15-19-556677', 'Roberto', 'Garcia', 'Santos', '1975-09-18', 'M', '34 Bonifacio St, Quezon City', 'Professional', 'Expired', '2019-11-03');


-- ─────────────────────────────────────────────────────────────────────────────
-- DL CODES: matched to vehicles each driver actually owns.
-- Students never get DL codes (trigger enforces this).
-- B  = M1: passenger cars ≤8 seats, GVW ≤5000kg (Sedan, SUV, Hatchback, Coupe)
-- B1 = M2: passenger >8 seats, GVW ≤5000kg (Van/Urvan)
-- B2 = N1: goods ≤3500kg (Pickup Truck)
-- C  = N2: goods 3500–12000kg (Truck)
-- D  = M3: passenger >8 seats, GVW >5000kg (Bus, Jeepney)
-- A  = L3: motorcycle >50kph (Motorcycle)
-- A1 = L5: 3-wheel symmetric >50kph (Tricycle/sidecar)
-- CE = O3: trailer GVW 3500–10000kg (Trailer)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO driver_dl_code (license_number, dl_code, vehicle_category) VALUES
-- John Doe: Sedan (B/M1) + SUV (B/M1) + Truck (C/N2)
('N01-22-123456', 'B',  'M1'),
('N01-22-123456', 'C',  'N2'),
-- Jane Austen: SUV (B/M1) + Sedan (B/M1)  — B only, both are M1 class
('N02-22-234567', 'B',  'M1'),
-- Michael Jordan: SUV (B/M1) — B only
('N03-15-345678', 'B',  'M1'),
-- Sarah Connor: Hatchback (B/M1) + Sedan (B/M1) — B only
('N04-21-456789', 'B',  'M1'),
-- Bruce Wayne: SUV (B/M1) + Pickup Truck (B2/N1)
('N05-18-567890', 'B',  'M1'),
('N05-18-567890', 'B2', 'N1'),
-- Clark Kent: Coupe (B/M1) — B only
('N06-22-678901', 'B',  'M1'),
-- Diana Prince: SUV (B/M1) + Sedan (B/M1) — B only
('N07-22-789012', 'B',  'M1'),
-- Peter Parker: Van/Urvan (B1/M2, seats >8)
('N08-23-890123', 'B1', 'M2'),
-- Natasha Romanoff: Sedan (B/M1) + SUV (B/M1) — B only
('N09-22-901234', 'B',  'M1'),
-- Tony Stark: Sedan (B/M1) + Coupe (B/M1) — B only (revoked, no special codes)
('N10-10-012345', 'B',  'M1'),
-- Ramon Cruz: Motorcycle (A/L3) — also holds B for any future car
('N11-22-112233', 'A',  'L3'),
('N11-22-112233', 'B',  'M1'),
-- Maria Santos: Motorcycle (A/L3)
('N12-21-223344', 'A',  'L3'),
('N12-21-223344', 'B',  'M1'),
-- Jose Ramos: Motorcycle (A/L3)
('N13-19-334455', 'A',  'L3'),
('N13-19-334455', 'B',  'M1'),
-- Eduardo Reyes: Bus (D/M3) + Trailer (CE/O3)
('N14-20-445566', 'D',  'M3'),
('N14-20-445566', 'CE', 'O3'),
-- Roberto Garcia: Jeepney (D/M3) + Tricycle (A1/L5)
('N15-19-556677', 'D',  'M3'),
('N15-19-556677', 'A1', 'L5');

-- ─────────────────────────────────────────────────────────────────────────────
-- VEHICLES (25 total)
-- Plate format:
--   Cars/trucks/vans/buses: XXX-#### (3-letter, 4-digit, post-2018)
--                           XXX-### (3-letter, 3-digit, pre-2018 legacy)
--   Motorcycles/tricycles:  XX-####  (2-letter, 4-digit, post-2018)
--                           XX-###   (2-letter, 3-digit, pre-2018 legacy)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO vehicle (plate_number, make, model, engine_number, chassis_number, vehicle_type, year, color, owner_license_number) VALUES
-- John Doe (N01-22-123456): Sedan + SUV + Truck
('ABK-1234', 'Toyota',     'Vios',          'ENG-00123', 'CHAS-00123', 'Sedan',       2018, 'Black',      'N01-22-123456'),
('ACM-5678', 'Toyota',     'Fortuner',      'ENG-00234', 'CHAS-00234', 'SUV',         2020, 'White',      'N01-22-123456'),
('ADR-9012', 'Ford',       'Ranger',        'ENG-00345', 'CHAS-00345', 'Truck',       2019, 'Red',        'N01-22-123456'),
-- Jane Austen (N02-22-234567): SUV + Sedan
('AET-3456', 'Mitsubishi', 'Montero Sport', 'ENG-00456', 'CHAS-00456', 'SUV',         2021, 'Silver',     'N02-22-234567'),
('AFN-7890', 'Honda',      'Civic',         'ENG-00567', 'CHAS-00567', 'Sedan',       2017, 'Black',      'N02-22-234567'),
-- Michael Jordan (N03-15-345678): SUV only (license expired, kept 1 vehicle)
('WBK-6789', 'Hyundai',   'Tucson',        'ENG-00678', 'CHAS-00678', 'SUV',         2022, 'Blue',       'N03-15-345678'),
-- Sarah Connor (N04-21-456789): Hatchback + Sedan
('TDR-5566', 'Suzuki',    'Swift',         'ENG-00789', 'CHAS-00789', 'Hatchback',   2015, 'Yellow',     'N04-21-456789'),
('TCN-7788', 'Kia',       'Rio',           'ENG-00890', 'CHAS-00890', 'Sedan',       2016, 'Green',      'N04-21-456789'),
-- Bruce Wayne (N05-18-567890): SUV + Pickup Truck (suspended)
('BFM-9900', 'Chevrolet', 'Trailblazer',   'ENG-00901', 'CHAS-00901', 'SUV',         2018, 'Gray',       'N05-18-567890'),
('ATK-4411', 'Mitsubishi','Strada',         'ENG-04001', 'CHAS-04001', 'Pickup Truck',2021, 'White',      'N05-18-567890'),
-- Clark Kent (N06-22-678901): Coupe
('PKR-0011', 'Audi',      'R8',            'ENG-01012', 'CHAS-01012', 'Coupe',       2023, 'Red',        'N06-22-678901'),
-- Diana Prince (N07-22-789012): SUV + Sedan
('SBN-2233', 'BMW',       'X5',            'ENG-01123', 'CHAS-01123', 'SUV',         2022, 'White',      'N07-22-789012'),
('SCT-3344', 'BMW',       'M3',            'ENG-01234', 'CHAS-01234', 'Sedan',       2020, 'Blue',       'N07-22-789012'),
-- Peter Parker (N08-23-890123): Van (Urvan, 12-seat → M2/B1)
('AGP-2345', 'Nissan',    'Urvan',         'ENG-01345', 'CHAS-01345', 'Van',         2019, 'White',      'N08-23-890123'),
-- Natasha Romanoff (N09-22-901234): Sedan + SUV
('QDM-6677', 'Mazda',     '3',             'ENG-01456', 'CHAS-01456', 'Sedan',       2021, 'Red',        'N09-22-901234'),
('QER-8899', 'Subaru',    'Crosstrek',     'ENG-01567', 'CHAS-01567', 'SUV',         2023, 'Orange',     'N09-22-901234'),
-- Tony Stark (N10-10-012345): Sedan + Coupe (revoked, vehicles unregistered)
('LBK-1100', 'Mercedes',  'S-Class',       'ENG-01678', 'CHAS-01678', 'Sedan',       2023, 'Black',      'N10-10-012345'),
('LCT-9988', 'Porsche',   '911',           'ENG-01789', 'CHAS-01789', 'Coupe',       2022, 'Silver',     'N10-10-012345'),
-- Ramon Cruz (N11-22-112233): Motorcycle (2-letter plate, post-2018 format)
('AN-1234',  'Honda',     'Click 125i',    'ENG-02001', 'CHAS-02001', 'Motorcycle',  2021, 'Red',        'N11-22-112233'),
-- Maria Santos (N12-21-223344): Motorcycle
('AB-5678',  'Yamaha',    'Mio Gear',      'ENG-02002', 'CHAS-02002', 'Motorcycle',  2022, 'Blue',       'N12-21-223344'),
-- Jose Ramos (N13-19-334455): Motorcycle
('WM-9012',  'Honda',     'XRM 125',       'ENG-02003', 'CHAS-02003', 'Motorcycle',  2019, 'Black',      'N13-19-334455'),
-- Eduardo Reyes (N14-20-445566): Bus + Trailer
('AXB-2468', 'Hino',      'FB Bus',        'ENG-03001', 'CHAS-03001', 'Bus',         2020, 'Yellow',     'N14-20-445566'),
('ATR-7722', 'Isuzu',     'Giga Trailer',  'ENG-04002', 'CHAS-04002', 'Trailer',     2018, 'Gray',       'N14-20-445566'),
-- Roberto Garcia (N15-19-556677): Jeepney + Tricycle (2-letter plate for tricycle)
('AJP-1357', 'Sarao',     'Jeepney',       'ENG-03002', 'CHAS-03002', 'Jeepney',     2019, 'Multicolor', 'N15-19-556677'),
('AT-5533',  'Honda',     'TMX Supremo',   'ENG-04003', 'CHAS-04003', 'Tricycle',    2020, 'Blue',       'N15-19-556677');

-- ─────────────────────────────────────────────────────────────────────────────
-- VEHICLE REGISTRATIONS
-- Expiry is trigger-computed from plate last digit (staggered schedule).
-- Status is set to match what the trigger would produce on registration date;
-- Suspended status is set manually where registration was suspended.
-- Registrations are continuous year-over-year (no unexplained gaps).
-- Bruce Wayne's vehicles stop being renewed after his 2022 suspension.
-- Tony Stark's vehicles stop after his 2010 revocation.
-- Michael Jordan's Tucson stops after his license expired in 2020.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO vehicle_registration (registration_number, plate_number, registration_date, registration_status) VALUES
-- ABK-1234 (ends 4 → April renewal) — John Doe's Vios, Active
('REG-2019-001', 'ABK-1234', '2019-03-12', 'Expired'),  -- expiry: 2020-04-30
('REG-2020-002', 'ABK-1234', '2020-03-20', 'Expired'),  -- expiry: 2021-04-30
('REG-2021-003', 'ABK-1234', '2021-04-05', 'Expired'),  -- expiry: 2022-04-30
('REG-2022-004', 'ABK-1234', '2022-04-10', 'Expired'),  -- expiry: 2023-04-30
('REG-2023-005', 'ABK-1234', '2023-04-03', 'Expired'),  -- expiry: 2024-04-30
('REG-2024-006', 'ABK-1234', '2024-03-28', 'Expired'),  -- expiry: 2025-04-30
('REG-2025-007', 'ABK-1234', '2025-04-01', 'Active'),   -- expiry: 2026-04-30
-- ACM-5678 (ends 8 → August renewal) — John Doe's Fortuner, Active
('REG-2021-008', 'ACM-5678', '2021-07-15', 'Expired'),  -- expiry: 2022-08-31
('REG-2022-009', 'ACM-5678', '2022-08-10', 'Expired'),  -- expiry: 2023-08-31
('REG-2023-010', 'ACM-5678', '2023-08-05', 'Expired'),  -- expiry: 2024-08-31
('REG-2024-011', 'ACM-5678', '2024-08-12', 'Expired'),  -- expiry: 2025-08-31
('REG-2025-012', 'ACM-5678', '2025-08-08', 'Active'),   -- expiry: 2026-08-31
-- ADR-9012 (ends 2 → February renewal) — John Doe's Ranger, Suspended
('REG-2020-013', 'ADR-9012', '2020-01-20', 'Expired'),  -- expiry: 2021-02-28
('REG-2021-014', 'ADR-9012', '2021-02-05', 'Expired'),  -- expiry: 2022-02-28
('REG-2022-015', 'ADR-9012', '2022-02-01', 'Expired'),  -- expiry: 2023-02-28
('REG-2023-016', 'ADR-9012', '2023-01-25', 'Expired'),  -- expiry: 2024-02-29
('REG-2024-017', 'ADR-9012', '2024-01-18', 'Suspended'),-- suspended (linked to a contested violation)
-- AET-3456 (ends 6 → June renewal) — Jane Austen's Montero, Active
('REG-2022-018', 'AET-3456', '2022-05-20', 'Expired'),  -- expiry: 2023-06-30
('REG-2023-019', 'AET-3456', '2023-05-30', 'Expired'),  -- expiry: 2024-06-30
('REG-2024-020', 'AET-3456', '2024-06-03', 'Expired'),  -- expiry: 2025-06-30
('REG-2025-021', 'AET-3456', '2025-05-28', 'Active'),   -- expiry: 2026-06-30
-- AFN-7890 (ends 0 → October renewal) — Jane Austen's Civic, Active
('REG-2018-022', 'AFN-7890', '2018-09-14', 'Expired'),  -- expiry: 2019-10-31
('REG-2019-023', 'AFN-7890', '2019-10-02', 'Expired'),  -- expiry: 2020-10-31
('REG-2020-024', 'AFN-7890', '2020-09-25', 'Expired'),  -- expiry: 2021-10-31
('REG-2021-025', 'AFN-7890', '2021-09-30', 'Expired'),  -- expiry: 2022-10-31
('REG-2022-026', 'AFN-7890', '2022-10-05', 'Expired'),  -- expiry: 2023-10-31
('REG-2023-027', 'AFN-7890', '2023-09-28', 'Expired'),  -- expiry: 2024-10-31
('REG-2024-028', 'AFN-7890', '2024-09-20', 'Expired'),  -- expiry: 2025-10-31
-- WBK-6789 (ends 9 → September renewal) — Michael Jordan's Tucson, Expired (lapsed with license)
('REG-2016-029', 'WBK-6789', '2016-08-10', 'Expired'),  -- expiry: 2017-09-30
('REG-2017-030', 'WBK-6789', '2017-09-01', 'Expired'),  -- expiry: 2018-09-30
('REG-2018-031', 'WBK-6789', '2018-08-25', 'Expired'),  -- expiry: 2019-09-30
('REG-2019-032', 'WBK-6789', '2019-09-03', 'Expired'),  -- expiry: 2020-09-30
('REG-2020-033', 'WBK-6789', '2020-08-20', 'Expired'),  -- expiry: 2021-09-30
('REG-2021-034', 'WBK-6789', '2021-09-10', 'Expired'),  -- expiry: 2022-09-30
('REG-2022-035', 'WBK-6789', '2022-09-05', 'Expired'),  -- expiry: 2023-09-30 (lapsed; license expired 2020)
-- TDR-5566 (ends 6 → June renewal) — Sarah Connor's Swift, Active
('REG-2016-036', 'TDR-5566', '2016-05-18', 'Expired'),  -- expiry: 2017-06-30
('REG-2017-037', 'TDR-5566', '2017-06-02', 'Expired'),  -- expiry: 2018-06-30
('REG-2018-038', 'TDR-5566', '2018-05-25', 'Expired'),  -- expiry: 2019-06-30
('REG-2019-039', 'TDR-5566', '2019-05-30', 'Expired'),  -- expiry: 2020-06-30
('REG-2020-040', 'TDR-5566', '2020-06-08', 'Expired'),  -- expiry: 2021-06-30
('REG-2021-041', 'TDR-5566', '2021-06-01', 'Expired'),  -- expiry: 2022-06-30
('REG-2022-042', 'TDR-5566', '2022-05-28', 'Expired'),  -- expiry: 2023-06-30
('REG-2023-043', 'TDR-5566', '2023-05-22', 'Expired'),  -- expiry: 2024-06-30
('REG-2024-044', 'TDR-5566', '2024-06-04', 'Expired'),  -- expiry: 2025-06-30
-- TCN-7788 (ends 8 → August renewal) — Sarah Connor's Kia Rio, Active
('REG-2017-045', 'TCN-7788', '2017-07-20', 'Expired'),  -- expiry: 2018-08-31
('REG-2018-046', 'TCN-7788', '2018-08-05', 'Expired'),  -- expiry: 2019-08-31
('REG-2019-047', 'TCN-7788', '2019-07-28', 'Expired'),  -- expiry: 2020-08-31
('REG-2020-048', 'TCN-7788', '2020-08-10', 'Expired'),  -- expiry: 2021-08-31
('REG-2021-049', 'TCN-7788', '2021-07-25', 'Expired'),  -- expiry: 2022-08-31
('REG-2022-050', 'TCN-7788', '2022-08-01', 'Expired'),  -- expiry: 2023-08-31
('REG-2023-051', 'TCN-7788', '2023-08-08', 'Expired'),  -- expiry: 2024-08-31
('REG-2024-052', 'TCN-7788', '2024-07-30', 'Expired'),  -- expiry: 2025-08-31
-- BFM-9900 (ends 0 → October renewal) — Bruce Wayne's Trailblazer, Expired (stopped renewing after suspension)
('REG-2019-053', 'BFM-9900', '2019-09-18', 'Expired'),  -- expiry: 2020-10-31
('REG-2020-054', 'BFM-9900', '2020-10-01', 'Expired'),  -- expiry: 2021-10-31
('REG-2021-055', 'BFM-9900', '2021-09-25', 'Expired'),  -- expiry: 2022-10-31 (last renewal before suspension)
-- ATK-4411 (ends 1 → January renewal) — Bruce Wayne's Strada, Expired (stopped renewing after suspension)
('REG-2022-056', 'ATK-4411', '2022-01-05', 'Expired'),  -- expiry: 2023-01-31
('REG-2023-057', 'ATK-4411', '2023-01-10', 'Expired'),  -- expiry: 2024-01-31
('REG-2024-058', 'ATK-4411', '2024-01-08', 'Expired'),  -- expiry: 2025-01-31 (lapsed after suspension)
-- PKR-0011 (ends 1 → January renewal) — Clark Kent's Audi R8, Expired (just missed Jan renewal)
('REG-2024-059', 'PKR-0011', '2024-01-10', 'Expired'),  -- expiry: 2025-01-31
('REG-2025-060', 'PKR-0011', '2025-01-05', 'Expired'),  -- expiry: 2026-01-31
-- SBN-2233 (ends 3 → March renewal) — Diana Prince's BMW X5, Expired (missed March renewal)
('REG-2023-061', 'SBN-2233', '2023-02-20', 'Expired'),  -- expiry: 2024-03-31
('REG-2024-062', 'SBN-2233', '2024-03-01', 'Expired'),  -- expiry: 2025-03-31
('REG-2025-063', 'SBN-2233', '2025-02-25', 'Expired'),  -- expiry: 2026-03-31
-- SCT-3344 (ends 4 → April renewal) — Diana Prince's BMW M3, Active
('REG-2021-064', 'SCT-3344', '2021-03-15', 'Expired'),  -- expiry: 2022-04-30
('REG-2022-065', 'SCT-3344', '2022-04-01', 'Expired'),  -- expiry: 2023-04-30
('REG-2023-066', 'SCT-3344', '2023-03-28', 'Expired'),  -- expiry: 2024-04-30
('REG-2024-067', 'SCT-3344', '2024-04-02', 'Expired'),  -- expiry: 2025-04-30
-- AGP-2345 (ends 5 → May renewal) — Peter Parker's Urvan, Active
('REG-2020-068', 'AGP-2345', '2020-04-10', 'Expired'),  -- expiry: 2021-05-31
('REG-2021-069', 'AGP-2345', '2021-04-28', 'Expired'),  -- expiry: 2022-05-31
('REG-2022-070', 'AGP-2345', '2022-05-02', 'Expired'),  -- expiry: 2023-05-31
('REG-2023-071', 'AGP-2345', '2023-04-25', 'Expired'),  -- expiry: 2024-05-31
('REG-2024-072', 'AGP-2345', '2024-04-30', 'Expired'),  -- expiry: 2025-05-31
('REG-2025-073', 'AGP-2345', '2025-04-15', 'Active'),   -- expiry: 2026-05-31
-- QDM-6677 (ends 7 → July renewal) — Natasha's Mazda 3, Expired (missed July 2025 renewal)
('REG-2022-074', 'QDM-6677', '2022-06-20', 'Expired'),  -- expiry: 2023-07-31
('REG-2023-075', 'QDM-6677', '2023-07-05', 'Expired'),  -- expiry: 2024-07-31
('REG-2024-076', 'QDM-6677', '2024-07-01', 'Expired'),  -- expiry: 2025-07-31
-- QER-8899 (ends 9 → September renewal) — Natasha's Crosstrek, Active
('REG-2024-077', 'QER-8899', '2024-08-15', 'Expired'),  -- expiry: 2025-09-30
('REG-2025-078', 'QER-8899', '2025-09-01', 'Active'),   -- expiry: 2026-09-30
-- LBK-1100 (ends 0 → October renewal) — Tony Stark's Mercedes, Expired (revoked owner)
('REG-2024-079', 'LBK-1100', '2024-04-20', 'Expired'),  -- expiry: 2025-10-31
-- LCT-9988 (ends 8 → August renewal) — Tony Stark's Porsche, Expired (revoked owner)
('REG-2023-080', 'LCT-9988', '2023-01-10', 'Expired'),  -- expiry: 2024-08-31
-- AN-1234 (ends 4 → April renewal) — Ramon Cruz's Honda Click, Active
('REG-2022-081', 'AN-1234',  '2022-03-15', 'Expired'),  -- expiry: 2023-04-30
('REG-2023-082', 'AN-1234',  '2023-04-01', 'Expired'),  -- expiry: 2024-04-30
('REG-2024-083', 'AN-1234',  '2024-03-25', 'Expired'),  -- expiry: 2025-04-30
('REG-2025-084', 'AN-1234',  '2025-03-20', 'Active'),   -- expiry: 2026-04-30
-- AB-5678 (ends 8 → August renewal) — Maria Santos's Yamaha Mio, Expired (missed Aug 2025 renewal)
('REG-2023-085', 'AB-5678',  '2023-07-20', 'Expired'),  -- expiry: 2024-08-31
('REG-2024-086', 'AB-5678',  '2024-08-05', 'Expired'),  -- expiry: 2025-08-31
-- WM-9012 (ends 2 → February renewal) — Jose Ramos's Honda XRM, Expired (license expired 2024)
('REG-2020-087', 'WM-9012',  '2020-01-10', 'Expired'),  -- expiry: 2021-02-28
('REG-2021-088', 'WM-9012',  '2021-02-03', 'Expired'),  -- expiry: 2022-02-28
('REG-2022-089', 'WM-9012',  '2022-01-28', 'Expired'),  -- expiry: 2023-02-28
('REG-2023-090', 'WM-9012',  '2023-02-01', 'Expired'),  -- expiry: 2024-02-29
('REG-2024-091', 'WM-9012',  '2024-02-05', 'Expired'),  -- expiry: 2025-02-28
-- AXB-2468 (ends 8 → August renewal) — Eduardo Reyes's Bus, Active
('REG-2021-092', 'AXB-2468', '2021-07-18', 'Expired'),  -- expiry: 2022-08-31
('REG-2022-093', 'AXB-2468', '2022-08-02', 'Expired'),  -- expiry: 2023-08-31
('REG-2023-094', 'AXB-2468', '2023-08-01', 'Expired'),  -- expiry: 2024-08-31
('REG-2024-095', 'AXB-2468', '2024-07-25', 'Expired'),  -- expiry: 2025-08-31
('REG-2025-096', 'AXB-2468', '2025-08-05', 'Active'),   -- expiry: 2026-08-31
-- ATR-7722 (ends 2 → February renewal) — Eduardo Reyes's Trailer, Expired (missed Feb 2025 renewal)
('REG-2019-097', 'ATR-7722', '2019-01-10', 'Expired'),  -- expiry: 2020-02-29
('REG-2020-098', 'ATR-7722', '2020-02-01', 'Expired'),  -- expiry: 2021-02-28
('REG-2021-099', 'ATR-7722', '2021-01-25', 'Expired'),  -- expiry: 2022-02-28
('REG-2022-100', 'ATR-7722', '2022-02-08', 'Expired'),  -- expiry: 2023-02-28
('REG-2023-101', 'ATR-7722', '2023-01-30', 'Expired'),  -- expiry: 2024-02-29
('REG-2024-102', 'ATR-7722', '2024-02-05', 'Expired'),  -- expiry: 2025-02-28
-- AJP-1357 (ends 7 → July renewal) — Roberto Garcia's Jeepney, Expired (license expired 2024)
('REG-2020-103', 'AJP-1357', '2020-06-15', 'Expired'),  -- expiry: 2021-07-31
('REG-2021-104', 'AJP-1357', '2021-07-01', 'Expired'),  -- expiry: 2022-07-31
('REG-2022-105', 'AJP-1357', '2022-07-05', 'Expired'),  -- expiry: 2023-07-31
('REG-2023-106', 'AJP-1357', '2023-06-28', 'Expired'),  -- expiry: 2024-07-31
('REG-2024-107', 'AJP-1357', '2024-07-08', 'Expired'),  -- expiry: 2025-07-31
-- AT-5533 (ends 3 → March renewal) — Roberto Garcia's Tricycle, Expired
('REG-2021-108', 'AT-5533',  '2021-02-20', 'Expired'),  -- expiry: 2022-03-31
('REG-2022-109', 'AT-5533',  '2022-03-01', 'Expired'),  -- expiry: 2023-03-31
('REG-2023-110', 'AT-5533',  '2023-02-25', 'Expired'),  -- expiry: 2024-03-31
('REG-2024-111', 'AT-5533',  '2024-03-03', 'Expired');  -- expiry: 2025-03-31

-- ─────────────────────────────────────────────────────────────────────────────
-- TRAFFIC VIOLATIONS (20 incidents)
-- UOVR format: [prefix][YY]-[7-digit sequential]-[1-digit checksum]
-- Prefix: M=MMDA/NCR, C=Cebu, D=Davao, B=Baguio, I=Iloilo, G=GenSan, Q=Quezon City LGU
--
-- Bruce Wayne (N05-18-567890): 3 pending violations within his license period
--   (2018-01-15 to 2023-10-24) → trigger auto-suspends his license.
--   These 3 must be seeded BEFORE the driver status is set; since we INSERT
--   driver first with status='Active' and the trigger fires AFTER INSERT on
--   traffic_violation, his status will be updated to 'Suspended' automatically.
--   We seed him as 'Suspended' to reflect the final state; the trigger will
--   attempt the UPDATE but it's idempotent (already Suspended → no change).
--
-- violation_status / payment_status rules enforced by triggers:
--   Dismissed → must be Waived (not Paid, not Unpaid)
--   Contested → must be Unpaid
--   Resolved  → must be Paid or Waived (not Unpaid)
--   Pending   → must be Unpaid
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO traffic_violation (
    uovr_number, officer, violation_status, violation_location_city,
    violation_location_region, violation_date,
    payment_status, license_number, plate_number, registration_number) VALUES
-- John Doe (N01): 3 violations — 1 resolved, 1 dismissed, 1 pending
('M20-0000001-1', 'PO2 Reyes',   'Resolved',  'Manila',       'NCR',        '2020-03-15', 'Paid',   'N01-22-123456', 'ABK-1234', 'REG-2019-001'),
('M22-0000002-2', 'PO1 Santos',  'Dismissed', 'Quezon City',  'NCR',        '2022-08-10', 'Waived', 'N01-22-123456', 'ACM-5678', 'REG-2022-009'),
('M25-0000003-3', NULL,          'Pending',   'Pasig',        'NCR',        '2025-09-05', 'Unpaid', 'N01-22-123456', 'ABK-1234', 'REG-2025-007'),
-- Jane Austen (N02): 2 violations — 1 resolved, 1 resolved
('M21-0000004-4', 'PO3 Cruz',    'Resolved',  'Makati',       'NCR',        '2021-11-30', 'Paid',   'N02-22-234567', 'AET-3456', 'REG-2022-018'),
('C22-0000005-5', 'PO1 Lim',     'Resolved',  'Cebu City',    'Region VII', '2022-05-18', 'Paid',   'N02-22-234567', 'AFN-7890', 'REG-2022-026'),
-- Michael Jordan (N03): 1 contested (expired license, Tucson stopped renewing after)
('D22-0000006-6', 'PO2 Bautista','Contested', 'Davao City',   'Region XI',  '2022-09-04', 'Unpaid', 'N03-15-345678', 'WBK-6789', 'REG-2022-035'),
-- Sarah Connor (N04): 2 violations — 1 pending, 1 resolved
('B23-0000007-7', 'PO1 Garcia',  'Pending',   'Baguio City',  'CAR',        '2023-01-19', 'Unpaid', 'N04-21-456789', 'TDR-5566', 'REG-2022-042'),
('M24-0000008-8', 'PO2 Torres',  'Resolved',  'Taguig',       'NCR',        '2024-06-25', 'Paid',   'N04-21-456789', 'TCN-7788', 'REG-2023-051'),
-- Bruce Wayne (N05): 3 PENDING violations → triggers auto-suspension
-- All within license period 2018-01-15 to 2023-10-24
('I20-0000009-9', 'PO3 Villanueva','Pending', 'Iloilo City',  'Region VI',  '2020-06-11', 'Unpaid', 'N05-18-567890', 'BFM-9900', 'REG-2019-053'),
('M21-0000010-0', 'PO1 Mendoza', 'Pending',   'Manila',       'NCR',        '2021-03-20', 'Unpaid', 'N05-18-567890', 'BFM-9900', 'REG-2020-054'),
('M22-0000011-1', 'PO2 Aquino',  'Pending',   'Mandaluyong',  'NCR',        '2022-11-08', 'Unpaid', 'N05-18-567890', 'ATK-4411', 'REG-2022-056'),
-- Clark Kent (N06): 2 violations — 1 pending, 1 pending
('M24-0000012-2', NULL,          'Pending',   'Mandaluyong',  'NCR',        '2024-07-07', 'Unpaid', 'N06-22-678901', 'PKR-0011', 'REG-2024-059'),
('M25-0000013-3', 'PO1 Dela Cruz','Pending',  'Manila',       'NCR',        '2025-10-14', 'Unpaid', 'N06-22-678901', 'PKR-0011', 'REG-2025-060'),
-- Diana Prince (N07): 1 resolved
('M23-0000014-4', 'PO3 Flores',  'Resolved',  'Quezon City',  'NCR',        '2023-04-12', 'Paid',   'N07-22-789012', 'SCT-3344', 'REG-2023-066'),
-- Ramon Cruz (N11): 1 pending (motorcycle)
('M25-0000015-5', 'PO2 Navarro', 'Pending',   'Manila',       'NCR',        '2025-06-15', 'Unpaid', 'N11-22-112233', 'AN-1234',  'REG-2025-084'),
-- Maria Santos (N12): 1 resolved (motorcycle)
('M24-0000016-6', 'PO1 Reyes',   'Resolved',  'Quezon City',  'NCR',        '2024-09-20', 'Paid',   'N12-21-223344', 'AB-5678',  'REG-2024-086'),
-- Jose Ramos (N13): 1 pending (expired license, still apprehended)
('C25-0000017-7', 'PO3 Uy',      'Pending',   'Cebu City',    'Region VII', '2025-01-10', 'Unpaid', 'N13-19-334455', 'WM-9012',  'REG-2024-091'),
-- Eduardo Reyes (N14): 2 violations — 1 pending, 1 resolved
('M25-0000018-8', 'PO2 Castillo','Pending',   'Manila',       'NCR',        '2025-08-10', 'Unpaid', 'N14-20-445566', 'AXB-2468', 'REG-2025-096'),
('M24-0000019-9', 'PO1 Ramos',   'Resolved',  'Quezon City',  'NCR',        '2024-03-18', 'Paid',   'N14-20-445566', 'AXB-2468', 'REG-2023-094'),
-- Roberto Garcia (N15): 1 resolved (PUV overcharging)
('M24-0000020-0', 'PO3 Hernandez','Resolved', 'Quezon City',  'NCR',        '2024-11-15', 'Paid',   'N15-19-556677', 'AJP-1357', 'REG-2024-107');

-- ─────────────────────────────────────────────────────────────────────────────
-- VIOLATION TYPES (linked to violation_fine_schedule)
-- Each uovr_number may have multiple types (multi-row apprehension).
-- All violation_type values must exist in violation_fine_schedule.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO violation_type (uovr_number, violation_type) VALUES
-- M20-0000001-1: John Doe, speeding + reckless on ABK-1234
('M20-0000001-1', 'Over speeding'),
('M20-0000001-1', 'Reckless driving'),
-- M22-0000002-2: John Doe, expired license on ACM-5678 (dismissed)
('M22-0000002-2', 'Expired drivers license'),
-- M25-0000003-3: John Doe, one way street + no seatbelt
('M25-0000003-3', 'Violation of one way street'),
('M25-0000003-3', 'No seatbelt'),
-- M21-0000004-4: Jane Austen, disregarding signal
('M21-0000004-4', 'Disregarding traffic sign/signal'),
-- C22-0000005-5: Jane Austen, reckless + no seatbelt + disobedience
('C22-0000005-5', 'Reckless driving'),
('C22-0000005-5', 'No seatbelt'),
('C22-0000005-5', 'Disobedience to traffic officer'),
-- D22-0000006-6: Michael Jordan, no seatbelt (contested)
('D22-0000006-6', 'No seatbelt'),
-- B23-0000007-7: Sarah Connor, obstruction + disobedience
('B23-0000007-7', 'Obstruction to traffic'),
('B23-0000007-7', 'Disobedience to traffic officer'),
-- M24-0000008-8: Sarah Connor, over speeding
('M24-0000008-8', 'Over speeding'),
-- I20-0000009-9: Bruce Wayne, reckless driving (pending #1)
('I20-0000009-9', 'Reckless driving'),
-- M21-0000010-0: Bruce Wayne, illegal parking unattended (pending #2)
('M21-0000010-0', 'Illegal parking (unattended)'),
-- M22-0000011-1: Bruce Wayne, over speeding + anti-distracted (pending #3 → triggers suspension)
('M22-0000011-1', 'Over speeding'),
('M22-0000011-1', 'Anti-Distracted Driving Act violation'),
-- M24-0000012-2: Clark Kent, one way street + disregarding signal
('M24-0000012-2', 'Violation of one way street'),
('M24-0000012-2', 'Disregarding traffic sign/signal'),
-- M25-0000013-3: Clark Kent, illegal counterflow
('M25-0000013-3', 'Illegal counterflow'),
-- M23-0000014-4: Diana Prince, illegal parking attended
('M23-0000014-4', 'Illegal parking (attended)'),
-- M25-0000015-5: Ramon Cruz, no helmet + over speeding (motorcycle)
('M25-0000015-5', 'No safety helmet'),
('M25-0000015-5', 'Over speeding'),
-- M24-0000016-6: Maria Santos, no helmet (motorcycle)
('M24-0000016-6', 'No safety helmet'),
-- C25-0000017-7: Jose Ramos, reckless driving (motorcycle)
('C25-0000017-7', 'Reckless driving'),
-- M25-0000018-8: Eduardo Reyes, smoking in PUV + refusal to convey
('M25-0000018-8', 'Smoking inside PUV'),
('M25-0000018-8', 'Refusal to convey passenger'),
-- M24-0000019-9: Eduardo Reyes, overloading
('M24-0000019-9', 'No overloading'),
-- M24-0000020-0: Roberto Garcia, overcharging (PUV)
('M24-0000020-0', 'Overcharging');


-- reports to be generated

-- View all registered drivers filtered by: License type, License status, Age range, Sex
SELECT * FROM v_driver WHERE (@license_type IS NULL OR license_type = @license_type) 
    AND (@license_status IS NULL OR license_status = @license_status) 
    AND (@age_min IS NULL OR @age_max IS NULL OR age BETWEEN @age_min 
    AND @age_max) 
    AND (@sex IS NULL OR sex = @sex);
 
-- View all vehicles owned by a given driver
SELECT v.* FROM vehicle v WHERE v.owner_license_number = @license_number;
 
-- View all vehicles with expired registrations as of a given date
SELECT v.*, vr.registration_number, vr.expiration_date, vr.registration_status 
    FROM vehicle v JOIN vehicle_registration vr ON v.plate_number = vr.plate_number 
    WHERE vr.expiration_date < @as_of_date
    AND vr.registration_status = 'Expired';

-- View all drivers with expired or suspended licenses.
SELECT * FROM driver
WHERE license_status IN ('Expired', 'Suspended');
 
-- View all traffic violations committed by a given driver within a specified date range.
-- uses v_violation_summary to include total_fine_amount derived from the fine schedule.
SELECT * FROM v_violation_summary
WHERE license_number = @license_number
AND violation_date BETWEEN @start_date AND @end_date;
 
-- View the total number of violations per violation type for a given year.
SELECT vt.violation_type, COUNT(*) AS total_violations FROM violation_type vt
JOIN traffic_violation tv 
ON vt.uovr_number = tv.uovr_number
WHERE YEAR(tv.violation_date) = @year
GROUP BY vt.violation_type
ORDER BY total_violations DESC;
 
-- View all vehicles involved in violations within a given city or region.
SELECT DISTINCT v.* FROM vehicle v
JOIN traffic_violation tv 
ON v.plate_number = tv.plate_number
WHERE tv.violation_location_city = @city
OR tv.violation_location_region = @region;

-- View all vehicles of each driver
SELECT d.license_number, d.license_type, CONCAT(d.first_name, ' ', d.last_name) AS full_name, 
v.plate_number, v.make, v.model, v.year, v.vehicle_type 
FROM driver d LEFT JOIN vehicle v on d.license_number = v.owner_license_number
ORDER BY d.license_number;

-- View registration history per vehicle
SELECT
    v.plate_number,
    v.make,
    v.model,
    vr.registration_number,
    vr.registration_date,
    vr.expiration_date,
    vr.registration_status
FROM vehicle v
JOIN vehicle_registration vr ON v.plate_number = vr.plate_number
WHERE (@plate_number IS NULL OR v.plate_number = @plate_number)
ORDER BY v.plate_number, vr.registration_date;