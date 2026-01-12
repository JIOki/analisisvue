# Componentes de Búsqueda Semántica

## Descripción

Sistema completo de búsqueda semántica para el frontend que permite buscar en documentos utilizando inteligencia artificial y vectores de similitud.

## Componentes

### 1. SemanticSearch.vue
Componente principal que maneja la interfaz de búsqueda y la lógica de filtrado.

#### Propiedades (Props)
- `activeConversation` (Object, opcional): Conversación activa a la que se pueden agregar resultados

#### Eventos (Emits)
- `add-to-conversation`: Se emite cuando se agrega un resultado a la conversación

#### Características
- ✅ Búsqueda en tiempo real con debounce (500ms)
- ✅ Filtros por tipo de documento (PDF, DOCX, TXT, MD, CSV, JSON)
- ✅ Selector de fuentes con contador de documentos
- ✅ Ordenamiento por relevancia, fecha o fuente
- ✅ Indicadores de carga y estado vacío
- ✅ Manejo de errores
- ✅ Búsqueda con mínimo 2 caracteres
- ✅ Limpieza de búsqueda

### 2. SearchResults.vue
Componente especializado para mostrar los resultados de búsqueda de forma atractiva.

#### Propiedades (Props)
- `results` (Array): Lista de resultados de búsqueda
- `searchQuery` (String): Consulta de búsqueda para destacar términos
- `currentPage` (Number): Página actual
- `totalPages` (Number): Total de páginas
- `totalResults` (Number): Total de resultados
- `isLoading` (Boolean): Estado de carga

#### Eventos (Emits)
- `add-to-conversation`: Agregar resultado a conversación
- `page-change`: Cambiar página de resultados

#### Características
- ✅ Destacado de términos de búsqueda
- ✅ Metadata completa (fuente, fecha, tipo, autor, páginas)
- ✅ Puntuación de relevancia visual
- ✅ Iconos por tipo de documento
- ✅ Enlaces a documentos originales
- ✅ Paginación inteligente
- ✅ Descarga de archivos
- ✅ Diseño responsive

## Estructura de Datos

### Resultado de Búsqueda
```javascript
{
  id: "unique-id",
  title: "Título del documento",
  content: "Fragmento relevante del contenido...",
  snippet: "Resumen del contenido",
  source: "local|database|api|uploaded",
  document_type: "pdf|docx|txt|md|csv|json",
  relevance_score: 0.85, // 0-1
  created_at: "2025-10-31T10:46:46Z",
  date: "2025-10-31",
  url: "https://ejemplo.com/documento",
  download_url: "https://ejemplo.com/descargar",
  metadata: {
    author: "Nombre del autor",
    pages: 25,
    size: "2.5 MB"
  }
}
```

## API Endpoints

### Búsqueda Semántica
```
GET /api/search/semantic
```

#### Parámetros de Query
- `q` (string): Consulta de búsqueda (requerido)
- `page` (number): Número de página (default: 1)
- `page_size` (number): Tamaño de página (default: 10)
- `sort_by` (string): Campo de ordenamiento (relevance|date|source)
- `document_types` (string): Tipos de documento separados por coma
- `sources` (string): Fuentes separadas por coma

#### Respuesta
```javascript
{
  "results": [...],
  "total": 150,
  "page": 1,
  "page_size": 10,
  "total_pages": 15
}
```

### Obtener Fuentes Disponibles
```
GET /api/search/sources
```

#### Respuesta
```javascript
{
  "sources": [
    {
      "label": "Documentos_locales",
      "value": "local",
      "count": 150
    }
  ]
}
```

## Instalación y Uso

### 1. Importar Componentes
```vue
<script setup>
import SemanticSearch from '@/components/SemanticSearch.vue'
import SearchResults from '@/components/SearchResults.vue'
</script>
```

### 2. Uso Básico
```vue
<template>
  <SemanticSearch 
    :active-conversation="activeConversation"
    @add-to-conversation="handleAddResult"
  />
</template>

<script setup>
const activeConversation = ref(null)

const handleAddResult = (result) => {
  // Lógica para agregar resultado a conversación
  console.log('Resultado:', result)
}
</script>
```

