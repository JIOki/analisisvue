#!/bin/bash

# ============================================================================
# Script de Migración de Base de Datos
# Sistema RAG con Gestión de Privacidad
# ============================================================================

set -e

echo "=========================================="
echo "  MIGRACIÓN DE BASE DE DATOS"
echo "=========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Directorio del proyecto
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$(dirname "${BASH_SOURCE[0]}")"

# -----------------------------------------------------------------------------
# Configuración de conexión a BD
# -----------------------------------------------------------------------------
print_status "Configurando conexión a base de datos..."

# Intentar leer de variables de entorno o usar valores por defecto
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-ragdb}"
DB_USER="${POSTGRES_USER:-raguser}"
DB_PASS="${POSTGRES_PASSWORD:-ragpass}"

export PGPASSWORD="$DB_PASS"

# Verificar conexión
print_status "Verificando conexión a PostgreSQL..."
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &> /dev/null; then
    print_warning "No se pudo conectar a la base de datos. Intentando con parámetros alternativos..."
    
    # Intentar sin contraseña (para desarrollo local)
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &> /dev/null; then
        print_status "Conexión exitosa sin contraseña"
        unset PGPASSWORD
    else
        print_error "No se puede conectar a la base de datos"
        print_error "Verifica las variables de entorno:"
        echo "  POSTGRES_HOST=$DB_HOST"
        echo "  POSTGRES_PORT=$DB_PORT"
        echo "  POSTGRES_DB=$DB_NAME"
        echo "  POSTGRES_USER=$DB_USER"
        exit 1
    fi
else
    print_status "Conexión a base de datos exitosa"
fi

echo ""

# -----------------------------------------------------------------------------
# Verificar extensión pgvector
# -----------------------------------------------------------------------------
print_status "Verificando extensión pgvector..."
VECTOR_CHECK=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT 1 FROM pg_extension WHERE extname = 'vector';" 2>/dev/null | xargs)

if [ -z "$VECTOR_CHECK" ]; then
    print_warning "Extensión pgvector no encontrada. Instalando..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS vector;"
    print_status "Extensión pgvector instalada"
else
    print_status "Extensión pgvector ya instalada"
fi

echo ""

# -----------------------------------------------------------------------------
# Ejecutar script de inicialización
# -----------------------------------------------------------------------------
INIT_SQL="$PROJECT_ROOT/analisis_explorado/analisis/database/init.sql"

if [ ! -f "$INIT_SQL" ]; then
    print_error "Script de inicialización no encontrado: $INIT_SQL"
    exit 1
fi

print_status "Ejecutando script de inicialización de base de datos..."
print_warning "Este proceso puede tomar varios minutos dependiendo del tamaño de la base de datos."

# Ejecutar con salida formateada
echo ""
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$INIT_SQL" 2>&1 | while IFS= read -r line; do
    echo "$line"
done

# Verificar resultado
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    print_status "Migración completada exitosamente"
else
    print_error "Hubo errores durante la migración"
    exit 1
fi

echo ""

# -----------------------------------------------------------------------------
# Verificar índices requeridos
# -----------------------------------------------------------------------------
print_status "Verificando índices de rendimiento..."

INDICES_ESPERADOS=(
    "idx_sources_user_id"
    "idx_sources_category"
    "idx_sources_is_public_for_ai"
    "idx_chunks_source_id"
    "idx_records_source_id"
    "idx_material_shares_shared_with_user_id"
    "idx_consent_audit_user_id"
)

for indice in "${INDICES_ESPERADOS[@]}"; do
    CHECK=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT 1 FROM pg_indexes WHERE indexname = '$indice';" 2>/dev/null | xargs)
    if [ -n "$CHECK" ]; then
        print_status "Índice $indice encontrado"
    else
        print_warning "Índice $indice no encontrado (puede ser normal si no se usa)"
    fi
done

echo ""

# -----------------------------------------------------------------------------
# Resumen de tablas creadas
# -----------------------------------------------------------------------------
print_status "Resumen de tablas en la base de datos:"
echo ""

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as columnas,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as tamano
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
"

echo ""
print_status "Migración de base de datos completada"
echo ""
print_warning "Recuerda:"
echo "  - Verifica que los triggers de privacidad estén activos"
echo "  - Los defaults de privacidad se aplicarán automáticamente según la categoría"
echo "  - Revisa la documentación para información sobre consultas RAG"
echo ""
