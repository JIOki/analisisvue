"""
Conector de Base de Datos para RAG Eval Core
Maneja la conexión con PostgreSQL y pgvector
"""

import json
import numpy as np
from typing import List, Dict, Optional, Any, Tuple
from contextlib import contextmanager
import logging

from sqlalchemy import create_engine, text, MetaData
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool

from .config import config

logger = logging.getLogger(__name__)


class DatabaseConnector:
    """Conector principal para la base de datos PostgreSQL con pgvector"""
    
    def __init__(self):
        self.engine = create_engine(
            config.db.connection_string,
            poolclass=QueuePool,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True
        )
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.metadata = MetaData()
    
    @contextmanager
    def get_session(self) -> Session:
        """Context manager para sesiones de base de datos"""
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Error en sesión de base de datos: {e}")
            raise
        finally:
            session.close()
    
    def test_connection(self) -> bool:
        """Prueba la conexión a la base de datos"""
        try:
            with self.get_session() as session:
                session.execute(text("SELECT 1"))
            logger.info("Conexión a base de datos exitosa")
            return True
        except Exception as e:
            logger.error(f"Error conectando a base de datos: {e}")
            return False
    
    def get_table_info(self) -> Dict[str, Any]:
        """Obtiene información sobre las tablas disponibles"""
        try:
            with self.get_session() as session:
                # Verificar si existe pgvector
                session.execute(text("SELECT extname FROM pg_extension WHERE extname = 'pgvector'"))
                
                # Listar tablas
                result = session.execute(text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                """))
                tables = [row[0] for row in result.fetchall()]
                
                return {
                    "pgvector_installed": True,
                    "tables": tables
                }
        except Exception as e:
            logger.error(f"Error obteniendo info de tablas: {e}")
            return {"error": str(e)}
    
    def fetch_all_chunks(self, limit: int = None) -> List[Dict[str, Any]]:
        """Extrae todos los chunks y sus embeddings de la base de datos"""
        try:
            with self.get_session() as session:
                query = text("""
                    SELECT id, content, metadata, embedding, created_at
                    FROM document_chunks
                    ORDER BY created_at DESC
                """)
                
                if limit:
                    query = text(f"""
                        SELECT id, content, metadata, embedding, created_at
                        FROM document_chunks
                        ORDER BY created_at DESC
                        LIMIT {limit}
                    """)
                
                result = session.execute(query)
                chunks = []
                
                for row in result.fetchall():
                    # Convertir embedding de string a numpy array si es necesario
                    embedding = row[3]
                    if isinstance(embedding, str):
                        embedding = np.array(json.loads(embedding))
                    elif isinstance(embedding, bytes):
                        embedding = np.frombuffer(embedding, dtype=np.float32)
                    
                    chunks.append({
                        "id": row[0],
                        "content": row[1],
                        "metadata": row[2],
                        "embedding": embedding,
                        "created_at": row[4]
                    })
                
                logger.info(f"Extraídos {len(chunks)} chunks de la base de datos")
                return chunks
                
        except Exception as e:
            logger.error(f"Error extrayendo chunks: {e}")
            return []
    
    def fetch_random_chunks(self, n: int = 10) -> List[Dict[str, Any]]:
        """Extrae una muestra aleatoria de chunks"""
        try:
            with self.get_session() as session:
                result = session.execute(text(f"""
                    SELECT id, content, metadata, embedding, created_at
                    FROM document_chunks
                    TABLESAMPLE BERNOULLI(20)
                    ORDER BY random()
                    LIMIT {n}
                """))
                
                chunks = []
                for row in result.fetchall():
                    embedding = row[3]
                    if isinstance(embedding, str):
                        embedding = np.array(json.loads(embedding))
                    elif isinstance(embedding, bytes):
                        embedding = np.frombuffer(embedding, dtype=np.float32)
                    
                    chunks.append({
                        "id": row[0],
                        "content": row[1],
                        "metadata": row[2],
                        "embedding": embedding,
                        "created_at": row[4]
                    })
                
                return chunks
                
        except Exception as e:
            logger.error(f"Error extrayendo muestra aleatoria: {e}")
            return []
    
    def get_embedding_dimension(self) -> Optional[int]:
        """Obtiene la dimensión de los embeddings almacenados"""
        try:
            with self.get_session() as session:
                result = session.execute(text("""
                    SELECT embedding FROM document_chunks LIMIT 1
                """))
                row = result.fetchone()
                
                if row:
                    embedding = row[0]
                    if isinstance(embedding, str):
                        arr = np.array(json.loads(embedding))
                    elif isinstance(embedding, bytes):
                        arr = np.frombuffer(embedding, dtype=np.float32)
                    else:
                        arr = np.array(embedding)
                    return len(arr)
                    
        except Exception as e:
            logger.error(f"Error obteniendo dimensión de embedding: {e}")
        return None
    
    def count_chunks(self) -> int:
        """Cuenta el número total de chunks"""
        try:
            with self.get_session() as session:
                result = session.execute(text("SELECT COUNT(*) FROM document_chunks"))
                return result.scalar()
        except Exception as e:
            logger.error(f"Error contando chunks: {e}")
            return 0
    
    def semantic_search(
        self, 
        query_embedding: np.ndarray, 
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Realiza búsqueda semántica usando pgvector"""
        try:
            with self.get_session() as session:
                # Convertir embedding a formato string para PostgreSQL
                embedding_list = query_embedding.tolist()
                
                result = session.execute(text(f"""
                    SELECT id, content, metadata, embedding,
                           embedding <-> :embedding as distance
                    FROM document_chunks
                    ORDER BY embedding <-> :embedding
                    LIMIT {top_k}
                """), {"embedding": json.dumps(embedding_list)})
                
                results = []
                for row in result.fetchall():
                    results.append({
                        "id": row[0],
                        "content": row[1],
                        "metadata": row[2],
                        "distance": row[4],
                        "similarity": 1 - row[4]  # Convertir distancia a similitud
                    })
                
                return results
                
        except Exception as e:
            logger.error(f"Error en búsqueda semántica: {e}")
            return []
    
    def close(self):
        """Cierra las conexiones de la base de datos"""
        self.engine.dispose()
        logger.info("Conexiones de base de datos cerradas")
