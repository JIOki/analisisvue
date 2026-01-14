"""
Main Entry Point para el Servicio de Verificación RAG
Microservicio FastAPI para evaluar la veracidad de respuestas del modelo
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import sys
from pathlib import Path

# Agregar el directorio actual al path
sys.path.insert(0, str(Path(__file__).parent))

from config import settings
from routers import verify, health

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestiona el ciclo de vida de la aplicación"""
    # Startup
    logger.info("🚀 Iniciando servicio de verificación RAG...")
    logger.info(f"📊 Conectando a base de datos: {settings.db_host}:{settings.db_port}")
    logger.info(f"🤖 Modelo de embedding: {settings.embedding_model}")
    logger.info(f"🎯 Umbral de similitud: {settings.similarity_threshold}")
    yield
    # Shutdown
    logger.info("🛑 Deteniendo servicio de verificación RAG...")


# Crear aplicación FastAPI
app = FastAPI(
    title="RAG Verification Service",
    description="Microservicio para verificar la veracidad de respuestas generadas por IA",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar los orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(verify.router, prefix="/api/v1/verify", tags=["Verification"])


@app.get("/", tags=["Root"])
async def root():
    """Endpoint raíz"""
    return {
        "service": "RAG Verification Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
