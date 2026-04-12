CREATE TABLE driver (
    license_number VARCHAR(11) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    birth_date DATE NOT NULL,
    age INT as TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) NOT NULL,
    sex CHAR(1) NOT NULL,
    address VARCHAR(255) NOT NULL,
    license_type VARCHAR(20) NOT NULL,
    license_status VARCHAR(20) NOT NULL,
    license_issue_date DATE NOT NULL,
    license_expiry_date DATE as DATE_ADD(birth_date, INTERVAL 5 YEAR) NOT NULL,
    PRIMARY KEY (license_number)
)

CREATE TABLE vehicle (
    plate_number VARCHAR(10) NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    engine_number VARCHAR(20) NOT NULL,
    chassis_number VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    color VARCHAR(20) NOT NULL,
    owner_license_number VARCHAR(11) NOT NULL,
    PRIMARY KEY (plate_number),
    FOREIGN KEY (owner_license_number) REFERENCES driver(license_number)
)

CREATE TABLE vehicle_registration (
    registration_number VARCHAR(20) NOT NULL,
    plate_number VARCHAR(10) NOT NULL,
    registration_date DATE NOT NULL,
    expiration_date DATE as DATE_ADD(registration_date, INTERVAL 1 YEAR) NOT NULL,
    registration_status VARCHAR(20) NOT NULL,
    PRIMARY KEY (registration_number),
    FOREIGN KEY (plate_number) REFERENCES vehicle(plate_number)
)

CREATE TABLE traffic_violation (
    uovr_number VARCHAR(20) NOT NULL,
    violation_status VARCHAR(20) NOT NULL,
    vehicle_registration_number VARCHAR(20) NOT NULL,
    violation_type VARCHAR(50) NOT NULL,
    violation_location_city VARCHAR(20) NOT NULL,
    violation_location_region VARCHAR(20) NOT NULL,
    violation_day DATE NOT NULL,
    violation_month DATE NOT NULL,
    violation_year DATE NOT NULL,
    fine_amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    PRIMARY KEY (uovr_number),
    FOREIGN KEY (vehicle_registration_number) REFERENCES vehicle_registration(registration_number)
)

create TABLE violation_type (
    uovr_number VARCHAR(20),
    violation_type VARCHAR(50) NOT NULL,
    PRIMARY KEY (violation_type, uovr_number),
    FOREIGN KEY (uovr_number) REFERENCES traffic_violation(uovr_number)
)