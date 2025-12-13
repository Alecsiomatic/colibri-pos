-- Agregar campos de OpenAI a la tabla business_info

USE delivery_management;

-- Agregar columnas para OpenAI
ALTER TABLE business_info 
ADD COLUMN openai_api_key VARCHAR(255) NULL,
ADD COLUMN openai_model VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
ADD COLUMN enable_ai_reports BOOLEAN DEFAULT FALSE;

-- Verificar la estructura actualizada
DESCRIBE business_info;