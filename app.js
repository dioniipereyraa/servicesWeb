const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de multer para uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads/logos');
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + extension);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: function (req, file, cb) {
    // Aceptar solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// Configuración de middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Servir archivos subidos
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuración de la base de datos
const dbConfig = {
  host: 'mysql',
  user: 'ppuser',
  password: 'pppass123',
  database: 'ppgarageGastos',
  port: 3306
};

// Función para conectar a la base de datos
async function connectDB() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error('Error conectando a la base de datos:', error);
    throw error;
  }
}

// Ruta principal - Dashboard
app.get('/', async (req, res) => {
  try {
    const connection = await connectDB();
    
    // Obtener parámetros de filtros y ordenamiento
    const { fechaDesde, fechaHasta, ordenGastos, ordenClientes } = req.query;
    
    // Construir query para gastos (solo activos)
    let gastosQuery = 'SELECT * FROM gastos WHERE estado = "activo"';
    let gastosParams = [];
    let whereConditions = [];
    
    if (fechaDesde) {
      whereConditions.push('fecha >= ?');
      gastosParams.push(fechaDesde);
    }
    
    if (fechaHasta) {
      whereConditions.push('fecha <= ?');
      gastosParams.push(fechaHasta);
    }
    
    if (whereConditions.length > 0) {
      gastosQuery += ' AND ' + whereConditions.join(' AND ');
    }
    
    // Agregar ordenamiento para gastos
    if (ordenGastos === 'monto_desc') {
      gastosQuery += ' ORDER BY monto DESC';
    } else if (ordenGastos === 'monto_asc') {
      gastosQuery += ' ORDER BY monto ASC';
    } else {
      gastosQuery += ' ORDER BY fecha DESC';
    }
    
    // Construir query para clientes
    let clientesQuery = 'SELECT * FROM clientes';
    
    // Agregar ordenamiento para clientes
    if (ordenClientes === 'monto_desc') {
      clientesQuery += ' ORDER BY montoCobrado DESC';
    } else if (ordenClientes === 'monto_asc') {
      clientesQuery += ' ORDER BY montoCobrado ASC';
    } else {
      clientesQuery += ' ORDER BY id DESC';
    }
    
    // Ejecutar consultas
    const [gastos] = await connection.execute(gastosQuery, gastosParams);
    const [clientes] = await connection.execute(clientesQuery);
    
    // Obtener productos dados de baja con estadísticas de rendimiento
    const [productosTerminados] = await connection.execute(`
      SELECT 
        id, descripcion, monto, lavados_realizados, observaciones, fecha_baja,
        CASE 
          WHEN lavados_realizados > 0 THEN ROUND(monto / lavados_realizados, 2)
          ELSE 0 
        END as costo_por_lavado
      FROM gastos 
      WHERE estado = 'terminado' 
      ORDER BY fecha_baja DESC
    `);
    
    // Obtener máquinas
    const [maquinas] = await connection.execute('SELECT * FROM gastos_maquinas ORDER BY fecha_creacion DESC');
    
    // Obtener precios de servicios
    const [preciosServicios] = await connection.execute('SELECT * FROM precios_servicios WHERE activo = TRUE ORDER BY nombre_servicio');
    
    // Calcular totales (siempre con todos los datos, sin filtros)
    const [totalGastos] = await connection.execute('SELECT SUM(monto) as total FROM gastos WHERE estado = "activo"');
    const [totalMaquinas] = await connection.execute('SELECT SUM(precio) as total FROM gastos_maquinas');
    const [totalIngresos] = await connection.execute('SELECT SUM(montoCobrado) as total FROM clientes');
    
    await connection.end();
    
    res.render('dashboard', {
      gastos,
      clientes,
      productosTerminados,
      maquinas,
      preciosServicios,
      totalGastos: totalGastos[0].total || 0,
      totalMaquinas: totalMaquinas[0].total || 0,
      totalIngresos: totalIngresos[0].total || 0,
      filtros: { fechaDesde, fechaHasta, ordenGastos, ordenClientes }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error del servidor');
  }
});

// Ruta para agregar gasto
app.post('/agregar-gasto', async (req, res) => {
  try {
    const { descripcion, monto, cantidadEnLts, fecha } = req.body;
    const connection = await connectDB();
    
    await connection.execute(
      'INSERT INTO gastos (descripcion, monto, cantidadEnLts, fecha) VALUES (?, ?, ?, ?)',
      [descripcion, monto, cantidadEnLts, fecha]
    );
    
    await connection.end();
    res.redirect('/');
  } catch (error) {
    console.error('Error agregando gasto:', error);
    res.status(500).send('Error agregando gasto');
  }
});

// Ruta para agregar cliente
app.post('/agregar-cliente', async (req, res) => {
  try {
    const { nombre, servicio, montoCobrado, tipo_tratamiento, fecha_ultimo_tratamiento, frecuencia_recomendada, notas_tratamiento } = req.body;
    const connection = await connectDB();
    
    await connection.execute(
      'INSERT INTO clientes (nombre, servicio, montoCobrado, tipo_tratamiento, fecha_ultimo_tratamiento, frecuencia_recomendada, notas_tratamiento) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, servicio, montoCobrado, tipo_tratamiento || 'basico', fecha_ultimo_tratamiento || null, frecuencia_recomendada || 30, notas_tratamiento || null]
    );
    
    await connection.end();
    res.redirect('/');
  } catch (error) {
    console.error('Error agregando cliente:', error);
    res.status(500).send('Error agregando cliente');
  }
});

// Ruta para eliminar gasto
app.delete('/gastos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();
    
    await connection.execute('DELETE FROM gastos WHERE id = ?', [id]);
    
    await connection.end();
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando gasto:', error);
    res.status(500).json({ error: 'Error eliminando gasto' });
  }
});

