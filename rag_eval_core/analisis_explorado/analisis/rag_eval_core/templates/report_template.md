# 📊 {{ report_title }}

**Generado:** {{ generated_at }}

---

## 1. Resumen Ejecutivo

### Estadísticas de Embeddings

| Métrica | Valor |
|---------|-------|
| Total de Chunks | {{ stats.total_chunks }} |
| Dimensión del Embedding | {{ stats.embedding_dimension }} |
| Norma Media del Vector | {{ stats.mean_vector_norm:.4f }} |
| Desviación Estándar de Normas | {{ stats.std_vector_norm:.4f }} |

### Similitud entre Chunks

| Métrica | Valor |
|---------|-------|
| Similitud Media | {{ stats.avg_similarity:.4f }} |
| Similitud Mínima | {{ stats.min_similarity:.4f }} |
| Similitud Máxima | {{ stats.max_similarity:.4f }} |

### Evaluación de Calidad

{% if stats.avg_similarity > 0.7 %}
✅ **CALIDAD ALTA**: Los embeddings muestran excelente cohesión semántica.
{% elif stats.avg_similarity > 0.4 %}
⚠️ **CALIDAD MEDIA**: Los embeddings tienen separación razonable.
{% else %}
❌ **CALIDAD BAJA**: Los embeddings pueden tener problemas de distribución.
{% endif %}

---

## 2. Información del Modelo

| Parámetro | Valor |
|-----------|-------|
| Modelo de Embedding | {{ model_info.name }} |
| Dimensión | {{ model_info.embedding_dimension }} |
| URL de Ollama | {{ model_info.ollama_url }} |

---

## 3. Visualización del Espacio de Embeddings

### 3.1 Distribución de Similitud

![Distribución de Similitud]({{ visualization_paths.similarity_dist | basename }})

Esta gráfica muestra la distribución de similitud coseno entre todos los pares de chunks. 
- Una distribución concentrada indica que los chunks son muy similares entre sí.
- Una distribución dispersa indica mayor diversidad en el contenido.

### 3.2 Mapa de Embeddings (PCA 2D)

![Mapa de Embeddings 2D]({{ visualization_paths.embedding_2d | basename }})

Visualización de los embeddings proyectados a 2D usando PCA. Los puntos cercanos representan chunks semánticamente similares.

### 3.3 Distribución de Normas

![Distribución de Normas]({{ visualization_paths.norms_dist | basename }})

Histograma y boxplot de las normas de los vectores de embedding.

---

## 4. Análisis de Clusters

{% if cluster_info %}
Se detectaron **{{ cluster_info | length }} clusters** de conocimiento:

| Cluster | Chunks | Similitud Intra-Cluster | Palabras Clave |
|---------|--------|-------------------------|----------------|
{% for cluster in cluster_info %}
| {{ cluster.cluster_id }} | {{ cluster.chunk_count }} | {{ cluster.avg_intra_similarity:.4f }} | {{ cluster.top_keywords[:3] | join(", ") }} |
{% endfor %}

{% if visualization_paths.clusters %}
### 4.1 Visualización de Clusters

![Clusters]({{ visualization_paths.clusters | basename }})
{% endif %}

### Interpretación de Clusters

{% for cluster in cluster_info %}
- **Cluster {{ cluster.cluster_id }}** ({{ cluster.chunk_count }} chunks, similitud: {{ cluster.avg_intra_similarity:.3f }}):
  {% if cluster.top_keywords %}
  Temas principales: **{{ cluster.top_keywords | join(", ") }}**
  {% else %}
  Sin palabras clave detectadas
  {% endif %}
{% endfor %}

{% else %}
No se realizó análisis de clusters (insuficientes datos).
{% endif %}

---

## 5. Pruebas de Búsqueda Semántica

### 5.1 Resumen de Resultados

| Métrica | Valor |
|---------|-------|
| Total de Pruebas | {{ search_results.total_tests }} |
| Hits Exitosos | {{ search_results.successful_hits }} |
| Tasa de Éxito | {{ search_results.success_rate:.1f }}% |
| Latencia Media | {{ search_results.avg_latency_ms:.2f }} ms |
| Similitud Media (Top 1) | {{ search_results.avg_top_similarity:.4f }} |
| Umbral de Éxito | {{ search_results.threshold_used }} |

### 5.2 Resultados Detallados

{% if search_results.tests %}
| Query | Similitud Top | Estado | Latencia |
|-------|---------------|--------|----------|
{% for test in search_results.tests %}
| {{ test.query[:50] }}... | {{ test.top_similarity:.4f }} | {% if test.hits %}✅ HIT{% else %}❌ MISS{% endif %} | {{ test.latency_ms:.1f }} ms |
{% endfor %}
{% else %}
No se realizaron pruebas de búsqueda.
{% endif %}

{% if visualization_paths.search_results %}
### 5.3 Visualización de Resultados

![Resultados de Búsqueda]({{ visualization_paths.search_results | basename }})
{% endif %}

---

## 6. Recomendaciones

{% if stats.avg_similarity < 0.3 %}
### ⚠️ Similitud Baja Detectada

La similitud media entre chunks es muy baja ({{ stats.avg_similarity:.4f }}). Esto puede indicar:

1. **Chunks muy diversos**: Los documentos pueden cubrir temas muy diferentes
2. **Problemas con el modelo**: Verificar que el modelo de embedding funciona correctamente
3. **Cantidad insuficiente de datos**: Se necesitan más documentos para análisis significativo

**Acción recomendada**: Revisar la calidad de los documentos fuente.
{% endif %}

{% if stats.avg_similarity > 0.8 %}
### 📝 Alta Redundancia Detectada

La similitud media es muy alta ({{ stats.avg_similarity:.4f }}). Esto puede indicar:

1. **Chunks muy similares**: Posible redundancia en el contenido
2. **Chunk size muy grande**: Los chunks pueden estar capturando contenido similar
3. **Documentos repetidos**: Posibles duplicados en la base de datos

**Acción recomendada**: Considerar reducir el tamaño de chunks o eliminar duplicados.
{% endif %}

{% if search_results.success_rate < 70 %}
### 🔍 Baja Tasa de Éxito en Búsquedas

La tasa de éxito de búsquedas es {{ search_results.success_rate:.1f }}%. 

**Acción recomendada**: 
- Revisar los chunks de baja calidad
- Aumentar el número de documentos
- Verificar la configuración del modelo de embedding
{% endif %}

### Recomendaciones Generales

1. **Monitoreo regular**: Ejecutar este análisis periódicamente
2. **Umbral de similitud**: Ajustar el umbral según las necesidades del negocio
3. **Actualización de embeddings**: Regenerar embeddings cuando se actualice el modelo

---

## 7. Configuración del Análisis

| Parámetro | Valor |
|-----------|-------|
| Modelo | {{ config.embedding_model }} |
| Umbral de Similitud | {{ config.similarity_threshold }} |
| Top K Búsquedas | {{ config.top_k }} |
| Dimensión | {{ config.embedding_dimension }} |

---

*Reporte generado automáticamente por RAG Eval Core*
