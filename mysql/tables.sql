CREATE DATABASE OPRS;
USE OPRS;

CREATE TABLE user(
    user_id SERIAL PRIMARY KEY,
	full_name VARCHAR(100) NOT NULL,
	gender VARCHAR(6) NOT NULL,
	phone_number VARCHAR(20) NOT NULL,
    date_of_birth VARCHAR(64) NOT NULL,
	email VARCHAR(128) NOT NULL,
    zone VARCHAR(64) NOT NULL,
	woreda VARCHAR(64) NOT NULL,
	date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	account_status INTEGER DEFAULT 2000,
	region VARCHAR(64) NOT NULL,
    job_type VARCHAR(64) NOT NULL,
    id_type VARCHAR(64) NOT NULL,
    id_number VARCHAR(64) NOT NULL,
    citizenship VARCHAR(64) NOT NULL,
    id_photo_url TEXT NOT NULL,
    user_role INTEGER DEFAULT 1000,
	married BOOL NOT NULL
);

ALTER TABLE user ADD CONSTRAINT email_constraint UNIQUE(email);

CREATE TABLE user_auth(
	user_id BIGINT UNSIGNED PRIMARY KEY,
	auth_string VARCHAR(128) NOT NULL,
	foreign key (user_id) references user(user_id) on delete CASCADE on update CASCADE
);

CREATE TABLE sessions(
    session_id VARCHAR(128) NOT NULL PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    user_role INTEGER,
    user_agent TEXT NOT NULL,
    user_ip VARCHAR(64) NOT NULL DEFAULT 'UNDEFINED',
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id) on delete CASCADE on update CASCADE
);


CREATE TABLE verification_keys (
    verification_id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    verification_key INT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id) on delete CASCADE on update CASCADE
);

CREATE TABLE listing(
    listing_id SERIAL PRIMARY KEY,
    owner_id BIGINT UNSIGNED,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    sub_city VARCHAR(20) NOT NULL,
    woreda VARCHAR(20) NOT NULL,
    area_name VARCHAR(64) NOT NULL,
    latitude VARCHAR(200) NOT NULL,
    longitude VARCHAR(200) NOT NULL,
    price_per_duration DECIMAL(10,2) NOT NULL,
    payment_currency VARCHAR(10) NOT NULL,
    tax_responsibility VARCHAR(64) NOT NULL,
    building_name VARCHAR(64) NOT NULL,
    date_created VARCHAR(64) NOT NULL,
    furnished VARCHAR(10) NOT NULL,
    total_area_square_meter INTEGER NOT NULL,
    listing_status INTEGER NOT NULL DEFAULT 3000,
    distance_from_road_in_meters INTEGER DEFAULT 0,
    customer_service_desks INTEGER DEFAULT 0,
    lease_duration_days INTEGER DEFAULT 0,
    number_of_bathrooms INTEGER DEFAULT 0,
    number_of_bedrooms INTEGER DEFAULT 0,
    number_of_kitchens INTEGER DEFAULT 0,
    security_guards INTEGER DEFAULT 0,
    catering_rooms INTEGER DEFAULT 0,
    floor_number INTEGER DEFAULT 0,
    back_stages INTEGER DEFAULT 0,
    backrooms INTEGER DEFAULT 0,
    displays INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    storage_capacity_square_meter INTEGER DEFAULT 0,
    parking_capacity INTEGER DEFAULT 0,
    ceiling_height_in_meter INTEGER DEFAULT 0,
    number_of_floors INTEGER DEFAULT 0,
    loading_docks INTEGER DEFAULT 0,
    guest_capacity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE amenities(
    id SERIAL PRIMARY KEY,
    listing_id BIGINT UNSIGNED,
    name VARCHAR(64) NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES listing(listing_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE describing_terms(
    id SERIAL PRIMARY KEY,
    listing_id BIGINT UNSIGNED,
    term VARCHAR(64) NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES listing(listing_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE listing_photos(
    id SERIAL PRIMARY KEY,
    listing_id BIGINT UNSIGNED,
    url TEXT NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES listing(listing_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE user_photos(
    id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    url TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE contact_info(
    id SERIAL PRIMARY KEY,
    user_id	 BIGINT UNSIGNED,
    contact_name VARCHAR(64) NOT NULL,
    contact_address TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE reviews(
    review_id SERIAL PRIMARY KEY,
    author_id BIGINT UNSIGNED,
    author_name VARCHAR(64) NOT NULL,
    receiver_id BIGINT UNSIGNED,
    reviewed_listing_id BIGINT UNSIGNED,
    review_message TEXT NOT NULL,
    rating FLOAT NOT NULL,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receiver_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (author_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE payment_info(
    id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    sub_account_id VARCHAR(64) NOT NULL,
    account_number VARCHAR(64) NOT NULL,
    business_name VARCHAR(128) NOT NULL,
    account_owner_name VARCHAR(64) NOT NULL,
    bank_id VARCHAR(128) NOT NULL,
    bank_name VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE payment_reference(
    id SERIAL PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    owner_id BIGINT UNSIGNED NOT NULL,
    first_name VARCHAR(64),
    last_name VARCHAR(64),
    email VARCHAR(128),
    currency VARCHAR(10),
    amount DECIMAL(10,2),
    charge DECIMAL(10,2),
    mode VARCHAR(8),
    method VARCHAR(32),
    type VARCHAR(32),
    status VARCHAR(64),
    tx_ref VARCHAR(32) NOT NULL,
    reference VARCHAR(64),
    title VARCHAR(32),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE reservation(
    reservation_id SERIAL PRIMARY KEY,
    tenant_id BIGINT UNSIGNED,
    owner_id BIGINT UNSIGNED,
    listing_id BIGINT UNSIGNED,
    additional_message TEXT,
    status INTEGER DEFAULT 2000,
    selected_payment_method VARCHAR(64) NOT NULL,
    price_offer INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE stay_dates(
    id SERIAL PRIMARY KEY,
    reservation_id BIGINT UNSIGNED,
    stay_date DATETIME NOT NULL,
    FOREIGN KEY (reservation_id) REFERENCES reservation(reservation_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE agreement(
    agreement_id SERIAL PRIMARY KEY,
    tenant_id BIGINT UNSIGNED,
    owner_id BIGINT UNSIGNED,
    listing_id BIGINT UNSIGNED,    
    agreement_status INTEGER NOT NULL DEFAULT 3000,
    lease_start_date BIGINT UNSIGNED NOT NULL,
    lease_end_date BIGINT UNSIGNED NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE notification(
    notification_id SERIAL PRIMARY KEY,
    initiator_id BIGINT UNSIGNED,
    receiver_id BIGINT UNSIGNED,
    type VARCHAR(16) NOT NULL,
    title VARCHAR(32) NOT NULL,
    body TEXT NOT NULL,
    viewed BOOLEAN DEFAULT FALSE,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (initiator_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE passwords(
    id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    pass VARCHAR(32) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);