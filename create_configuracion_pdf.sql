-- Crear tabla para configuración del PDF de presupuestos
USE ppgarageGastos;

CREATE TABLE IF NOT EXISTS configuracion_pdf (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_empresa VARCHAR(255) DEFAULT 'PPGarage - Car Detailing',
    direccion_empresa VARCHAR(255) DEFAULT 'Tu Dirección, Ciudad',
    telefono_empresa VARCHAR(50) DEFAULT '+54 11 1234-5678',
    email_empresa VARCHAR(100) DEFAULT 'contacto@ppgarage.com',
    encabezado_presupuesto TEXT,
    descripcion_empresa TEXT,
    terminos_condiciones TEXT,
    pie_pagina TEXT,
    validez_dias INT DEFAULT 15,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar configuración por defecto
INSERT INTO configuracion_pdf (
    id, 
    encabezado_presupuesto, 
    descripcion_empresa, 
    terminos_condiciones, 
    pie_pagina
) VALUES (
    1,
    'Presupuesto de Servicios de Car Detailing',
    'Especialistas en cuidado automotriz con más de X años de experiencia.',
    'Términos y Condiciones:\n• El presupuesto tiene validez por los días indicados\n• Los precios incluyen materiales y mano de obra\n• Se requiere 50% de seña para iniciar el trabajo\n• Los trabajos se realizan con cita previa',
    'Gracias por confiar en PPGarage - Su vehículo en las mejores manos'
) ON DUPLICATE KEY UPDATE fecha_actualizacion = CURRENT_TIMESTAMP;