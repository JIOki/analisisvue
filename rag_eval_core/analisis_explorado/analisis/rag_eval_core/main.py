"""
Main Entry Point para RAG Eval Core
Módulo de Análisis y Reportes de Embeddings
"""

import argparse
import sys
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
import json
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def run_full_analysis(
    output_format: str = "markdown",
    sample_size: Optional[int] = None,
    test_queries: Optional[List[Dict]] = None,
    include_charts: bool = True
) -> str:
    """
    Ejecuta un análisis completo de embeddings
    
    Args:
        output_format: Formato del reporte (markdown, pdf)
        sample_size: Número de chunks a analizar (None = todos)
        test_queries: Lista de queries de prueba
        include_charts: Incluir gráficos en el reporte
        
    Returns:
        Ruta al reporte generado
    """
    from .config import config
    from .db_connector import DatabaseConnector
    from .embedder import OllamaEmbedder
    from .analyzer import EmbeddingAnalyzer, SearchAnalyzer
    from .reporter import ReportGenerator
    
    logger.info("🚀 Iniciando análisis de embeddings RAG")
    
    # 1. Conectar a la base de datos
    logger.info("📦 Conectando a la base de datos...")
    db = DatabaseConnector()
    
    if not db.test_connection():
        logger.error("❌ Error conectando a la base de datos")
        return None
    
    # 2. Extraer chunks
    logger.info("📄 Extrayendo chunks de la base de datos...")
    if sample_size:
        chunks = db.fetch_random_chunks(sample_size)
    else:
        chunks = db.fetch_all_chunks()
    
    if not chunks:
        logger.error("❌ No se encontraron chunks en la base de datos")
        return None
    
    logger.info(f"✅ Extraídos {len(chunks)} chunks")
    
    # 3. Inicializar embedder
    logger.info(f"🤖 Inicializando modelo de embedding: {config.embedding.model}")
    embedder = OllamaEmbedder()
    
    if not embedder.test_connection():
        logger.error("❌ Error conectando a Ollama")
        return None
    
    # 4. Obtener información del modelo
    model_info = embedder.get_model_info()
    logger.info(f"📊 Modelo: {model_info.get('name', 'desconocido')}")
    
    # 5. Preparar datos para análisis
    embeddings = np.array([chunk["embedding"] for chunk in chunks])
    contents = [chunk["content"] for chunk in chunks]
    
    # 6. Analizar embeddings
    logger.info("🔍 Analizando embeddings...")
    analyzer = EmbeddingAnalyzer(embeddings, contents)
    stats = analyzer.get_basic_stats()
    
    logger.info(f"   - Dimensión: {stats.embedding_dimension}")
    logger.info(f"   - Similitud media: {stats.avg_similarity:.4f}")
    
    # 7. Clustering
    logger.info("📊 Ejecutando análisis de clusters...")
    labels, cluster_info = analyzer.perform_clustering()
    cluster_info_dicts = [c.to_dict() for c in cluster_info]
    
    # 8. Detectar outliers
    outliers = analyzer.find_outliers()
    if outliers:
        logger.warning(f"⚠️ Detectados {len(outliers)} outliers")
    
    # 9. Generar gráficos
    chart_paths = {}
    if include_charts:
        logger.info("📈 Generando visualizaciones...")
        reporter = ReportGenerator()
        chart_paths = reporter.generate_charts(analyzer)
    
    # 10. Pruebas de búsqueda
    search_results = {"tests": [], "summary": {}}
    if test_queries:
        logger.info("🧪 Ejecutando pruebas de búsqueda...")
        search_analyzer = SearchAnalyzer(db, embedder)
        test_results = search_analyzer.run_test_queries(test_queries)
        search_results["tests"] = [r.to_dict() for r in test_results]
        search_results["summary"] = search_analyzer.generate_summary(test_results)
        
        logger.info(f"   - Tasa de éxito: {search_results['summary'].get('success_rate', 0):.1f}%")
    
    # 11. Generar reporte
    logger.info("📝 Generando reporte...")
    reporter = ReportGenerator()
    
    # Convertir stats a diccionario
    stats_dict = {
        "total_chunks": stats.total_chunks,
        "embedding_dimension": stats.embedding_dimension,
        "mean_vector_norm": stats.mean_vector_norm,
        "std_vector_norm": stats.std_vector_norm,
        "min_similarity": stats.min_similarity,
        "max_similarity": stats.max_similarity,
        "avg_similarity": stats.avg_similarity
    }
    
    config_used = {
        "embedding_model": config.embedding.model,
        "embedding_dimension": config.embedding.dimension,
        "similarity_threshold": config.analysis.similarity_threshold,
        "top_k": config.analysis.top_k_results,
        "ollama_url": config.embedding.ollama_url
    }
    
    report_path = reporter.generate_full_report(
        stats=stats_dict,
        cluster_info=cluster_info_dicts,
        search_results=search_results,
        visualization_paths=chart_paths,
        model_info=model_info,
        config_used=config_used
    )
    
    logger.info(f"✅ Reporte generado: {report_path}")
    
    # 12. Cleanup
    db.close()
    
    return report_path


