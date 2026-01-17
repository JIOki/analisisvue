# Sistema RAG - Chat Inteligente

## Descripción

Sistema de **Generación Aumentada por Recuperación (RAG)** que permite a los usuarios cargar documentos, procesarlos mediante inteligencia artificial y realizar consultas conversacionales sobre el contenido. El sistema utiliza modelos de IA ejecutados localmente a través de Ollama, proporcionando mayor privacidad y control sobre los datos procesados.

## Características Principales

- **Carga de Documentos**: Soporte para múltiples formatos (PDF, Word, Excel, CSV, texto plano)
- **Procesamiento Inteligente**: Fragmentación de documentos y generación de embeddings vectoriales
- **Chat Conversacional**: Interfaz de chat para realizar preguntas sobre los documentos cargados
- **Sistema de Autenticación**: Registro e inicio de sesión seguro con JWT
- **Búsqueda Semántica**: Recuperación de información relevante basada en similitud vectorial
- **Calificación de Respuestas**: Sistema de ratings para evaluar la utilidad de las respuestas

## Requisitos del Sistema

- Node.js 18+ y npm
- PostgreSQL 16+ con extensión pgvector
- Ollama con modelos nomic-embed-text y llama3.2
- Docker y Docker Compose (opcional, para despliegue)

## Instalación Rápida

### Opción 1: Con Docker (Recomendado para Producción)

```bash
# Clonar o descomprimir el proyecto
cd sistema-rag

# Iniciar todos los servicios
docker-compose up -d

# Verificar que todos los servicios estén corriendo
docker-compose ps

# Ver logs
docker-compose logs -f
```

### Opción 2: Desarrollo Local

#### 1. Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontendvite
npm install
```

#### 2. Iniciar Servicios Externos

```bash
# Iniciar PostgreSQL con pgvector
docker run -d \
  --name rag_postgres \
  -e POSTGRES_USER=raguser \
  -e POSTGRES_PASSWORD=ragpass \
  -e POSTGRES_DB=ragdb \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  pgvector/pgvector:pg16

# Iniciar Ollama
docker run -d \
  --name rag_ollama \
  -p 11434:11434 \
  -v ollama_data:/root/.ollama \
  ollama/ollama:latest

# Descargar modelos de IA
docker exec rag_ollama ollama pull nomic-embed-text
docker exec rag_ollama ollama pull llama3.2
```

#### 3. Inicializar Base de Datos

```bash
# Ejecutar script de inicialización
cd ../scripts
./init-db.sh

# O directamente con psql
psql -h localhost -U raguser -d ragdb -f ../database/init.sql
```

#### 4. Iniciar Aplicación

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontendvite
npm run dev
```

## Credenciales de Acceso

### Usuario Administrador (Creado por Defecto)

```
Email: admin@sistema-rag.local
Password: admin123
```

**IMPORTANTE**: Cambiar la contraseña en el primer inicio de sesión.

### Crear Nuevos Usuarios

1. Acceder a `/auth/register`
2. Completar el formulario de registro
3. El usuario quedará automáticamente autenticado

## Estructura del Proyecto

```
sistema-rag/
├── backend/                    # Servidor Node.js/Express
│   ├── src/
│   │   ├── index.js           # Punto de entrada
│   │   ├── db.js              # Conexión a PostgreSQL
│   │   ├── ollama.js          # Integración con Ollama
│   │   ├── middleware/        # Middlewares (auth, etc.)
│   │   ├── routes/            # Rutas de API
│   │   ├── Models/            # Modelos de datos
│   │   └── utils/             # Utilidades
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── frontendvite/              # Aplicación Vue 3
│   ├── src/
│   │   ├── Views/             # Vistas de la aplicación
│   │   ├── components/        # Componentes reutilizables
│   │   ├── layout/            # Layout principal
│   │   ├── router/            # Configuración de rutas
│   │   ├── stores/            # Stores Pinia (estado)
│   │   └── service/           # Servicios API
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── database/
│   └── init.sql               # Script de inicialización BD
│
├── scripts/
│   └── init-db.sh             # Script de inicialización
│
└── docker-compose.yml         # Orquestación Docker
```

## Configuración

### Variables de Entorno (Backend)

Copiar `backend/.env.example` a `backend/.env` y configurar:

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=raguser
DB_NAME=ragdb
DB_PASS=ragpass

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
EMBEDDING_MODEL=nomic-embed-text
LLM_MODEL=llama3.2

# JWT
JWT_SECRET=tu-secret-seguro-aqui
JWT_EXPIRES_IN=24h
```

### Variables de Entorno (Frontend)

Copiar `frontendvite/.env.example` a `frontendvite/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

## Uso de la Aplicación

### 1. Subir Documentos

1. Iniciar sesión con credenciales de administrador
2. Navegar a "Subir Teoría" o "Subir Casos de Uso"
3. Arrastrar o seleccionar archivos
4. El sistema procesará automáticamente el documento

### 2. Chat Inteligente

1. Acceder a "Análisis Inteligente"
2. Los documentos cargados se seleccionan automáticamente
3. Escribir preguntas sobre el contenido
4. Las respuestas se generan basándose en los documentos

### 3. Calificar Respuestas

- Cada respuesta del asistente tiene botones de calificación
- Los ratings ayudan a mejorar la calidad del sistema

## API Endpoints

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar nuevo usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/profile` | Obtener perfil |
| PUT | `/api/auth/profile` | Actualizar perfil |
| PUT | `/api/auth/change-password` | Cambiar contraseña |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/verify` | Verificar token |

### Documentos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/material/upload` | Subir documento |
| GET | `/api/material` | Listar documentos |
| GET | `/api/material/:id` | Obtener documento |
| DELETE | `/api/material/:id` | Eliminar documento |

### Chat

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/chat` | Enviar mensaje |
| POST | `/api/chat/upload-documents` | Subir documentos al chat |
| GET | `/api/chat/:id/documents` | Obtener documentos del chat |

### Conversaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/conversations/start` | Iniciar conversación |
| GET | `/api/conversations/:id` | Obtener conversación |
| GET | `/api/conversations/:id/messages` | Obtener mensajes |

## Solución de Problemas

### Error de Conexión a Base de Datos

```bash
# Verificar que PostgreSQL esté corriendo
pg_isready -h localhost -p 5432 -U raguser

# Verificar credenciales en .env
cat backend/.env
```

### Ollama No Responde

```bash
# Verificar que Ollama esté corriendo
curl http://localhost:11434/api/version

# Verificar modelos instalados
ollama list
```

### Error 401 (No Autorizado)

- Verificar que el token no haya expirado
- Cerrar sesión y volver a iniciar
- Verificar que el JWT_SECRET sea correcto

### Documentos No se Procesan

- Verificar que el archivo no exceda 10MB
- Verificar formato soportado (PDF, DOCX, XLSX, CSV, TXT)
- Revisar logs del backend

## Despliegue en Producción

### Con Docker

```bash
# Build y start
docker-compose up -d --build

# Escalar si es necesario
docker-compose up -d --scale backend=2
```

### Sin Docker

1. Configurar variables de entorno de producción
2. Build del frontend: `cd frontendvite && npm run build`
3. Configurar Nginx para servir frontend y proxy a backend
4. Usar un process manager como PM2 para el backend

## Licencia

Este proyecto está bajo la licencia MIT.

## Soporte

Para problemas o consultas, revisar la documentación o contactar al equipo de desarrollo.
