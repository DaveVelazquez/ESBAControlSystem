-- Configuración inicial para Supabase PostgreSQL
-- Este archivo contiene las migraciones necesarias para configurar la base de datos

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Crear esquemas
CREATE SCHEMA IF NOT EXISTS public;

-- Tabla de usuarios (técnicos, despachadores, administradores)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'dispatcher', 'technician')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    profile_image_url VARCHAR(500),
    push_token VARCHAR(500),
    device_id VARCHAR(255)
);

-- Tabla de órdenes de trabajo
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    customer_name VARCHAR(200),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    service_address TEXT NOT NULL,
    service_location GEOGRAPHY(POINT, 4326),
    assigned_technician_id UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    sla_deadline TIMESTAMP WITH TIME ZONE,
    estimated_duration_minutes INTEGER DEFAULT 120,
    notes TEXT,
    service_type VARCHAR(100),
    equipment_needed TEXT[]
);

-- Tabla de check-ins
CREATE TABLE IF NOT EXISTS check_ins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES users(id),
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP WITH TIME ZONE,
    location GEOGRAPHY(POINT, 4326),
    check_in_address TEXT,
    check_out_address TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out', 'break', 'lunch'))
);

-- Tabla de evidencias
CREATE TABLE IF NOT EXISTS evidences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES users(id),
    evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('photo', 'video', 'document', 'signature')),
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    location GEOGRAPHY(POINT, 4326),
    metadata JSONB
);

-- Tabla de ubicaciones en tiempo real
CREATE TABLE IF NOT EXISTS location_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    technician_id UUID REFERENCES users(id),
    work_order_id UUID REFERENCES work_orders(id),
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    accuracy FLOAT,
    speed FLOAT,
    heading FLOAT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    battery_level INTEGER,
    is_moving BOOLEAN DEFAULT false
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success', 'order_assigned', 'order_updated', 'sla_warning')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Tabla de configuraciones del sistema
CREATE TABLE IF NOT EXISTS system_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar las consultas
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_technician ON work_orders(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_created_by ON work_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_work_orders_scheduled_date ON work_orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_location ON work_orders USING GIST(service_location);

CREATE INDEX IF NOT EXISTS idx_check_ins_work_order ON check_ins(work_order_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_technician ON check_ins(technician_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_time ON check_ins(check_in_time);

CREATE INDEX IF NOT EXISTS idx_evidences_work_order ON evidences(work_order_id);
CREATE INDEX IF NOT EXISTS idx_evidences_technician ON evidences(technician_id);
CREATE INDEX IF NOT EXISTS idx_evidences_type ON evidences(evidence_type);

CREATE INDEX IF NOT EXISTS idx_location_tracking_technician ON location_tracking(technician_id);
CREATE INDEX IF NOT EXISTS idx_location_tracking_timestamp ON location_tracking(timestamp);
CREATE INDEX IF NOT EXISTS idx_location_tracking_location ON location_tracking USING GIST(location);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar configuraciones del sistema por defecto
INSERT INTO system_config (key, value, description, data_type) VALUES
    ('default_sla_minutes', '240', 'Tiempo SLA por defecto en minutos', 'number'),
    ('sla_warning_threshold', '0.8', 'Umbral de advertencia SLA (80%)', 'number'),
    ('sla_critical_threshold', '0.95', 'Umbral crítico SLA (95%)', 'number'),
    ('max_check_in_distance_meters', '100', 'Distancia máxima para check-in en metros', 'number'),
    ('location_ping_interval_seconds', '120', 'Intervalo de ping de ubicación en segundos', 'number'),
    ('max_file_size_mb', '10', 'Tamaño máximo de archivo en MB', 'number'),
    ('allowed_file_types', '["image/jpeg","image/png","image/webp","application/pdf"]', 'Tipos de archivo permitidos', 'json')
ON CONFLICT (key) DO NOTHING;

-- Crear usuario administrador por defecto (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
    ('admin@fieldservice.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'System', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Función para limpiar ubicaciones antiguas (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_old_locations()
RETURNS void AS $$
BEGIN
    DELETE FROM location_tracking 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Función para obtener técnicos cercanos
CREATE OR REPLACE FUNCTION get_nearby_technicians(
    target_location GEOGRAPHY(POINT, 4326),
    radius_meters INTEGER DEFAULT 5000,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    technician_id UUID,
    first_name VARCHAR,
    last_name VARCHAR,
    distance_meters NUMERIC,
    last_location_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as technician_id,
        u.first_name,
        u.last_name,
        ST_Distance(lt.location, target_location)::NUMERIC as distance_meters,
        lt.timestamp as last_location_time
    FROM users u
    JOIN (
        SELECT DISTINCT ON (technician_id) 
            technician_id, 
            location, 
            timestamp
        FROM location_tracking 
        ORDER BY technician_id, timestamp DESC
    ) lt ON u.id = lt.technician_id
    WHERE 
        u.role = 'technician' 
        AND u.status = 'active'
        AND ST_DWithin(lt.location, target_location, radius_meters)
        AND lt.timestamp > CURRENT_TIMESTAMP - INTERVAL '1 hour'
    ORDER BY distance_meters
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Configurar RLS (Row Level Security) para Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de RLS (ajustar según necesidades específicas)
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Comentarios finales
COMMENT ON TABLE users IS 'Tabla de usuarios del sistema (técnicos, despachadores, administradores)';
COMMENT ON TABLE work_orders IS 'Órdenes de trabajo del sistema';
COMMENT ON TABLE check_ins IS 'Registro de check-ins de técnicos';
COMMENT ON TABLE evidences IS 'Evidencias fotográficas y documentales';
COMMENT ON TABLE location_tracking IS 'Seguimiento de ubicación en tiempo real';
COMMENT ON TABLE notifications IS 'Notificaciones del sistema';
COMMENT ON TABLE system_config IS 'Configuraciones del sistema';

-- Crear vistas útiles
CREATE OR REPLACE VIEW active_orders AS
SELECT 
    wo.*,
    u.first_name || ' ' || u.last_name as technician_name,
    creator.first_name || ' ' || creator.last_name as created_by_name
FROM work_orders wo
LEFT JOIN users u ON wo.assigned_technician_id = u.id
LEFT JOIN users creator ON wo.created_by = creator.id
WHERE wo.status IN ('pending', 'assigned', 'in_progress');

CREATE OR REPLACE VIEW order_summary AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
    AVG(CASE WHEN completed_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (completed_at - created_at))/3600 
    END) as avg_completion_hours
FROM work_orders
GROUP BY DATE(created_at)
ORDER BY date DESC;