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

-- traffic violations that are based on the actual traffic violation receipt (TVR) and IRR-RA10930
CREATE TABLE violation_type (
    uovr_number VARCHAR(20) NOT NULL,
    violation_type ENUM(
        'Illegal parking (attended)',
        'Illegal parking (unattended)',
        'Violation of loading zones',
        'Obstruction to traffic',
        'Colorum tricycles',
        '50/50 scheme',
        'Non display of Not-for-hire',
        'Violation of one way street',
        'Driving under the influence of liquor',
        'Truck ban',
        'No drivers license',
        'No professional drivers license',
        'Expired drivers license',
        'No seatbelt',
        'Noisy muffler',
        'Disobedience to traffic officer',
        'Disregarding traffic sign/signal',
        'Discourteous and disrespectful conduct to passer',
        'Others',
        'Untidy attire of driver',
        'Reckless driving',
        'No U-turn',
        'No interior light',
        'Over speeding',
        'No safety helmet',
        'Unauthorized driver',
        'Not posting of current passenger fare matrix',
        'Refusal to convey passenger',
        'No overloading',
        'No Mayor permit',
        'Overcharging',
        'Without proper light',
        'Jaywalking',
        'Expired TCT',
        'Driving through funeral or other processions',
        'Smoking inside PUV',
        'Violation of emission standard',
        'Driving against traffic',
        'Illegal counterflow',
        'Anti-Distracted Driving Act violation',
        'No contact overspeeding',
        'Overspeeding physical apprehension',
        'Unified Vehicular Volume Reduction Program',
        'Failure to use seatbelt',
        'Children safety on motorcycle',
        'No ICC/PS mark sticker on helmet',
        'Smoke belching',
        'Driving without license',
        'Driving with suspended drivers license',
        'Driving with revoked drivers license',
        'Using motor vehicle in commission of crime'
    ) NOT NULL,
    CONSTRAINT pk_violation_type PRIMARY KEY (uovr_number, violation_type),
    CONSTRAINT fk_vtype_violation FOREIGN KEY (uovr_number) REFERENCES traffic_violation(uovr_number)
);

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
    --   e.g. issued 2022-03-10, born 1990-06-15 -> expiry = 2027-06-15
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

-- auto-compute registration expiry based on LTO staggered renewal schedule.
-- the last digit of the plate number determines the renewal month:
--   1 -> January,  2 -> February,  3 -> March,  4 -> April,
--   5 -> May,      6 -> June,      7 -> July,   8 -> August,
--   9 -> September, 0 -> October
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

-- suspend license if driver reaches 3 or more pending violations within the current license period.
-- uses GREATEST(v_expiry_date, CURDATE()) to include post-expiry violations, mirroring sp_renew_license.
-- suspends both Active and Expired licenses, blocking renewal for repeat offenders.
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
-- birth-date-reckoned expiry per IRR RA 10930 Section 9.3.1 and 9.4
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

-- dummy data

INSERT INTO driver (
    license_number, first_name, last_name, middle_name,
    birth_date, sex, address,
    license_type, license_status, license_issue_date
) VALUES
('N01-23-100001', 'Ana',     'Reyes',     'Garcia',    '1995-03-12', 'F', '14 Mabini St, Manila',               'Non-Professional', 'Active',    '2023-01-20'),
('N02-22-200002', 'Marco',   'Santos',    'Bautista',  '1988-07-04', 'M', '8 Rizal Ave, Quezon City',           'Professional',     'Active',    '2022-06-15'),
('N03-24-300003', 'Lara',    'Cruz',      'Ocampo',    '2000-11-29', 'F', '55 Del Pilar St, Cebu City',         'Non-Professional', 'Active',    '2024-09-05'),
('N04-21-400004', 'Ben',     'Villanueva','Reyes',     '1979-02-28', 'M', '20 Burgos St, Davao City',           'Professional',     'Active',    '2021-02-01'),
('N05-23-500005', 'Celia',   'Flores',    'Luna',      '1997-08-15', 'F', '77 Aurora Blvd, Pasig',              'Non-Professional', 'Active',    '2023-11-10'),
('N06-21-600006', 'Andres',  'Torres',    'Manalac',   '1983-05-09', 'M', '33 Abad Santos St, Manila',          'Professional',     'Active',    '2021-03-25'),
('N07-22-700007', 'Rosa',    'Dela Cruz', 'Natividad', '1990-09-17', 'F', '12 Magsaysay Ave, Iloilo City',      'Professional',     'Active',    '2022-07-08'),
('N08-20-800008', 'Felix',   'Navarro',   'Torres',    '1985-06-30', 'M', '5 Roxas Blvd, Manila',               'Professional',     'Active',    '2020-04-12'),
('N09-19-900009', 'Ramon',   'Abad',      'Cruz',      '1980-04-22', 'M', '9 Bonifacio St, Iloilo City',        'Non-Professional', 'Expired',   '2019-03-10'),
('N10-17-101010', 'Dolores', 'Mendoza',   'Santos',    '1982-12-01', 'F', '22 Quezon Blvd, Baguio City',        'Professional',     'Expired',   '2017-11-05'),
('N11-10-111111', 'Victor',  'Tan',       'Lim',       '1975-10-08', 'M', '88 Session Rd, Baguio City',         'Professional',     'Revoked',   '2010-09-01'),
('S01-25-121212', 'Gio',     'dela Cruz', NULL,        '2007-05-20', 'M', '3 Sampaguita Lane, Marikina',        'Student Permit',   'Active',    '2025-06-01'),
('S02-26-131313', 'Nina',    'Tan',       'Santos',    '2006-09-14', 'F', '101 Katipunan Ave, Quezon City',     'Student Permit',   'Active',    '2026-01-10');

