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
    license_status ENUM('Valid', 'Expired', 'Suspended', 'Revoked') NOT NULL,
    license_issue_date DATE NOT NULL,
    license_expiry_date DATE NOT NULL,
    PRIMARY KEY (license_number)
);

CREATE VIEW v_driver AS
SELECT *, 
       TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) AS age 
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
    PRIMARY KEY (plate_number),
    FOREIGN KEY (owner_license_number) REFERENCES driver(license_number)
);

CREATE TABLE vehicle_registration (
    registration_number VARCHAR(20) NOT NULL,
    plate_number VARCHAR(10) NOT NULL,
    registration_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    registration_status ENUM('Active', 'Expired', 'Suspended') NOT NULL,
    PRIMARY KEY (registration_number),
    FOREIGN KEY (plate_number) REFERENCES vehicle(plate_number)
);

CREATE TABLE traffic_violation (
    uovr_number VARCHAR(20) NOT NULL,
    violation_status VARCHAR(20) NOT NULL,
    vehicle_registration_number VARCHAR(20) NOT NULL,
    violation_location_city VARCHAR(20) NOT NULL,
    violation_location_region VARCHAR(20) NOT NULL,
    violation_date DATE NOT NULL,
    fine_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(20) NOT NULL,
    PRIMARY KEY (uovr_number),
    FOREIGN KEY (vehicle_registration_number) REFERENCES vehicle_registration(registration_number)
);

CREATE TABLE violation_type (
    uovr_number VARCHAR(20),
    violation_type VARCHAR(50) NOT NULL,
    PRIMARY KEY (uovr_number, violation_type),
    FOREIGN KEY (uovr_number) REFERENCES traffic_violation(uovr_number)
);

INSERT INTO driver (license_number, first_name, last_name, middle_name, birth_date, sex, address, license_type, license_status, license_issue_date) VALUES
('D01-12-1234', 'John', 'Doe', 'Smith', '1985-06-15', 'M', '123 Maple St, Manila', 'Non-Professional', 'Active', '2020-05-10'),
('D02-13-2345', 'Jane', 'Austen', 'Rose', '1990-08-20', 'F', '456 Oak Ave, Makati', 'Professional', 'Active', '2019-11-22'),
('D03-14-3456', 'Michael', 'Jordan', 'Jeffrey', '1975-02-17', 'M', '789 Pine Rd, Pasig', 'Professional', 'Expired', '2015-03-14'),
('D04-15-4567', 'Sarah', 'Connor', 'Ann', '1988-12-05', 'F', '321 Elm St, Quezon City', 'Non-Professional', 'Active', '2021-07-01'),
('D05-16-5678', 'Bruce', 'Wayne', 'Thomas', '1982-10-24', 'M', '1007 Mountain Dr, Taguig', 'Professional', 'Suspended', '2018-01-15'),
('D06-17-6789', 'Clark', 'Kent', 'Joseph', '1992-04-18', 'M', '344 Clinton St, Manila', 'Non-Professional', 'Active', '2022-09-09'),
('D07-18-7890', 'Diana', 'Prince', 'Marie', '1987-03-22', 'F', '890 Amazon Way, Pasay', 'Professional', 'Active', '2017-06-30'),
('D08-19-8901', 'Peter', 'Parker', 'Benjamin', '1995-08-10', 'M', '20 Ingram St, Mandaluyong', 'Non-Professional', 'Active', '2023-02-14'),
('D09-20-9012', 'Natasha', 'Romanoff', 'Alianovna', '1984-11-22', 'F', '500 Russian Blvd, Taguig', 'Professional', 'Active', '2016-10-05'),
('D10-21-0123', 'Tony', 'Stark', 'Edward', '1970-05-29', 'M', '108 Malibu Point, Makati', 'Professional', 'Revoked', '2010-12-01');

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
('REG-2023-001', 'ABC-1234', '2023-01-10', 'Active'),
('REG-2023-002', 'XYZ-9876', '2023-02-15', 'Active'),
('REG-2022-003', 'DEF-2468', '2022-03-20', 'Expired'),
('REG-2023-004', 'GHI-1357', '2023-04-25', 'Active'),
('REG-2023-005', 'JKL-1122', '2023-05-30', 'Active'),
('REG-2023-006', 'MNO-3344', '2023-06-05', 'Active'),
('REG-2023-007', 'PQR-5566', '2023-07-10', 'Active'),
('REG-2023-008', 'STU-7788', '2023-08-15', 'Active'),
('REG-2021-009', 'VWX-9900', '2021-09-20', 'Expired'),
('REG-2023-010', 'YZA-0011', '2023-10-25', 'Active');

INSERT INTO traffic_violation (
    uovr_number, violation_status, vehicle_registration_number,
    violation_location_city, violation_location_region,
    violation_date, fine_amount, payment_status
) VALUES
('UOVR-1001', 'Pending', 'REG-2023-001', 'Manila', 'NCR', '2023-05-15', 1000.00, 'Unpaid'),
('UOVR-1002', 'Resolved', 'REG-2023-002', 'Makati', 'NCR', '2023-06-20', 500.00, 'Paid'),
('UOVR-1003', 'Pending', 'REG-2022-003', 'Quezon City', 'NCR', '2023-07-10', 2000.00, 'Unpaid'),
('UOVR-1004', 'Resolved', 'REG-2023-004', 'Pasig', 'NCR', '2023-08-05', 1500.00, 'Paid'),
('UOVR-1005', 'Pending', 'REG-2023-005', 'Cebu City', 'Region 7', '2023-09-12', 2500.00, 'Unpaid'),
('UOVR-1006', 'Resolved', 'REG-2023-006', 'Davao City', 'Region 11', '2023-10-01', 1000.00, 'Paid'),
('UOVR-1007', 'Pending', 'REG-2023-007', 'Baguio City', 'CAR', '2023-10-15', 3000.00, 'Unpaid'),
('UOVR-1008', 'Resolved', 'REG-2023-008', 'Taguig', 'NCR', '2023-11-20', 1000.00, 'Paid'),
('UOVR-1009', 'Pending', 'REG-2021-009', 'Iloilo City', 'Region 6', '2023-12-05', 2000.00, 'Unpaid'),
('UOVR-1010', 'Resolved', 'REG-2023-010', 'Mandaluyong', 'NCR', '2023-12-10', 500.00, 'Paid');

INSERT INTO violation_type (uovr_number, violation_type) VALUES
-- UOVR-1001 has 2 violations
('UOVR-1001', 'Speeding'),
('UOVR-1001', 'Reckless Driving'),

-- UOVR-1002 has 1 violation
('UOVR-1002', 'Illegal Parking'),

-- UOVR-1003 has 2 violations
('UOVR-1003', 'Expired Registration'),
('UOVR-1003', 'Driving Without License'),

-- UOVR-1004 has 1 violation
('UOVR-1004', 'Beating Red Light'),

-- UOVR-1005 has 3 violations
('UOVR-1005', 'Reckless Driving'),
('UOVR-1005', 'No Seatbelt'),
('UOVR-1005', 'Using Phone'),

-- UOVR-1006 has 1 violation
('UOVR-1006', 'No Seatbelt'),

-- UOVR-1007 has 2 violations
('UOVR-1007', 'Using Phone'),
('UOVR-1007', 'Swerving'),

-- UOVR-1008 has 1 violation
('UOVR-1008', 'Speeding'),

-- UOVR-1009 has 1 violation
('UOVR-1009', 'Expired Registration'),

-- UOVR-1010 has 2 violations
('UOVR-1010', 'Illegal Turn'),
('UOVR-1010', 'Failure to Yield');