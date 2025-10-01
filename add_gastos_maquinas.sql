-- Agregar tabla para gastos de máquinas
USE ppgarageGastos;

CREATE TABLE IF NOT EXISTS gastos_maquinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    precio DECIMAL(10,2) NOT NULL,
    fecha_compra DATE NOT NULL,
    garantia_meses INT DEFAULT NULL,
    estado ENUM('nueva', 'usada', 'mantenimiento', 'averiada', 'vendida') DEFAULT 'nueva',
    observaciones TEXT DEFAULT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);