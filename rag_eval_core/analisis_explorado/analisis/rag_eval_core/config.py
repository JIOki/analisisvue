"""
Configuración del Módulo RAG Eval Core
Carga variables de entorno y settings centralizados
"""

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class DatabaseConfig:
    """Configuración de la base de datos PostgreSQL"""
    host: str = os.getenv("DB_HOST", "localhost")
    port: int = int(os.getenv("DB_PORT", "5432"))
    user: str = os.getenv("DB_USER", "raguser")
    password: str = os.getenv("DB_PASS", "ragpass")
    database: str = os.getenv("DB_NAME", "ragdb")
    
    @property
    def connection_string(self) -> str:
        """Retorna el string de conexión para SQLAlchemy"""
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"
    
    @property
    def async_connection_string(self) -> str:
        """Retorna el string de conexión asíncrona"""
        return f"postgresql+asyncpg://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"


@dataclass
class EmbeddingConfig:
    """Configuración del modelo de embeddings"""
    model: str = os.getenv("EMBEDDING_MODEL", "mxbai-embed-large")
    ollama_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    dimension: int = 1024  # Dimensión de mxbai-embed-large


@dataclass
class AnalysisConfig:
    """Configuración del análisis"""
    sample_size: int = int(os.getenv("ANALYSIS_SAMPLE_SIZE", "100"))
    similarity_threshold: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.7"))
    top_k_results: int = int(os.getenv("TOP_K_RESULTS", "5"))
    pca_components: int = 2  # Para visualización 2D


@dataclass
class ReportConfig:
    """Configuración de reportes"""
    output_dir: str = os.getenv("REPORT_OUTPUT_DIR", "./reports")
    format: str = os.getenv("REPORT_FORMAT", "markdown")  # markdown, pdf, html
    include_charts: bool = True


class Config:
    """Configuración global del módulo"""
    
    def __init__(self):
        self.db = DatabaseConfig()
        self.embedding = EmbeddingConfig()
        self.analysis = AnalysisConfig()
        self.report = ReportConfig()
    
    def validate(self) -> bool:
        """Valida que la configuración sea correcta"""
        errors = []
        
        if not self.db.host:
            errors.append("DB_HOST no está configurado")
        if not self.embedding.model:
            errors.append("EMBEDDING_MODEL no está configurado")
        if not self.embedding.ollama_url:
            errors.append("OLLAMA_BASE_URL no está configurado")
        
        if errors:
            raise ValueError(f"Errores de configuración: {', '.join(errors)}")
        
        return True


# Instancia global de configuración
config = Config()