// Ruta para eliminar cliente
app.delete('/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();
    
    await connection.execute('DELETE FROM clientes WHERE id = ?', [id]);
    
    await connection.end();
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({ error: 'Error eliminando cliente' });
  }
});

// Ruta para eliminar producto terminado
app.delete('/productos-terminados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();
    
    // Solo eliminar productos que estén marcados como terminados
    await connection.execute('DELETE FROM gastos WHERE id = ? AND estado = "terminado"', [id]);
    
    await connection.end();
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando producto terminado:', error);
    res.status(500).json({ error: 'Error eliminando producto terminado' });
  }
});

// Ruta para dar de baja producto
app.post('/dar-baja-producto', async (req, res) => {
  try {
    const { id, lavados_realizados, observaciones } = req.body;
    const connection = await connectDB();
    
    // Validar y limpiar datos
    const lavadosRealizado = parseInt(lavados_realizados) || 0;
    const observacionesLimpias = observaciones?.trim() || null;
    
    // Primero obtener el monto del producto para calcular costo por lavado
    const [productos] = await connection.execute('SELECT monto FROM gastos WHERE id = ?', [id]);
    
    if (productos.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    const monto = productos[0].monto;
    const costo_por_lavado = lavadosRealizado > 0 ? (monto / lavadosRealizado) : 0;
    
    // Actualizar el producto a estado 'terminado'
    await connection.execute(
      'UPDATE gastos SET estado = ?, lavados_realizados = ?, observaciones = ?, fecha_baja = CURDATE() WHERE id = ?',
      ['terminado', lavadosRealizado, observacionesLimpias, id]
    );
    
    await connection.end();
    res.json({ 
      success: true, 
      costo_por_lavado: costo_por_lavado.toFixed(2),
      message: `Producto dado de baja. Costo por lavado: $${costo_por_lavado.toFixed(2)}`
    });
  } catch (error) {
    console.error('Error dando de baja producto:', error);
    res.status(500).json({ error: 'Error dando de baja producto' });
  }
});

// Ruta para agregar máquina
app.post('/maquinas', async (req, res) => {
  try {
    const { nombre, marca, modelo, precio, fecha_compra, garantia_meses, estado, observaciones } = req.body;
    const connection = await connectDB();
    
    await connection.execute(
      'INSERT INTO gastos_maquinas (nombre, marca, modelo, precio, fecha_compra, garantia_meses, estado, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, marca || null, modelo || null, precio, fecha_compra, garantia_meses || null, estado, observaciones || null]
    );
    
    await connection.end();
    res.json({ success: true });
  } catch (error) {
    console.error('Error agregando máquina:', error);
    res.status(500).json({ error: 'Error agregando máquina' });
  }
});

// Ruta para eliminar máquina
app.delete('/maquinas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();
    
    await connection.execute('DELETE FROM gastos_maquinas WHERE id = ?', [id]);
    
    await connection.end();
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando máquina:', error);
    res.status(500).json({ error: 'Error eliminando máquina' });
  }
});

// Ruta para marcar tratamiento como realizado
app.post('/clientes/marcar-tratamiento', async (req, res) => {
  try {
    const { clienteId, fechaTratamiento } = req.body;
    const connection = await connectDB();
    
    await connection.execute(
      'UPDATE clientes SET fecha_ultimo_tratamiento = ? WHERE id = ?',
      [fechaTratamiento, clienteId]
    );
    
    await connection.end();
    res.json({ success: true });
  } catch (error) {
    console.error('Error marcando tratamiento:', error);
    res.status(500).json({ error: 'Error marcando tratamiento' });
  }
});

