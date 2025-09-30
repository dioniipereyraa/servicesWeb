const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
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
    
    // Obtener gastos
    const [gastos] = await connection.execute('SELECT * FROM gastos ORDER BY fecha DESC');
    
    // Obtener clientes
    const [clientes] = await connection.execute('SELECT * FROM clientes ORDER BY id DESC');
    
    // Calcular totales
    const [totalGastos] = await connection.execute('SELECT SUM(monto) as total FROM gastos');
    const [totalIngresos] = await connection.execute('SELECT SUM(montoCobrado) as total FROM clientes');
    
    await connection.end();
    
    res.render('dashboard', {
      gastos,
      clientes,
      totalGastos: totalGastos[0].total || 0,
      totalIngresos: totalIngresos[0].total || 0
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
    const { nombre, servicio, montoCobrado } = req.body;
    const connection = await connectDB();
    
    await connection.execute(
      'INSERT INTO clientes (nombre, servicio, montoCobrado) VALUES (?, ?, ?)',
      [nombre, servicio, montoCobrado]
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});