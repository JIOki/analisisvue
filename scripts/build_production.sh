#!/bin/bash

# ============================================================================
# Script de Construcción para Producción
# Sistema RAG con Gestión de Privacidad
# ============================================================================

set -e  # Exit on error

echo "=========================================="
echo "  BUILD PARA PRODUCCIÓN"
echo "  Sistema RAG con Gestión de Privacidad"
echo "=========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Directorio raíz del proyecto
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

print_status "Directorio del proyecto: $PROJECT_ROOT"
echo ""

# -----------------------------------------------------------------------------
# Paso 1: Verificar dependencias
# -----------------------------------------------------------------------------
echo "1. Verificando entorno de construcción..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instala Node.js v18 o superior."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Se requiere Node.js v18 o superior. Versión actual: v$NODE_VERSION"
    exit 1
fi

print_status "Node.js versión $(node -v) detectada"

# Verificar npm o pnpm
if command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
    print_status "Usando pnpm como gestor de paquetes"
elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
    print_warning "Usando npm como gestor de paquetes (se recomienda pnpm)"
else
    print_error "No se encontró npm ni pnpm"
    exit 1
fi

echo ""

# -----------------------------------------------------------------------------
# Paso 2: Construir Frontend
# -----------------------------------------------------------------------------
echo "2. Construyendo Frontend (Vue.js + Vite)..."

FRONTEND_DIR="$PROJECT_ROOT/analisis_explorado/analisis/frontendvite"

if [ ! -d "$FRONTEND_DIR" ]; then
    print_error "Directorio del frontend no encontrado: $FRONTEND_DIR"
    exit 1
fi

cd "$FRONTEND_DIR"

# Instalar dependencias
print_status "Instalando dependencias del frontend..."
$PACKAGE_MANAGER install --frozen-lockfile 2>/dev/null || $PACKAGE_MANAGER install

# Verificar instalación
if [ ! -d "node_modules" ]; then
    print_error "Falló la instalación de dependencias del frontend"
    exit 1
fi

# Limpiar build anterior
if [ -d "dist" ]; then
    print_warning "Limpiando build anterior..."
    rm -rf dist
fi

# Construir
print_status "Generando build de producción..."
$PACKAGE_MANAGER run build

# Verificar que el build fue exitoso
if [ ! -d "dist" ]; then
    print_error "El build del frontend falló. No se generó la carpeta dist/"
    exit 1
fi

print_status "Frontend construido exitosamente"
print_status "Archivos generados en: $FRONTEND_DIR/dist/"

echo ""

# -----------------------------------------------------------------------------
# Paso 3: Preparar archivos para despliegue
# -----------------------------------------------------------------------------
echo "3. Preparando archivos para despliegue..."

# Crear directorio de distribución
DIST_DIR="$PROJECT_ROOT/dist"
BUILD_DIR="$DIST_DIR/build"

mkdir -p "$BUILD_DIR"

# Copiar archivos del frontend
print_status "Copiando archivos del frontend..."
cp -r "$FRONTEND_DIR/dist" "$BUILD_DIR/frontend"

# Copiar backend
print_status "Copiando backend..."
mkdir -p "$BUILD_DIR/backend"
cp -r "$PROJECT_ROOT/analisis_explorado/analisis/backend/src" "$BUILD_DIR/backend/"

# Copiar configuración
mkdir -p "$BUILD_DIR/backend/config"
cp "$PROJECT_ROOT/analisis_explorado/analisis/backend/.env.example" "$BUILD_DIR/backend/config/" 2>/dev/null || true

# Copiar scripts de base de datos
mkdir -p "$BUILD_DIR/database"
cp "$PROJECT_ROOT/analisis_explorado/analisis/database/"*.sql "$BUILD_DIR/database/" 2>/dev/null || true

# Crear archivo de versión
print_status "Generando archivo de versión..."
cat > "$BUILD_DIR/VERSION" << EOF
SISTEMA RAG CON GESTIÓN DE PRIVACIDAD
====================================
Fecha de build: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Commit: $(git rev-parse HEAD 2>/dev/null || echo "N/A")
Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A")
Node.js: $(node -v)
Frontend build: $(ls -la "$FRONTEND_DIR/dist" 2>/dev/null | grep -c "^d" || echo "0") directorios
EOF

echo ""

# -----------------------------------------------------------------------------
# Resumen
# -----------------------------------------------------------------------------
echo "=========================================="
echo "  BUILD COMPLETADO EXITOSAMENTE"
echo "=========================================="
echo ""
print_status "Directorio de distribución: $BUILD_DIR"
echo ""
echo "Contenido del build:"
echo "  - frontend/: Aplicación Vue.js compilada"
echo "  - backend/: Código fuente del servidor Node.js"
echo "  - database/: Scripts de base de datos"
echo "  - config/: Archivos de configuración"
echo ""
print_warning "Próximos pasos:"
echo "  1. Configurar variables de entorno en $BUILD_DIR/backend/.env"
echo "  2. Ejecutar migraciones de base de datos"
echo "  3. Desplegar usando scripts de despliegue"
echo ""
