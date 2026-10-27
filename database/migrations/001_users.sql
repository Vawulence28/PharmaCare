-- Enable pgcrypto for secure hashing if needed (bcrypt via Node.js is primary)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if re-running (caution: drops data)
DROP TABLE IF EXISTS dmi_sessions CASCADE;
DROP TABLE IF EXISTS dmi_users CASCADE;

-- 1. Users Table
CREATE TABLE dmi_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'STAFF')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sessions Table (Database-backed sessions for secure HTTP-only cookies)
CREATE TABLE dmi_sessions (
    sid VARCHAR(255) PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indexes for performance and security lookups
CREATE INDEX idx_dmi_users_username ON dmi_users(username);
CREATE INDEX idx_dmi_users_email ON dmi_users(email);
CREATE INDEX idx_dmi_sessions_expire ON dmi_sessions(expire);
