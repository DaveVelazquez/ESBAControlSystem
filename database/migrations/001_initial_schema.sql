-- Field Service Management System - Initial Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- User roles enum
CREATE TYPE user_role_enum AS ENUM ('technician', 'dispatcher', 'admin');

-- Order status enum
CREATE TYPE order_status_enum AS ENUM (
  'pending', 'assigned', 'en_route', 'in_progress', 
  'completed', 'cancelled', 'on_hold'
);

-- Priority enum
CREATE TYPE priority_enum AS ENUM ('low', 'normal', 'high', 'urgent');

-- Event type enum
CREATE TYPE event_type_enum AS ENUM (
  'created', 'assigned', 'reassigned', 'accepted', 'rejected',
  'en_route', 'check_in', 'check_out', 'paused', 'resumed',
  'completed', 'cancelled', 'note', 'photo', 'signature'
);

-- Evidence type enum
CREATE TYPE evidence_type_enum AS ENUM ('photo', 'signature', 'document');

-- ============================================================================
-- USERS AND AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role user_role_enum NOT NULL,
    team_id UUID,
    zone_ids UUID[],
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);

-- ============================================================================
-- TECHNICIAN PROFILES
-- ============================================================================

CREATE TABLE technician_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skills JSONB,
    availability_status VARCHAR(50) DEFAULT 'available',
    max_concurrent_orders INTEGER DEFAULT 3,
    rating DECIMAL(3,2),
    total_completed_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tech_profiles_user_id ON technician_profiles(user_id);

-- ============================================================================
-- CLIENTS
-- ============================================================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    contact_person VARCHAR(255),
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_active ON clients(active);

-- ============================================================================
-- SITES
-- ============================================================================

CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    check_in_radius INTEGER DEFAULT 100, -- meters
    access_instructions TEXT,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sites_client_id ON sites(client_id);
CREATE INDEX idx_sites_location ON sites USING GIST (
    ST_MakePoint(longitude, latitude)::geography
);

-- ============================================================================
-- SERVICE TYPES
-- ============================================================================

CREATE TABLE service_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sla_hours INTEGER NOT NULL DEFAULT 4,
    estimated_duration_minutes INTEGER,
    required_skills JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ORDERS
-- ============================================================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id),
    site_id UUID REFERENCES sites(id),
    service_type_id UUID REFERENCES service_types(id),
    assigned_technician_id UUID REFERENCES users(id),
    created_by_id UUID REFERENCES users(id),
    
    status order_status_enum DEFAULT 'pending',
    priority priority_enum DEFAULT 'normal',
    
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    sla_deadline TIMESTAMP NOT NULL,
    
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    
    notes TEXT,
    customer_notes TEXT,
    internal_notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_technician ON orders(assigned_technician_id);
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_scheduled_start ON orders(scheduled_start);
CREATE INDEX idx_orders_sla_deadline ON orders(sla_deadline);

-- ============================================================================
-- ORDER EVENTS (Tracking/Audit)
-- ============================================================================

CREATE TABLE order_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES users(id),
    event_type event_type_enum NOT NULL,
    
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    accuracy_meters INTEGER,
    
    notes TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_events_order_id ON order_events(order_id);
CREATE INDEX idx_order_events_type ON order_events(event_type);
CREATE INDEX idx_order_events_created_at ON order_events(created_at);

-- ============================================================================
-- EVIDENCES
-- ============================================================================

CREATE TABLE evidences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    evidence_type evidence_type_enum NOT NULL,
    
    file_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    signature_data TEXT, -- SVG data for signatures
    
    notes TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_evidences_order_id ON evidences(order_id);
CREATE INDEX idx_evidences_type ON evidences(evidence_type);

-- ============================================================================
-- TECHNICIAN LOCATIONS (Real-time tracking)
-- ============================================================================

CREATE TABLE technician_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy_meters INTEGER,
    speed_kmh DECIMAL(5,2),
    heading DECIMAL(5,2),
    battery_level INTEGER,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tech_locations_technician ON technician_locations(technician_id);
CREATE INDEX idx_tech_locations_order ON technician_locations(order_id);
CREATE INDEX idx_tech_locations_created_at ON technician_locations(created_at);
CREATE INDEX idx_tech_locations_active ON technician_locations(is_active);

-- ============================================================================
-- TEAMS
-- ============================================================================

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manager_id UUID REFERENCES users(id),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ZONES
-- ============================================================================

CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    polygon GEOGRAPHY(POLYGON),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_technician_profiles_updated_at BEFORE UPDATE ON technician_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active orders with details
CREATE VIEW v_active_orders AS
SELECT 
    o.*,
    c.name as client_name,
    s.address as site_address,
    s.latitude as site_lat,
    s.longitude as site_lng,
    u.name as technician_name,
    st.name as service_type_name,
    CASE 
        WHEN o.sla_deadline < NOW() THEN 'overdue'
        WHEN o.sla_deadline < NOW() + INTERVAL '1 hour' THEN 'critical'
        WHEN o.sla_deadline < NOW() + INTERVAL '2 hours' THEN 'warning'
        ELSE 'ok'
    END as sla_status
FROM orders o
LEFT JOIN clients c ON o.client_id = c.id
LEFT JOIN sites s ON o.site_id = s.id
LEFT JOIN users u ON o.assigned_technician_id = u.id
LEFT JOIN service_types st ON o.service_type_id = st.id
WHERE o.status NOT IN ('completed', 'cancelled');

-- Technician performance
CREATE VIEW v_technician_performance AS
SELECT 
    u.id,
    u.name,
    COUNT(o.id) as total_orders,
    COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN o.actual_end <= o.sla_deadline THEN 1 END) as on_time_orders,
    ROUND(
        COUNT(CASE WHEN o.actual_end <= o.sla_deadline THEN 1 END)::NUMERIC / 
        NULLIF(COUNT(CASE WHEN o.status = 'completed' THEN 1 END), 0) * 100, 
        2
    ) as on_time_percentage
FROM users u
LEFT JOIN orders o ON o.assigned_technician_id = u.id
WHERE u.role = 'technician'
GROUP BY u.id, u.name;

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant permissions (adjust as needed)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database schema created successfully!';
END $$;
