DROP DATABASE IF EXISTS trafficviolation;
CREATE DATABASE trafficviolation;
USE trafficviolation;
 
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
    license_expiry_date DATE NOT NULL,
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
    vehicle_type VARCHAR(20) NOT NULL,
    year YEAR NOT NULL,
    color VARCHAR(20) NOT NULL,
    owner_license_number VARCHAR(13) NOT NULL,
    CONSTRAINT pk_vehicle PRIMARY KEY (plate_number),
    CONSTRAINT fk_vehicle_driver FOREIGN KEY (owner_license_number) REFERENCES driver(license_number)
);
 
CREATE TABLE vehicle_registration (
    registration_number VARCHAR(20) NOT NULL,
    plate_number VARCHAR(10) NOT NULL,
    registration_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
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
    fine_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('Paid', 'Unpaid', 'Waived') NOT NULL DEFAULT 'Unpaid',
    license_number VARCHAR(13) NOT NULL,
    plate_number VARCHAR(10) NOT NULL,
    registration_number VARCHAR(20),
    CONSTRAINT pk_traffic_violation PRIMARY KEY (uovr_number),
    CONSTRAINT fk_violation_driver FOREIGN KEY (license_number) REFERENCES driver(license_number),
    CONSTRAINT fk_violation_vehicle FOREIGN KEY (plate_number) REFERENCES vehicle(plate_number),
    CONSTRAINT fk_violation_registration FOREIGN KEY (registration_number) REFERENCES vehicle_registration(registration_number)
);
 
-- traffic violations that are based on the actual traffic violation receipt (TVR)
CREATE TABLE violation_type (
    uovr_number VARCHAR(20) NOT NULL,
    violation_type ENUM(
        'Illegal parking',
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
        'Violation of emission standard'
    ) NOT NULL,
    CONSTRAINT pk_violation_type PRIMARY KEY (uovr_number, violation_type),
    CONSTRAINT fk_vtype_violation FOREIGN KEY (uovr_number) REFERENCES traffic_violation(uovr_number)
);

-- triggers

DELIMITER $$

-- auto-compute expiry on insert (always 5 years)
CREATE TRIGGER trg_driver_before_insert
BEFORE INSERT ON driver
FOR EACH ROW
BEGIN
    IF NEW.license_type = 'Student Permit' THEN
        SET NEW.license_expiry_date = DATE_ADD(NEW.license_issue_date, INTERVAL 1 YEAR);
    ELSE
        SET NEW.license_expiry_date = DATE_ADD(NEW.license_issue_date, INTERVAL 5 YEAR);
    END IF;
END$$

-- block direct edits to expiry, allow renewal override via session var
CREATE TRIGGER trg_driver_before_update
BEFORE UPDATE ON driver
FOR EACH ROW
BEGIN
    IF @lto_renewal_override != 1 THEN
        IF NEW.license_issue_date <> OLD.license_issue_date THEN
            SET NEW.license_expiry_date = DATE_ADD(NEW.license_issue_date, INTERVAL 5 YEAR);
        ELSEIF NEW.license_expiry_date <> OLD.license_expiry_date THEN
            SET NEW.license_expiry_date = OLD.license_expiry_date;
        END IF;
    END IF;
END$$

-- auto-compute registration expiry (1 year)
CREATE TRIGGER trg_registration_before_insert
BEFORE INSERT ON vehicle_registration
FOR EACH ROW
BEGIN
    SET NEW.expiration_date = DATE_ADD(NEW.registration_date, INTERVAL 1 YEAR);
END$$

-- suspend license if driver reaches 3 or more pending violations
CREATE TRIGGER trg_violation_after_insert
AFTER INSERT ON traffic_violation
FOR EACH ROW
BEGIN
    DECLARE v_pending_count INT;
    SELECT COUNT(*) INTO v_pending_count
    FROM traffic_violation
    WHERE license_number = NEW.license_number
      AND violation_status = 'Pending';
    IF v_pending_count >= 3 THEN
        UPDATE driver
        SET license_status = 'Suspended'
        WHERE license_number = NEW.license_number
          AND license_status = 'Active';
    END IF;
