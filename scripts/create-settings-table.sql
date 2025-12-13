-- Tabla para configuraciones del sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar configuraciones de Mercado Pago
INSERT INTO system_settings (setting_key, setting_value, description, is_encrypted) VALUES
('mercadopago_public_key', '', 'Mercado Pago Public Key', FALSE),
('mercadopago_access_token', '', 'Mercado Pago Access Token', TRUE),
('mercadopago_enabled', 'false', 'Habilitar pagos con Mercado Pago', FALSE)
ON DUPLICATE KEY UPDATE setting_key = setting_key;
