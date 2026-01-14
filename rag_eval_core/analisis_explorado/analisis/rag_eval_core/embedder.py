"""
Wrapper para el modelo de Embeddings de Ollama
Maneja la generación de embeddings usando el modelo mxbai-embed-large
"""

import numpy as np
from typing import List, Optional, Union
import logging
import time

from .config import config

logger = logging.getLogger(__name__)


class EmbeddingError(Exception):
    """Excepción personalizada para errores de embedding"""
    pass


class OllamaEmbedder:
    """Wrapper para el modelo de embeddings de Ollama"""
    
    def __init__(self, model: str = None, ollama_url: str = None):
        """
        Inicializa el embedder
        
        Args:
            model: Nombre del modelo de Ollama (default: mxbai-embed-large)
            ollama_url: URL base de Ollama (default: http://localhost:11434)
        """
        self.model = model or config.embedding.model
        self.ollama_url = ollama_url or config.embedding.ollama_url
        self._client = None
        self._embedding_dim = None
        
        logger.info(f"Inicializando OllamaEmbedder con modelo: {self.model}")
    
    def _get_client(self):
        """Obtiene o crea el cliente de Ollama"""
        if self._client is None:
            try:
                import ollama
                self._client = ollama.Client(host=self.ollama_url)
            except ImportError:
                raise EmbeddingError(
                    "La librería 'ollama' no está instalada. "
                    "Ejecuta: pip install ollama"
                )
            except Exception as e:
                raise EmbeddingError(f"Error conectando a Ollama: {e}")
        return self._client
    
    def test_connection(self) -> bool:
        """Prueba la conexión con Ollama"""
        try:
            client = self._get_client()
            response = client.embed(model=self.model, input=["test connection"])
            logger.info("Conexión con Ollama exitosa")
            return True
        except Exception as e:
            logger.error(f"Error conectando con Ollama: {e}")
            return False
    
    def embed_text(self, text: str) -> np.ndarray:
        """
        Genera el embedding para un texto individual
        
        Args:
            text: Texto a embeber
            
        Returns:
            Vector de embedding como numpy array
        """
        try:
            client = self._get_client()
            
            # Retry logic para manejar errores de conexión
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    response = client.embed(model=self.model, input=text)
                    embedding = np.array(response.embeddings[0], dtype=np.float32)
                    
                    if self._embedding_dim is None:
                        self._embedding_dim = len(embedding)
                    
                    return embedding
                    
                except Exception as e:
                    if attempt < max_retries - 1:
                        time.sleep(1)
                        logger.warning(f"Reintento {attempt + 1}/{max_retries}: {e}")
                    else:
                        raise EmbeddingError(f"Error generando embedding: {e}")
                        
        except Exception as e:
            logger.error(f"Error en embed_text: {e}")
            raise EmbeddingError(str(e))
    
    def embed_texts(self, texts: List[str], show_progress: bool = True) -> np.ndarray:
        """
        Genera embeddings para múltiples textos
        
        Args:
            texts: Lista de textos a embeber
            show_progress: Mostrar barra de progreso
            
        Returns:
            Matriz de embeddings (n_texts x dimension)
        """
        if not texts:
            return np.array([], dtype=np.float32).reshape(0, config.embedding.dimension)
        
        try:
            client = self._get_client()
            embeddings = []
            
            # Procesar en lotes para evitar timeouts
            batch_size = 32
            total_batches = (len(texts) + batch_size - 1) // batch_size
            
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                batch_num = i // batch_size + 1
                
                if show_progress:
                    print(f"Procesando lote {batch_num}/{total_batches}")
                
                try:
                    response = client.embed(model=self.model, input=batch)
                    batch_embeddings = np.array(response.embeddings, dtype=np.float32)
                    embeddings.append(batch_embeddings)
                    
                except Exception as e:
                    logger.warning(f"Error en lote {batch_num}: {e}")
                    # Reintentar uno por uno para el lote fallido
                    for text in batch:
                        try:
                            emb = self.embed_text(text)
                            embeddings.append(emb.reshape(1, -1))
                        except Exception as sub_e:
                            logger.error(f"Error procesando texto: {sub_e}")
                            embeddings.append(np.zeros((1, config.embedding.dimension), dtype=np.float32))
            
            if embeddings:
                return np.vstack(embeddings)
            else:
                return np.array([], dtype=np.float32).reshape(0, config.embedding.dimension)
                
        except Exception as e:
            logger.error(f"Error en embed_texts: {e}")
            raise EmbeddingError(str(e))
    
    def embed_query(self, query: str) -> np.ndarray:
        """
        Genera embedding para una query de búsqueda
        Alias para embed_text para claridad semántica
        """
        return self.embed_text(query)
    
    def get_dimension(self) -> int:
        """
        Obtiene la dimensión del modelo de embedding
        
        Returns:
            Dimensión del vector de embedding
        """
        if self._embedding_dim is None:
            try:
                # Generar embedding de prueba para obtener dimensión
                test_embedding = self.embed_text("dimension test")
                self._embedding_dim = len(test_embedding)
            except Exception as e:
                logger.error(f"Error obteniendo dimensión: {e}")
                # Usar dimensión por defecto para mxbai-embed-large
                self._embedding_dim = config.embedding.dimension
        
        return self._embedding_dim
    
    def get_model_info(self) -> dict:
        """
        Obtiene información sobre el modelo
        
        Returns:
            Diccionario con información del modelo
        """
        try:
            client = self._get_client()
            response = client.show(model=self.model)
            
            return {
                "name": self.model,
                "size": response.get("size", "unknown"),
                "digest": response.get("digest", "unknown"),
                "details": response.get("details", {}),
                "embedding_dimension": self.get_dimension()
            }
        except Exception as e:
            logger.error(f"Error obteniendo info del modelo: {e}")
            return {
                "name": self.model,
                "error": str(e)
            }


# Función de conveniencia para crear embedder
def create_embedder(model: str = None, ollama_url: str = None) -> OllamaEmbedder:
    """Factory function para crear un embedder"""
    return OllamaEmbedder(model=model, ollama_url=ollama_url)


# Función para calcular similitud coseno
def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """
    Calcula la similitud coseno entre dos vectores
    
    Args:
        a: Primer vector
        b: Segundo vector
        
    Returns:
        Similitud coseno (entre -1 y 1, típicamente 0 a 1 para embeddings normalizados)
    """
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
    
    return float(dot_product / (norm_a * norm_b))


def cosine_distance(a: np.ndarray, b: np.ndarray) -> float:
    """
    Calcula la distancia coseno (1 - similitud coseno)
    
    Args:
        a: Primer vector
        b: Segundo vector
        
    Returns:
        Distancia coseno (entre 0 y 1)
    """
    return 1.0 - cosine_similarity(a, b)
