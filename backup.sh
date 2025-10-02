#!/bin/bash
# Script de backup automático para PPGarage

BACKUP_DIR="/home/dionipereyra/ppgarage2/servicesWeb/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="ppgarage_backup_$DATE.sql"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo "💾 Creando backup de PPGarage..."

# Hacer backup de la base de datos completa
docker exec ppgarage_mysql mysqldump -u root -proot123 --single-transaction --routines --triggers ppgarageGastos > "$BACKUP_DIR/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup creado exitosamente: $BACKUP_FILE"
    
    # Comprimir el backup
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    echo "🗜️  Backup comprimido: $BACKUP_FILE.gz"
    
    # Mostrar estadísticas
    PRODUCTOS=$(docker exec ppgarage_mysql mysql -u root -proot123 -se "USE ppgarageGastos; SELECT COUNT(*) FROM gastos;" 2>/dev/null)
    CLIENTES=$(docker exec ppgarage_mysql mysql -u root -proot123 -se "USE ppgarageGastos; SELECT COUNT(*) FROM clientes;" 2>/dev/null)
    MAQUINAS=$(docker exec ppgarage_mysql mysql -u root -proot123 -se "USE ppgarageGastos; SELECT COUNT(*) FROM gastos_maquinas;" 2>/dev/null)
    
    echo "📊 Datos respaldados:"
    echo "   📦 Productos químicos: $PRODUCTOS"
    echo "   👥 Clientes: $CLIENTES"
    echo "   🔧 Máquinas/Herramientas: $MAQUINAS"
    
    # Limpiar backups antiguos (mantener solo últimos 10)
    cd "$BACKUP_DIR"
    ls -t ppgarage_backup_*.sql.gz | tail -n +11 | xargs rm -f 2>/dev/null
    
    echo "🧹 Backups antiguos limpiados (manteniendo últimos 10)"
    
else
    echo "❌ Error al crear backup"
    exit 1
fi