END$$

-- renew license: 10 years if no violations in current period, else 5 years
CREATE PROCEDURE sp_renew_license(
    IN p_license_number VARCHAR(13),
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_status ENUM('Active', 'Expired', 'Suspended', 'Revoked');
    DECLARE v_issue_date DATE;
    DECLARE v_expiry_date DATE;
    DECLARE v_violation_count INT;
    DECLARE v_renewal_years INT;
    DECLARE v_new_issue_date DATE;
    DECLARE v_new_expiry_date DATE;

    SELECT license_status, license_issue_date, license_expiry_date
    INTO v_status, v_issue_date, v_expiry_date
    FROM driver
    WHERE license_number = p_license_number;

    IF v_status IS NULL THEN
        SET p_message = CONCAT('error: no driver found with license number ', p_license_number);
    ELSEIF v_status = 'Revoked' THEN
        SET p_message = 'error: revoked licenses cannot be renewed';
    ELSE
        SELECT COUNT(*) INTO v_violation_count
        FROM traffic_violation
        WHERE license_number = p_license_number
          AND violation_date BETWEEN v_issue_date AND v_expiry_date
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
END$$

DELIMITER ;

-- dummy tables

INSERT INTO driver (license_number, first_name, last_name, middle_name, birth_date, sex, address, license_type, license_status, license_issue_date) VALUES
('D01-12-1234', 'John', 'Doe', 'Smith', '1985-06-15', 'M', '123 Maple St, Manila', 'Non-Professional', 'Active', '2022-05-10'),
('D02-13-2345', 'Jane', 'Austen', 'Rose', '1990-08-20', 'F', '456 Oak Ave, Makati', 'Professional', 'Active', '2022-11-22'),
('D03-14-3456', 'Michael', 'Jordan', 'Jeffrey', '1975-02-17', 'M', '789 Pine Rd, Pasig', 'Professional', 'Expired', '2015-03-14'),
('D04-15-4567', 'Sarah', 'Connor', 'Ann', '1988-12-05', 'F', '321 Elm St, Quezon City', 'Non-Professional', 'Active', '2021-07-01'),
('D05-16-5678', 'Bruce', 'Wayne', 'Thomas', '1982-10-24', 'M', '1007 Mountain Dr, Taguig', 'Professional', 'Suspended', '2018-01-15'),
('D06-17-6789', 'Clark', 'Kent', 'Joseph', '1992-04-18', 'M', '344 Clinton St, Manila', 'Non-Professional', 'Active', '2022-09-09'),
('D07-18-7890', 'Diana', 'Prince', 'Marie', '1987-03-22', 'F', '890 Amazon Way, Pasay', 'Professional', 'Active', '2022-06-30'),
('D08-19-8901', 'Peter', 'Parker', 'Benjamin', '1995-08-10', 'M', '20 Ingram St, Mandaluyong', 'Non-Professional', 'Active', '2023-02-14'),
('D09-20-9012', 'Natasha', 'Romanoff', 'Alianovna', '1984-11-22', 'F', '500 Russian Blvd, Taguig', 'Professional', 'Active', '2022-10-05'),
('D10-21-0123', 'Tony', 'Stark', 'Edward', '1970-05-29', 'M', '108 Malibu Point, Makati', 'Professional', 'Revoked', '2010-12-01'),
('S01-22-1111', 'Carlo', 'Reyes', NULL, '2007-03-10', 'M', '12 Sampaguita St, Caloocan', 'Student Permit', 'Active', '2025-04-15'),
('S02-23-2222', 'Liza', 'Santos', 'Marie', '2006-09-24', 'F', '88 Mabini Ave, Paranaque', 'Student Permit', 'Active', '2025-05-08'),
('S03-24-3333', 'Ramon', 'Villanueva', 'Cruz', '2005-11-02', 'M', '45 Rizal Blvd, Marikina', 'Student Permit', 'Expired', '2023-06-20');

INSERT INTO vehicle (plate_number, make, model, engine_number, chassis_number, vehicle_type, year, color, owner_license_number) VALUES
('ABC-1234', 'Toyota', 'Vios', 'ENG-00123', 'CHAS-00123', 'Sedan', 2018, 'Black', 'D01-12-1234'),
('XYZ-9876', 'Toyota', 'Fortuner', 'ENG-00234', 'CHAS-00234', 'SUV', 2020, 'White', 'D01-12-1234'),
('DEF-2468', 'Ford', 'Ranger', 'ENG-00345', 'CHAS-00345', 'Truck', 2019, 'Red', 'D01-12-1234'),
('GHI-1357', 'Mitsubishi', 'Montero', 'ENG-00456', 'CHAS-00456', 'SUV', 2021, 'Silver', 'D02-13-2345'),
('JKL-1122', 'Honda', 'Civic', 'ENG-00567', 'CHAS-00567', 'Sedan', 2017, 'Black', 'D02-13-2345'),
('MNO-3344', 'Hyundai', 'Tucson', 'ENG-00678', 'CHAS-00678', 'SUV', 2022, 'Blue', 'D03-14-3456'),
('PQR-5566', 'Suzuki', 'Swift', 'ENG-00789', 'CHAS-00789', 'Hatchback', 2015, 'Yellow', 'D04-15-4567'),
('STU-7788', 'Kia', 'Rio', 'ENG-00890', 'CHAS-00890', 'Sedan', 2016, 'Green', 'D04-15-4567'),
('VWX-9900', 'Chevrolet', 'Trailblazer', 'ENG-00901', 'CHAS-00901', 'SUV', 2018, 'Gray', 'D05-16-5678'),
('YZA-0011', 'Audi', 'R8', 'ENG-01012', 'CHAS-01012', 'Coupe', 2023, 'Red', 'D06-17-6789'),
('BCD-2233', 'BMW', 'X5', 'ENG-01123', 'CHAS-01123', 'SUV', 2022, 'White', 'D07-18-7890'),
('EFG-3344', 'BMW', 'M3', 'ENG-01234', 'CHAS-01234', 'Sedan', 2020, 'Blue', 'D07-18-7890'),
('NNN-4455', 'Nissan', 'Urvan', 'ENG-01345', 'CHAS-01345', 'Van', 2019, 'White', 'D08-19-8901'),
('MZD-6677', 'Mazda', '3', 'ENG-01456', 'CHAS-01456', 'Sedan', 2021, 'Red', 'D09-20-9012'),
('SBB-8899', 'Subaru', 'Crosstrek', 'ENG-01567', 'CHAS-01567', 'SUV', 2023, 'Orange', 'D09-20-9012'),
('MRZ-1100', 'Mercedes', 'S-Class', 'ENG-01678', 'CHAS-01678', 'Sedan', 2023, 'Black', 'D10-21-0123'),
('PRC-9988', 'Porsche', '911', 'ENG-01789', 'CHAS-01789', 'Coupe', 2022, 'Silver', 'D10-21-0123');

INSERT INTO vehicle_registration (registration_number, plate_number, registration_date, registration_status) VALUES
('REG-2026-001', 'ABC-1234',  '2026-03-10', 'Active'),
('REG-2025-002', 'XYZ-9876',  '2025-08-20', 'Active'),
('REG-2026-003', 'GHI-1357',  '2026-01-15', 'Active'),
('REG-2025-004', 'JKL-1122',  '2025-06-30', 'Active'),
('REG-2026-005', 'MNO-3344',  '2026-02-10', 'Active'),
('REG-2025-006', 'STU-7788',  '2025-09-05', 'Active'),
('REG-2023-007', 'PQR-5566',  '2023-04-18', 'Expired'),
('REG-2022-008', 'VWX-9900',  '2022-11-30', 'Expired'),
('REG-2024-009', 'YZA-0011',  '2024-07-22', 'Expired'),
('REG-2024-010', 'DEF-2468',  '2024-05-14', 'Suspended');

-- uovr number format: [M/G/D/B][YY]-[7-digit sequential]-[1-digit checksum] M=Manila, G=GMA, D=Davao, B=Baguio. checksum is mod 10 of the sequential number. sequential numbers are unique across all regions and reset every year.
INSERT INTO traffic_violation (
    uovr_number, violation_status, violation_location_city,
    violation_location_region, violation_date, fine_amount,
    payment_status, license_number, plate_number, registration_number) VALUES
('M20-0000001-1', 'Resolved',  'Manila',       'NCR',        '2020-03-15', 1000.00, 'Paid',   'D01-12-1234', 'ABC-1234', 'REG-2026-001'),
('M21-0000002-2', 'Resolved',  'Makati',       'NCR',        '2021-07-22',  500.00, 'Paid',   'D01-12-1234', 'XYZ-9876', 'REG-2025-002'),
('M22-0000003-3', 'Dismissed', 'Quezon City',  'NCR',        '2022-02-10', 2000.00, 'Waived', 'D01-12-1234', 'DEF-2468', 'REG-2024-010'),
('M21-0000004-4', 'Resolved',  'Pasig',        'NCR',        '2021-11-30', 1500.00, 'Paid',   'D02-13-2345', 'GHI-1357', 'REG-2026-003'),
('G22-0000005-5', 'Resolved',  'Cebu City',    'Region VII', '2022-05-18', 2500.00, 'Paid',   'D02-13-2345', 'JKL-1122', 'REG-2025-004'),
('D22-0000006-6', 'Contested', 'Davao City',   'Region XI',  '2022-09-04', 1000.00, 'Unpaid', 'D03-14-3456', 'MNO-3344', 'REG-2026-005'),
('B23-0000007-7', 'Pending',   'Baguio City',  'CAR',        '2023-01-19', 3000.00, 'Unpaid', 'D04-15-4567', 'PQR-5566', 'REG-2023-007'),
('M23-0000008-8', 'Resolved',  'Taguig',       'NCR',        '2023-09-25', 1000.00, 'Paid',   'D04-15-4567', 'STU-7788', 'REG-2025-006'),
('F20-0000009-9', 'Resolved',  'Iloilo City',  'Region VI',  '2020-06-11', 2000.00, 'Paid',   'D05-16-5678', 'VWX-9900', 'REG-2022-008'),
('M24-0000010-0', 'Pending',   'Mandaluyong',  'NCR',        '2024-02-07',  500.00, 'Unpaid', 'D06-17-6789', 'YZA-0011', 'REG-2024-009');
 
INSERT INTO violation_type (uovr_number, violation_type) VALUES
-- M20-0000001-1 has 2 violations
('M20-0000001-1', 'Over speeding'),
('M20-0000001-1', 'Reckless driving'),
 
-- M21-0000002-2 has 1 violation
('M21-0000002-2', 'Illegal parking'),
 
-- M22-0000003-3 has 2 violations
('M22-0000003-3', 'Expired drivers license'),
('M22-0000003-3', 'No drivers license'),
 
-- M21-0000004-4 has 1 violation
('M21-0000004-4', 'Disregarding traffic sign/signal'),
 
-- G22-0000005-5 has 3 violations
('G22-0000005-5', 'Reckless driving'),
('G22-0000005-5', 'No seatbelt'),
('G22-0000005-5', 'Disobedience to traffic officer'),
 
-- D22-0000006-6 has 1 violation
('D22-0000006-6', 'No seatbelt'),
 
-- B23-0000007-7 has 2 violations
('B23-0000007-7', 'Disobedience to traffic officer'),
('B23-0000007-7', 'Obstruction to traffic'),
 
-- M23-0000008-8 has 1 violation
('M23-0000008-8', 'Over speeding'),
 
-- F20-0000009-9 has 1 violation
('F20-0000009-9', 'Expired drivers license'),
 
-- M24-0000010-0 has 2 violations
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
 
 
-- View all traffic violations committed by a given driver within a specified date range.

 
-- View the total number of violations per violation type for a given year.

 
-- View all vehicles involved in violations within a given city or region.


-- View all vehicles of each driver
SELECT d.license_number, CONCAT(d.first_name, ' ', d.last_name) AS full_name, 
v.plate_number, v.make, v.model, v.year, v.vehicle_type 
FROM driver d LEFT JOIN vehicle v on d.license_number = v.owner_license_number
ORDER BY d.license_number; 
