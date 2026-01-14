"""
RAG Eval Core - Módulo de Análisis y Reportes de Embeddings

Este módulo proporciona herramientas para:
- Analizar la calidad de embeddings en sistemas RAG
- Generar reportes detallados con visualizaciones
- Validar búsquedas semánticas
- Cargar y procesar documentos
- Detectar outliers y problemas en los datos

Usage:
    # Como módulo
    from rag_eval_core import run_full_analysis, load_sample_document
    
    # Como CLI
    python -m rag_eval_core.main check
    python -m rag_eval_core.main analyze
    python -m rag_eval_core.data_loader load-sample
    python -m rag_eval_core.data_loader load-file mi_documento.txt
"""

__version__ = "1.0.0"
__author__ = "RAG Eval Team"

from .main import run_full_analysis, run_quick_check, interactive_mode
from .config import config, Config
from .db_connector import DatabaseConnector
from .embedder import OllamaEmbedder, create_embedder, cosine_similarity
from .analyzer import EmbeddingAnalyzer, SearchAnalyzer, EmbeddingStats
from .reporter import ReportGenerator
from .data_loader import DocumentLoader

__all__ = [
    # Main functions
    "run_full_analysis",
    "run_quick_check",
    "interactive_mode",
    
    # Config
    "config",
    "Config",
    
    # Database
    "DatabaseConnector",
    
    # Embeddings
    "OllamaEmbedder",
    "create_embedder",
    "cosine_similarity",
    
    # Analysis
    "EmbeddingAnalyzer",
    "SearchAnalyzer",
    "EmbeddingStats",
    
    # Reporting
    "ReportGenerator",
    
    # Data Loading
    "DocumentLoader",
]
