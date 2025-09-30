# PPGarage - Sistema de Gestión de Gastos e Ingresos

Una aplicación web personalizada para gestionar gastos y clientes de tu negocio de detailing automotriz.

## 🚀 ¿Qué es esto?

Es una aplicación web completa que te permite:
- Ver un dashboard con estadísticas de gastos e ingresos
- Agregar y eliminar gastos de productos
- Agregar y eliminar clientes y servicios
- Ver el balance total (ingresos - gastos)
- Todo en una interfaz moderna y fácil de usar

## 📁 Estructura del Proyecto

```
ppgarage/
├── app.js                 # Servidor principal de Node.js
├── package.json           # Dependencias y configuración de npm
├── Dockerfile            # Configuración para containerizar la app
├── docker-compose.yml    # Orquestación de servicios (MySQL + App Web)
├── ppdb.sql             # Script original de base de datos
├── init_tables.sql      # Script corregido para crear tablas
├── views/
│   └── dashboard.ejs    # Interfaz web (HTML con Bootstrap)
└── README.md           # Este archivo
```

## 🔧 Arquitectura Técnica

### 1. **app.js** - El Cerebro del Sistema
```javascript
// Esto es lo que hace cada parte:

// Configuración del servidor Express
const app = express();
app.set('view engine', 'ejs');  // Para renderizar HTML dinámico

// Configuración de MySQL
const dbConfig = {
  host: 'mysql',        // Nombre del contenedor MySQL
  user: 'ppuser',       // Usuario de la base de datos
  password: 'pppass123', // Contraseña
  database: 'ppgarageGastos'
};

// Rutas principales:
app.get('/')              // Página principal (dashboard)
app.post('/agregar-gasto') // Para agregar gastos
app.post('/agregar-cliente') // Para agregar clientes
app.delete('/gastos/:id')    // Para eliminar gastos
app.delete('/clientes/:id')  // Para eliminar clientes
```

**¿Cómo funciona?**
1. Cuando visitas la página, hace consultas SQL para obtener datos
2. Calcula totales automáticamente
3. Renderiza la página HTML con los datos
4. Cuando agregas algo, guarda en MySQL y recarga la página

### 2. **docker-compose.yml** - El Director de Orquesta
```yaml
services:
  mysql:              # Base de datos
    image: mysql:8.0  # Versión específica de MySQL
    ports: "3306:3306" # Puerto para acceso externo
    volumes:
      - mysql_data:/var/lib/mysql          # Persistencia de datos
      - ./ppdb.sql:/docker-entrypoint-initdb.d/  # Script inicial
    
  webapp:             # Tu aplicación web
    build: .          # Construye desde Dockerfile
    ports: "3000:3000" # Acceso en localhost:3000
    depends_on: mysql   # Espera que MySQL esté listo
```

**¿Por qué Docker?**
- ✅ Funciona igual en cualquier computadora
- ✅ No necesitas instalar MySQL en tu sistema
- ✅ Fácil de levantar y tirar abajo
- ✅ Aislamiento completo del sistema

### 3. **Dockerfile** - Receta para la App
```dockerfile
FROM node:18-alpine    # Imagen base liviana de Node.js
WORKDIR /usr/src/app   # Directorio de trabajo
COPY package*.json ./  # Copia archivos de dependencias
RUN npm install        # Instala dependencias
COPY . .              # Copia todo el código
EXPOSE 3000           # Expone puerto 3000
CMD ["npm", "start"]  # Comando para iniciar
```

### 4. **dashboard.ejs** - La Interfaz Visual
```html
<!-- Bootstrap para diseño responsive -->
<link href="bootstrap@5.1.3/dist/css/bootstrap.min.css">

<!-- Estadísticas en tiempo real -->
<h4 class="text-danger">$<%= totalGastos.toLocaleString() %></h4>
<h4 class="text-success">$<%= totalIngresos.toLocaleString() %></h4>

<!-- Formularios para agregar datos -->
<form action="/agregar-gasto" method="POST">
<form action="/agregar-cliente" method="POST">

<!-- Tablas dinámicas con datos -->
<% gastos.forEach(gasto => { %>
  <tr>
    <td><%= gasto.descripcion %></td>
    <td>$<%= gasto.monto.toLocaleString() %></td>
  </tr>
<% }) %>
```

**Características:**
- 📱 **Responsive**: Se adapta a móvil y desktop
- 🎨 **Bootstrap**: Diseño profesional sin CSS personalizado
- ⚡ **Dinámico**: Los datos se actualizan en tiempo real
- 🗑️ **CRUD completo**: Crear, leer y eliminar datos

## 🗄️ Base de Datos

### Estructura:
```sql
-- Tabla de gastos (productos que compras)
CREATE TABLE gastos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    descripcion VARCHAR(100) NOT NULL,    -- Ej: "Shampoo", "Cera"
    monto INT NOT NULL,                   -- Precio en pesos
    cantidadEnLts INT NOT NULL,           -- Litros/cantidad
    fecha DATE NOT NULL                   -- Fecha de compra
);

-- Tabla de clientes (servicios que cobras)
CREATE TABLE clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,         -- Nombre del cliente
    servicio VARCHAR(100) NOT NULL,       -- Tipo de servicio
    montoCobrado INT NOT NULL             -- Lo que cobraste
);
```