// Ruta para reagendar tratamiento
app.post('/clientes/reagendar-tratamiento', async (req, res) => {
  try {
    const { clienteId, fechaTratamiento } = req.body;
    const connection = await connectDB();
    
    await connection.execute(
      'UPDATE clientes SET fecha_ultimo_tratamiento = ? WHERE id = ?',
      [fechaTratamiento, clienteId]
    );
    
    await connection.end();
    res.json({ success: true });
  } catch (error) {
    console.error('Error reagendando tratamiento:', error);
    res.status(500).json({ error: 'Error reagendando tratamiento' });
  }
});

// Ruta para actualizar precio de servicio
app.post('/actualizar-precio', async (req, res) => {
  try {
    const { servicioId, nuevoPrecio } = req.body;
    const connection = await connectDB();
    
    await connection.execute(
      'UPDATE precios_servicios SET precio = ? WHERE id = ?',
      [nuevoPrecio, servicioId]
    );
    
    await connection.end();
    res.json({ success: true });
  } catch (error) {
    console.error('Error actualizando precio:', error);
    res.status(500).json({ error: 'Error actualizando precio' });
  }
});

// Ruta para agregar nuevo servicio
app.post('/agregar-servicio', async (req, res) => {
  try {
    const { nombre, precio, descripcion } = req.body;
    const connection = await connectDB();
    
    // Convertir nombre a formato de base de datos (snake_case)
    const nombreServicio = nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    await connection.execute(
      'INSERT INTO precios_servicios (nombre_servicio, precio, descripcion) VALUES (?, ?, ?)',
      [nombreServicio, precio, descripcion]
    );
    
    await connection.end();
    res.json({ success: true });
  } catch (error) {
    console.error('Error agregando servicio:', error);
    res.status(500).json({ error: 'Error agregando servicio' });
  }
});

// Ruta para editar servicio completo
app.put('/editar-servicio/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, descripcion } = req.body;
    const connection = await connectDB();
    
    // Verificar que el servicio existe
    const [servicioExistente] = await connection.execute('SELECT * FROM precios_servicios WHERE id = ?', [id]);
    
    if (servicioExistente.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    // Convertir nombre a formato de base de datos si se cambió
    const nombreServicio = nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    // Verificar que no existe otro servicio con el mismo nombre (excepto el actual)
    const [servicioConMismoNombre] = await connection.execute(
      'SELECT id FROM precios_servicios WHERE nombre_servicio = ? AND id != ?', 
      [nombreServicio, id]
    );
    
    if (servicioConMismoNombre.length > 0) {
      await connection.end();
      return res.status(400).json({ error: 'Ya existe un servicio con ese nombre' });
    }
    
    // Actualizar el servicio
    await connection.execute(
      'UPDATE precios_servicios SET nombre_servicio = ?, precio = ?, descripcion = ? WHERE id = ?',
      [nombreServicio, precio, descripcion, id]
    );
    
    await connection.end();
    res.json({ 
      success: true, 
      message: 'Servicio actualizado correctamente',
      servicio: {
        id: id,
        nombre_servicio: nombreServicio,
        precio: precio,
        descripcion: descripcion
      }
    });
  } catch (error) {
    console.error('Error editando servicio:', error);
    res.status(500).json({ error: 'Error editando servicio' });
  }
});

// Ruta para eliminar servicio
app.delete('/eliminar-servicio/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();
    
    // Verificar que el servicio existe antes de eliminarlo
    const [servicio] = await connection.execute('SELECT nombre_servicio FROM precios_servicios WHERE id = ?', [id]);
    
    if (servicio.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    // Eliminar el servicio
    await connection.execute('DELETE FROM precios_servicios WHERE id = ?', [id]);
    
    await connection.end();
    res.json({ 
      success: true, 
      message: `Servicio "${servicio[0].nombre_servicio}" eliminado correctamente` 
    });
  } catch (error) {
    console.error('Error eliminando servicio:', error);
    res.status(500).json({ error: 'Error eliminando servicio' });
  }
});

// Ruta para obtener precios de servicios (para el presupuesto)
app.get('/api/precios-servicios', async (req, res) => {
  try {
    const connection = await connectDB();
    const [precios] = await connection.execute('SELECT * FROM precios_servicios WHERE activo = TRUE ORDER BY nombre_servicio');
    await connection.end();
    res.json(precios);
  } catch (error) {
    console.error('Error obteniendo precios:', error);
    res.status(500).json({ error: 'Error obteniendo precios' });
  }
});

