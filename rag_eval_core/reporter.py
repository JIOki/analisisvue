"""
Generador de Reportes para RAG Eval Core
Genera reportes en Markdown y PDF con análisis de embeddings
"""

import os
import json
import base64
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path
import logging

import matplotlib
matplotlib.use('Agg')  # Usar backend no interactivo
import matplotlib.pyplot as plt
import seaborn as sns

from jinja2 import Environment, FileSystemLoader

from .config import config
from .analyzer import EmbeddingAnalyzer, SearchAnalyzer, EmbeddingStats

logger = logging.getLogger(__name__)


class ReportGenerator:
    """Generador de reportes de análisis de embeddings"""
    
    def __init__(self, output_dir: str = None):
        """
        Inicializa el generador de reportes
        
        Args:
            output_dir: Directorio donde se guardarán los reportes
        """
        self.output_dir = Path(output_dir or config.report.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Configurar Jinja2
        template_dir = Path(__file__).parent / "templates"
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            trim_blocks=True,
            lstrip_blocks=True
        )
        
        # Configurar matplotlib
        plt.style.use('seaborn-v0_8-whitegrid')
        sns.set_palette("husl")
    
    def generate_full_report(
        self,
        stats: EmbeddingStats,
        cluster_info: List[Dict],
        search_results: Dict,
        visualization_paths: Dict[str, str],
        model_info: Dict,
        config_used: Dict
    ) -> str:
        """
        Genera un reporte completo en Markdown
        
        Args:
            stats: Estadísticas de los embeddings
            cluster_info: Información de clusters
            search_results: Resultados de pruebas de búsqueda
            visualization_paths: Rutas a las imágenes generadas
            model_info: Información del modelo de embedding
            config_used: Configuración usada en el análisis
            
        Returns:
            Ruta al archivo de reporte generado
        """
        # Renderizar template
        template = self.jinja_env.get_template("report_template.md")
        content = template.render(
            report_title="Reporte de Análisis de Embeddings RAG",
            generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            stats=stats,
            cluster_info=cluster_info,
            search_results=search_results,
            visualization_paths=visualization_paths,
            model_info=model_info,
            config=config_used
        )
        
        # Guardar archivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"rag_analysis_{timestamp}.md"
        filepath = self.output_dir / filename
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        
        logger.info(f"Reporte generado: {filepath}")
        return str(filepath)
    
    def generate_charts(
        self,
        analyzer: EmbeddingAnalyzer,
        search_analyzer: SearchAnalyzer = None,
        test_queries: List[Dict] = None
    ) -> Dict[str, str]:
        """
        Genera gráficos de visualización
        
        Args:
            analyzer: Analizador de embeddings
            search_analyzer: Analizador de búsquedas (opcional)
            test_queries: Queries de prueba (opcional)
            
        Returns:
            Diccionario con rutas a las imágenes generadas
        """
        paths = {}
        
        try:
            # 1. Gráfico de distribución de similitud
            paths["similarity_dist"] = self._plot_similarity_distribution(analyzer)
            
            # 2. Gráfico 2D de embeddings
            paths["embedding_2d"] = self._plot_embeddings_2d(analyzer)
            
            # 3. Gráfico de clusters
            paths["clusters"] = self._plot_clusters(analyzer)
            
            # 4. Gráfico de distribución de normas
            paths["norms_dist"] = self._plot_norms_distribution(analyzer)
            
            # 5. Gráfico de resultados de búsqueda (si hay datos)
            if search_analyzer and test_queries:
                paths["search_results"] = self._plot_search_results(search_analyzer, test_queries)
            
        except Exception as e:
            logger.error(f"Error generando gráficos: {e}")
        
        return paths
    
    def _plot_similarity_distribution(self, analyzer: EmbeddingAnalyzer) -> str:
        """Genera histograma de distribución de similitud"""
        if len(analyzer.embeddings) < 2:
            return ""
        
        similarity_matrix = analyzer._compute_similarity_matrix()
        upper_tri = similarity_matrix[np.triu_indices(len(similarity_matrix), k=1)]
        
        fig, ax = plt.subplots(figsize=(10, 6))
        
        ax.hist(upper_tri, bins=50, color="steelblue", edgecolor="white", alpha=0.7)
        ax.axvline(x=np.mean(upper_tri), color="red", linestyle="--", 
                   label=f"Media: {np.mean(upper_tri):.3f}")
        ax.axvline(x=np.median(upper_tri), color="green", linestyle="--", 
                   label=f"Mediana: {np.median(upper_tri):.3f}")
        
        ax.set_xlabel("Similitud Coseno", fontsize=12)
        ax.set_ylabel("Frecuencia", fontsize=12)
        ax.set_title("Distribución de Similitud entre Chunks", fontsize=14)
        ax.legend()
        
        filepath = self.output_dir / "similarity_distribution.png"
        plt.savefig(filepath, dpi=150, bbox_inches="tight")
        plt.close()
        
        return str(filepath)
    
    def _plot_embeddings_2d(self, analyzer: EmbeddingAnalyzer) -> str:
        """Genera scatter plot 2D de los embeddings"""
        if len(analyzer.embeddings) < 4:
            return ""
        
        coords_2d = analyzer.reduce_dimensions_2d(method="pca")
        
        fig, ax = plt.subplots(figsize=(12, 8))
        
        scatter = ax.scatter(
            coords_2d[:, 0], 
            coords_2d[:, 1],
            c=range(len(coords_2d)),
            cmap="viridis",
            alpha=0.6,
            s=50
        )
        
        ax.set_xlabel("Componente Principal 1", fontsize=12)
        ax.set_ylabel("Componente Principal 2", fontsize=12)
        ax.set_title("Mapa de Embeddings (PCA 2D)", fontsize=14)
        
        # Añadir barra de color
        cbar = plt.colorbar(scatter, ax=ax)
        cbar.set_label("Índice del Chunk", fontsize=10)
        
        filepath = self.output_dir / "embeddings_2d.png"
        plt.savefig(filepath, dpi=150, bbox_inches="tight")
        plt.close()
        
        return str(filepath)
    
    def _plot_clusters(self, analyzer: EmbeddingAnalyzer) -> str:
        """Genera gráfico de clusters"""
        if len(analyzer.embeddings) < 10:
            return ""
        
        coords_2d = analyzer.reduce_dimensions_2d(method="pca")
        labels, cluster_infos = analyzer.perform_clustering()
        
        if len(cluster_infos) == 0:
            return ""
        
        fig, ax = plt.subplots(figsize=(12, 8))
        
        # Usar scatter plot con colores por cluster
        scatter = ax.scatter(
            coords_2d[:, 0], 
            coords_2d[:, 1],
            c=labels,
            cmap="tab10",
            alpha=0.6,
            s=50
        )
        
        # Marcar centroides
        centroids_2d = []
        for info in cluster_infos:
            if info.centroid is not None:
                centroid_2d = PCA(n_components=2).fit_transform(info.centroid.reshape(1, -1))
                centroids_2d.append(centroid_2d[0])
        
        if centroids_2d:
            centroids_array = np.array(centroids_2d)
            ax.scatter(
                centroids_array[:, 0], 
                centroids_array[:, 1],
                c="black",
                marker="X",
                s=200,
                edgecolors="white",
                linewidths=2,
                label="Centroides"
            )
        
        ax.set_xlabel("Componente Principal 1", fontsize=12)
        ax.set_ylabel("Componente Principal 2", fontsize=12)
        ax.set_title(f"Clusters de Conocimiento ({len(cluster_infos)} clusters)", fontsize=14)
        
        # Leyenda
        legend_elements = [f"Cluster {i} ({info.chunk_count} chunks)" 
                          for i, info in enumerate(cluster_infos)]
        ax.legend(legend_elements, loc="best", fontsize=8)
        
        filepath = self.output_dir / "clusters.png"
        plt.savefig(filepath, dpi=150, bbox_inches="tight")
        plt.close()
        
        return str(filepath)
    
    def _plot_norms_distribution(self, analyzer: EmbeddingAnalyzer) -> str:
        """Genera distribución de normas de vectores"""
        if len(analyzer.embeddings) == 0:
            return ""
        
        norms = np.linalg.norm(analyzer.embeddings, axis=1)
        
        fig, axes = plt.subplots(1, 2, figsize=(14, 5))
        
        # Histograma
        axes[0].hist(norms, bins=30, color="coral", edgecolor="white", alpha=0.7)
        axes[0].axvline(x=np.mean(norms), color="blue", linestyle="--", 
                        label=f"Media: {np.mean(norms):.3f}")
        axes[0].set_xlabel("Norma del Vector", fontsize=12)
        axes[0].set_ylabel("Frecuencia", fontsize=12)
        axes[0].set_title("Distribución de Normas", fontsize=14)
        axes[0].legend()
        
        # Box plot
        axes[1].boxplot(norms, vert=True)
        axes[1].set_ylabel("Norma del Vector", fontsize=12)
        axes[1].set_title("Box Plot de Normas", fontsize=14)
        
        filepath = self.output_dir / "norms_distribution.png"
        plt.savefig(filepath, dpi=150, bbox_inches="tight")
        plt.close()
        
        return str(filepath)
    
    def _plot_search_results(
        self, 
        search_analyzer: SearchAnalyzer, 
        test_queries: List[Dict]
    ) -> str:
        """Genera gráfico de resultados de búsqueda"""
        results = search_analyzer.run_test_queries(test_queries)
        
        if not results:
            return ""
        
        queries = [r.query[:30] + "..." if len(r.query) > 30 else r.query for r in results]
        similarities = [r.top_similarity for r in results]
        colors = ["green" if r.hits else "red" for r in results]
        
        fig, ax = plt.subplots(figsize=(12, 6))
        
        bars = ax.barh(queries, similarities, color=colors, alpha=0.7)
        ax.axvline(x=config.analysis.similarity_threshold, color="blue", linestyle="--",
                   label=f"Umbral: {config.analysis.similarity_threshold}")
        
        ax.set_xlabel("Similitud del Top Result", fontsize=12)
        ax.set_title("Resultados de Búsqueda Semántica", fontsize=14)
        ax.legend()
        
        # Añadir valores en las barras
        for bar, sim in zip(bars, similarities):
            ax.text(bar.get_width() + 0.02, bar.get_y() + bar.get_height()/2,
                   f"{sim:.3f}", va="center", fontsize=9)
        
        filepath = self.output_dir / "search_results.png"
        plt.savefig(filepath, dpi=150, bbox_inches="tight")
        plt.close()
        
        return str(filepath)
    
    def image_to_base64(self, image_path: str) -> str:
        """Convierte una imagen a base64 para embeber en el reporte"""
        try:
            with open(image_path, "rb") as img_file:
                return base64.b64encode(img_file.read()).decode('utf-8')
        except Exception as e:
            logger.error(f"Error convirtiendo imagen a base64: {e}")
            return ""
    
    def generate_executive_summary(self, stats: EmbeddingStats) -> str:
        """Genera un resumen ejecutivo rápido"""
        summary = f"""
## Resumen Ejecutivo

### Estadísticas Generales
- **Total de Chunks Analizados**: {stats.total_chunks}
- **Dimensión de Embeddings**: {stats.embedding_dimension}
- **Norma Media del Vector**: {stats.mean_vector_norm:.4f}

### Calidad de Embeddings
- **Similitud Media**: {stats.avg_similarity:.4f}
- **Similitud Mínima**: {stats.min_similarity:.4f}
- **Similitud Máxima**: {stats.max_similarity:.4f}

### Evaluación
"""
        
        if stats.avg_similarity > 0.7:
            summary += "✅ **CALIDAD ALTA**: Los embeddings muestran buena cohesión semántica.\n"
        elif stats.avg_similarity > 0.4:
            summary += "⚠️ **CALIDAD MEDIA**: Los embeddings tienen separación razonable.\n"
        else:
            summary += "❌ **CALIDAD BAJA**: Los embeddings pueden tener problemas de distribución.\n"
        
        return summary
