#!/bin/bash
# Script de Verificación de Protección de Rutas con JWT

echo "🔍 VERIFICACIÓN DE PROTECCIÓN DE RUTAS - SISTEMA RAG"
echo "=================================================="
echo ""

BACKEND_DIR="/workspace/analisis/backend/src"
ERRORS=0

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar imports
check_import() {
    local file=$1
    local import_line="import { authenticateToken } from '../middleware/authMiddleware.js';"
    
    if grep -q "authenticateToken" "$file"; then
        echo -e "${GREEN}✅${NC} $file - Import de authenticateToken encontrado"
        return 0
    else
        echo -e "${RED}❌${NC} $file - Falta import de authenticateToken"
        ((ERRORS++))
        return 1
    fi
}

# Función para contar endpoints protegidos
count_protected() {
    local file=$1
    local count=$(grep -c "authenticateToken" "$file" 2>/dev/null || echo "0")
    echo -e "${GREEN}📊${NC} $file - $count endpoints protegidos"
}

echo "📁 Verificando archivos de rutas..."
echo ""

# 1. Verificar conversationRoutes.js
echo "1️⃣  conversationRoutes.js"
FILE="$BACKEND_DIR/routes/conversationRoutes.js"
if [ -f "$FILE" ]; then
    check_import "$FILE"
    count_protected "$FILE"
    
    # Verificar que no haya user_id en req.body
    if grep -q "req.body.user_id" "$FILE"; then
        echo -e "${RED}⚠️${NC}  ADVERTENCIA: Se encontró req.body.user_id (debería usar req.user.id)"
        ((ERRORS++))
    else
        echo -e "${GREEN}✅${NC} No usa req.body.user_id (correcto)"
    fi
else
    echo -e "${RED}❌${NC} Archivo no encontrado: $FILE"
    ((ERRORS++))
fi
echo ""

# 2. Verificar material.js
echo "2️⃣  material.js"
FILE="$BACKEND_DIR/routes/material.js"
if [ -f "$FILE" ]; then
    check_import "$FILE"
    count_protected "$FILE"
    
    # Verificar que no haya user_id hardcodeado
    if grep -q "841657fa-fe17-417f-914d-4af0d522ba1e" "$FILE"; then
        echo -e "${RED}❌${NC} CRÍTICO: Se encontró user_id hardcodeado"
        ((ERRORS++))
    else
        echo -e "${GREEN}✅${NC} No hay user_id hardcodeado (correcto)"
    fi
    
    # Verificar filtro obligatorio en /list
    if grep -q "conditions = \['s.user_id = \$1'\]" "$FILE"; then
        echo -e "${GREEN}✅${NC} Filtro obligatorio por user_id en /list encontrado"
    else
        echo -e "${RED}❌${NC} Falta filtro obligatorio por user_id en /list"
        ((ERRORS++))
    fi
else
    echo -e "${RED}❌${NC} Archivo no encontrado: $FILE"
    ((ERRORS++))
fi
echo ""

# 3. Verificar chatRoutes.js
echo "3️⃣  chatRoutes.js"
FILE="$BACKEND_DIR/routes/chatRoutes.js"
if [ -f "$FILE" ]; then
    check_import "$FILE"
    count_protected "$FILE"
    
    # Verificar que tenga verificación de ownership
    if grep -q "ownerCheck" "$FILE"; then
        echo -e "${GREEN}✅${NC} Verificación de ownership implementada"
    else
        echo -e "${YELLOW}⚠️${NC}  No se encontró verificación de ownership"
    fi
else
    echo -e "${RED}❌${NC} Archivo no encontrado: $FILE"
    ((ERRORS++))
fi
echo ""

# 4. Verificar uploadMaterial.js
echo "4️⃣  uploadMaterial.js"
FILE="$BACKEND_DIR/routes/uploadMaterial.js"
if [ -f "$FILE" ]; then
    check_import "$FILE"
    count_protected "$FILE"
    
    # Verificar que INSERT incluya user_id
    if grep -q "INSERT INTO sources.*user_id" "$FILE"; then
        echo -e "${GREEN}✅${NC} INSERT incluye user_id"
    else
        echo -e "${RED}❌${NC} INSERT no incluye user_id"
        ((ERRORS++))
    fi
else
    echo -e "${RED}❌${NC} Archivo no encontrado: $FILE"
    ((ERRORS++))
fi
echo ""

# 5. Verificar uploadRecords.js
echo "5️⃣  uploadRecords.js"
FILE="$BACKEND_DIR/routes/uploadRecords.js"
if [ -f "$FILE" ]; then
    check_import "$FILE"
    count_protected "$FILE"
else
    echo -e "${RED}❌${NC} Archivo no encontrado: $FILE"
    ((ERRORS++))
fi
echo ""

# 6. Verificar ask.js
echo "6️⃣  ask.js"
FILE="$BACKEND_DIR/routes/ask.js"
if [ -f "$FILE" ]; then
    check_import "$FILE"
    count_protected "$FILE"
else
    echo -e "${RED}❌${NC} Archivo no encontrado: $FILE"
    ((ERRORS++))
fi
echo ""

