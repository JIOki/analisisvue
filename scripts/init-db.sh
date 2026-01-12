#!/bin/bash
# =============================================================================
# Script para verificar e inicializar la base de datos
# Sistema RAG - Chat Inteligente
# =============================================================================
# Uso: ./scripts/init-db.sh
# =============================================================================

set -e

echo "=================================================="
echo "INICIALIZACIÓN DE BASE DE DATOS - SISTEMA RAG"
echo "=================================================="

# Colores para输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-raguser}
DB_NAME=${DB_NAME:-ragdb}

echo -e "${YELLOW}Verificando conexión a PostgreSQL...${NC}"

# Verificar si PostgreSQL está corriendo
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
    echo -e "${RED}ERROR: PostgreSQL no está disponible en $DB_HOST:$DB_PORT${NC}"
    echo "Por favor, inicia PostgreSQL o verifica la configuración."
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL está disponible${NC}"

# Verificar si la base de datos existe
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" = "1" ]; then
    echo -e "${YELLOW}La base de datos '$DB_NAME' ya existe.${NC}"
    echo -e "${YELLOW}¿Deseas ejecutar las migraciones de todos modos? (s/n)${NC}"
    read -r respuesta
    if [ "$respuesta" != "s" ] && [ "$respuesta" != "S" ]; then
        echo "Saliendo sin modificar la base de datos."
        exit 0
    fi
else
    echo -e "${GREEN}Creando base de datos '$DB_NAME'...${NC}"
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
    echo -e "${GREEN}✓ Base de datos creada${NC}"
fi

# Ejecutar script de inicialización
echo ""
echo -e "${YELLOW}Ejecutando script de inicialización...${NC}"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f ../database/init.sql

echo ""
echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}INICIALIZACIÓN COMPLETADA${NC}"
echo -e "${GREEN}==================================================${NC}"
echo ""
echo "Usuario administrador creado:"
echo "  Email: admin@sistema-rag.local"
echo "  Password: admin123"
echo ""
echo -e "${RED}IMPORTANTE: Cambia el password en el primer inicio de sesión${NC}"
echo ""
