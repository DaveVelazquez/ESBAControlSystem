-- Migration: Create clients tables
-- Version: 1.0
-- Description: Add tables for client management module

-- 1. Clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    legal_name VARCHAR(200),
    email VARCHAR(150),
    phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Client contacts table
CREATE TABLE IF NOT EXISTS client_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    role VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Client locations table
CREATE TABLE IF NOT EXISTS client_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(300),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Client contracts table
CREATE TABLE IF NOT EXISTS client_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    contract_number VARCHAR(100),
    start_date DATE,
    end_date DATE,
    sla_response_time INT, -- minutes
    sla_resolution_time INT, -- minutes
    file_url TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Extend work_orders table
ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id),
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES client_locations(id),
ADD COLUMN IF NOT EXISTS sla_response_time INT,
ADD COLUMN IF NOT EXISTS sla_resolution_time INT,
ADD COLUMN IF NOT EXISTS sla_response_met BOOLEAN,
ADD COLUMN IF NOT EXISTS sla_resolution_met BOOLEAN;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_primary ON client_contacts(client_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_client_locations_client_id ON client_locations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_locations_default ON client_locations(client_id, is_default);
CREATE INDEX IF NOT EXISTS idx_client_contracts_client_id ON client_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contracts_dates ON client_contracts(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_client_id ON work_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_location_id ON work_orders(location_id);

-- Comments
COMMENT ON TABLE clients IS 'Main clients table';
COMMENT ON TABLE client_contacts IS 'Client contact persons';
COMMENT ON TABLE client_locations IS 'Client physical locations (branches, stores, etc)';
COMMENT ON TABLE client_contracts IS 'Client contracts and SLA agreements';
