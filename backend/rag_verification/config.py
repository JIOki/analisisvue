"""
Configuración del Servicio de Verificación RAG
Carga variables de entorno y settings centralizados
"""

import os
from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Configuración global del servicio"""
    
    # Servidor
    host: str = os.getenv("RV_HOST", "0.0.0.0")
    port: int = int(os.getenv("RV_PORT", "8001"))
    debug: bool = os.getenv("RV_DEBUG", "false").lower() == "true"
    
    # Base de datos PostgreSQL
    db_host: str = os.getenv("DB_HOST", "localhost")
    db_port: int = int(os.getenv("DB_PORT", "5432"))
    db_user: str = os.getenv("DB_USER", "raguser")
    db_password: str = os.getenv("DB_PASS", "ragpass")
    db_name: str = os.getenv("DB_NAME", "ragdb")
    
    @property
    def database_url(self) -> str:
        """URL de conexión a la base de datos"""
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
    
    @property
    def async_database_url(self) -> str:
        """URL de conexión asíncrona"""
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
    
    # Ollama
    ollama_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
    
    # Verificación
    similarity_threshold: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.7"))
    top_k_results: int = int(os.getenv("TOP_K_RESULTS", "5"))
    max_chunks_per_query: int = int(os.getenv("MAX_CHUNKS_PER_QUERY", "10"))
    
    # Modelos
    llm_model: str = os.getenv("LLM_MODEL", "llama3.2:1b")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Obtiene la configuración cacheada"""
    return Settings()


# Instancia global de configuración
settings = get_settings()
