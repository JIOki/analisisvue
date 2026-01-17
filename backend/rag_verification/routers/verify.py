"""
Router de Verificacion RAG
Endpoints para verificar la veracidad de respuestas del modelo
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import time
import logging
import sys
from pathlib import Path

# Asegurar que la carpeta principal este en el path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from models import (
    VerificationRequest, VerificationResponse,
    SourceSearchRequest, SourceSearchResponse,
    ConfidenceCheckRequest, ConfidenceCheckResponse,
    ConfidenceLevel, VerificationStatus
)
from services.verification import VerificationService

logger = logging.getLogger(__name__)

router = APIRouter()

# Instancia global del servicio (lazy initialization)
_verification_service: Optional[VerificationService] = None


def get_verification_service() -> VerificationService:
    """Obtiene o crea el servicio de verificacion"""
    global _verification_service
    if _verification_service is None:
        _verification_service = VerificationService()
    return _verification_service


@router.post("/response", response_model=VerificationResponse)
async def verify_response(request: VerificationRequest):
    """
    Verifica la veracidad de una respuesta del modelo AI
    
    Este endpoint analiza una respuesta generada por el modelo y verifica
    que tan bien esta respaldada por las fuentes de conocimiento disponibles.
    
    Returns:
        - Estado de verificacion (verified/partial/unverified)
        - Puntuacion de confianza (0-1)
        - Metricas detalladas
        - Fuentes utilizadas
        - Analisis de afirmaciones
    """
    start_time = time.time()
    
    try:
        service = get_verification_service()
        
        result = service.verify_response(
            query=request.query,
            response=request.response,
            linked_material_ids=request.linked_material_ids,
            user_id=request.user_id,
            conversation_id=request.conversation_id,
            context_chunks=request.context_chunks,
            context_text=request.context_text
        )
        
        logger.info(
            f"Verificacion completada en {result.processing_time_ms:.2f}ms - "
            f"Confianza: {result.confidence_score:.2f} ({result.confidence_level.value})"
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error en verificacion: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error durante la verificacion: {str(e)}"
        )


@router.post("/confidence", response_model=ConfidenceCheckResponse)
async def check_confidence(request: ConfidenceCheckRequest):
    """
    Verificacion rapida de confianza
    
    Endpoint ligero para obtener rapidamente la puntuacion de confianza
    de una respuesta sin el analisis detallado de afirmaciones.
    
    Util para verificar multiples respuestas rapidamente.
    """
    start_time = time.time()
    
    try:
        service = get_verification_service()
        
        # Buscar fuentes relevantes
        source_chunks, _ = service.search_sources(
            query=request.query,
            top_k=5
        )
        
        # Calcular similitudes
        if source_chunks:
            similarities = [s.similarity for s in source_chunks]
            max_sim = max(similarities)
            avg_sim = sum(similarities) / len(similarities)
        else:
            max_sim = 0.0
            avg_sim = 0.0
        
        # Determinar confianza
        threshold = request.threshold or service.claim_analyzer.threshold
        confidence_score = avg_sim
        
        if confidence_score >= 0.8:
            level = ConfidenceLevel.ALTA
            is_reliable = True
            recommendation = "La respuesta tiene alto respaldo en las fuentes."
        elif confidence_score >= 0.6:
            level = ConfidenceLevel.MEDIA
            is_reliable = True
            recommendation = "La respuesta esta parcialmente respaldada. Verificar detalles importantes."
        elif confidence_score >= 0.4:
            level = ConfidenceLevel.BAJA
            is_reliable = False
            recommendation = "La respuesta tiene poco respaldo. Se recomienda verificar con fuentes adicionales."
        else:
            level = ConfidenceLevel.NULA
            is_reliable = False
            recommendation = "La respuesta no tiene respaldo en las fuentes consultadas."
        
        return ConfidenceCheckResponse(
            confidence_score=confidence_score,
            confidence_level=level,
            is_reliable=is_reliable,
            top_similarities=[
                {
                    "source_id": s.source_id,
                    "source_title": s.source_title,
                    "similarity": s.similarity
                }
                for s in source_chunks[:3]
            ],
            recommendation=recommendation
        )
        
    except Exception as e:
        logger.error(f"Error en check_confidence: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error verificando confianza: {str(e)}"
        )


@router.get("/sources", response_model=SourceSearchResponse)
async def search_sources(
    q: str = Query(..., description="Consulta de busqueda", min_length=1),
    top_k: int = Query(5, ge=1, le=20, description="Numero de resultados"),
    source_ids: Optional[str] = Query(
        None, 
        description="IDs de fuentes separados por coma"
    ),
    user_id: Optional[str] = Query(None, description="ID del usuario")
):
    """
    Busca fuentes de conocimiento para una consulta
    
    Utilizado para verificar que informacion esta disponible en las fuentes
    antes de o durante una conversacion.
    """
    start_time = time.time()
    
    try:
        service = get_verification_service()
        
        # Parsear source_ids si viene como string
        source_list = None
        if source_ids:
            source_list = source_ids.split(",")
        
        source_chunks, processing_time = service.search_sources(
            query=q,
            top_k=top_k,
            source_ids=source_list,
            user_id=user_id
        )
        
        return SourceSearchResponse(
            query=q,
            total_found=len(source_chunks),
            chunks=source_chunks,
            processing_time_ms=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error buscando fuentes: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error buscando fuentes: {str(e)}"
        )


@router.post("/batch", response_model=list[VerificationResponse])
async def verify_batch(requests: list[VerificationRequest]):
    """
    Verificacion en lote
    
    Verifica multiples respuestas en una sola llamada.
    Util para analisis de calidad de respuestas historicas.
    
    Limite: maximo 50 items por llamada.
    """
    if len(requests) > 50:
        raise HTTPException(
            status_code=400,
            detail="Maximo 50 items por llamada"
        )
    
    results = []
    
    try:
        service = get_verification_service()
        
        for req in requests:
            result = service.verify_response(
                query=req.query,
                response=req.response,
                linked_material_ids=req.linked_material_ids,
                user_id=req.user_id
            )
            results.append(result)
        
        logger.info(f"Verificacion en lote completada: {len(results)} items")
        
        return results
        
    except Exception as e:
        logger.error(f"Error en verificacion en lote: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error en verificacion en lote: {str(e)}"
        )


@router.get("/stats")
async def get_verification_stats():
    """
    Obtiene estadisticas del servicio de verificacion
    
    Returns:
        - Total de verificaciones realizadas
        - Distribucion por nivel de confianza
        - Tiempos promedio de procesamiento
    """
    
    return {
        "service": "RAG Verification Service",
        "version": "1.0.0",
        "metrics": {
            "total_verifications": 0,
            "avg_confidence": 0.0,
            "distribution": {
                "alta": 0,
                "media": 0,
                "baja": 0,
                "nula": 0
            },
            "avg_processing_time_ms": 0.0
        },
        "config": {
            "similarity_threshold": 0.7,
            "top_k_results": 5,
            "embedding_model": "nomic-embed-text"
        }
    }
