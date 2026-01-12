<script setup>
import { ref, computed, watch, nextTick } from 'vue'

// Props
const props = defineProps({
  conversation: {
    type: Object,
    required: true,
    validator: (obj) => {
      return obj && typeof obj.id !== 'undefined' && typeof obj.title !== 'undefined'
    }
  }
})

// Emits
const emit = defineEmits(['title-updated'])

// Estados reactivos
const isEditing = ref(false)
const isLoading = ref(false)
const error = ref('')
const editTitle = ref('')
const inputRef = ref(null)

// Computed properties
const displayTitle = computed(() => {
  if (isEditing.value) {
    return editTitle.value
  }
  return props.conversation.title || 'Sin título'
})

const maxLength = 100
const canSave = computed(() => {
  return editTitle.value.trim().length > 0 && 
         editTitle.value.trim().length <= maxLength && 
         editTitle.value.trim() !== props.conversation.title
})

// Métodos
function startEdit() {
  if (isLoading.value) return
  
  isEditing.value = true
  error.value = ''
  editTitle.value = props.conversation.title || ''
  
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus()
      inputRef.value.select()
    }
  })
}

function cancelEdit() {
  isEditing.value = false
  error.value = ''
  editTitle.value = props.conversation.title || ''
}

async function saveTitle() {
  if (!canSave.value || isLoading.value) return
  
  const trimmedTitle = editTitle.value.trim()
  
  if (trimmedTitle.length === 0) {
    error.value = 'El título no puede estar vacío'
    return
  }
  
  if (trimmedTitle.length > maxLength) {
    error.value = `El título no puede exceder ${maxLength} caracteres`
    return
  }
  
  isLoading.value = true
  error.value = ''
  
  try {
    const response = await fetch(`/api/conversations/${props.conversation.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        title: trimmedTitle
      })
    })
    
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Actualizar el título localmente
    emit('title-updated', {
      id: props.conversation.id,
      title: trimmedTitle
    })
    
    isEditing.value = false
    
  } catch (err) {
    console.error('Error al actualizar título:', err)
    error.value = 'Error al guardar el título. Inténtalo de nuevo.'
  } finally {
    isLoading.value = false
  }
}

function generateAutoTitle() {
  // Esta función podría recibir el primer mensaje como prop en el futuro
  // Por ahora, genera un título basado en timestamp
  const now = new Date()
  const timeString = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
  
  const autoTitle = `Conversación ${timeString}`
  editTitle.value = autoTitle
}

function handleKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    saveTitle()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelEdit()
  }
}

// Watch para resetear error cuando cambie el modo de edición
watch(isEditing, (newVal) => {
  if (!newVal) {
    error.value = ''
  }
})
</script>

<template>
  <div class="conversation-title-container">
    <!-- Título en modo visualización -->
    <div
      v-if="!isEditing"
      class="title-display"
      @dblclick="startEdit"
      role="button"
      tabindex="0"
      :aria-label="`Editar título de conversación: ${displayTitle}`"
      @keydown.enter="startEdit"
      @keydown.space.prevent="startEdit"
    >
      <h1 class="title-text">
        {{ displayTitle }}
      </h1>
      
      <!-- Botón de edición -->
      <button
        type="button"
        class="edit-button"
        @click.stop="startEdit"
        :disabled="isLoading"
        aria-label="Editar título"
        title="Editar título (doble clic también funciona)"
      >
        <svg 
          class="edit-icon" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
    </div>

    <!-- Título en modo edición -->
    <div v-else class="title-edit-container">
      <div class="input-group">
        <input
          ref="inputRef"
          v-model="editTitle"
          type="text"
          class="title-input"
          :placeholder="'Título de la conversación'"
          :maxlength="maxLength"
          :aria-label="`Editar título de conversación (máximo ${maxLength} caracteres)`"
          :aria-describedby="error ? 'title-error' : undefined"
          @keydown="handleKeydown"
          @blur="saveTitle"
        />
        
        <!-- Contador de caracteres -->
        <span class="char-counter" :class="{ 'char-limit': editTitle.length > maxLength }">
          {{ editTitle.length }}/{{ maxLength }}
        </span>
      </div>

      <!-- Botones de acción -->
      <div class="action-buttons">
        <button
          type="button"
          class="action-button save-button"
          @click="saveTitle"
          :disabled="!canSave || isLoading"
          aria-label="Guardar título"
          title="Guardar (Enter)"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <svg 
            v-else
            class="button-icon" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round"
          >
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        </button>

        <button
          type="button"
          class="action-button cancel-button"
          @click="cancelEdit"
          :disabled="isLoading"
          aria-label="Cancelar edición"
          title="Cancelar (Esc)"
        >
          <svg 
            class="button-icon" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <button
          type="button"
          class="action-button auto-generate-button"
          @click="generateAutoTitle"
          :disabled="isLoading"
          aria-label="Generar título automático"
          title="Generar título automático"
        >
          <svg 
            class="button-icon" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round"
          >
            <path d="M1 4v6h6"></path>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mensaje de error -->
    <div
      v-if="error"
      id="title-error"
      class="error-message"
      role="alert"
      aria-live="polite"
    >
      {{ error }}
    </div>

    <!-- Estado de carga global -->
    <div v-if="isLoading" class="loading-overlay" aria-hidden="true">
      <div class="loading-spinner-large"></div>
    </div>
  </div>
</template>

<style scoped>
.conversation-title-container {
  @apply relative w-full;
}

/* Estilos para modo visualización */
.title-display {
  @apply flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group;
}

.title-display:hover {
  @apply border-blue-300 dark:border-blue-600;
}

.title-display:focus-within {
  @apply ring-2 ring-blue-500 ring-opacity-50;
}

.title-text {
  @apply flex-1 text-xl font-semibold text-gray-900 dark:text-gray-100 truncate;
}

.edit-button {
  @apply p-2 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 dark:hover:text-blue-400 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100;
}

.edit-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.edit-icon {
  @apply w-4 h-4;
}

/* Estilos para modo edición */
.title-edit-container {
  @apply space-y-3;
}

.input-group {
  @apply relative flex items-center;
}

.title-input {
  @apply flex-1 px-4 py-3 text-lg font-medium bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200;
}

.char-counter {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500 pointer-events-none;
}

.char-counter.char-limit {
  @apply text-red-500 dark:text-red-400 font-medium;
}

.action-buttons {
  @apply flex items-center gap-2 justify-end;
}

.action-button {
  @apply p-2 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50;
}

.action-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.save-button:disabled:hover {
  @apply text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600;
}

.button-icon {
  @apply w-4 h-4;
}

.auto-generate-button {
  @apply text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400;
}

/* Animaciones y estados */
.loading-spinner {
  @apply inline-block w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin;
}

.loading-spinner-large {
  @apply inline-block w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin;
}

.loading-overlay {
  @apply absolute inset-0 bg-white bg-opacity-50 dark:bg-gray-800 dark:bg-opacity-50 flex items-center justify-center rounded-lg;
}

/* Mensaje de error */
.error-message {
  @apply px-4 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 border border-red-200 dark:border-red-800 rounded-md mt-2;
}

/* Transiciones */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Responsive design */
@media (max-width: 640px) {
  .title-display {
    @apply p-3;
  }
  
  .title-text {
    @apply text-lg;
  }
  
  .title-input {
    @apply px-3 py-2 text-base;
  }
  
  .action-buttons {
    @apply gap-1;
  }
  
  .action-button {
    @apply p-1.5;
  }
}

@media (max-width: 480px) {
  .title-display {
    @apply flex-col items-start gap-2;
  }
  
  .edit-button {
    @apply self-end opacity-100;
  }
  
  .action-buttons {
    @apply self-end;
  }
}

/* Mejoras de accesibilidad */
@media (prefers-reduced-motion: reduce) {
  .title-display,
  .edit-button,
  .action-button,
  .title-input {
    transition: none;
  }
  
  .loading-spinner,
  .loading-spinner-large {
    animation: none;
  }
}

/* Focus visible para mejor accesibilidad */
.title-display:focus-visible,
.edit-button:focus-visible,
.action-button:focus-visible,
.title-input:focus-visible {
  @apply ring-2 ring-blue-500 ring-opacity-75 outline-none;
}

/* Modo alto contraste */
@media (prefers-contrast: high) {
  .title-display {
    @apply border-2;
  }
  
  .title-input {
    @apply border-2;
  }
  
  .action-button {
    @apply border-2;
  }
}
</style>