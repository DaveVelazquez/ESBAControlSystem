-- Create Admin User for Testing
-- Password: admin123 (hashed with bcrypt)

INSERT INTO users (
    id,
    email,
    password_hash,
    name,
    phone,
    role,
    active,
    created_at,
    updated_at
) VALUES (
    uuid_generate_v4(),
    'admin@fieldservice.com',
    '$2a$10$CpHihlCfxrdr4lVByDWKaeRUNi/IACrpgXTLkok4f9nMPPFF2V0A2', -- admin123 (bcryptjs hash)
    'Administrator',
    '+1234567890',
    'admin',
    true,
    NOW(),
    NOW()
);

-- Create a test technician
INSERT INTO users (
    id,
    email,
    password_hash,
    name,
    phone,
    role,
    active,
    created_at,
    updated_at
) VALUES (
    uuid_generate_v4(),
    'tech@fieldservice.com',
    '$2a$10$CpHihlCfxrdr4lVByDWKaeRUNi/IACrpgXTLkok4f9nMPPFF2V0A2', -- admin123 (bcryptjs hash)
    'John Technician',
    '+1234567891',
    'technician',
    true,
    NOW(),
    NOW()
);

-- Create a test dispatcher
INSERT INTO users (
    id,
    email,
    password_hash,
    name,
    phone,
    role,
    active,
    created_at,
    updated_at
) VALUES (
    uuid_generate_v4(),
    'dispatcher@fieldservice.com',
    '$2a$10$CpHihlCfxrdr4lVByDWKaeRUNi/IACrpgXTLkok4f9nMPPFF2V0A2', -- admin123 (bcryptjs hash)
    'Jane Dispatcher',
    '+1234567892',
    'dispatcher',
    true,
    NOW(),
    NOW()
);

SELECT 'Users created successfully!' as message;
SELECT email, name, role FROM users;
