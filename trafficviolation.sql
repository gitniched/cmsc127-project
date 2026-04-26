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
('Illegal parking',                             1000.00,  'MMDA OVR Code 04 / LGU ordinances'),
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
('Others',                                      1000.00,  'R.A. 4136 / JAO 2014-01'),
('Untidy attire of driver',                     1000.00,  'LTO AO for PUV drivers'),
('Reckless driving',                            2000.00,  'R.A. 4136 Sec. 48 / JAO 2014-01'),
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
('Violation of emission standard',              2000.00,  'R.A. 8749 / RA 4136 Sec. 34');

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

    -- auto-compute expiry: Student Permit = 1 year, all others = 5 years
    IF NEW.license_type = 'Student Permit' THEN
        SET NEW.license_expiry_date = DATE_ADD(NEW.license_issue_date, INTERVAL 1 YEAR);
    ELSE
        SET NEW.license_expiry_date = DATE_ADD(NEW.license_issue_date, INTERVAL 5 YEAR);
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
                SET NEW.license_expiry_date = DATE_ADD(NEW.license_issue_date, INTERVAL 5 YEAR);
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
            SET v_new_expiry_date = DATE_ADD(v_new_issue_date, INTERVAL v_renewal_years YEAR);

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


-- driver DL codes: assigned based on each driver's license type and the vehicles they own
INSERT INTO driver_dl_code (license_number, dl_code, vehicle_category) VALUES
-- Non-Professional drivers: typically hold B (M1) for passenger cars
('N01-22-123456', 'B',  'M1'),   -- John Doe: car + truck owner, also has C
('N01-22-123456', 'C',  'N2'),
('N02-22-234567', 'B',  'M1'),   -- Jane Austen: professional, car + SUV
('N02-22-234567', 'B1', 'M2'),
('N03-15-345678', 'B',  'M1'),   -- Michael Jordan: professional, expired
('N03-15-345678', 'C',  'N2'),
('N04-21-456789', 'B',  'M1'),   -- Sarah Connor: non-pro
('N05-18-567890', 'B',  'M1'),   -- Bruce Wayne: professional, suspended
('N05-18-567890', 'B2', 'N1'),
('N06-22-678901', 'B',  'M1'),   -- Clark Kent: non-pro
('N07-22-789012', 'B',  'M1'),   -- Diana Prince: professional
('N07-22-789012', 'B1', 'M2'),
('N08-23-890123', 'B',  'M1'),   -- Peter Parker: non-pro
('N09-22-901234', 'B',  'M1'),   -- Natasha Romanoff: professional
('N09-22-901234', 'C',  'N3'),
('N10-10-012345', 'B',  'M1'),   -- Tony Stark: professional, revoked
('N10-10-012345', 'D',  'M3'),
-- motorcycle owners: hold A (L3) in addition to B
('N11-22-112233', 'A',  'L3'),   -- Ramon Cruz: motorcycle owner
('N11-22-112233', 'B',  'M1'),
('N12-21-223344', 'A',  'L3'),   -- Maria Santos: motorcycle owner
('N12-21-223344', 'B',  'M1'),
('N13-19-334455', 'A',  'L3'),   -- Jose Ramos: motorcycle owner
('N13-19-334455', 'B',  'M1'),
-- PUV/heavy vehicle drivers
('N14-20-445566', 'D',  'M3'),   -- Eduardo Reyes: bus driver
('N14-20-445566', 'CE', 'O3'),
('N15-19-556677', 'A1', 'L5'),   -- Roberto Garcia: jeepney/tricycle driver
('N15-19-556677', 'D',  'M3');

