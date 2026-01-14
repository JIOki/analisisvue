"""
Servicio de Verificacion RAG
Logica principal para verificar la veracidad de respuestas del modelo
"""

import numpy as np
import time
import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import json
import sys
from pathlib import Path
from datetime import datetime

# Asegurar que la carpeta principal este en el path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from config import settings
from models import (
    SourceChunk, ClaimEvidence, ConfidenceLevel, VerificationStatus,
    VerificationMetrics, VerificationResponse
)

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    """Resultado de busqueda semantica"""
    id: str
    content: str
    source_id: str
    source_title: str
    similarity: float
    chunk_index: Optional[int] = None


class DatabaseManager:
    """Gestor de conexion a base de datos"""
    
    def __init__(self):
        self.engine = create_engine(
            settings.database_url,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True
        )
        self.SessionLocal = sessionmaker(
            autocommit=False, 
            autoflush=False, 
            bind=self.engine
        )
    
    def test_connection(self) -> bool:
        """Prueba la conexion a la base de datos"""
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error(f"Error conectando a DB: {e}")
            return False
    
    def close(self):
        """Cierra las conexiones"""
        self.engine.dispose()
    
    def semantic_search(
        self, 
        query_embedding: List[float], 
        top_k: int = 5,
        source_ids: Optional[List[str]] = None,
        user_id: Optional[str] = None
    ) -> List[SearchResult]:
        """
        Realiza busqueda semantica en la base de datos
        
        Args:
            query_embedding: Vector de embedding de la query
            top_k: Numero de resultados a devolver
            source_ids: Filtrar por fuentes especificas
            user_id: ID del usuario para filtros de privacidad
            
        Returns:
            Lista de SearchResult ordenados por similitud
        """
        try:
            with self.engine.connect() as conn:
                embedding_json = json.dumps(query_embedding)
                
                # Query base con filtros de privacidad
                base_query = """
                    SELECT 
                        c.id, c.content, c.source_id, c.chunk_index,
                        s.title as source_title,
                        1 - (c.embedding <=> :embedding) as similarity
                    FROM chunks c
                    JOIN sources s ON c.source_id = s.id
                    WHERE s.is_deleted = FALSE
                """
                
                params = {"embedding": embedding_json}
                
                # Agregar filtro de fuentes si se especifica
                if source_ids and len(source_ids) > 0:
                    # Convertir strings a UUIDs para comparar con s.id (tipo uuid)
                    # Usamos CAST en lugar de :: porque SQLAlchemy no permite :: en placeholders
                    import uuid
                    try:
                        uuid_source_ids = [uuid.UUID(sid) for sid in source_ids]
                    except ValueError:
                        # Si no son UUIDs válidos, usar strings
                        uuid_source_ids = source_ids
                    base_query += " AND s.id = ANY(CAST(:source_ids AS uuid[]))"
                    params["source_ids"] = uuid_source_ids
                
                # Agregar filtro de privacidad del usuario
                if user_id:
                    base_query += """
                        AND (
                            s.user_id = :user_id
                            OR s.is_public_for_ai = true
                            OR s.id IN (
                                SELECT material_id FROM material_shares
                                WHERE shared_with_user_id = :user_id
                                AND status = 'active'
                                AND (expires_at IS NULL OR expires_at > NOW())
                            )
                        )
                    """
                    params["user_id"] = user_id
                
                # Ordenar y limitar
                base_query += """
                    ORDER BY c.embedding <=> :embedding
                    LIMIT :limit
                """
                params["limit"] = top_k
                
                result = conn.execute(
                    text(base_query),
                    params
                )
                
                results = []
                for row in result:
                    results.append(SearchResult(
                        id=str(row[0]),
                        content=row[1],
                        source_id=str(row[2]),
                        source_title=row[4],
                        similarity=float(row[5]),
                        chunk_index=row[3]
                    ))
                
                return results
                
        except Exception as e:
            logger.error(f"Error en busqueda semantica: {e}")
            return []
    
    def search_with_privacy(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        linked_material_ids: Optional[List[str]] = None,
        user_id: Optional[str] = None
    ) -> List[SearchResult]:
        """
        Busca chunks considerando materiales vinculados y privacidad
        
        Args:
            query_embedding: Vector de embedding
            top_k: Numero de resultados
            linked_material_ids: IDs de materiales vinculados (maxima prioridad)
            user_id: ID del usuario para filtros adicionales
            
        Returns:
            Lista de SearchResult
        """
        # Estrategia: Primero buscar en materiales vinculados, luego expandir
        all_results = []
        seen_ids = set()
        
        # 1. Buscar en materiales vinculados (si existen)
        if linked_material_ids and len(linked_material_ids) > 0:
            linked_results = self.semantic_search(
                query_embedding,
                top_k=top_k,
                source_ids=linked_material_ids,
                user_id=user_id
            )
            for r in linked_results:
                if r.id not in seen_ids:
                    all_results.append(r)
                    seen_ids.add(r.id)
        
        # 2. Si necesitamos mas resultados, buscar en todo el contenido accesible
        if len(all_results) < top_k:
            remaining_k = top_k - len(all_results)
            other_results = self.semantic_search(
                query_embedding,
                top_k=remaining_k,
                source_ids=None,  # Buscar en todo
                user_id=user_id
            )
            for r in other_results:
                if r.id not in seen_ids:
                    all_results.append(r)
                    seen_ids.add(r.id)
        
        return all_results[:top_k]


