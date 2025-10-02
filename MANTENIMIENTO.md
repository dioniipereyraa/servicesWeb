# 🚗 Guía de Mantenimiento PPGarage

## 📋 Inicio Seguro del Sistema

### ✅ Forma CORRECTA de iniciar (SIEMPRE usar este método):
```bash
cd /home/dionipereyra/ppgarage2/servicesWeb
./start-safe.sh
```

### ❌ NO hacer nunca:
- `docker run` manual del container MySQL
- `docker rm ppgarage_mysql` sin revisar volúmenes
- Iniciar desde directorios incorrectos

## 🔄 Rutinas de Mantenimiento

### Backup Manual (recomendado antes de cambios importantes):
```bash
./backup.sh
```

### Verificar Estado del Sistema:
```bash
# Ver containers activos
docker ps

# Ver volúmenes
docker volume ls | grep ppgarage

# Verificar datos
docker exec ppgarage_mysql mysql -u root -proot123 -e "USE ppgarageGastos; SELECT COUNT(*) FROM gastos; SELECT COUNT(*) FROM clientes; SELECT COUNT(*) FROM gastos_maquinas;"
```

## 🚨 Recuperación de Emergencia

### Si perdiste datos después de reiniciar:

1. **Verificar volúmenes disponibles:**
   ```bash
   docker volume ls | grep mysql
   ```

2. **Si existe ppgarage_mysql_data:**
   ```bash
   docker stop ppgarage_mysql
   docker rm ppgarage_mysql
   # Editar docker-compose.yml para usar ppgarage_mysql_data
   docker-compose up -d mysql
   ```

3. **Restaurar desde backup:**
   ```bash
   # Listar backups disponibles
   ls -la backups/
   
   # Restaurar backup específico
   gunzip backups/ppgarage_backup_YYYYMMDD_HHMMSS.sql.gz
   docker exec -i ppgarage_mysql mysql -u root -proot123 ppgarageGastos < backups/ppgarage_backup_YYYYMMDD_HHMMSS.sql
   ```

## 🔧 Solución de Problemas Comunes

### Error "Puerto 3002 en uso":
```bash
# Matar proceso en puerto 3002
lsof -ti:3002 | xargs kill -9
```

### MySQL no inicia:
```bash
# Verificar logs
docker logs ppgarage_mysql

# Reiniciar container
docker restart ppgarage_mysql
```

### Container no encuentra volumen:
```bash
# Verificar que el volumen existe
docker volume inspect ppgarage_mysql_data

# Si no existe, revisar otros volúmenes
docker volume ls | grep mysql
```

## 📊 Monitoreo de Datos

### Verificación rápida de integridad:
```bash
docker exec ppgarage_mysql mysql -u root -proot123 -e "
USE ppgarageGastos; 
SELECT 'PRODUCTOS' as tipo, COUNT(*) as cantidad FROM gastos 
UNION SELECT 'CLIENTES', COUNT(*) FROM clientes 
UNION SELECT 'MÁQUINAS', COUNT(*) FROM gastos_maquinas;
"
```

### Números esperados (a partir del 2 oct 2025):
- Productos químicos: 11+
- Clientes: 6+
- Máquinas/Herramientas: 4+

## 🛡️ Prevención de Pérdida de Datos

### SIEMPRE:
- ✅ Usar `./start-safe.sh` para iniciar
- ✅ Hacer backup antes de cambios importantes
- ✅ Verificar datos después de reinicios
- ✅ Mantener docker-compose.yml apuntando al volumen correcto

### NUNCA:
- ❌ Eliminar containers con `docker rm` sin verificar
- ❌ Cambiar configuración de volúmenes sin backup
- ❌ Usar comandos docker directos en lugar de docker-compose

## 🕐 Rutina Recomendada

### Al iniciar trabajo:
1. `./start-safe.sh`
2. Verificar que carga datos correctos
3. Trabajar normalmente

### Al terminar trabajo:
1. `Ctrl+C` para detener servidor
2. `./backup.sh` (opcional, pero recomendado)
3. `docker-compose down` (opcional)

### Backup semanal:
```bash
./backup.sh
```

## 📞 Contacto de Emergencia
Si nada funciona, los backups están en `/backups/` y el volumen original debería ser `ppgarage_mysql_data`.