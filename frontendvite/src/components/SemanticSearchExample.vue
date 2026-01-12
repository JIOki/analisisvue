<!--
  Ejemplo de uso de los componentes de búsqueda semántica
  Archivo: SemanticSearchExample.vue
-->

<script setup>
import { ref } from 'vue'
import SemanticSearch from '@/components/SemanticSearch.vue'
import SearchResults from '@/components/SearchResults.vue'

// Estado de la conversación activa
const activeConversation = ref({
  id: 'conv-123',
  title: 'Mi Conversación',
  messages: []
})

// Manejar agregado de resultados a la conversación
const handleAddToConversation = (searchResult) => {
  console.log('Agregando resultado a conversación:', searchResult)
  
  // Aquí puedes implementar la lógica para agregar el resultado
  // a la conversación activa, por ejemplo:
  activeConversation.value.messages.push({
    id: Date.now(),
    type: 'user',
    content: `Consulta: ${searchResult.search_query}`,
    timestamp: new Date()
  })
  
  activeConversation.value.messages.push({
    id: Date.now() + 1,
    type: 'assistant',
    content: searchResult.content,
    metadata: searchResult.metadata,
    timestamp: new Date()
  })
  
  // Mostrar notificación de éxito
  showNotification('Resultado agregado a la conversación')
}

// Notificación simple
const notification = ref('')
const showNotification = (message) => {
  notification.value = message
  setTimeout(() => {
    notification.value = ''
  }, 3000)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Notificación -->
    <div
      v-if="notification"
      class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300"
    >
      <div class="flex items-center">
        <i class="pi pi-check-circle mr-2"></i>
        {{ notification }}
      </div>
    </div>

    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Búsqueda Semántica Avanzada
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              Busca en todos tus documentos con inteligencia artificial
            </p>
          </div>
          
          <!-- Información de la conversación activa -->
          <div v-if="activeConversation" class="text-right">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Conversación activa
            </div>
            <div class="font-medium text-gray-900 dark:text-white">
              {{ activeConversation.title }}
            </div>
            <div class="text-xs text-gray-500">
              {{ activeConversation.messages.length }} mensajes
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Panel de búsqueda -->
        <div class="lg:col-span-2">
          <SemanticSearch
            :active-conversation="activeConversation"
            @add-to-conversation="handleAddToConversation"
          />
        </div>

        <!-- Panel lateral -->
        <div class="lg:col-span-1">
          <!-- Consejos de búsqueda -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <i class="pi pi-lightbulb mr-2"></i>
              Consejos de Búsqueda
            </h3>
            <ul class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li class="flex items-start">
                <i class="pi pi-check text-green-500 mr-2 mt-0.5"></i>
                <span>Usa palabras clave específicas para mejores resultados</span>
              </li>
              <li class="flex items-start">
                <i class="pi pi-check text-green-500 mr-2 mt-0.5"></i>
                <span>Combina términos relacionados con AND, OR</span>
              </li>
              <li class="flex items-start">
                <i class="pi pi-check text-green-500 mr-2 mt-0.5"></i>
                <span>Usa filtros para acotar la búsqueda</span>
              </li>
              <li class="flex items-start">
                <i class="pi pi-check text-green-500 mr-2 mt-0.5"></i>
                <span>Revisa la puntuación de relevancia</span>
              </li>
            </ul>
          </div>

          <!-- Historial de búsquedas recientes -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <i class="pi pi-history mr-2"></i>
              Búsquedas Recientes
            </h3>
            <div class="space-y-2">
              <button
                v-for="i in 5"
                :key="i"
                class="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  Consulta de ejemplo {{ i }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ i }} resultados • Hace {{ i }} minutos
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Estilos adicionales si es necesario */
</style>