class OllamaEmbedder:
    """Wrapper para generacion de embeddings con Ollama"""
    
    def __init__(self):
        self.model = settings.embedding_model
        self.url = settings.ollama_url
        self._client = None
    
    def _get_client(self):
        """Obtiene el cliente de Ollama"""
        if self._client is None:
            try:
                import ollama
                self._client = ollama.Client(host=self.url)
            except ImportError:
                raise ImportError(
                    "La libreria 'ollama' no esta instalada. "
                    "Ejecuta: pip install ollama"
                )
        return self._client
    
    def test_connection(self) -> bool:
        """Prueba la conexion con Ollama"""
        try:
            client = self._get_client()
            response = client.embed(model=self.model, input=["test"])
            return len(response.embeddings) > 0
        except Exception as e:
            logger.error(f"Error conectando a Ollama: {e}")
            return False
    
    def embed_text(self, text: str) -> List[float]:
        """
        Genera embedding para un texto
        
        Args:
            text: Texto a embeber
            
        Returns:
            Vector de embedding
        """
        try:
            client = self._get_client()
            response = client.embed(model=self.model, input=text)
            embedding = response.embeddings[0]
            
            # Normalizar el vector
            embedding_array = np.array(embedding, dtype=np.float32)
            norm = np.linalg.norm(embedding_array)
            if norm > 0:
                embedding_array = embedding_array / norm
            
            return embedding_array.tolist()
            
        except Exception as e:
            logger.error(f"Error generando embedding: {e}")
            raise
    
    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """
        Genera embeddings para multiples textos
        
        Args:
            texts: Lista de textos
            
        Returns:
            Matriz de embeddings
        """
        if not texts:
            return np.array([]).reshape(0, 1024)  # Default dimension
        
        try:
            client = self._get_client()
            response = client.embed(model=self.model, input=texts)
            
            embeddings = np.array(response.embeddings, dtype=np.float32)
            
            # Normalizar
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            norms = np.where(norms == 0, 1, norms)
            embeddings = embeddings / norms
            
            return embeddings
            
        except Exception as e:
            logger.error(f"Error generando embeddings: {e}")
            raise


