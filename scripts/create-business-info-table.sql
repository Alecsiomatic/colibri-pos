-- Crear tabla para información empresarial
CREATE TABLE IF NOT EXISTS business_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT 'SUPER NOVA',
    slogan VARCHAR(255) DEFAULT 'Restaurante & Delivery',
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    instagram VARCHAR(100),
    facebook VARCHAR(100),
    whatsapp VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar datos por defecto
INSERT INTO business_info (
    name, slogan, address, phone, email, website, instagram, facebook, whatsapp
) VALUES (
    'SUPER NOVA',
    'Restaurante & Delivery',
    'Av. Principal #123, Col. Centro',
    '(555) 123-4567',
    'info@supernova.com',
    'www.supernova-delivery.com',
    '@SuperNovaRestaurante',
    '@SuperNovaOficial',
    '+52 555 123 4567'
) ON DUPLICATE KEY UPDATE id=id;