#!/bin/bash

echo "🏭 Iniciando PPGarage en modo producción..."

# Parar contenedores de desarrollo
echo "⏹️  Parando contenedores de desarrollo..."
docker-compose -f docker-compose.dev.yml down 2>/dev/null

# Levantar en modo producción
echo "🚀 Levantando en modo producción..."
docker-compose up --build -d

echo ""
echo "✅ Producción iniciada!"
echo "📱 App: http://localhost:3000"
echo "🗄️  MySQL: localhost:3306"
echo ""
echo "💡 Para ver logs: docker-compose logs -f"
echo "⏹️  Para parar: docker-compose down"