class ClaimAnalyzer:
    """Analizador de afirmaciones en respuestas"""
    
    def __init__(self, similarity_threshold: float = 0.7):
        self.threshold = similarity_threshold
    
    def extract_claims(self, response: str) -> List[str]:
        """
        Extrae afirmaciones principales de la respuesta
        
        Args:
            response: Texto de la respuesta
            
        Returns:
            Lista de afirmaciones
        """
        # Dividir en oraciones
        sentences = response.replace('!', '.').replace('?', '.').split('.')
        
        claims = []
        for sentence in sentences:
            sentence = sentence.strip()
            # Filtrar oraciones muy cortas o vacias
            if len(sentence) > 20:
                claims.append(sentence)
        
        return claims
    
    def calculate_claim_confidence(
        self, 
        claim: str, 
        sources: List[SourceChunk]
    ) -> Tuple[float, ConfidenceLevel]:
        """
        Calcula la confianza de una afirmacion basada en las fuentes
        
        Args:
            claim: Afirmacion a verificar
            sources: Fuentes disponibles
            
        Returns:
            Tupla de (confianza_numerica, nivel_texto)
        """
        if not sources:
            return 0.0, ConfidenceLevel.NULA
        
        # Calcular similitud promedio de las fuentes
        similarities = [s.similarity for s in sources]
        avg_sim = np.mean(similarities)
        max_sim = max(similarities)
        
        # Determinar nivel de confianza
        if avg_sim >= self.threshold and max_sim >= self.threshold:
            if avg_sim >= 0.85:
                level = ConfidenceLevel.ALTA
            else:
                level = ConfidenceLevel.MEDIA
        elif max_sim >= self.threshold:
            level = ConfidenceLevel.MEDIA
        elif any(s.similarity >= self.threshold - 0.1 for s in sources):
            level = ConfidenceLevel.BAJA
        else:
            level = ConfidenceLevel.NULA
        
        return avg_sim, level