### 3. Uso Avanzado con Control Personalizado
```vue
<template>
  <div>
    <!-- Búsqueda personalizada -->
    <SemanticSearch 
      ref="searchComponent"
      @add-to-conversation="handleAddToConversation"
    />
    
    <!-- Resultados personalizados -->
    <SearchResults
      :results="customResults"
      :search-query="searchQuery"
      @add-to-conversation="handleAddToConversation"
      @page-change="handlePageChange"
    />
  </div>
</template>
```

## Características de UX/UI

### Búsqueda en Tiempo Real
- Debounce de 500ms para evitar llamadas excesivas
- Indicador visual de búsqueda activa
- Búsqueda automática al escribir (mínimo 2 caracteres)

### Filtros Inteligentes
- Checkboxes para tipos de documento
- Contador de documentos por fuente
- Ordenamiento múltiple

### Resultados Visuales
- Destacado de términos con `<mark>`
- Puntuación de relevancia con barra de progreso
- Iconos distintivos por tipo de archivo
- Badges de color para fuentes

### Paginación
- Controles anterior/siguiente
- Números de página directos
- Información de página actual
- Responsive en móviles

### Accesibilidad
- Labels descriptivos para todos los inputs
- Focus states visibles
- Contraste adecuado en modo oscuro
- Navegación por teclado

## Estilos y Temas

### Variables CSS
Los componentes usan las variables de Tailwind CSS por defecto y soportan modo oscuro automáticamente.

### Personalización
```css
/* Personalizar colores de relevancia */
.result-item .relevance-bar {
  background: linear-gradient(to right, #ef4444, #f59e0b, #10b981);
}

/* Personalizar destacado de términos */
:deep(mark) {
  background-color: #fef08a;
  color: #854d0e;
  font-weight: 600;
}
```

## Estados y Manejo de Errores

### Estados de Carga
- Spinner durante búsqueda
- Mensajes informativos
- Skeleton loading (opcional)

### Estados Vacíos
- Sin resultados: mensaje helpful con sugerencias
- Sin búsqueda: estado inicial atractivo
- Error: mensaje claro con opción de reintentar

### Manejo de Errores
```javascript
// Ejemplo de manejo de errores
try {
  const response = await fetch('/api/search/semantic')
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`)
  }
  const data = await response.json()
  return data
} catch (error) {
  console.error('Error en búsqueda:', error)
  throw error
}
```

## Performance

### Optimizaciones
- Debounce para reducir llamadas API
- Paginación para grandes datasets
- Lazy loading de imágenes
- Virtual scrolling (para futuras implementaciones)

### Métricas Recomendadas
- Tiempo de búsqueda: < 500ms
- Tiempo de renderizado: < 100ms
- Tamaño de respuesta: < 1MB por página

## Testing

### Casos de Prueba
1. Búsqueda básica con resultados
2. Búsqueda sin resultados
3. Filtros múltiples
4. Paginación
5. Navegación entre resultados
6. Agregar a conversación
7. Manejo de errores de red
8. Responsividad en móvil

### Ejemplo de Test
```javascript
import { mount } from '@vue/test-utils'
import SemanticSearch from '@/components/SemanticSearch.vue'

describe('SemanticSearch', () => {
  it('realiza búsqueda cuando se escriben 2+ caracteres', async () => {
    const wrapper = mount(SemanticSearch)
    const input = wrapper.find('input[type="text"]')
    
    await input.setValue('test query')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.vm.searchQuery).toBe('test query')
  })
})
```

## Futuras Mejoras

- [ ] Búsqueda por voz
- [ ] Filtros de fecha más avanzados
- [ ] Guardado de búsquedas favoritas
- [ ] Exportación de resultados
- [ ] Búsqueda avanzada con operadores
- [ ] Sugerencias de búsqueda automática
- [ ] Resultados en tiempo real
- [ ] Integración con IA para reescritura de consultas

## Soporte

Para reportar bugs o solicitar funcionalidades, crear un issue en el repositorio del proyecto.

---

**Versión:** 1.0.0  
**Última actualización:** 2025-10-31  
**Compatibilidad:** Vue 3, Tailwind CSS 3.x