### Datos de Ejemplo:
- **Gastos**: Shampoo ($18.000), Silicona ($18.000), etc.
- **Clientes**: Se agregan cuando prestas servicios

## 🚀 Cómo Usar

### Modo Desarrollo (Recomendado para programar):
```bash
# Opción 1: Script automático
./dev.sh

# Opción 2: Manual
docker-compose -f docker-compose.dev.yml up --build
```

**¿Qué hace el modo desarrollo?**
- ✅ **Hot Reload**: Los cambios en el código se aplican instantáneamente
- ✅ **Nodemon**: El servidor se reinicia automáticamente cuando cambias archivos
- ✅ **Volúmenes**: Tu código local se sincroniza con el contenedor
- ✅ **Sin reconstruir**: No necesitas hacer `docker build` cada vez

### Modo Producción (Para uso final):
```bash
# Opción 1: Script automático
./prod.sh

# Opción 2: Manual
docker-compose up --build -d
```

### Comandos Principales:
```bash
# Levantar todo el sistema
docker-compose up -d

# Ver logs si algo falla
docker logs ppgarage_webapp
docker logs ppgarage_mysql

# Parar todo
docker-compose down

# Reconstruir si cambias código
docker-compose up --build -d
```

### Acceso:
- **Aplicación Web**: http://localhost:3000
- **MySQL directo**: localhost:3306 (usuario: ppuser, pass: pppass123)

## 💡 Flujo de Trabajo

### Para agregar un gasto:
1. Vas a localhost:3000
2. Llenas el formulario "Agregar Gasto"
3. Click en "Agregar Gasto"
4. Se guarda en MySQL automáticamente
5. La página se recarga con el nuevo total

### Para agregar un cliente:
1. Llenas el formulario "Agregar Cliente"
2. Especificas el servicio (ej: "Lavado completo")
3. Pones el monto cobrado
4. Se suma automáticamente a tus ingresos

## 🔥 Características Avanzadas

### Cálculos Automáticos:
```javascript
// En app.js - Esto calcula totales en tiempo real
const [totalGastos] = await connection.execute('SELECT SUM(monto) as total FROM gastos');
const [totalIngresos] = await connection.execute('SELECT SUM(montoCobrado) as total FROM clientes');

// Balance = Ingresos - Gastos
const balance = totalIngresos - totalGastos;
```

### Persistencia de Datos:
- Los datos se guardan en un volumen Docker (`mysql_data`)
- Aunque pares y levantes el sistema, los datos persisten
- Backup automático en la carpeta del proyecto

### Seguridad Básica:
- Conexión a MySQL con usuario específico (no root)
- Queries preparados para evitar SQL injection
- Contenedores aislados

## 🛠️ Personalización

### Para cambiar el diseño:
- Edita `views/dashboard.ejs`
- Usa clases de Bootstrap para estilos
- Agrega CSS personalizado en la sección `<style>`

### Para agregar nuevas funciones:
- Agrega rutas en `app.js`
- Crea nuevas tablas en MySQL si es necesario
- Actualiza la interfaz en `dashboard.ejs`

### Ejemplos de mejoras:
- Filtros por fecha
- Gráficos de gastos mensuales
- Exportar a Excel
- Categorías de gastos
- Cálculo de rentabilidad por cliente

## 🐛 Solución de Problemas

### Si la app no carga:
```bash
# Verifica que los contenedores estén corriendo
docker ps

# Si algo falló, ve los logs
docker logs ppgarage_webapp
```

### Si MySQL no conecta:
```bash
# Espera un poco más (MySQL tarda en inicializar)
sleep 10

# Verifica la conexión
docker exec -it ppgarage_mysql mysql -u ppuser -ppppass123 -e "SHOW DATABASES;"
```

### Si las tablas no existen:
```bash
# Ejecuta el script de inicialización
docker exec -i ppgarage_mysql mysql -u root -proot123 ppgarageGastos < init_tables.sql
```

## 🎯 Próximos Pasos

1. **Backup automático**: Script para respaldar datos diariamente
2. **Reportes**: Generar PDF con estadísticas mensuales
3. **Notificaciones**: Alertas cuando el stock de productos baja
4. **Móvil**: App nativa para agregar datos más rápido
5. **Multiusuario**: Login para diferentes empleados

## 🤝 Créditos

- **Backend**: Node.js + Express + MySQL
- **Frontend**: Bootstrap + EJS
- **Containerización**: Docker + Docker Compose
- **Base de datos**: MySQL 8.0

---

**¡Tu sistema está listo para usar! 🚗✨**

Si necesitas agregar algo más o modificar alguna funcionalidad, solo edita los archivos correspondientes y reconstruye con `docker-compose up --build -d`.# servicesWeb