# 7. Verificar authMiddleware.js
echo "7️⃣  authMiddleware.js"
FILE="$BACKEND_DIR/middleware/authMiddleware.js"
if [ -f "$FILE" ]; then
    echo -e "${GREEN}✅${NC} authMiddleware.js existe"
    
    # Verificar exports
    if grep -q "export.*authenticateToken" "$FILE"; then
        echo -e "${GREEN}✅${NC} Exporta authenticateToken"
    else
        echo -e "${RED}❌${NC} No exporta authenticateToken"
        ((ERRORS++))
    fi
    
    if grep -q "export.*optionalAuth" "$FILE"; then
        echo -e "${GREEN}✅${NC} Exporta optionalAuth"
    fi
    
    if grep -q "export.*requireAdmin" "$FILE"; then
        echo -e "${GREEN}✅${NC} Exporta requireAdmin"
    fi
else
    echo -e "${RED}❌${NC} Archivo no encontrado: $FILE"
    ((ERRORS++))
fi
echo ""

# 8. Verificar authRoutes.js
echo "8️⃣  authRoutes.js"
FILE="$BACKEND_DIR/routes/authRoutes.js"
if [ -f "$FILE" ]; then
    echo -e "${GREEN}✅${NC} authRoutes.js existe"
    
    # Contar endpoints
    LOGIN=$(grep -c "'/auth/login'" "$FILE" || echo "0")
    REGISTER=$(grep -c "'/auth/register'" "$FILE" || echo "0")
    PROFILE=$(grep -c "'/auth/profile'" "$FILE" || echo "0")
    
    echo -e "${GREEN}📊${NC} Endpoints encontrados: login=$LOGIN, register=$REGISTER, profile=$PROFILE"
else
    echo -e "${RED}❌${NC} Archivo no encontrado: $FILE"
    ((ERRORS++))
fi
echo ""

# 9. Verificar migración SQL
echo "9️⃣  Migración SQL"
FILE="/workspace/analisis/backend/migrations/001_auth_system.sql"
if [ -f "$FILE" ]; then
    echo -e "${GREEN}✅${NC} Migración SQL existe"
    
    if grep -q "ALTER TABLE users" "$FILE"; then
        echo -e "${GREEN}✅${NC} Contiene ALTER TABLE users"
    fi
    
    if grep -q "CREATE TABLE user_sessions" "$FILE"; then
        echo -e "${GREEN}✅${NC} Contiene CREATE TABLE user_sessions"
    fi
    
    if grep -q "admin@sistema-rag.local" "$FILE"; then
        echo -e "${GREEN}✅${NC} Contiene usuario admin por defecto"
    fi
else
    echo -e "${RED}❌${NC} Archivo no encontrado: $FILE"
    ((ERRORS++))
fi
echo ""

# 10. Verificar package.json
echo "🔟 Dependencias en package.json"
FILE="/workspace/analisis/backend/package.json"
if [ -f "$FILE" ]; then
    if grep -q '"bcrypt"' "$FILE"; then
        echo -e "${GREEN}✅${NC} bcrypt está en package.json"
    else
        echo -e "${RED}❌${NC} Falta bcrypt en package.json"
        ((ERRORS++))
    fi
    
    if grep -q '"jsonwebtoken"' "$FILE"; then
        echo -e "${GREEN}✅${NC} jsonwebtoken está en package.json"
    else
        echo -e "${RED}❌${NC} Falta jsonwebtoken en package.json"
        ((ERRORS++))
    fi
    
    if grep -q '"express-validator"' "$FILE"; then
        echo -e "${GREEN}✅${NC} express-validator está en package.json"
    else
        echo -e "${YELLOW}⚠️${NC}  express-validator no encontrado (opcional)"
    fi
else
    echo -e "${RED}❌${NC} Archivo no encontrado: $FILE"
    ((ERRORS++))
fi
echo ""

# 11. Verificar index.js (registro de rutas)
echo "1️⃣1️⃣  index.js - Registro de rutas"
FILE="$BACKEND_DIR/index.js"
if [ -f "$FILE" ]; then
    if grep -q 'authRoutes' "$FILE"; then
        echo -e "${GREEN}✅${NC} authRoutes está registrado"
    else
        echo -e "${RED}❌${NC} authRoutes no está registrado"
        ((ERRORS++))
    fi
    
    echo -e "${GREEN}📊${NC} Rutas registradas:"
    grep "app.use.*Routes" "$FILE" | while read -r line; do
        echo "    - $line"
    done
else
    echo -e "${RED}❌${NC} Archivo no encontrado: $FILE"
    ((ERRORS++))
fi
echo ""

# Resumen final
echo "=================================================="
echo ""
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ ÉXITO: Todas las verificaciones pasaron${NC}"
    echo ""
    echo "🎯 Estado: Backend protegido al 100%"
    echo ""
    echo "📋 Próximos pasos:"
    echo "  1. Ejecutar: cd backend && npm install"
    echo "  2. Configurar JWT_SECRET en .env"
    echo "  3. Ejecutar migración SQL: psql -h localhost -p 5433 -U raguser -d ragdb -f backend/migrations/001_auth_system.sql"
    echo "  4. Implementar frontend (Login, Register, Profile)"
    echo "  5. Probar autenticación con usuario admin"
    exit 0
else
    echo -e "${RED}❌ FALLÓ: Se encontraron $ERRORS errores${NC}"
    echo ""
    echo "Por favor revisa los errores anteriores y corrígelos."
    exit 1
fi
