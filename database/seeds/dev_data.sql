-- Seed data for development/testing
-- Run after 001_initial_schema.sql

-- Insert sample service types
INSERT INTO service_types (id, name, description, sla_hours, estimated_duration_minutes) VALUES
(uuid_generate_v4(), 'Installation', 'Equipment installation service', 4, 120),
(uuid_generate_v4(), 'Maintenance', 'Regular maintenance check', 24, 60),
(uuid_generate_v4(), 'Repair', 'Emergency repair service', 2, 90),
(uuid_generate_v4(), 'Inspection', 'Safety inspection', 48, 45);

-- Insert sample users (password: Test1234)
-- Password hash for 'Test1234'
INSERT INTO users (id, email, password_hash, name, phone, role, active) VALUES
(uuid_generate_v4(), 'admin@company.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW3JqhV7LqLm', 'Admin User', '+52-555-0001', 'admin', true),
(uuid_generate_v4(), 'dispatcher@company.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW3JqhV7LqLm', 'Maria Dispatcher', '+52-555-0002', 'dispatcher', true),
(uuid_generate_v4(), 'tech1@company.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW3JqhV7LqLm', 'Juan Técnico', '+52-555-1001', 'technician', true),
(uuid_generate_v4(), 'tech2@company.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW3JqhV7LqLm', 'Carlos Méndez', '+52-555-1002', 'technician', true),
(uuid_generate_v4(), 'tech3@company.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW3JqhV7LqLm', 'Ana López', '+52-555-1003', 'technician', true);

-- Create technician profiles
INSERT INTO technician_profiles (user_id, skills, availability_status, rating)
SELECT id, '{"electrical": true, "plumbing": false, "hvac": true}'::jsonb, 'available', 4.5
FROM users WHERE role = 'technician';

-- Insert sample clients
INSERT INTO clients (id, name, email, phone, address, contact_person) VALUES
(uuid_generate_v4(), 'TechCorp S.A.', 'contact@techcorp.com', '+52-555-2001', 'Av. Reforma 123, CDMX', 'Roberto Gómez'),
(uuid_generate_v4(), 'RetailMax', 'service@retailmax.com', '+52-555-2002', 'Calle Madero 456, Monterrey', 'Laura Martínez'),
(uuid_generate_v4(), 'FoodServices Inc', 'ops@foodservices.com', '+52-555-2003', 'Blvd. Juárez 789, Guadalajara', 'Pedro Sánchez'),
(uuid_generate_v4(), 'Healthcare Plus', 'facilities@healthplus.com', '+52-555-2004', 'Av. Universidad 321, Mérida', 'Sofia Ramírez');

-- Insert sample sites
INSERT INTO sites (client_id, name, address, latitude, longitude, check_in_radius) VALUES
((SELECT id FROM clients WHERE name = 'TechCorp S.A.'), 'TechCorp Main Office', 'Av. Reforma 123, CDMX', 19.4326, -99.1332, 100),
((SELECT id FROM clients WHERE name = 'RetailMax'), 'RetailMax Store #1', 'Calle Madero 456, Monterrey', 25.6866, -100.3161, 150),
((SELECT id FROM clients WHERE name = 'FoodServices Inc'), 'FoodServices Warehouse', 'Blvd. Juárez 789, Guadalajara', 20.6597, -103.3496, 100),
((SELECT id FROM clients WHERE name = 'Healthcare Plus'), 'Healthcare Clinic Central', 'Av. Universidad 321, Mérida', 20.9674, -89.5926, 80);

-- Insert sample orders
WITH tech_ids AS (
    SELECT id FROM users WHERE role = 'technician' ORDER BY name LIMIT 3
),
service_ids AS (
    SELECT id, name FROM service_types
),
site_ids AS (
    SELECT id FROM sites
)
INSERT INTO orders (
    order_number, client_id, site_id, service_type_id, assigned_technician_id,
    status, priority, scheduled_start, scheduled_end, sla_deadline, notes
)
SELECT 
    'ORD-' || LPAD((row_number() OVER ())::text, 6, '0'),
    s.client_id,
    s.id,
    (SELECT id FROM service_ids ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM tech_ids ORDER BY RANDOM() LIMIT 1),
    (ARRAY['pending', 'assigned', 'in_progress'])[floor(random() * 3 + 1)],
    (ARRAY['normal', 'high'])[floor(random() * 2 + 1)]::priority_enum,
    NOW() + (random() * INTERVAL '7 days'),
    NOW() + (random() * INTERVAL '7 days') + INTERVAL '2 hours',
    NOW() + (random() * INTERVAL '7 days') + INTERVAL '4 hours',
    'Sample order for testing'
FROM site_ids s
LIMIT 10;

-- Insert sample order events
INSERT INTO order_events (order_id, technician_id, event_type, notes)
SELECT 
    o.id,
    o.assigned_technician_id,
    'assigned',
    'Order assigned to technician'
FROM orders o
WHERE o.status IN ('assigned', 'in_progress');

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Seed data inserted successfully!';
    RAISE NOTICE 'Test credentials:';
    RAISE NOTICE '  Admin: admin@company.com / Test1234';
    RAISE NOTICE '  Dispatcher: dispatcher@company.com / Test1234';
    RAISE NOTICE '  Technician: tech1@company.com / Test1234';
END $$;