INSERT INTO vehicle (
    plate_number, make, model, engine_number, chassis_number,
    vehicle_type, year, color, owner_license_number
) VALUES
('ABD-1234', 'Toyota',     'Vios',        'ENG-10001', 'CHAS-10001', 'Sedan',        2021, 'White',       'N01-23-100001'),
('BCE-5677', 'Honda',      'Jazz',        'ENG-10002', 'CHAS-10002', 'Hatchback',    2020, 'Blue',        'N02-22-200002'),
('BCF-4567', 'Ford',       'Everest',     'ENG-10003', 'CHAS-10003', 'SUV',          2019, 'Black',       'N02-22-200002'),
('BDG-5672', 'Mitsubishi', 'Strada',      'ENG-10004', 'CHAS-10004', 'Pickup Truck', 2020, 'Silver',      'N02-22-200002'),
('CEH-6789', 'BMW',        '3 Series',    'ENG-10005', 'CHAS-10005', 'Coupe',        2023, 'Matte Black', 'N03-24-300003'),
('DFJ-7895', 'Toyota',     'HiAce',       'ENG-10006', 'CHAS-10006', 'Van',          2018, 'Pearl White', 'N04-21-400004'),
('EGK-8903', 'Nissan',     'Almera',      'ENG-10007', 'CHAS-10007', 'Sedan',        2022, 'Red',         'N05-23-500005'),
('FHL-9016', 'Sarao',      'Jeepney',     'ENG-10008', 'CHAS-10008', 'Jeepney',      2019, 'Multicolor',  'N06-21-600006'),
('AT-5533',  'Kawasaki',   'Barako',      'ENG-10009', 'CHAS-10009', 'Tricycle',     2020, 'Blue',        'N06-21-600006'),
('GJM-0128', 'Hino',       'FB Bus',      'ENG-10010', 'CHAS-10010', 'Bus',          2020, 'Yellow',      'N07-22-700007'),
('GHK-3453', 'Isuzu',      'Forward',     'ENG-10011', 'CHAS-10011', 'Truck',        2018, 'White',       'N07-22-700007'),
('ATR-7722', 'Utility',    'Flatbed',     'ENG-10012', 'CHAS-10012', 'Trailer',      2017, 'Gray',        'N07-22-700007'),
('HKN-1230', 'Chevrolet',  'Trailblazer', 'ENG-10013', 'CHAS-10013', 'SUV',          2020, 'Dark Gray',   'N08-20-800008'),
('FHL-3455', 'Kia',        'Soluto',      'ENG-10014', 'CHAS-10014', 'Sedan',        2017, 'Gray',        'N09-19-900009'),
('GJM-9018', 'Hyundai',    'Accent',      'ENG-10015', 'CHAS-10015', 'Sedan',        2016, 'Beige',       'N10-17-101010'),
('JLP-2345', 'BMW',        'M3',          'ENG-10016', 'CHAS-10016', 'Sedan',        2023, 'Matte Black', 'N11-10-111111'),
('GH-1231',  'Honda',      'Click 125i',  'ENG-10017', 'CHAS-10017', 'Motorcycle',   2024, 'Green',       'S01-25-121212'),
('AC-7773',  'Yamaha',     'Mio Gear',    'ENG-10018', 'CHAS-10018', 'Motorcycle',   2022, 'Red',         'N01-23-100001');

