#!/bin/bash

# ============================================================================
# Script de Health Check
# Sistema RAG con Gestión de Privacidad
# ============================================================================

set -e

echo "=========================================="
echo "  HEALTH CHECK DEL SISTEMA"
echo "=========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_info() { echo -e "${BLUE}[i]${NC} $1"; }

# Configuración
API_URL="${API_URL:-http://localhost:4000}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-ragdb}"
DB_USER="${POSTGRES_USER:-raguser}"
DB_PASS="${POSTGRES_PASSWORD:-ragpass}"

export PGPASSWORD="$DB_PASS"

# Contadores
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_TOTAL=0

# Función para ejecutar un check
run_check() {
    local name="$1"
    local command="$2"
    local timeout="${3:-5}"
    
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    
    echo -n "  Verificando $name... "
    
    if eval "$command" > /dev/null 2>&1; then
        print_status "OK"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        return 0
    else
        print_error "FALLO"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
        return 1
    fi
}

echo "Configuración del health check:"
echo "  API URL: $API_URL"
echo "  Base de datos: $DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# -----------------------------------------------------------------------------
# Sección 1: API del Servidor
# -----------------------------------------------------------------------------
echo "1. API del Servidor"
echo "--------------------"

# Health endpoint básico
run_check "health endpoint" "curl -s -f $API_URL/health" 10

# API de autenticación
run_check "endpoint auth" "curl -s -f $API_URL/api/auth/verify" 5

# API de materiales
run_check "endpoint materials" "curl -s -f $API_URL/api/material/list" 5

# API de privacidad
run_check "endpoint privacy" "curl -s -f $API_URL/api/privacy/dashboard" 5

echo ""

# -----------------------------------------------------------------------------
# Sección 2: Base de Datos
# -----------------------------------------------------------------------------
echo "2. Base de Datos PostgreSQL"
echo "----------------------------"

# Conexión básica
run_check "conexión PostgreSQL" "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c 'SELECT 1'" 5

# Tabla de usuarios
run_check "tabla users" "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c 'SELECT 1 FROM users LIMIT 1'" 5

# Tabla de fuentes
run_check "tabla sources" "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c 'SELECT 1 FROM sources LIMIT 1'" 5

# Extensión pgvector
run_check "extensión pgvector" "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c 'SELECT 1 FROM pg_extension WHERE extname = '\''vector'\'''" 5

echo ""

# -----------------------------------------------------------------------------
# Sección 3: Servicios Externos
# -----------------------------------------------------------------------------
echo "3. Servicios Externos"
echo "----------------------"

# Servidor Ollama
run_check "servidor Ollama" "curl -s -f $API_URL/api/health | grep -q 'ollama' || curl -s http://localhost:11434/api/tags" 10

echo ""

# -----------------------------------------------------------------------------
# Sección 4: Rendimiento
# -----------------------------------------------------------------------------
echo "4. Métricas de Rendimiento"
echo "---------------------------"

# Latencia de API
echo -n "  Latencia de API... "
LATENCY=$(curl -s -w "%{time_total}" -o /dev/null -f "$API_URL/health" 2>/dev/null | head -1)
if [ -n "$LATENCY" ]; then
    LATENCY_MS=$(echo "$LATENCY * 1000" | bc 2>/dev/null || echo "$LATENCY" | awk '{print $1 * 1000}')
    if (( $(echo "$LATENCY < 0.5" | bc -l) )); then
        print_status "$(printf '%.0fms' $LATENCY_MS)"
    else
        print_warning "$(printf '%.0fms (lento)' $LATENCY_MS)"
    fi
else
    print_error "No se pudo medir"
fi

# Verificar espacio en disco
echo -n "  Espacio en disco... "
DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    print_status "$DISK_USAGE% usado"
else
    print_warning "$DISK_USAGE% usado (cerca del límite)"
fi

echo ""

# -----------------------------------------------------------------------------
# Resumen
# -----------------------------------------------------------------------------
echo "=========================================="
echo "  RESUMEN DEL HEALTH CHECK"
echo "=========================================="
echo ""
echo "  Total de verificaciones: $CHECKS_TOTAL"
echo -e "  ${GREEN}Exitosas: $CHECKS_PASSED${NC}"
if [ $CHECKS_FAILED -gt 0 ]; then
    echo -e "  ${RED}Fallidas: $CHECKS_FAILED${NC}"
else
    echo -e "  ${GREEN}Fallidas: $CHECKS_FAILED${NC}"
fi
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    print_status "El sistema está funcionando correctamente"
    exit 0
else
    print_warning "Se detectaron problemas en el sistema"
    print_warning "Revisa los errores marcados arriba"
    exit 1
fi
