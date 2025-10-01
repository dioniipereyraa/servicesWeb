-- Actualización de la tabla gastos para agregar funcionalidad de rendimiento
use ppgarageGastos;

-- Agregar nuevas columnas a la tabla gastos
ALTER TABLE gastos 
ADD COLUMN estado ENUM('activo', 'terminado') DEFAULT 'activo',
ADD COLUMN lavados_realizados INT DEFAULT NULL,
ADD COLUMN observaciones TEXT DEFAULT NULL,
ADD COLUMN fecha_baja DATE DEFAULT NULL;