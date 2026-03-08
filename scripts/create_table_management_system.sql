-- Restaurant Tables Management System
-- Stores physical table definitions with position for the visual map

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE,
  capacity INT DEFAULT 4,
  shape ENUM('square', 'round', 'rectangle') DEFAULT 'square',
  x FLOAT DEFAULT 0,
  y FLOAT DEFAULT 0,
  width FLOAT DEFAULT 80,
  height FLOAT DEFAULT 80,
  rotation FLOAT DEFAULT 0,
  zone VARCHAR(64) DEFAULT 'Principal',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
