#!/bin/bash

echo "================================================"
echo "VERIFICACION SISTEMA DE AUTENTICACION JWT"
echo "================================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}OK${NC} $1"
        return 0
    else
        echo -e "${RED}FALTA${NC} $1"
        return 1
    fi
}

echo "1. Archivos Backend Creados"
echo "----------------------------"
check_file "backend/migrations/001_auth_system.sql"
check_file "backend/src/middleware/authMiddleware.js"
check_file "backend/src/routes/authRoutes.js"
echo ""

echo "2. Archivos Backend Modificados"
echo "--------------------------------"
check_file "backend/src/index.js"
check_file "backend/package.json"
echo ""

echo "3. Dependencias Backend"
echo "-----------------------"
cd backend
if grep -q "bcrypt" package.json; then
    echo -e "${GREEN}OK${NC} bcrypt en package.json"
else
    echo -e "${RED}FALTA${NC} bcrypt en package.json"
fi

if grep -q "jsonwebtoken" package.json; then
    echo -e "${GREEN}OK${NC} jsonwebtoken en package.json"
else
    echo -e "${RED}FALTA${NC} jsonwebtoken en package.json"
fi

if grep -q "express-validator" package.json; then
    echo -e "${GREEN}OK${NC} express-validator en package.json"
else
    echo -e "${RED}FALTA${NC} express-validator en package.json"
fi

# Verificar si están instalados
if [ -d "node_modules/bcrypt" ]; then
    echo -e "${GREEN}OK${NC} bcrypt instalado"
else
    echo -e "${YELLOW}PENDIENTE${NC} bcrypt NO instalado (ejecutar npm install)"
fi

if [ -d "node_modules/jsonwebtoken" ]; then
    echo -e "${GREEN}OK${NC} jsonwebtoken instalado"
else
    echo -e "${YELLOW}PENDIENTE${NC} jsonwebtoken NO instalado (ejecutar npm install)"
fi

cd ..
echo ""

echo "4. Documentacion"
echo "----------------"
check_file "SISTEMA_AUTENTICACION.md"
check_file "RESUMEN_AUTENTICACION.md"
echo ""

echo "5. Variables de Entorno"
echo "-----------------------"
if [ -f "backend/.env" ]; then
    if grep -q "JWT_SECRET" backend/.env; then
        echo -e "${GREEN}OK${NC} JWT_SECRET configurado"
    else
        echo -e "${YELLOW}PENDIENTE${NC} JWT_SECRET no configurado"
        echo "   Agregar: JWT_SECRET=tu-secret-aqui"
    fi
else
    echo -e "${YELLOW}PENDIENTE${NC} archivo .env no existe"
    echo "   Crear backend/.env con JWT_SECRET"
fi
echo ""

echo "6. Migracion SQL"
echo "----------------"
echo -e "${YELLOW}MANUAL${NC} Ejecutar: psql -h localhost -p 5433 -U raguser -d ragdb -f backend/migrations/001_auth_system.sql"
echo ""

echo "7. Frontend - Pendiente"
echo "-----------------------"
cd frontendvite
if [ -d "node_modules/pinia" ]; then
    echo -e "${GREEN}OK${NC} Pinia instalado"
else
    echo -e "${YELLOW}PENDIENTE${NC} Pinia NO instalado (ejecutar npm install pinia)"
fi

if [ -d "src/stores" ]; then
    echo -e "${GREEN}OK${NC} Directorio stores existe"
else
    echo -e "${YELLOW}PENDIENTE${NC} Crear directorio src/stores"
fi

if [ -f "src/stores/auth.js" ]; then
    echo -e "${GREEN}OK${NC} Store de auth existe"
else
    echo -e "${YELLOW}PENDIENTE${NC} Crear src/stores/auth.js (ver documentacion)"
fi

if [ -d "src/Views/auth" ]; then
    echo -e "${GREEN}OK${NC} Directorio Views/auth existe"
else
    echo -e "${YELLOW}PENDIENTE${NC} Crear directorio src/Views/auth"
fi

cd ..
echo ""

echo "8. Estado de Implementacion"
echo "----------------------------"
echo -e "${GREEN}COMPLETADO (40%)${NC}"
echo "  - Base de datos (migracion lista)"
echo "  - Middleware de autenticacion"
echo "  - Rutas de autenticacion"
echo "  - Documentacion completa"
echo ""
echo -e "${YELLOW}PENDIENTE (60%)${NC}"
echo "  - Instalar dependencias backend"
echo "  - Ejecutar migracion SQL"
echo "  - Proteger rutas existentes"
echo "  - Implementar frontend completo"
echo "  - Configurar router guards"
echo ""

echo "================================================"
echo "PROXIMOS PASOS"
echo "================================================"
echo ""
echo "1. Instalar dependencias:"
echo "   cd backend && npm install"
echo "   cd frontendvite && npm install pinia"
echo ""
echo "2. Ejecutar migracion SQL:"
echo "   psql -h localhost -p 5433 -U raguser -d ragdb \\"
echo "     -f backend/migrations/001_auth_system.sql"
echo ""
echo "3. Configurar .env:"
echo "   echo 'JWT_SECRET=secret-seguro' >> backend/.env"
echo ""
echo "4. Seguir guia en SISTEMA_AUTENTICACION.md"
echo ""
echo "5. Usuario admin por defecto:"
echo "   Email: admin@sistema-rag.local"
echo "   Password: admin123"
echo ""
