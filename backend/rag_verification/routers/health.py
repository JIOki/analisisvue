
from fastapi import APIRouter
from datetime import datetime
import time
import logging
import sys
from pathlib import Path

# Asegurar que la carpeta principal este en el path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from models import HealthResponse
from services.verification import DatabaseManager, OllamaEmbedder

logger = logging.getLogger(__name__)

router = APIRouter()

# Tiempo de inicio del servicio
start_time = time.time()


@router.get("/", response_model=HealthResponse)
async def health_check():
    """
    Verificacion de salud completa del servicio
    
    Checks:
    - Conexion a base de datos PostgreSQL
    - Conexion a Ollama para embeddings
    - Informacion de version
    - Tiempo de actividad
    """
    db_healthy = False
    ollama_healthy = False
    
    try:
        # Verificar base de datos
        db = DatabaseManager()
        db_healthy = db.test_connection()
        db.close()
    except Exception as e:
        logger.error(f"Error verificando DB: {e}")
    
    try:
        # Verificar Ollama
        embedder = OllamaEmbedder()
        ollama_healthy = embedder.test_connection()
    except Exception as e:
        logger.error(f"Error verificando Ollama: {e}")
    
    # Calcular tiempo de actividad
    uptime = time.time() - start_time
    
    # Determinar estado general
    if db_healthy and ollama_healthy:
        status = "healthy"
    elif db_healthy or ollama_healthy:
        status = "degraded"
    else:
        status = "unhealthy"
    
    return HealthResponse(
        status=status,
        database=db_healthy,
        ollama=ollama_healthy,
        version="1.0.0",
        uptime_seconds=round(uptime, 2),
        config={
            "embedding_model": "nomic-embed-text",
            "similarity_threshold": 0.7,
            "top_k": 5
        }
    )


@router.get("/live")
async def liveness():
    """
    Endpoint de liveness para Kubernetes/Load Balancers
    
    Returns 200 si el servicio esta vivo
    """
    return {"status": "alive", "timestamp": datetime.utcnow()}


@router.get("/ready")
async def readiness():
    """
    Endpoint de readiness para Kubernetes
    
    Returns 200 si el servicio esta listo para recibir trafico
    """
    try:
        # Verificar que podemos hacer operaciones basicas
        db = DatabaseManager()
        db_ok = db.test_connection()
        db.close()
        
        if db_ok:
            return {"status": "ready", "timestamp": datetime.utcnow()}
        else:
            return {"status": "not ready", "reason": "Database unavailable"}
            
    except Exception as e:
        return {"status": "not ready", "reason": str(e)}
