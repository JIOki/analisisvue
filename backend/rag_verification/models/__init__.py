"""
Modelos Pydantic para el Servicio de Verificación RAG
Definición de schemas para requests y responses
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class ConfidenceLevel(str, Enum):
    """Niveles de confianza para las respuestas"""
    ALTA = "alta"
    MEDIA = "media"
    BAJA = "baja"
    NULA = "nula"


class VerificationStatus(str, Enum):
    """Estado de la verificación"""
    VERIFIED = "verified"
    PARTIAL = "partial"
    UNVERIFIED = "unverified"
    ERROR = "error"


# ============================================
# Modelos de Request
# ============================================

class VerificationRequest(BaseModel):
    """Request para verificar una respuesta"""
    query: str = Field(..., description="Pregunta original del usuario", min_length=1)
    response: str = Field(..., description="Respuesta generada por el modelo", min_length=1)
    conversation_id: Optional[str] = Field(None, description="ID de la conversación")
    user_id: Optional[str] = Field(None, description="ID del usuario")
    linked_material_ids: Optional[List[str]] = Field(
        default=None, 
        description="IDs de materiales vinculados a la conversación"
    )
    # Chunks de contexto para verificación directa (sin buscar en BD)
    context_chunks: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Chunks de contexto recuperados para verificación directa"
    )
    context_text: Optional[str] = Field(
        default=None,
        description="Texto de contexto combinado para verificación"
    )


class BatchVerificationRequest(BaseModel):
    """Request para verificación en lote"""
    items: List[VerificationRequest] = Field(
        ..., 
        description="Lista de items a verificar",
        max_length=50
    )


class SourceSearchRequest(BaseModel):
    """Request para buscar fuentes"""
    query: str = Field(..., description="Consulta a buscar", min_length=1)
    top_k: int = Field(default=5, ge=1, le=20, description="Número de resultados")
    source_ids: Optional[List[str]] = Field(
        default=None, 
        description="Filtrar por fuentes específicas"
    )


class ConfidenceCheckRequest(BaseModel):
    """Request para verificar confianza de una respuesta"""
    query: str = Field(..., description="Pregunta original")
    response: str = Field(..., description="Respuesta a verificar")
    threshold: Optional[float] = Field(
        default=None, 
        ge=0, 
        le=1, 
        description="Umbral de similitud personalizado"
    )


# ============================================
# Modelos de Response
# ============================================

class SourceChunk(BaseModel):
    """Fragmento de fuente encontrado"""
    id: str = Field(..., description="ID del chunk")
    content: str = Field(..., description="Contenido del fragmento")
    source_id: str = Field(..., description="ID de la fuente")
    source_title: str = Field(..., description="Título de la fuente")
    similarity: float = Field(..., description="Similitud con la query", ge=0, le=1)
    chunk_index: Optional[int] = Field(None, description="Índice del chunk")


class ClaimEvidence(BaseModel):
    """Evidencia para una afirmación en la respuesta"""
    claim: str = Field(..., description="Afirmación extraída")
    supporting_sources: List[SourceChunk] = Field(
        default_factory=list,
        description="Fuentes que respaldan la afirmación"
    )
    confidence: float = Field(
        ..., 
        description="Confianza de la afirmación",
        ge=0, 
        le=1
    )
    evidence_quality: ConfidenceLevel = Field(
        ..., 
        description="Calidad de la evidencia"
    )


class VerificationMetrics(BaseModel):
    """Métricas de verificación"""
    overall_confidence: float = Field(
        ..., 
        description="Confianza general de la respuesta",
        ge=0, 
        le=1
    )
    confidence_level: ConfidenceLevel = Field(..., description="Nivel de confianza textual")
    supported_claims: int = Field(..., description="Número de afirmaciones respaldadas")
    unsupported_claims: int = Field(..., description="Número de afirmaciones no respaldadas")
    total_evidence_sources: int = Field(..., description="Total de fuentes utilizadas")
    max_similarity: float = Field(..., description="Similitud máxima encontrada")
    avg_similarity: float = Field(..., description="Similitud promedio")
    threshold_used: float = Field(..., description="Umbral de similitud utilizado")


class VerificationResponse(BaseModel):
    """Response de verificación completa"""
    status: VerificationStatus = Field(..., description="Estado de la verificación")
    query: str = Field(..., description="Pregunta verificada")
    response: str = Field(..., description="Respuesta verificada")
    confidence_score: float = Field(..., description="Puntuación de confianza", ge=0, le=1)
    confidence_level: ConfidenceLevel = Field(..., description="Nivel de confianza")
    
    # Métricas detalladas
    metrics: VerificationMetrics = Field(..., description="Métricas de verificación")
    
    # Fuentes utilizadas
    relevant_sources: List[SourceChunk] = Field(
        default_factory=list,
        description="Fuentes relevantes encontradas"
    )
    
    # Análisis de afirmaciones
    claims_analysis: List[ClaimEvidence] = Field(
        default_factory=list,
        description="Análisis de afirmaciones en la respuesta"
    )
    
    # Advertencias
    warnings: List[str] = Field(
        default_factory=list,
        description="Advertencias sobre la respuesta"
    )
    
    # Metadatos
    processing_time_ms: float = Field(..., description="Tiempo de procesamiento")
    model_version: str = Field(..., description="Versión del modelo de verificación")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SourceSearchResponse(BaseModel):
    """Response de búsqueda de fuentes"""
    query: str = Field(..., description="Consulta realizada")
    total_found: int = Field(..., description="Total de chunks encontrados")
    chunks: List[SourceChunk] = Field(..., description="Chunks encontrados")
    processing_time_ms: float = Field(..., description="Tiempo de procesamiento")


class ConfidenceCheckResponse(BaseModel):
    """Response de verificación de confianza"""
    confidence_score: float = Field(..., description="Puntuación de confianza", ge=0, le=1)
    confidence_level: ConfidenceLevel = Field(..., description="Nivel de confianza")
    is_reliable: bool = Field(..., description="Si la respuesta es confiable")
    top_similarities: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Similitudes top encontradas"
    )
    recommendation: str = Field(..., description="Recomendación sobre la respuesta")


class HealthResponse(BaseModel):
    """Response de verificación de salud del servicio"""
    status: str = Field(..., description="Estado general")
    database: bool = Field(..., description="Conexión a base de datos")
    ollama: bool = Field(..., description="Conexión a Ollama")
    version: str = Field(..., description="Versión del servicio")
    uptime_seconds: float = Field(..., description="Tiempo activo")
    config: Dict[str, Any] = Field(default_factory=dict, description="Configuración activa")