class VerificationService:
    """Servicio principal de verificacion"""
    
    def __init__(self):
        self.db = DatabaseManager()
        self.embedder = OllamaEmbedder()
        self.claim_analyzer = ClaimAnalyzer(settings.similarity_threshold)
        self.model_version = "1.0.0"
    
    def verify_response(
        self,
        query: str,
        response: str,
        linked_material_ids: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        context_chunks: Optional[List[Dict[str, Any]]] = None,
        context_text: Optional[str] = None
    ) -> VerificationResponse:
        """
        Verifica la veracidad de una respuesta del modelo
        
        Args:
            query: Pregunta original
            response: Respuesta generada por el modelo
            linked_material_ids: IDs de materiales vinculados
            user_id: ID del usuario
            conversation_id: ID de la conversacion
            context_chunks: Chunks de contexto directamente del frontend (prioridad)
            context_text: Texto de contexto combinado
            
        Returns:
            VerificationResponse con el analisis completo
        """
        start_time = time.time()
        warnings = []
        
        try:
            # Configuracion de limites para evitar errores de contexto
            MAX_CHUNKS = 5
            MAX_CHUNK_LENGTH = 1000 # Reducido para permitir batches
            BATCH_SIZE = 1  # Procesar en batches pequenos
            
            # 1. Si hay context_chunks del frontend, usarlos directamente
            if context_chunks and len(context_chunks) > 0:
                logger.info(f"Recibidos {len(context_chunks)} chunks de contexto")
                
                # Limitar a maximo 5 chunks
                context_chunks = context_chunks[:MAX_CHUNKS]
                logger.info(f"Limitados a {len(context_chunks)} chunks para procesamiento")
                
                source_chunks = []
                for i, chunk in enumerate(context_chunks):
                    # Truncar contenido si es muy largo
                    content = chunk.get('content', '')
                    if len(content) > MAX_CHUNK_LENGTH:
                        original_len = len(content)
                        content = content[:MAX_CHUNK_LENGTH]
                        logger.info(f"Chunk {i} truncado de {original_len} a {len(content)} caracteres")
                    
                    source_chunks.append(SourceChunk(
                        id=chunk.get('id', f'chunk-{i}'),
                        content=content,
                        source_id=chunk.get('document_id', ''),
                        source_title=chunk.get('document_name', 'Documento'),
                        similarity=chunk.get('similarity', 0.0),
                        chunk_index=chunk.get('page', chunk.get('chunk_index', i))
                    ))
                
                # Calcular similitudes usando embeddings en batches
                if source_chunks:
                    logger.info(f"Calculando similitudes para {len(source_chunks)} chunks en batches de {BATCH_SIZE}...")
                    response_embedding = self.embedder.embed_text(response)
                    
                    # Procesar en batches pequenos
                    from sklearn.metrics.pairwise import cosine_similarity
                    all_similarities = []
                    
                    for i in range(0, len(source_chunks), BATCH_SIZE):
                        batch = source_chunks[i:i+BATCH_SIZE]
                        batch_texts = [c.content for c in batch]
                        
                        logger.info(f"Procesando batch {i//BATCH_SIZE + 1}: chunks {i} a {i+len(batch)-1}")
                        batch_embeddings = self.embedder.embed_texts(batch_texts)
                        
                        # Calcular similitudes para este batch
                        batch_sims = cosine_similarity([response_embedding], batch_embeddings)[0]
                        all_similarities.extend(batch_sims)
                    
                    # Asignar similitudes a los chunks
                    for i, chunk in enumerate(source_chunks):
                        chunk.similarity = float(all_similarities[i])
                
                relevant_chunks = source_chunks
                
            else:
                # 2. Si no hay context_chunks, buscar en la base de datos
                logger.info(f"Buscando fuentes en BD con linked_material_ids: {linked_material_ids}")
                logger.info(f"Generando embedding para query: {query[:50]}...")
                query_embedding = self.embedder.embed_text(query)
                
                # Buscar fuentes relevantes
                logger.info("Buscando fuentes relevantes en base de datos...")
                relevant_chunks_db = self.db.search_with_privacy(
                    query_embedding=query_embedding,
                    top_k=settings.top_k_results,
                    linked_material_ids=linked_material_ids,
                    user_id=user_id
                )
                
                # Convertir a SourceChunk
                source_chunks = [
                    SourceChunk(
                        id=chunk.id,
                        content=chunk.content,
                        source_id=chunk.source_id,
                        source_title=chunk.source_title,
                        similarity=chunk.similarity,
                        chunk_index=chunk.chunk_index
                    )
                    for chunk in relevant_chunks_db
                ]
            
            # 4. Calcular metricas
            if source_chunks:
                similarities = [s.similarity for s in source_chunks]
                max_similarity = max(similarities)
                avg_similarity = np.mean(similarities)
            else:
                max_similarity = 0.0
                avg_similarity = 0.0
                warnings.append("No se encontraron fuentes relevantes para verificar la respuesta")
            
            # 5. Analizar afirmaciones
            logger.info("Analizando afirmaciones en la respuesta...")
            claims = self.claim_analyzer.extract_claims(response)
            
            claims_analysis = []
            supported_claims = 0
            unsupported_claims = 0
            
            for claim in claims[:10]:  # Limitar a 10 afirmaciones
                # Buscar fuentes que respalden esta afirmacion
                claim_sources = [
                    s for s in source_chunks 
                    if s.similarity >= settings.similarity_threshold
                ]
                
                confidence, level = self.claim_analyzer.calculate_claim_confidence(
                    claim, claim_sources
                )
                
                if level in [ConfidenceLevel.ALTA, ConfidenceLevel.MEDIA]:
                    supported_claims += 1
                else:
                    unsupported_claims += 1
                
                claims_analysis.append(ClaimEvidence(
                    claim=claim,
                    supporting_sources=claim_sources[:3],  # Maximo 3 fuentes por claim
                    confidence=confidence,
                    evidence_quality=level
                ))
            
            # 6. Calcular confianza general
            if claims:
                overall_confidence = np.mean([
                    c.confidence for c in claims_analysis
                ])
            else:
                overall_confidence = avg_similarity
            
            # Determinar nivel textual
            if overall_confidence >= 0.8:
                confidence_level = ConfidenceLevel.ALTA
            elif overall_confidence >= 0.6:
                confidence_level = ConfidenceLevel.MEDIA
            elif overall_confidence >= 0.4:
                confidence_level = ConfidenceLevel.BAJA
            else:
                confidence_level = ConfidenceLevel.NULA
            
            # 7. Determinar estado de verificacion
            if confidence_level == ConfidenceLevel.ALTA and unsupported_claims == 0:
                status = VerificationStatus.VERIFIED
            elif confidence_level == ConfidenceLevel.NULA:
                status = VerificationStatus.UNVERIFIED
            else:
                status = VerificationStatus.PARTIAL
            
            # 8. Agregar advertencias si es necesario
            if max_similarity < settings.similarity_threshold:
                warnings.append(
                    f"La similitud maxima ({max_similarity:.2f}) esta por debajo "
                    f"del umbral ({settings.similarity_threshold})"
                )
            
            if unsupported_claims > supported_claims:
                warnings.append(
                    f"{unsupported_claims} afirmaciones no tienen suficiente respaldo en las fuentes"
                )
            
            # 9. Construir respuesta
            processing_time = (time.time() - start_time) * 1000
            
            metrics = VerificationMetrics(
                overall_confidence=overall_confidence,
                confidence_level=confidence_level,
                supported_claims=supported_claims,
                unsupported_claims=unsupported_claims,
                total_evidence_sources=len(set(s.source_id for s in source_chunks)),
                max_similarity=max_similarity,
                avg_similarity=avg_similarity,
                threshold_used=settings.similarity_threshold
            )
            
            return VerificationResponse(
                status=status,
                query=query,
                response=response,
                confidence_score=overall_confidence,
                confidence_level=confidence_level,
                metrics=metrics,
                relevant_sources=source_chunks,
                claims_analysis=claims_analysis,
                warnings=warnings,
                processing_time_ms=processing_time,
                model_version=self.model_version,
                timestamp=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Error en verificacion: {e}")
            processing_time = (time.time() - start_time) * 1000
            
            return VerificationResponse(
                status=VerificationStatus.ERROR,
                query=query,
                response=response,
                confidence_score=0.0,
                confidence_level=ConfidenceLevel.NULA,
                metrics=VerificationMetrics(
                    overall_confidence=0.0,
                    confidence_level=ConfidenceLevel.NULA,
                    supported_claims=0,
                    unsupported_claims=0,
                    total_evidence_sources=0,
                    max_similarity=0.0,
                    avg_similarity=0.0,
                    threshold_used=settings.similarity_threshold
                ),
                relevant_sources=[],
                claims_analysis=[],
                warnings=[f"Error durante la verificacion: {str(e)}"],
                processing_time_ms=processing_time,
                model_version=self.model_version,
                timestamp=datetime.utcnow()
            )
    
    def search_sources(
        self,
        query: str,
        top_k: int = 5,
        source_ids: Optional[List[str]] = None,
        user_id: Optional[str] = None
    ) -> Tuple[List[SourceChunk], float]:
        """
        Busca fuentes para una consulta especifica
        
        Args:
            query: Consulta de busqueda
            top_k: Numero de resultados
            source_ids: Filtrar por fuentes
            user_id: ID del usuario
            
        Returns:
            Tupla de (lista de SourceChunk, tiempo de procesamiento)
        """
        start_time = time.time()
        
        try:
            query_embedding = self.embedder.embed_text(query)
            chunks = self.db.semantic_search(
                query_embedding=query_embedding,
                top_k=top_k,
                source_ids=source_ids,
                user_id=user_id
            )
            
            source_chunks = [
                SourceChunk(
                    id=chunk.id,
                    content=chunk.content,
                    source_id=chunk.source_id,
                    source_title=chunk.source_title,
                    similarity=chunk.similarity,
                    chunk_index=chunk.chunk_index
                )
                for chunk in chunks
            ]
            
            processing_time = (time.time() - start_time) * 1000
            return source_chunks, processing_time
            
        except Exception as e:
            logger.error(f"Error buscando fuentes: {e}")
            return [], (time.time() - start_time) * 1000
    
    def close(self):
        """Cierra conexiones"""
        self.db.close()