INSERT INTO vehicle_registration (
    registration_number, plate_number, registration_date, registration_status
) VALUES
-- ABD-1234 (ends 4 -> Apr): history + active
('REG-2022-001', 'ABD-1234', '2022-02-10', 'Expired'),
('REG-2026-002', 'ABD-1234', '2026-02-15', 'Active'),
-- BCE-5677 (ends 7 -> Jul): registered Aug, month past renewal -> expiry Jul of year+2
('REG-2024-003', 'BCE-5677', '2024-08-20', 'Active'),
-- BCF-4567 (ends 7 -> Jul): registered Aug, month past renewal -> expiry Jul of year+2
('REG-2024-004', 'BCF-4567', '2024-08-01', 'Active'),
-- BDG-5672 (ends 2 -> Feb): registered Jan -> expiry Feb of year+1
('REG-2025-005', 'BDG-5672', '2025-01-05', 'Active'),
-- CEH-6789 (ends 9 -> Sep): registered Sep -> expiry Sep of year+1
('REG-2025-006', 'CEH-6789', '2025-09-01', 'Active'),
-- DFJ-7895 (ends 5 -> May): registered Jun, month past renewal -> expiry May of year+2
('REG-2024-007', 'DFJ-7895', '2024-06-10', 'Active'),
-- EGK-8903 (ends 3 -> Mar): registered Feb -> expiry Mar of year+1
('REG-2025-008', 'EGK-8903', '2025-02-20', 'Active'),
-- FHL-9016 (ends 6 -> Jun): registered May -> expiry Jun of year+1
('REG-2024-009', 'FHL-9016', '2024-05-10', 'Active'),
-- AT-5533 (ends 3 -> Mar): registered Feb -> expiry Mar of year+1
('REG-2025-010', 'AT-5533',  '2025-02-15', 'Active'),
-- GJM-0128 (ends 8 -> Aug): registered Jul -> expiry Aug of year+1
('REG-2025-011', 'GJM-0128', '2025-07-20', 'Active'),
-- GHK-3453 (ends 3 -> Mar): registered Mar -> expiry Mar of year+1
('REG-2025-012', 'GHK-3453', '2025-03-01', 'Active'),
-- ATR-7722 (ends 2 -> Feb): registered Jan -> expiry Feb of year+1
('REG-2025-013', 'ATR-7722', '2025-01-20', 'Active'),
-- HKN-1230 (ends 0 -> Oct): expired — owner suspended, stopped renewing
('REG-2022-014', 'HKN-1230', '2022-09-15', 'Expired'),
-- FHL-3455 (ends 5 -> May): expired — owner license expired
('REG-2022-015', 'FHL-3455', '2022-04-10', 'Expired'),
-- GJM-9018 (ends 8 -> Aug): expired — owner license expired
('REG-2022-016', 'GJM-9018', '2022-07-20', 'Expired'),
-- JLP-2345 (ends 5 -> May): expired — owner revoked
('REG-2023-017', 'JLP-2345', '2023-04-01', 'Expired'),
-- GH-1231 (ends 1 -> Jan): motorcycle, registered Jan -> expiry Jan of year+1
('REG-2025-018', 'GH-1231',  '2025-01-15', 'Active'),
-- AC-7773 (ends 3 -> Mar): motorcycle, registered Feb -> expiry Mar of year+1
('REG-2025-019', 'AC-7773',  '2025-02-10', 'Active'),
-- BCF-4567: suspended registration (separate incident)
('REG-2024-020', 'BCF-4567', '2024-01-05', 'Suspended');

