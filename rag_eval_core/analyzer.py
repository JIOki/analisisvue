"""
Módulo de Análisis para RAG Eval Core
Contiene todas las funciones matemáticas y análisis estadísticos
"""

import json
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional, Any
from collections import defaultdict
from dataclasses import dataclass, asdict
from sklearn.cluster import KMeans, DBSCAN
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.metrics import silhouette_score
from sklearn.neighbors import NearestNeighbors
import logging

from .embedder import cosine_similarity, cosine_distance
from .config import config

logger = logging.getLogger(__name__)


@dataclass
class EmbeddingStats:
    """Estadísticas básicas de los embeddings"""
    total_chunks: int
    embedding_dimension: int
    mean_vector_norm: float
    std_vector_norm: float
    min_similarity: float
    max_similarity: float
    avg_similarity: float
    
    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class ClusterInfo:
    """Información de un cluster"""
    cluster_id: int
    chunk_count: int
    centroid: np.ndarray
    top_keywords: List[str]
    avg_intra_similarity: float
    
    def to_dict(self) -> dict:
        return {
            "cluster_id": self.cluster_id,
            "chunk_count": self.chunk_count,
            "centroid": self.centroid.tolist() if self.centroid is not None else None,
            "top_keywords": self.top_keywords,
            "avg_intra_similarity": self.avg_intra_similarity
        }


@dataclass
class SearchTestResult:
    """Resultado de una prueba de búsqueda"""
    query: str
    retrieved_chunks: List[Dict[str, Any]]
    expected_relevant: bool
    hits: bool
    top_similarity: float
    avg_similarity: float
    latency_ms: float
    
    def to_dict(self) -> dict:
        return {
            "query": self.query,
            "retrieved_chunks": [
                {
                    "id": c["id"],
                    "content_preview": c["content"][:100] + "...",
                    "similarity": c["similarity"]
                }
                for c in self.retrieved_chunks
            ],
            "expected_relevant": self.expected_relevant,
            "hits": self.hits,
            "top_similarity": self.top_similarity,
            "avg_similarity": self.avg_similarity,
            "latency_ms": self.latency_ms
        }