INSERT INTO vehicle (plate_number, make, model, engine_number, chassis_number, vehicle_type, year, color, owner_license_number) VALUES
('ABK-1234', 'Toyota', 'Vios', 'ENG-00123', 'CHAS-00123', 'Sedan', 2018, 'Black', 'N01-22-123456'),
('ACM-5678', 'Toyota', 'Fortuner', 'ENG-00234', 'CHAS-00234', 'SUV', 2020, 'White', 'N01-22-123456'),
('ADR-9012', 'Ford', 'Ranger', 'ENG-00345', 'CHAS-00345', 'Truck', 2019, 'Red', 'N01-22-123456'),
('AET-3456', 'Mitsubishi', 'Montero', 'ENG-00456', 'CHAS-00456', 'SUV', 2021, 'Silver', 'N02-22-234567'),
('AFN-7890', 'Honda', 'Civic', 'ENG-00567', 'CHAS-00567', 'Sedan', 2017, 'Black', 'N02-22-234567'),
('AGP-2345', 'Nissan', 'Urvan', 'ENG-01345', 'CHAS-01345', 'Van', 2019, 'White', 'N08-23-890123'),
('WBK-6789', 'Hyundai', 'Tucson', 'ENG-00678', 'CHAS-00678', 'SUV', 2022, 'Blue', 'N03-15-345678'),
('TDR-5566', 'Suzuki', 'Swift', 'ENG-00789', 'CHAS-00789', 'Hatchback', 2015, 'Yellow', 'N04-21-456789'),
('TCN-7788', 'Kia', 'Rio', 'ENG-00890', 'CHAS-00890', 'Sedan', 2016, 'Green', 'N04-21-456789'),
('BFM-9900', 'Chevrolet', 'Trailblazer', 'ENG-00901', 'CHAS-00901', 'SUV', 2018, 'Gray', 'N05-18-567890'),
('PKR-0011', 'Audi', 'R8', 'ENG-01012', 'CHAS-01012', 'Coupe', 2023, 'Red', 'N06-22-678901'),
('SBN-2233', 'BMW', 'X5', 'ENG-01123', 'CHAS-01123', 'SUV', 2022, 'White', 'N07-22-789012'),
('SCT-3344', 'BMW', 'M3', 'ENG-01234', 'CHAS-01234', 'Sedan', 2020, 'Blue', 'N07-22-789012'),
('QDM-6677', 'Mazda', '3', 'ENG-01456', 'CHAS-01456', 'Sedan', 2021, 'Red', 'N09-22-901234'),
('QER-8899', 'Subaru', 'Crosstrek', 'ENG-01567', 'CHAS-01567', 'SUV', 2023, 'Orange', 'N09-22-901234'),
('LBK-1100', 'Mercedes', 'S-Class', 'ENG-01678', 'CHAS-01678', 'Sedan', 2023, 'Black', 'N10-10-012345'),
('LCT-9988', 'Porsche', '911', 'ENG-01789', 'CHAS-01789', 'Coupe', 2022, 'Silver', 'N10-10-012345'),
('ANK-1234', 'Honda', 'Click 125i', 'ENG-02001', 'CHAS-02001', 'Motorcycle', 2021, 'Red', 'N11-22-112233'),
('ABT-5678', 'Yamaha', 'Mio Gear', 'ENG-02002', 'CHAS-02002', 'Motorcycle', 2022, 'Blue', 'N12-21-223344'),
('WMK-9012', 'Honda', 'XRM 125', 'ENG-02003', 'CHAS-02003', 'Motorcycle', 2019, 'Black', 'N13-19-334455'),
('AXB-2468', 'Hino', 'FB Bus', 'ENG-03001', 'CHAS-03001', 'Bus', 2020, 'Yellow', 'N14-20-445566'),
('AJP-1357', 'Sarao', 'Jeepney', 'ENG-03002', 'CHAS-03002', 'Jeepney', 2019, 'Multicolor', 'N15-19-556677'),
('ATK-4411', 'Mitsubishi', 'Strada', 'ENG-04001', 'CHAS-04001', 'Pickup Truck', 2021, 'White', 'N05-18-567890'),
('ATR-7722', 'Isuzu', 'Giga Trailer', 'ENG-04002', 'CHAS-04002', 'Trailer', 2018, 'Gray', 'N14-20-445566'),
('ATC-5533', 'Honda', 'TMX Supremo', 'ENG-04003', 'CHAS-04003', 'Tricycle', 2020, 'Blue', 'N15-19-556677');

INSERT INTO vehicle_registration (registration_number, plate_number, registration_date, registration_status) VALUES
('REG-2026-001', 'ABK-1234', '2026-03-10', 'Active'),
('REG-2025-002', 'ACM-5678', '2025-08-20', 'Active'),
('REG-2026-003', 'AET-3456', '2026-01-15', 'Active'),
('REG-2025-004', 'AFN-7890', '2025-06-30', 'Active'),
('REG-2022-020', 'WBK-6789', '2022-07-01', 'Expired'),
('REG-2025-006', 'TCN-7788', '2025-09-05', 'Active'),
('REG-2023-007', 'TDR-5566', '2023-04-18', 'Expired'),
('REG-2022-008', 'BFM-9900', '2022-11-30', 'Expired'),
('REG-2024-009', 'PKR-0011', '2024-07-22', 'Expired'),
('REG-2024-010', 'ADR-9012', '2024-05-14', 'Suspended'),
('REG-2025-011', 'ANK-1234', '2025-03-20', 'Expired'),
('REG-2024-012', 'ABT-5678', '2024-08-10', 'Expired'),
('REG-2025-013', 'WMK-9012', '2025-06-05', 'Active'),
('REG-2025-014', 'AXB-2468', '2025-07-15', 'Active'),
('REG-2025-015', 'AJP-1357', '2025-11-03', 'Active'),
('REG-2020-016', 'ABK-1234', '2020-01-05', 'Expired'),
('REG-2021-017', 'ACM-5678', '2021-05-10', 'Expired'),
('REG-2021-018', 'AET-3456', '2021-09-20', 'Expired'),
('REG-2022-019', 'AFN-7890', '2022-03-01', 'Expired'),
('REG-2022-023', 'TDR-5566', '2022-11-10', 'Expired'),
('REG-2022-024', 'TCN-7788', '2022-12-01', 'Expired'),
('REG-2019-025', 'BFM-9900', '2019-08-15', 'Expired'),
('REG-2023-026', 'PKR-0011', '2023-06-15', 'Expired'),
('REG-2025-020', 'ATK-4411', '2025-04-10', 'Expired'),
('REG-2023-021', 'ATR-7722', '2023-08-22', 'Expired'),
('REG-2025-022', 'ATC-5533', '2025-02-14', 'Expired');

