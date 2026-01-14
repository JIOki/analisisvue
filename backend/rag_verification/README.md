# RAG Verification Service

Microservicio FastAPI para verificar la veracidad de respuestas generadas por modelos de IA en sistemas RAG (Retrieval-Augmented Generation).

## Características

- **Verificación de Respuestas**: Analiza respuestas del modelo y verifica su respaldo en fuentes de conocimiento
- **Puntuación de Confianza**: Calcula scores de confianza (0-1) basados en similitud semántica
- **Análisis de Afirmaciones**: Identifica y verifica afirmaciones individuales en las respuestas
- **Búsqueda de Fuentes**: Endpoint para buscar fuentes relevantes en la base de conocimiento
- **Verificación en Lote**: Soporta análisis de múltiples respuestas simultáneamente

## Estructura del Proyecto

```
rag_verification/
├── main.py                    # Punto de entrada FastAPI
├── config.py                  # Configuración centralizada
├── requirements.txt           # Dependencias Python
├── models/
│   └── __init__.py           # Modelos Pydantic
├── routers/
│   ├── __init__.py
│   ├── verify.py             # Endpoints de verificación
│   └── health.py             # Endpoints de salud
└── services/
    └── verification.py       # Lógica de verificación
```

## Instalación

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
.\venv\Scripts\activate   # Windows

# Instalar dependencias
cd rag_verification
pip install -r requirements.txt
```

## Configuración

El servicio lee las siguientes variables de entorno:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `RV_HOST` | `0.0.0.0` | Host del servidor |
| `RV_PORT` | `8001` | Puerto del servidor |
| `RV_DEBUG` | `false` | Modo debug |
| `DB_HOST` | `localhost` | Host de PostgreSQL |
| `DB_PORT` | `5432` | Puerto de PostgreSQL |
| `DB_USER` | `raguser` | Usuario de PostgreSQL |
| `DB_PASS` | `ragpass` | Contraseña de PostgreSQL |
| `DB_NAME` | `ragdb` | Nombre de la base de datos |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | URL de Ollama |
| `EMBEDDING_MODEL` | `mxbai-embed-large` | Modelo de embeddings |
| `SIMILARITY_THRESHOLD` | `0.7` | Umbral de similitud |
| `TOP_K_RESULTS` | `5` | Resultados por búsqueda |

## Ejecución

```bash
# Desarrollo
python main.py

# Producción
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4

# Con Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8001
```

## Endpoints

### Verificación de Respuestas

```http
POST /api/v1/verify/response
Content-Type: application/json

{
    "query": "¿Qué es el machine learning?",
    "response": "El machine learning es una rama de la IA...",
    "linked_material_ids": ["mat-1", "mat-2"],
    "user_id": "user-123"
}
```

**Response:**
```json
{
    "status": "verified",
    "query": "¿Qué es el machine learning?",
    "response": "El machine learning es una rama de la IA...",
    "confidence_score": 0.85,
    "confidence_level": "alta",
    "metrics": {
        "overall_confidence": 0.85,
        "confidence_level": "alta",
        "supported_claims": 3,
        "unsupported_claims": 0,
        "total_evidence_sources": 2,
        "max_similarity": 0.92,
        "avg_similarity": 0.78,
        "threshold_used": 0.7
    },
    "relevant_sources": [...],
    "claims_analysis": [...],
    "warnings": [],
    "processing_time_ms": 150.5,
    "model_version": "1.0.0",
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### Verificación Rápida de Confianza

```http
POST /api/v1/verify/confidence
Content-Type: application/json

{
    "query": "¿Qué es el machine learning?",
    "response": "El machine learning es una rama de la IA...",
    "threshold": 0.7
}
```

### Búsqueda de Fuentes

```http
GET /api/v1/verify/sources?q=machine+learning&top_k=5
```

### Verificación en Lote

```http
POST /api/v1/verify/batch
Content-Type: application/json

{
    "items": [
        {"query": "...", "response": "..."},
        {"query": "...", "response": "..."}
    ]
}
```

### Health Check

```http
GET /health/
GET /health/live
GET /health/ready
```

## Integración con Backend Node.js

Para integrar este servicio con el backend Node.js existente:

```javascript
// Ejemplo de integración en el backend Node.js

async function verifyResponse(query, response, linkedMaterialIds) {
    const response = await fetch('http://localhost:8001/api/v1/verify/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query,
            response,
            linked_material_ids: linkedMaterialIds,
            user_id: req.user.id
        })
    });
    
    return await response.json();
}
```

## Niveles de Confianza

| Nivel | Rango | Descripción |
|-------|-------|-------------|
| **ALTA** | 0.8 - 1.0 | Respuesta bien respaldada por fuentes |
| **MEDIA** | 0.6 - 0.8 | Respuesta parcialmente respaldada |
| **BAJA** | 0.4 - 0.6 | Poco respaldo, verificar detalles |
| **NULA** | 0.0 - 0.4 | Sin respaldo en las fuentes |

## Métricas de Verificación

- **overall_confidence**: Confianza general de la respuesta
- **supported_claims**: Afirmaciones con respaldo en fuentes
- **unsupported_claims**: Afirmaciones sin respaldo
- **max_similarity**: Similitud máxima encontrada
- **avg_similarity**: Similitud promedio de fuentes

## License

MIT