class EmbeddingAnalyzer:
    """Analizador de embeddings con múltiples métricas"""
    
    def __init__(self, embeddings: np.ndarray, contents: List[str] = None):
        """
        Inicializa el analizador
        
        Args:
            embeddings: Matriz de embeddings (n x dimension)
            contents: Lista de contenidos correspondientes a los embeddings
        """
        self.embeddings = embeddings
        self.contents = contents or []
        self.df = None
        
        if len(embeddings) > 0:
            self._build_dataframe()
    
    def _build_dataframe(self):
        """Construye un DataFrame con los embeddings para análisis"""
        if len(self.embeddings) == 0:
            self.df = pd.DataFrame()
            return
        
        # Crear columnas para cada dimensión
        embedding_cols = [f"dim_{i}" for i in range(self.embeddings.shape[1])]
        
        data = {
            **{col: self.embeddings[:, i] for i, col in enumerate(embedding_cols)},
            "vector_norm": np.linalg.norm(self.embeddings, axis=1)
        }
        
        if self.contents:
            data["content"] = self.contents
        
        self.df = pd.DataFrame(data)
    
    def get_basic_stats(self) -> EmbeddingStats:
        """Calcula estadísticas básicas de los embeddings"""
        if len(self.embeddings) == 0:
            return EmbeddingStats(
                total_chunks=0,
                embedding_dimension=0,
                mean_vector_norm=0,
                std_vector_norm=0,
                min_similarity=0,
                max_similarity=0,
                avg_similarity=0
            )
        
        # Calcular normas de los vectores
        norms = np.linalg.norm(self.embeddings, axis=1)
        
        # Calcular matriz de similitud
        if len(self.embeddings) > 1:
            similarity_matrix = self._compute_similarity_matrix()
            # Extraer solo la parte triangular superior (sin diagonal)
            upper_tri = similarity_matrix[np.triu_indices(len(similarity_matrix), k=1)]
            
            min_sim = float(np.min(upper_tri)) if len(upper_tri) > 0 else 0
            max_sim = float(np.max(upper_tri)) if len(upper_tri) > 0 else 0
            avg_sim = float(np.mean(upper_tri)) if len(upper_tri) > 0 else 0
        else:
            min_sim = max_sim = avg_sim = 0.0
        
        return EmbeddingStats(
            total_chunks=len(self.embeddings),
            embedding_dimension=self.embeddings.shape[1],
            mean_vector_norm=float(np.mean(norms)),
            std_vector_norm=float(np.std(norms)),
            min_similarity=min_sim,
            max_similarity=max_sim,
            avg_similarity=avg_sim
        )
    
    def _compute_similarity_matrix(self) -> np.ndarray:
        """Calcula la matriz de similitud coseno"""
        norms = np.linalg.norm(self.embeddings, axis=1, keepdims=True)
        norms = np.where(norms == 0, 1, norms)  # Evitar división por cero
        normalized = self.embeddings / norms
        return np.dot(normalized, normalized.T)
    
    def find_optimal_clusters(self, max_k: int = 10) -> Tuple[int, List[float]]:
        """
        Encuentra el número óptimo de clusters usando el método del codo
        
        Args:
            max_k: Máximo número de clusters a probar
            
        Returns:
            Tuple con (optimal_k, inertias)
        """
        if len(self.embeddings) < 2:
            return 1, []
        
        n_clusters = min(max_k, len(self.embeddings))
        inertias = []
        silhouette_scores = []
        
        for k in range(2, n_clusters + 1):
            try:
                kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
                labels = kmeans.fit_predict(self.embeddings)
                inertias.append(kmeans.inertia_)
                
                if k > 1:
                    sil_score = silhouette_score(self.embeddings, labels)
                    silhouette_scores.append(sil_score)
            except Exception as e:
                logger.warning(f"Error en cluster {k}: {e}")
                break
        
        # Usar silhouette score para encontrar óptimo
        if silhouette_scores:
            optimal_k = silhouette_scores.index(max(silhouette_scores)) + 2
        else:
            optimal_k = 3
        
        return optimal_k, inertias
    
    def perform_clustering(self, n_clusters: int = None) -> Tuple[np.ndarray, List[ClusterInfo]]:
        """
        Realiza clustering de los embeddings usando K-Means
        
        Args:
            n_clusters: Número de clusters (si es None, usa el óptimo)
            
        Returns:
            Tuple con (labels, cluster_info_list)
        """
        if len(self.embeddings) < 2:
            return np.zeros(len(self.embeddings), dtype=int), []
        
        if n_clusters is None:
            n_clusters, _ = self.find_optimal_clusters()
        
        n_clusters = min(n_clusters, len(self.embeddings))
        
        try:
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            labels = kmeans.fit_predict(self.embeddings)
            centroids = kmeans.cluster_centers_
            
            cluster_infos = []
            for i in range(n_clusters):
                cluster_mask = labels == i
                cluster_embeddings = self.embeddings[cluster_mask]
                
                # Calcular similitud intra-cluster
                if len(cluster_embeddings) > 1:
                    cluster_sims = []
                    for j in range(len(cluster_embeddings)):
                        for k in range(j + 1, len(cluster_embeddings)):
                            sim = cosine_similarity(cluster_embeddings[j], cluster_embeddings[k])
                            cluster_sims.append(sim)
                    avg_intra_sim = np.mean(cluster_sims) if cluster_sims else 0
                else:
                    avg_intra_sim = 1.0
                
                # Extraer keywords del contenido
                if self.contents:
                    cluster_contents = [self.contents[idx] for idx in range(len(self.contents)) if labels[idx] == i]
                    top_keywords = self._extract_keywords(cluster_contents)
                else:
                    top_keywords = []
                
                cluster_infos.append(ClusterInfo(
                    cluster_id=i,
                    chunk_count=int(np.sum(cluster_mask)),
                    centroid=centroids[i],
                    top_keywords=top_keywords,
                    avg_intra_similarity=float(avg_intra_sim)
                ))
            
            return labels, cluster_infos
            
        except Exception as e:
            logger.error(f"Error en clustering: {e}")
            return np.zeros(len(self.embeddings), dtype=int), []
    
    def _extract_keywords(self, texts: List[str], top_n: int = 5) -> List[str]:
        """Extrae palabras clave comunes de una lista de textos"""
        # Implementación simple - contar palabras frecuentes
        stopwords = {"el", "la", "de", "que", "y", "en", "un", "una", "es", "del", "los", "las", "por", "con", "para", "como", "pero", "su", "al", "lo", "como", "más", "muy", "ya", "o", "este", "esta", "estos", "estas", "ese", "esa", "esos", "esas", "a", "se", "no", "si", "todo", "todos", "todas", "cada", "uno", "una", "cuando", "donde", "mientras", "cómo", "qué", "cuál", "cuáles", "dónde", "quién", "quiénes"}
        
        word_counts = defaultdict(int)
        
        for text in texts:
            words = text.lower().split()
            for word in words:
                clean_word = "".join(c for c in word if c.isalnum())
                if len(clean_word) > 3 and clean_word not in stopwords:
                    word_counts[clean_word] += 1
        
        sorted_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)
        return [word for word, count in sorted_words[:top_n]]
    
    def reduce_dimensions_2d(self, method: str = "pca") -> np.ndarray:
        """
        Reduce los embeddings a 2D para visualización
        
        Args:
            method: 'pca' o 'tsne'
            
        Returns:
            Array de forma (n, 2) con coordenadas 2D
        """
        if len(self.embeddings) < 4:
            # No hay suficientes puntos para dimensionality reduction
            # Devolver los primeros 2 componentes si existen
            if self.embeddings.shape[1] >= 2:
                return self.embeddings[:, :2]
            else:
                # Rellenar con ceros
                zeros = np.zeros((len(self.embeddings), 2))
                zeros[:, 0] = np.arange(len(self.embeddings))
                return zeros
        
        if method == "tsne":
            try:
                tsne = TSNE(n_components=2, random_state=42, perplexity=min(30, len(self.embeddings) - 1))
                return tsne.fit_transform(self.embeddings)
            except Exception as e:
                logger.warning(f"Error en t-SNE: {e}, usando PCA")
                method = "pca"
        
        if method == "pca":
            pca = PCA(n_components=2)
            return pca.fit_transform(self.embeddings)
        
        return self.embeddings[:, :2]
    
    def find_outliers(self, threshold: float = 0.1) -> List[int]:
        """
        Detecta outliers usando análisis de vecinos más cercanos
        
        Args:
            threshold: Umbral de distancia para considerar outlier
            
        Returns:
            Índices de los chunks que son outliers
        """
        if len(self.embeddings) < 5:
            return []
        
        try:
            n_neighbors = min(5, len(self.embeddings) - 1)
            nn = NearestNeighbors(n_neighbors=n_neighbors)
            nn.fit(self.embeddings)
            distances, _ = nn.kneighbors(self.embeddings)
            
            # Usar la distancia promedio a los vecinos más cercanos
            avg_distances = np.mean(distances, axis=1)
            
            # Calcular estadísticas de distancias
            mean_dist = np.mean(avg_distances)
            std_dist = np.std(avg_distances)
            
            # Outliers: distancia > mean + 2*std
            outlier_mask = avg_distances > (mean_dist + 2 * std_dist)
            
            return list(np.where(outlier_mask)[0])
            
        except Exception as e:
            logger.error(f"Error detectando outliers: {e}")
            return []
    
    def get_nearest_neighbors(self, idx: int, k: int = 5) -> List[Tuple[int, float]]:
        """
        Encuentra los k vecinos más cercanos a un embedding específico
        
        Args:
            idx: Índice del embedding de referencia
            k: Número de vecinos a encontrar
            
        Returns:
            Lista de tuplas (indice, similitud) ordenadas por similitud descendente
        """
        if idx >= len(self.embeddings):
            return []
        
        target = self.embeddings[idx]
        similarities = []
        
        for i, emb in enumerate(self.embeddings):
            if i != idx:
                sim = cosine_similarity(target, emb)
                similarities.append((i, sim))
        
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:k]


