-- Crear tabla para gestión de precios de servicios
USE ppgarageGastos;

CREATE TABLE IF NOT EXISTS precios_servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_servicio VARCHAR(100) NOT NULL UNIQUE,
    precio DECIMAL(10,2) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar precios iniciales
INSERT INTO precios_servicios (nombre_servicio, precio, descripcion) VALUES
('lavado_basico', 1500.00, 'Lavado exterior básico con jabón y encerado ligero'),
('lavado_completo', 2500.00, 'Lavado completo exterior e interior básico'),
('encerado', 3500.00, 'Encerado profesional con ceras de alta calidad'),
('sellado', 5000.00, 'Sellado de pintura con protección cerámica'),
('limpieza_interior', 2000.00, 'Limpieza profunda del interior del vehículo'),
('limpieza_motor', 1500.00, 'Limpieza y desengrase del compartimiento del motor')
ON DUPLICATE KEY UPDATE precio = VALUES(precio);