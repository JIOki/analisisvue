<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  results: {
    type: Array,
    default: () => []
  },
  searchQuery: {
    type: String,
    default: ''
  },
  currentPage: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 1
  },
  totalResults: {
    type: Number,
    default: 0
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['add-to-conversation', 'page-change'])

// Métodos
const highlightText = (text, query) => {
  if (!query || !text) return text
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600 px-1 rounded">$1</mark>')
}

const formatDate = (dateString) => {
  if (!dateString) return 'Fecha no disponible'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getDocumentIcon = (documentType) => {
  const icons = {
    pdf: 'pi pi-file-pdf text-red-500',
    docx: 'pi pi-file-word text-blue-500',
    txt: 'pi pi-file text-gray-500',
    md: 'pi pi-markdown text-purple-500',
    csv: 'pi pi-table text-green-500',
    json: 'pi pi-code text-yellow-500'
  }
  return icons[documentType] || 'pi pi-file text-gray-500'
}

const getSourceBadgeColor = (source) => {
  const colors = {
    local: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    database: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    api: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    uploaded: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  }
  return colors[source] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
}

const handleAddToConversation = (result) => {
  emit('add-to-conversation', result)
}

const handlePageChange = (direction) => {
  const newPage = direction === 'next' 
    ? Math.min(props.currentPage + 1, props.totalPages)
    : Math.max(props.currentPage - 1, 1)
  
  if (newPage !== props.currentPage) {
    emit('page-change', newPage)
  }
}

const goToPage = (page) => {
  if (page !== props.currentPage && page >= 1 && page <= props.totalPages) {
    emit('page-change', page)
  }
}

// Computed
const visiblePageNumbers = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, props.currentPage - Math.floor(maxVisible / 2))
  let end = Math.min(props.totalPages, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const hasNextPage = computed(() => props.currentPage < props.totalPages)
const hasPrevPage = computed(() => props.currentPage > 1)
</script>

<template>
  <div class="search-results">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="flex items-center space-x-2">
        <i class="pi pi-spin pi-spinner text-blue-600"></i>
        <span class="text-gray-600 dark:text-gray-400">Cargando resultados...</span>
      </div>
    </div>

    <!-- Results List -->
    <div v-else class="space-y-4">
      <div
        v-for="(result, index) in results"
        :key="result.id || index"
        class="result-item bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-all duration-200"
      >
        <!-- Header del resultado -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center space-x-3 flex-1">
            <!-- Icono del tipo de documento -->
            <div class="flex-shrink-0">
              <i :class="[getDocumentIcon(result.document_type), 'text-xl']"></i>
            </div>
            
            <!-- Título y fuente -->
            <div class="flex-1 min-w-0">
              <h3 
                class="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate"
                v-html="highlightText(result.title || 'Sin título', searchQuery)"
              ></h3>
              
              <div class="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <!-- Fuente -->
                <span class="flex items-center">
                  <i class="pi pi-database mr-1"></i>
                  <span 
                    class="px-2 py-1 rounded-full text-xs font-medium"
                    :class="getSourceBadgeColor(result.source)"
                  >
                    {{ result.source || 'Desconocida' }}
                  </span>
                </span>
                
                <!-- Tipo -->
                <span class="flex items-center">
                  <i class="pi pi-file mr-1"></i>
                  {{ (result.document_type || 'Desconocido').toUpperCase() }}
                </span>
                
                <!-- Fecha -->
                <span class="flex items-center">
                  <i class="pi pi-calendar mr-1"></i>
                  {{ formatDate(result.created_at || result.date) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Score de relevancia -->
          <div v-if="result.relevance_score" class="flex-shrink-0 ml-4">
            <div class="text-right">
              <div class="text-xs text-gray-500 mb-1">Relevancia</div>
              <div class="flex items-center">
                <div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                  <div 
                    class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${Math.round(result.relevance_score * 100)}%` }"
                  ></div>
                </div>
                <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {{ Math.round(result.relevance_score * 100) }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Contenido/Fragmento -->
        <div class="mb-4">
          <p 
            class="text-gray-700 dark:text-gray-300 leading-relaxed"
            v-html="highlightText(result.content || result.snippet || 'Sin contenido disponible', searchQuery)"
          ></p>
        </div>

        <!-- Metadata adicional -->
        <div v-if="result.metadata" class="mb-4 text-xs text-gray-500 dark:text-gray-400">
          <div class="flex flex-wrap gap-4">
            <span v-if="result.metadata.author">
              <i class="pi pi-user mr-1"></i>
              {{ result.metadata.author }}
            </span>
            <span v-if="result.metadata.pages">
              <i class="pi pi-list mr-1"></i>
              {{ result.metadata.pages }} páginas
            </span>
            <span v-if="result.metadata.size">
              <i class="pi pi-hdd mr-1"></i>
              {{ result.metadata.size }}
            </span>
          </div>
        </div>

        <!-- Acciones -->
        <div class="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <!-- Enlaces de acción -->
          <div class="flex items-center space-x-4">
            <button
              v-if="result.url"
              @click="window.open(result.url, '_blank')"
              class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center transition-colors"
            >
              <i class="pi pi-external-link mr-1"></i>
              Ver documento
            </button>
            
            <button
              v-if="result.download_url"
              @click="window.open(result.download_url, '_blank')"
              class="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm font-medium flex items-center transition-colors"
            >
              <i class="pi pi-download mr-1"></i>
              Descargar
            </button>
          </div>

          <!-- Botón agregar a conversación -->
          <button
            @click="handleAddToConversation(result)"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <i class="pi pi-plus mr-1"></i>
            Agregar a conversación
          </button>
        </div>
      </div>
    </div>

    <!-- Paginación -->
    <div v-if="totalPages > 1" class="pagination mt-8 flex items-center justify-between">
      <!-- Info de página -->
      <div class="text-sm text-gray-700 dark:text-gray-300">
        Página {{ currentPage }} de {{ totalPages }}
        <span class="text-gray-500">
          ({{ totalResults }} resultado{{ totalResults !== 1 ? 's' : '' }})
        </span>
      </div>

      <!-- Controles de paginación -->
      <div class="flex items-center space-x-2">
        <!-- Botón anterior -->
        <button
          @click="handlePageChange('prev')"
          :disabled="!hasPrevPage"
          class="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <i class="pi pi-chevron-left mr-1"></i>
          Anterior
        </button>

        <!-- Números de página -->
        <div class="flex items-center space-x-1">
          <!-- Primera página si no está visible -->
          <button
            v-if="visiblePageNumbers[0] > 1"
            @click="goToPage(1)"
            class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            1
          </button>

          <!-- Ellipsis izquierda -->
          <span v-if="visiblePageNumbers[0] > 2" class="px-2 text-gray-500">...</span>

          <!-- Páginas visibles -->
          <button
            v-for="page in visiblePageNumbers"
            :key="page"
            @click="goToPage(page)"
            :class="[
              'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              page === currentPage
                ? 'bg-blue-600 text-white border border-blue-600'
                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'
            ]"
          >
            {{ page }}
          </button>

          <!-- Ellipsis derecha -->
          <span v-if="visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages - 1" class="px-2 text-gray-500">...</span>

          <!-- Última página si no está visible -->
          <button
            v-if="visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages"
            @click="goToPage(totalPages)"
            class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {{ totalPages }}
          </button>
        </div>

        <!-- Botón siguiente -->
        <button
          @click="handlePageChange('next')"
          :disabled="!hasNextPage"
          class="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Siguiente
          <i class="pi pi-chevron-right ml-1"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-item {
  transition: all 0.2s ease;
}

.result-item:hover {
  transform: translateY(-1px);
}

/* Estilos para texto destacado */
:deep(mark) {
  background-color: rgb(254 240 138);
  color: rgb(133 77 14);
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 500;
}

@media (prefers-color-scheme: dark) {
  :deep(mark) {
    background-color: rgb(161 98 7);
    color: rgb(254 240 138);
  }
}

/* Animaciones */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Scroll suave */
html {
  scroll-behavior: smooth;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .dark\:bg-gray-800 {
    background-color: rgb(31 41 55);
  }
  .dark\:bg-gray-700 {
    background-color: rgb(55 65 81);
  }
  .dark\:bg-gray-900 {
    background-color: rgb(17 24 39);
  }
  .dark\:text-white {
    color: rgb(255 255 255);
  }
  .dark\:text-gray-300 {
    color: rgb(209 213 219);
  }
  .dark\:text-gray-400 {
    color: rgb(156 163 175);
  }
  .dark\:border-gray-600 {
    border-color: rgb(75 85 99);
  }
  .dark\:border-gray-700 {
    border-color: rgb(55 65 81);
  }
  .dark\:bg-blue-900 {
    background-color: rgb(30 58 138);
  }
  .dark\:text-blue-200 {
    color: rgb(191 219 254);
  }
  .dark\:bg-green-900 {
    background-color: rgb(6 78 59);
  }
  .dark\:text-green-200 {
    color: rgb(167 243 208);
  }
  .dark\:bg-purple-900 {
    background-color: rgb(76 29 149);
  }
  .dark\:text-purple-200 {
    color: rgb(221 214 254);
  }
  .dark\:bg-orange-900 {
    background-color: rgb(154 52 18);
  }
  .dark\:text-orange-200 {
    color: rgb(254 215 170);
  }
  .dark\:bg-gray-900\/20 {
    background-color: rgb(17 24 39 / 0.2);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .result-item {
    padding: 1rem;
  }
  
  .pagination {
    flex-direction: column;
    space-y: 1rem;
  }
  
  .pagination > div:first-child {
    margin-bottom: 0.5rem;
  }
}
</style>