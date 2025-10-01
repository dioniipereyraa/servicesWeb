-- Agregar campos para personalización visual del PDF
USE ppgarageGastos;

-- Agregar columnas para colores y logo
ALTER TABLE configuracion_pdf 
ADD COLUMN color_primario VARCHAR(7) DEFAULT '#2980b9' COMMENT 'Color principal en formato hex',
ADD COLUMN color_secundario VARCHAR(7) DEFAULT '#34495e' COMMENT 'Color secundario en formato hex',
ADD COLUMN logo_url VARCHAR(500) DEFAULT NULL COMMENT 'URL o ruta del logo de la empresa',
ADD COLUMN mostrar_logo BOOLEAN DEFAULT FALSE COMMENT 'Si mostrar o no el logo en el PDF';

-- Actualizar registro existente con colores por defecto
UPDATE configuracion_pdf SET 
    color_primario = '#2980b9',
    color_secundario = '#34495e',
    mostrar_logo = FALSE
WHERE id = 1;