-- uovr number format: [prefix][YY]-[7-digit sequential]-[1-digit checksum]
-- Prefix codes (issuing authority/region): M=MMDA (Metro Manila), C=Cebu, D=Davao, B=Baguio, I=Iloilo
INSERT INTO traffic_violation (
    uovr_number, violation_status, violation_location_city,
    violation_location_region, violation_date,
    payment_status, license_number, plate_number, registration_number) VALUES
('M20-0000001-1', 'Resolved', 'Manila', 'NCR', '2020-03-15', 'Paid', 'N01-22-123456', 'ABK-1234', 'REG-2020-016'),
('M21-0000002-2', 'Resolved', 'Makati', 'NCR', '2021-07-22', 'Paid', 'N01-22-123456', 'ACM-5678', 'REG-2021-017'),
('M22-0000003-3', 'Dismissed', 'Quezon City', 'NCR', '2022-02-10', 'Waived', 'N01-22-123456', 'ADR-9012', NULL),
('M21-0000004-4', 'Resolved', 'Pasig', 'NCR', '2021-11-30', 'Paid', 'N02-22-234567', 'AET-3456', 'REG-2021-018'),
('C22-0000005-5', 'Resolved', 'Cebu City', 'Region VII', '2022-05-18', 'Paid', 'N02-22-234567', 'AFN-7890', 'REG-2022-019'),
('D22-0000006-6', 'Contested', 'Davao City', 'Region XI', '2022-09-04', 'Unpaid', 'N03-15-345678', 'WBK-6789', 'REG-2022-020'),
('B23-0000007-7', 'Pending', 'Baguio City', 'CAR', '2023-01-19', 'Unpaid', 'N04-21-456789', 'TDR-5566', 'REG-2022-023'),
('M23-0000008-8', 'Resolved', 'Taguig', 'NCR', '2023-09-25', 'Paid', 'N04-21-456789', 'TCN-7788', 'REG-2022-024'),
('I20-0000009-9', 'Resolved', 'Iloilo City', 'Region VI', '2020-06-11', 'Paid', 'N05-18-567890', 'BFM-9900', 'REG-2019-025'),
('M24-0000010-0', 'Pending', 'Mandaluyong', 'NCR', '2024-02-07', 'Unpaid', 'N06-22-678901', 'PKR-0011', 'REG-2023-026'),
('M25-0000011-1', 'Pending', 'Manila', 'NCR', '2025-06-15', 'Unpaid', 'N11-22-112233', 'ANK-1234', 'REG-2025-011'),
('M24-0000012-2', 'Resolved', 'Quezon City', 'NCR', '2024-09-20', 'Paid', 'N12-21-223344', 'ABT-5678', 'REG-2024-012'),
('C25-0000013-3', 'Pending', 'Cebu City', 'Region VII', '2025-11-03', 'Unpaid', 'N13-19-334455', 'WMK-9012', 'REG-2025-013'),
('M25-0000014-4', 'Pending', 'Manila', 'NCR', '2025-08-10', 'Unpaid', 'N14-20-445566', 'AXB-2468', 'REG-2025-014'),
('M25-0000015-5', 'Resolved', 'Quezon City', 'NCR', '2025-11-15', 'Paid', 'N15-19-556677', 'AJP-1357', 'REG-2025-015');
 
INSERT INTO violation_type (uovr_number, violation_type) VALUES

('M25-0000011-1', 'No safety helmet'),
('M25-0000011-1', 'Over speeding'),
('M24-0000012-2', 'No safety helmet'),
('C25-0000013-3', 'Reckless driving'),
('M25-0000014-4', 'Smoking inside PUV'),
('M25-0000014-4', 'Refusal to convey passenger'),
('M25-0000015-5', 'Overcharging'),
('M20-0000001-1', 'Over speeding'),
('M20-0000001-1', 'Reckless driving'),
('M21-0000002-2', 'Illegal parking'),
('M22-0000003-3', 'Expired drivers license'),
('M22-0000003-3', 'No drivers license'),
('M21-0000004-4', 'Disregarding traffic sign/signal'),
('C22-0000005-5', 'Reckless driving'),
('C22-0000005-5', 'No seatbelt'),
('C22-0000005-5', 'Disobedience to traffic officer'),
('D22-0000006-6', 'No seatbelt'),
('B23-0000007-7', 'Disobedience to traffic officer'),
('B23-0000007-7', 'Obstruction to traffic'),
('M23-0000008-8', 'Over speeding'),
('I20-0000009-9', 'Expired drivers license'),
('M24-0000010-0', 'Violation of one way street'),
('M24-0000010-0', 'Disregarding traffic sign/signal');


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