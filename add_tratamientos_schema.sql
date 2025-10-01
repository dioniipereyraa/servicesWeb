-- Agregar campos para sistema de recordatorios de tratamientos
USE ppgarageGastos;

-- Agregar nuevas columnas a la tabla clientes
ALTER TABLE clientes 
ADD COLUMN tipo_tratamiento ENUM('basico', 'encerado', 'sellado', 'premium') DEFAULT 'basico',
ADD COLUMN fecha_ultimo_tratamiento DATE DEFAULT NULL,
ADD COLUMN frecuencia_recomendada INT DEFAULT 30 COMMENT 'Días entre tratamientos',
ADD COLUMN notas_tratamiento TEXT DEFAULT NULL;