class SearchAnalyzer:
    """Analizador para pruebas de búsqueda semántica"""
    
    def __init__(self, db_connector, embedder):
        self.db = db_connector
        self.embedder = embedder
    
    def run_test_queries(
        self, 
        test_queries: List[Dict[str, str]], 
        top_k: int = None
    ) -> List[SearchTestResult]:
        """
        Ejecuta pruebas de búsqueda con queries predefinidas
        
        Args:
            test_queries: Lista de diccionarios con 'query' y 'expected_relevant'
            top_k: Número de resultados a recuperar
            
        Returns:
            Lista de SearchTestResult
        """
        top_k = top_k or config.analysis.top_k_results
        results = []
        
        for test in test_queries:
            query = test["query"]
            expected_relevant = test.get("expected_relevant", True)
            
            try:
                import time
                start_time = time.time()
                
                # Generar embedding de la query
                query_embedding = self.embedder.embed_query(query)
                
                # Buscar en la base de datos
                retrieved = self.db.semantic_search(query_embedding, top_k)
                
                latency_ms = (time.time() - start_time) * 1000
                
                if retrieved:
                    top_sim = retrieved[0].get("similarity", 0)
                    avg_sim = np.mean([r.get("similarity", 0) for r in retrieved])
                    hits = top_sim >= config.analysis.similarity_threshold
                else:
                    top_sim = 0
                    avg_sim = 0
                    hits = False
                
                results.append(SearchTestResult(
                    query=query,
                    retrieved_chunks=retrieved,
                    expected_relevant=expected_relevant,
                    hits=hits,
                    top_similarity=top_sim,
                    avg_similarity=avg_sim,
                    latency_ms=latency_ms
                ))
                
            except Exception as e:
                logger.error(f"Error en test de búsqueda para '{query}': {e}")
                results.append(SearchTestResult(
                    query=query,
                    retrieved_chunks=[],
                    expected_relevant=expected_relevant,
                    hits=False,
                    top_similarity=0,
                    avg_similarity=0,
                    latency_ms=0
                ))
        
        return results
    
    def generate_summary(self, results: List[SearchTestResult]) -> Dict[str, Any]:
        """Genera un resumen de los resultados de búsqueda"""
        if not results:
            return {"error": "No hay resultados"}
        
        hits = sum(1 for r in results if r.hits)
        total = len(results)
        
        avg_latency = np.mean([r.latency_ms for r in results])
        avg_top_sim = np.mean([r.top_similarity for r in results])
        avg_all_sim = np.mean([r.avg_similarity for r in results])
        
        return {
            "total_tests": total,
            "successful_hits": hits,
            "success_rate": hits / total * 100 if total > 0 else 0,
            "avg_latency_ms": avg_latency,
            "avg_top_similarity": avg_top_sim,
            "avg_all_similarities": avg_all_sim,
            "threshold_used": config.analysis.similarity_threshold
        }
