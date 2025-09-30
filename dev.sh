#!/bin/bash

echo "🚀 Iniciando PPGarage en modo desarrollo..."
echo "📁 Código sincronizado en tiempo real"
echo "🔄 Nodemon detectará cambios automáticamente"
echo ""

# Parar contenedores existentes
echo "⏹️  Parando contenedores de producción..."
docker-compose down 2>/dev/null

# Levantar en modo desarrollo
echo "🛠️  Levantando en modo desarrollo..."
docker-compose -f docker-compose.dev.yml up --build

echo ""
echo "✅ Desarrollo iniciado!"
echo "📱 App: http://localhost:3000"
echo "🗄️  MySQL: localhost:3306"
echo ""
echo "💡 Para parar: Ctrl+C"
echo "🔄 Los cambios en el código se aplicarán automáticamente"