// Rutas para configuración del PDF
app.get('/api/configuracion-pdf', async (req, res) => {
  try {
    const connection = await connectDB();
    const [config] = await connection.execute('SELECT * FROM configuracion_pdf WHERE id = 1');
    await connection.end();
    
    if (config.length > 0) {
      res.json(config[0]);
    } else {
      // Si no existe configuración, crear una por defecto
      res.json({
        nombre_empresa: 'PPGarage - Car Detailing',
        direccion_empresa: 'Tu Dirección, Ciudad',
        telefono_empresa: '+54 11 1234-5678',
        email_empresa: 'contacto@ppgarage.com',
        encabezado_presupuesto: 'Presupuesto de Servicios de Car Detailing',
        descripcion_empresa: 'Especialistas en cuidado automotriz.',
        terminos_condiciones: 'Términos y Condiciones:\n• El presupuesto tiene validez por los días indicados\n• Los precios incluyen materiales y mano de obra',
        pie_pagina: 'Gracias por confiar en PPGarage',
        validez_dias: 15,
        color_primario: '#2980b9',
        color_secundario: '#34495e',
        logo_url: null,
        mostrar_logo: false
      });
    }
  } catch (error) {
    console.error('Error obteniendo configuración PDF:', error);
    res.status(500).json({ error: 'Error obteniendo configuración' });
  }
});

app.put('/api/configuracion-pdf', async (req, res) => {
  try {
    const {
      nombre_empresa,
      direccion_empresa,
      telefono_empresa,
      email_empresa,
      encabezado_presupuesto,
      descripcion_empresa,
      terminos_condiciones,
      pie_pagina,
      validez_dias,
      color_primario,
      color_secundario,
      logo_url,
      mostrar_logo
    } = req.body;

    const connection = await connectDB();
    
    // Verificar si existe configuración
    const [existing] = await connection.execute('SELECT id FROM configuracion_pdf WHERE id = 1');
    
    if (existing.length > 0) {
      // Actualizar configuración existente
      await connection.execute(`
        UPDATE configuracion_pdf SET 
        nombre_empresa = ?, direccion_empresa = ?, telefono_empresa = ?, email_empresa = ?,
        encabezado_presupuesto = ?, descripcion_empresa = ?, terminos_condiciones = ?, 
        pie_pagina = ?, validez_dias = ?, color_primario = ?, color_secundario = ?, 
        logo_url = ?, mostrar_logo = ?
        WHERE id = 1
      `, [nombre_empresa, direccion_empresa, telefono_empresa, email_empresa, 
          encabezado_presupuesto, descripcion_empresa, terminos_condiciones, pie_pagina, validez_dias,
          color_primario, color_secundario, logo_url, mostrar_logo]);
    } else {
      // Crear nueva configuración
      await connection.execute(`
        INSERT INTO configuracion_pdf 
        (id, nombre_empresa, direccion_empresa, telefono_empresa, email_empresa,
         encabezado_presupuesto, descripcion_empresa, terminos_condiciones, pie_pagina, validez_dias,
         color_primario, color_secundario, logo_url, mostrar_logo)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [nombre_empresa, direccion_empresa, telefono_empresa, email_empresa, 
          encabezado_presupuesto, descripcion_empresa, terminos_condiciones, pie_pagina, validez_dias,
          color_primario, color_secundario, logo_url, mostrar_logo]);
    }
    
    await connection.end();
    res.json({ message: 'Configuración actualizada correctamente' });
  } catch (error) {
    console.error('Error actualizando configuración PDF:', error);
    res.status(500).json({ error: 'Error actualizando configuración' });
  }
});

// Ruta para subir logo
app.post('/api/upload-logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }
    
    // Generar URL del logo
    const logoUrl = `/uploads/logos/${req.file.filename}`;
    
    // Actualizar configuración con el nuevo logo
    const connection = await connectDB();
    await connection.execute(`
      UPDATE configuracion_pdf SET 
      logo_url = ?, mostrar_logo = TRUE
      WHERE id = 1
    `, [logoUrl]);
    await connection.end();
    
    res.json({ 
      message: 'Logo subido correctamente',
      logoUrl: logoUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error subiendo logo:', error);
    res.status(500).json({ error: 'Error subiendo logo' });
  }
});

// Ruta para eliminar logo
app.delete('/api/delete-logo', async (req, res) => {
  try {
    // Obtener la configuración actual para saber qué archivo eliminar
    const connection = await connectDB();
    const [config] = await connection.execute('SELECT logo_url FROM configuracion_pdf WHERE id = 1');
    
    if (config.length > 0 && config[0].logo_url) {
      const logoPath = path.join(__dirname, config[0].logo_url);
      
      // Eliminar archivo físico si existe
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }
    
    // Actualizar configuración para quitar el logo
    await connection.execute(`
      UPDATE configuracion_pdf SET 
      logo_url = NULL, mostrar_logo = FALSE
      WHERE id = 1
    `);
    await connection.end();
    
    res.json({ message: 'Logo eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando logo:', error);
    res.status(500).json({ error: 'Error eliminando logo' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});