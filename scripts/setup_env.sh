#!/bin/bash

# ============================================================================
# Script de Configuración de Variables de Entorno (Template)
# Sistema RAG con Gestión de Privacidad
# ============================================================================

set -e

echo "=========================================="
echo "  CONFIGURACIÓN DE ENTORNO"
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

# Directorios
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/analisis_explorado/analisis/backend"
ENV_FILE="$BACKEND_DIR/.env"
ENV_TEMPLATE="$BACKEND_DIR/.env.example"

# -----------------------------------------------------------------------------
# Verificar existencia de archivos
# -----------------------------------------------------------------------------
if [ ! -d "$BACKEND_DIR" ]; then
    print_error "Directorio del backend no encontrado: $BACKEND_DIR"
    exit 1
fi

print_status "Directorio del backend: $BACKEND_DIR"

# -----------------------------------------------------------------------------
# Crear archivo .env si no existe
# -----------------------------------------------------------------------------
if [ -f "$ENV_FILE" ]; then
    print_warning "El archivo .env ya existe. No se sobrescribirá."
    print_warning "Para regenerar, elimina el archivo .env actual primero."
    echo ""
    print_status "Edita el archivo $ENV_FILE para modificar la configuración."
else
    print_status "Generando archivo .env desde plantilla..."
    
    if [ -f "$ENV_TEMPLATE" ]; then
        cp "$ENV_TEMPLATE" "$ENV_FILE"
        print_status "Archivo .env creado desde plantilla"
    else
        # Crear archivo .env básico
        cat > "$ENV_FILE" << 'EOF'
# ============================================================================
# CONFIGURACIÓN DE ENTORNO - PRODUCCIÓN
# Sistema RAG con Gestión de Privacidad
# ============================================================================

# -----------------------------------------------------------------------------
# Configuración del Servidor
# -----------------------------------------------------------------------------
NODE_ENV=production
PORT=4000

# -----------------------------------------------------------------------------
# Base de Datos PostgreSQL
# -----------------------------------------------------------------------------
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ragdb
DB_USER=raguser
DB_PASSWORD=ragpass

# -----------------------------------------------------------------------------
# Extensión pgvector
# -----------------------------------------------------------------------------
# Dimensión de vectores (debe coincidir con el modelo de embedding)
VECTOR_DIM=1024

# -----------------------------------------------------------------------------
# JWT - Autenticación
# -----------------------------------------------------------------------------
# Genera una clave segura: openssl rand -base64 32
JWT_SECRET=tu_clave_jwt_aqui_muy_larga_y_segura
JWT_EXPIRES_IN=24h

# -----------------------------------------------------------------------------
# Ollama - Modelo de Embedding
# -----------------------------------------------------------------------------
# URL del servidor Ollama local
OLLAMA_BASE_URL=http://localhost:11434
# Modelo de embedding configurado
EMBEDDING_MODEL=mxbai-embed-large
# Modelo LLM para generación de respuestas
LLM_MODEL=gemma3

# -----------------------------------------------------------------------------
# Rutas de Archivos
# -----------------------------------------------------------------------------
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800

# -----------------------------------------------------------------------------
# Configuración de Privacidad
# -----------------------------------------------------------------------------
# Tiempo de expiración de tokens de privacidad (en segundos)
PRIVACY_TOKEN_EXPIRY=3600

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------
LOG_LEVEL=info

# -----------------------------------------------------------------------------
# CORS
# -----------------------------------------------------------------------------
CORS_ORIGIN=http://localhost:5173

# ============================================================================
# NOTA: EDITAR LOS VALORES MARCADOS CON "REEMPLAZAR" ANTOS DE EJECUTAR
# ============================================================================
EOF
        print_status "Archivo .env básico creado"
    fi
fi

echo ""
print_status "Archivo de configuración: $ENV_FILE"
echo ""

# -----------------------------------------------------------------------------
# Verificar variables críticas
# -----------------------------------------------------------------------------
print_status "Verificando variables críticas..."

MISSING_VARS=()

# Verificar JWT_SECRET
if grep -q "JWT_SECRET=tu_clave" "$ENV_FILE" 2>/dev/null; then
    MISSING_VARS+=("JWT_SECRET")
    print_warning "JWT_SECRET no configurado (genera una clave segura)"
fi

# Verificar DB_PASSWORD
if grep -q "DB_PASSWORD=ragpass" "$ENV_FILE" 2>/dev/null; then
    MISSING_VARS+=("DB_PASSWORD")
    print_warning "DB_PASSWORD parece ser el valor por defecto"
fi

echo ""

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    print_warning "Se encontraron ${#MISSING_VARS[@]} variable(s) sin configurar:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    print_warning "Edita el archivo $ENV_FILE para configurar estas variables."
    print_warning "Para generar una clave JWT segura:"
    echo "  openssl rand -base64 32"
else
    print_status "Todas las variables críticas están configuradas"
fi

echo ""
print_status "Configuración de entorno completada"
echo ""
print_warning "Próximos pasos:"
echo "  1. Edita $ENV_FILE con tus valores específicos"
echo "  2. Ejecuta el script de migración de base de datos"
echo "  3. Inicia el servidor con npm start"
echo ""