def run_quick_check() -> Dict:
    """Ejecuta una verificación rápida del sistema"""
    from .db_connector import DatabaseConnector
    from .embedder import OllamaEmbedder
    from .config import config
    
    results = {
        "database": False,
        "ollama": False,
        "total_chunks": 0,
        "errors": []
    }
    
    # Verificar base de datos
    try:
        db = DatabaseConnector()
        results["database"] = db.test_connection()
        if results["database"]:
            results["total_chunks"] = db.count_chunks()
        db.close()
    except Exception as e:
        results["errors"].append(f"Database: {str(e)}")
    
    # Verificar Ollama
    try:
        embedder = OllamaEmbedder()
        results["ollama"] = embedder.test_connection()
        if results["ollama"]:
            results["model_info"] = embedder.get_model_info()
    except Exception as e:
        results["errors"].append(f"Ollama: {str(e)}")
    
    return results


def interactive_mode():
    """Modo interactivo para el usuario"""
    print("\n" + "="*50)
    print("🔍 RAG EVAL CORE - Análisis de Embeddings")
    print("="*50 + "\n")
    
    # 1. Verificación rápida
    print("1️⃣ Verificando sistema...")
    check = run_quick_check()
    
    if not check["database"]:
        print("❌ Error: No se puede conectar a la base de datos")
        return
    
    if not check["ollama"]:
        print("❌ Error: No se puede conectar a Ollama")
        return
    
    print(f"   ✅ Base de datos: {check['total_chunks']} chunks")
    print(f"   ✅ Ollama: {check.get('model_info', {}).get('name', 'desconocido')}")
    
    # 2. Definir queries de prueba
    print("\n2️⃣ Definiendo queries de prueba...")
    default_queries = [
        {"query": "¿Qué es machine learning?", "expected_relevant": True},
        {"query": "redes neuronales profundas", "expected_relevant": True},
        {"query": "algoritmos de clasificación", "expected_relevant": True},
    ]
    
    print("   Usando queries por defecto:")
    for i, q in enumerate(default_queries, 1):
        print(f"   {i}. {q['query']}")
    
    # 3. Ejecutar análisis
    print("\n3️⃣ Ejecutando análisis completo...")
    report_path = run_full_analysis(
        output_format="markdown",
        sample_size=None,
        test_queries=default_queries,
        include_charts=True
    )
    
    if report_path:
        print(f"\n✅ Análisis completado!")
        print(f"📄 Reporte: {report_path}")
        
        # Preguntar si quiere ver el reporte
        response = input("\n¿Desea ver el reporte? (s/n): ")
        if response.lower() in ["s", "si", "sí", "y", "yes"]:
            with open(report_path, "r", encoding="utf-8") as f:
                print("\n" + "="*50)
                print(f.read())
                print("="*50)


def main():
    """Punto de entrada principal"""
    parser = argparse.ArgumentParser(
        description="RAG Eval Core - Módulo de Análisis de Embeddings"
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Comandos disponibles")
    
    # Comando: analyze
    analyze_parser = subparsers.add_parser("analyze", help="Ejecutar análisis completo")
    analyze_parser.add_argument(
        "--format", "-f", 
        choices=["markdown", "pdf"], 
        default="markdown",
        help="Formato del reporte"
    )
    analyze_parser.add_argument(
        "--sample", "-s",
        type=int,
        help="Número de chunks a muestrear (default: todos)"
    )
    analyze_parser.add_argument(
        "--output", "-o",
        help="Directorio de salida para el reporte"
    )
    
    # Comando: check
    check_parser = subparsers.add_parser("check", help="Verificación rápida del sistema")
    
    # Comando: interactive
    subparsers.add_parser("interactive", help="Modo interactivo")
    
    args = parser.parse_args()
    
    if args.command == "check":
        # Verificación rápida
        results = run_quick_check()
        print("\n📋 Resultados de Verificación:")
        print(f"   Base de datos: {'✅ OK' if results['database'] else '❌ FAIL'}")
        if results['database']:
            print(f"   Total chunks: {results['total_chunks']}")
        print(f"   Ollama: {'✅ OK' if results['ollama'] else '❌ FAIL'}")
        if results.get('model_info'):
            print(f"   Modelo: {results['model_info'].get('name', 'N/A')}")
        if results.get('errors'):
            print(f"   Errores: {results['errors']}")
    
    elif args.command == "interactive":
        interactive_mode()
    
    elif args.command == "analyze":
        # Queries de prueba por defecto
        default_queries = [
            {"query": "¿Qué es machine learning?", "expected_relevant": True},
            {"query": "redes neuronales profundas", "expected_relevant": True},
            {"query": "algoritmos de clasificación", "expected_relevant": True},
        ]
        
        run_full_analysis(
            output_format=args.format,
            sample_size=args.sample,
            test_queries=default_queries,
            include_charts=True
        )
    
    else:
        parser.print_help()


# Importar numpy al inicio del módulo
import numpy as np


if __name__ == "__main__":
    main()
