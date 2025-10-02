#!/bin/bash
# Script seguro para iniciar PPGarage sin perder datos

echo "🚗 Iniciando PPGarage de forma segura..."

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: No se encuentra docker-compose.yml. Ejecuta desde /servicesWeb"
    exit 1
fi

# Verificar que el volumen de datos existe
if ! docker volume ls | grep -q "ppgarage_mysql_data"; then
    echo "⚠️  Advertencia: El volumen ppgarage_mysql_data no existe"
    echo "   Si es la primera vez, esto es normal"
else
    echo "✅ Volumen de datos encontrado: ppgarage_mysql_data"
fi

# Iniciar MySQL primero (siempre con docker-compose para mantener volúmenes)
echo "🐘 Iniciando base de datos MySQL..."
docker-compose up -d mysql

# Esperar que MySQL esté listo
echo "⏳ Esperando que MySQL esté listo..."
until docker exec ppgarage_mysql mysqladmin ping -h "localhost" --silent; do
    printf "."
    sleep 2
done
echo ""
echo "✅ MySQL está listo"

# Verificar datos
echo "📊 Verificando integridad de datos..."
PRODUCTOS=$(docker exec ppgarage_mysql mysql -u root -proot123 -se "USE ppgarageGastos; SELECT COUNT(*) FROM gastos;" 2>/dev/null || echo "0")
CLIENTES=$(docker exec ppgarage_mysql mysql -u root -proot123 -se "USE ppgarageGastos; SELECT COUNT(*) FROM clientes;" 2>/dev/null || echo "0")
MAQUINAS=$(docker exec ppgarage_mysql mysql -u root -proot123 -se "USE ppgarageGastos; SELECT COUNT(*) FROM gastos_maquinas;" 2>/dev/null || echo "0")

echo "   📦 Productos químicos: $PRODUCTOS"
echo "   👥 Clientes: $CLIENTES"  
echo "   🔧 Máquinas/Herramientas: $MAQUINAS"

if [ "$PRODUCTOS" -eq 0 ] && [ "$CLIENTES" -eq 0 ] && [ "$MAQUINAS" -eq 0 ]; then
    echo "⚠️  No se encontraron datos. Ejecutando script de inicialización..."
    docker exec -i ppgarage_mysql mysql -u root -proot123 < ppdb.sql
fi

# Iniciar aplicación
echo "🚀 Iniciando aplicación en puerto 3002..."
echo "   Accede en: http://localhost:3002"
echo ""
echo "💡 Para detener: Ctrl+C y luego ejecuta 'docker-compose down'"
echo "💡 Para backup: ejecuta './backup.sh'"
echo ""

# Iniciar Node.js
node app.js