INSERT INTO traffic_violation (
    uovr_number, officer, violation_status, violation_location_city,
    violation_location_region, violation_date,
    payment_status, license_number, plate_number, registration_number
) VALUES
('M23-0000001-1', 'PO1 Santos',    'Resolved',  'Manila',      'NCR',        '2023-06-10', 'Paid',   'N01-23-100001', 'ABD-1234',  'REG-2022-001'),
('M24-0000002-2', 'PO2 Reyes',     'Resolved',  'Manila',      'NCR',        '2024-02-20', 'Waived', 'N01-23-100001', 'AC-7773',   'REG-2025-019'),
('M22-0000003-3', 'PO3 Garcia',    'Dismissed', 'Quezon City', 'NCR',        '2022-09-18', 'Waived', 'N02-22-200002', 'BCF-4567',  NULL),
('M24-0000004-4', 'PO1 Bautista',  'Contested', 'Caloocan',    'NCR',        '2024-03-22', 'Unpaid', 'N02-22-200002', 'BDG-5672',  'REG-2025-005'),
('C25-0000005-5', 'PO2 Uy',        'Pending',   'Cebu City',   'Region VII', '2025-02-14', 'Unpaid', 'N03-24-300003', 'CEH-6789',  'REG-2025-006'),
('D22-0000006-6', 'PO1 Castillo',  'Resolved',  'Davao City',  'Region XI',  '2022-04-11', 'Paid',   'N04-21-400004', 'DFJ-7895',  'REG-2024-007'),
('M24-0000007-7', 'PO2 Dela Cruz', 'Pending',   'Pasig',       'NCR',        '2024-05-30', 'Unpaid', 'N05-23-500005', 'EGK-8903',  'REG-2025-008'),
('M25-0000008-8', 'PO1 Flores',    'Pending',   'Mandaluyong', 'NCR',        '2025-01-18', 'Unpaid', 'N05-23-500005', 'EGK-8903',  'REG-2025-008'),
('M23-0000009-9', 'PO3 Navarro',   'Resolved',  'Manila',      'NCR',        '2023-08-05', 'Paid',   'N06-21-600006', 'FHL-9016',  'REG-2024-009'),
('M24-0000010-0', 'PO2 Torres',    'Resolved',  'Manila',      'NCR',        '2024-06-18', 'Paid',   'N07-22-700007', 'GJM-0128',  'REG-2025-011'),
('M25-0000011-1', 'PO1 Cruz',      'Pending',   'Manila',      'NCR',        '2025-03-10', 'Unpaid', 'N07-22-700007', 'GHK-3453',  'REG-2025-012'),
('M21-0000012-2', 'PO3 Lim',       'Pending',   'Manila',      'NCR',        '2021-07-14', 'Unpaid', 'N08-20-800008', 'HKN-1230',  'REG-2022-014'),
('M22-0000013-3', 'PO2 Santos',    'Pending',   'Makati',      'NCR',        '2022-11-03', 'Unpaid', 'N08-20-800008', 'HKN-1230',  'REG-2022-014'),
-- This 3rd pending insert fires trg_violation_after_insert -> Felix Navarro auto-suspended
('M24-0000014-4', 'PO1 Reyes',     'Pending',   'Taguig',      'NCR',        '2024-08-19', 'Unpaid', 'N08-20-800008', 'HKN-1230',  'REG-2022-014'),
('I24-0000015-5', 'PO3 Hernandez', 'Pending',   'Iloilo City', 'Region VI',  '2024-03-22', 'Unpaid', 'N09-19-900009', 'FHL-3455',  NULL),
('M25-0000016-6', 'PO2 Villanueva','Pending',   'Marikina',    'NCR',        '2025-09-14', 'Unpaid', 'S01-25-121212', 'GH-1231',   'REG-2025-018');

INSERT INTO violation_type (uovr_number, violation_type) VALUES
('M23-0000001-1', 'Reckless driving'),
('M23-0000001-1', 'No seatbelt'),
('M24-0000002-2', 'Noisy muffler'),
('M22-0000003-3', 'No drivers license'),
('M24-0000004-4', 'Over speeding'),
('C25-0000005-5', 'Illegal parking (attended)'),
('D22-0000006-6', 'Violation of loading zones'),
('M24-0000007-7', 'Disregarding traffic sign/signal'),
('M25-0000008-8', 'Violation of one way street'),
('M23-0000009-9', 'Overcharging'),
('M24-0000010-0', 'Smoking inside PUV'),
('M24-0000010-0', 'Refusal to convey passenger'),
('M25-0000011-1', 'Truck ban'),
('M21-0000012-2', 'Driving under the influence of liquor'),
('M22-0000013-3', 'Obstruction to traffic'),
('M24-0000014-4', 'Over speeding'),
('M24-0000014-4', 'Disobedience to traffic officer'),
('I24-0000015-5', 'Expired drivers license'),
('M25-0000016-6', 'No safety helmet');

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
    WHERE vr.expiration_date < 2024-05-01
    AND vr.registration_status = 'Expired';

-- View all drivers with expired or suspended licenses
SELECT * FROM driver
WHERE license_status IN ('Expired', 'Suspended');

-- View all traffic violations committed by a given driver within a specified date range
SELECT
    tv.uovr_number,
    tv.officer,
    tv.violation_status,
    tv.violation_location_city,
    tv.violation_location_region,
    tv.violation_date,
    tv.payment_status,
    tv.plate_number,
    tv.registration_number,
    vt.violation_type
FROM traffic_violation tv
JOIN violation_type vt ON tv.uovr_number = vt.uovr_number
WHERE tv.license_number = @license_number
AND tv.violation_date BETWEEN @start_date AND @end_date;

-- View the total number of violations per violation type for a given year
SELECT vt.violation_type, COUNT(*) AS total_violations FROM violation_type vt
JOIN traffic_violation tv
ON vt.uovr_number = tv.uovr_number
WHERE YEAR(tv.violation_date) = @year
GROUP BY vt.violation_type
ORDER BY total_violations DESC;

-- View all vehicles involved in violations within a given city or region
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