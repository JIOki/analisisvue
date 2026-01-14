<template>
  <div class="conversation-sidebar glass-sidebar">
    <!-- Header del Sidebar -->
    <div class="sidebar-header">
      <h3 class="sidebar-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Historial de Chats
      </h3>
      <button @click="showNewConversationModal = true" class="new-chat-btn" title="Nueva conversación">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>

    <!-- Filtros de estado -->
    <div class="filter-tabs">
      <button 
        v-for="tab in statusTabs" 
        :key="tab.value"
        :class="['filter-tab', { active: activeFilter === tab.value }]"
        @click="activeFilter = tab.value"
      >
        {{ tab.label }}
        <span v-if="getCountByStatus(tab.value)" class="tab-count">{{ getCountByStatus(tab.value) }}</span>
      </button>
    </div>

    <!-- Lista de conversaciones -->
    <div class="conversations-list" v-if="!loading">
      <div v-if="filteredConversations.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <p>No hay {{ activeFilter === 'active' ? 'conversaciones' : activeFilter }}</p>
        <button @click="showNewConversationModal = true" class="create-first-btn">
          Crear primera conversación
        </button>
      </div>

      <div 
        v-for="conversation in filteredConversations" 
        :key="conversation.id"
        :class="['conversation-item', { 
          active: currentConversationId === conversation.id,
          'has-materials': conversation.material_count > 0
        }]"
        @click="selectConversation(conversation.id)"
      >
        <div class="conversation-info">
          <h4 class="conversation-title">{{ conversation.title || 'Sin título' }}</h4>
          <div class="conversation-meta">
            <span class="message-count">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {{ conversation.message_count || 0 }}
            </span>
            <span v-if="conversation.material_count > 0" class="material-count">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              {{ conversation.material_count }}
            </span>
            <span class="last-activity">{{ formatDate(conversation.last_activity_at) }}</span>
          </div>
        </div>
        
        <div class="conversation-actions">
          <button 
            @click.stop="openContextMenu($event, conversation)"
            class="action-btn"
            title="Opciones"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="6" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="12" cy="18" r="2"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Botón cargar más -->
      <button 
        v-if="pagination.hasMore && !loadingMore"
        @click="loadMore"
        class="load-more-btn"
      >
        Cargar más
      </button>
    </div>

    <!-- Loading state -->
    <div v-else class="loading-state">
      <div class="loading-spinner"></div>
      <p>Cargando conversaciones...</p>
    </div>

    <!-- Modal de nueva conversación -->
    <Teleport to="body">
      <div v-if="showNewConversationModal" class="modal-overlay" @click.self="showNewConversationModal = false">
        <div class="modal-content glass-modal">
          <div class="modal-header">
            <h3>Nueva Conversación</h3>
            <button @click="showNewConversationModal = false" class="close-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label for="conversationTitle">Título de la conversación</label>
              <input 
                id="conversationTitle"
                v-model="newConversation.title"
                type="text"
                placeholder="Ej: Análisis de caso clínico X"
                class="glass-input"
              />
            </div>
            
            <div class="form-group">
              <label for="conversationModel">Modelo de IA</label>
              <select id="conversationModel" v-model="newConversation.llm_model" class="glass-input">
                <option value="llama3.2:1b">Llama 3.2 (1B) - Rápido</option>
                <option value="llama3.2">Llama 3.2 - Equilibrado</option>
                <option value="llama3">Llama 3 - Preciso</option>
              </select>
            </div>

            <div class="form-group">
              <label>Descripción (opcional)</label>
              <textarea 
                v-model="newConversation.description"
                placeholder="Describe el propósito de esta conversación..."
                rows="3"
                class="glass-input"
              ></textarea>
            </div>
          </div>
          
          <div class="modal-footer">
            <button @click="showNewConversationModal = false" class="glass-button-secondary">
              Cancelar
            </button>
            <button 
              @click="createNewConversation"
              :disabled="creating"
              class="glass-button-primary"
            >
              <span v-if="creating">Creando...</span>
              <span v-else>Crear Conversación</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Menú contextual -->
    <Teleport to="body">
      <div 
        v-if="contextMenu.show" 
        :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
        class="context-menu glass-context-menu"
      >
        <button @click="openConversationInNewTab" class="menu-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          Abrir en nueva pestaña
        </button>
        <button @click="archiveConversation" class="menu-item" v-if="contextMenu.conversation?.status === 'active'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="21 8 21 21 3 21 3 8"/>
            <rect x="1" y="3" width="22" height="5"/>
          </svg>
          Archivar
        </button>
        <button @click="restoreConversation" class="menu-item" v-if="contextMenu.conversation?.status === 'archived'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="21 8 21 21 3 21 3 8"/>
            <rect x="1" y="3" width="22" height="5"/>
            <line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
          Restaurar
        </button>
        <button @click="editConversationTitle" class="menu-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Editar título
        </button>
        <div class="menu-divider"></div>
        <button @click="confirmDeleteConversation" class="menu-item danger">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Eliminar
        </button>
      </div>
    </Teleport>

    <!-- Modal de confirmación de eliminación -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="modal-content glass-modal delete-modal">
          <div class="modal-header">
            <h3>Eliminar Conversación</h3>
            <button @click="showDeleteConfirm = false" class="close-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <p>¿Estás seguro de que deseas eliminar "{{ contextMenu.conversation?.title }}"?</p>
            <p class="warning-text">Esta acción no se puede deshacer.</p>
          </div>
          <div class="modal-footer">
            <button @click="showDeleteConfirm = false" class="glass-button-secondary">
              Cancelar
            </button>
            <button @click="deleteConversation" class="glass-button-danger">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useConversationStore } from '@/stores/conversationStore';

const props = defineProps({
  currentConversationId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['select', 'created']);

const router = useRouter();
const conversationStore = useConversationStore();

// Estado local
const loading = ref(false);
const conversations = computed(() => conversationStore.conversations);
const pagination = computed(() => conversationStore.pagination);

const activeFilter = ref('active');
const showNewConversationModal = ref(false);
const showDeleteConfirm = ref(false);
const creating = ref(false);
const loadingMore = ref(false);

const newConversation = ref({
  title: '',
  description: '',
  llm_model: 'llama3.2:1b'
});

const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  conversation: null
});

const statusTabs = [
  { value: 'active', label: 'Activas' },
  { value: 'archived', label: 'Archivadas' }
];

// Computed
const filteredConversations = computed(() => {
  return conversations.value.filter(c => c.status === activeFilter.value);
});

const getCountByStatus = (status) => {
  return conversations.value.filter(c => c.status === status).length;
};

// Funciones
async function loadConversations() {
  loading.value = true;
  try {
    await conversationStore.fetchConversations({
      status: activeFilter.value,
      limit: pagination.value.limit,
      offset: 0
    });
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  loadingMore.value = true;
  try {
    await conversationStore.fetchConversations({
      status: activeFilter.value,
      limit: pagination.value.limit,
      offset: pagination.value.offset + pagination.value.limit
    });
  } finally {
    loadingMore.value = false;
  }
}

function selectConversation(conversationId) {
  emit('select', conversationId);
}

async function createNewConversation() {
  if (!newConversation.value.title.trim()) {
    alert('Por favor ingresa un título para la conversación');
    return;
  }

  creating.value = true;
  try {
    const conversation = await conversationStore.createConversation(newConversation.value);
    showNewConversationModal.value = false;
    newConversation.value = { title: '', description: '', llm_model: 'llama3.2:1b' };
    emit('created', conversation.id);
  } catch (error) {
    console.error('Error creating conversation:', error);
    alert('Error al crear la conversación: ' + error.message);
  } finally {
    creating.value = false;
  }
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-MX');
}

// Context menu
function openContextMenu(event, conversation) {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    conversation
  };
}

function closeContextMenu() {
  contextMenu.value.show = false;
}

function openConversationInNewTab() {
  if (contextMenu.value.conversation) {
    window.open(`/pages/ChatInteligente?conversation=${contextMenu.value.conversation.id}`, '_blank');
  }
  closeContextMenu();
}

async function archiveConversation() {
  if (contextMenu.value.conversation) {
    await conversationStore.updateConversation(contextMenu.value.conversation.id, { status: 'archived' });
    await loadConversations();
  }
  closeContextMenu();
}

async function restoreConversation() {
  if (contextMenu.value.conversation) {
    await conversationStore.updateConversation(contextMenu.value.conversation.id, { status: 'active' });
    await loadConversations();
  }
  closeContextMenu();
}

function editConversationTitle() {
  const newTitle = prompt('Nuevo título:', contextMenu.value.conversation?.title);
  if (newTitle && newTitle.trim()) {
    conversationStore.updateConversation(contextMenu.value.conversation.id, { title: newTitle.trim() });
    loadConversations();
  }
  closeContextMenu();
}

function confirmDeleteConversation() {
  showDeleteConfirm.value = true;
  closeContextMenu();
}

async function deleteConversation() {
  if (contextMenu.value.conversation) {
    await conversationStore.deleteConversation(contextMenu.value.conversation.id);
    showDeleteConfirm.value = false;
    emit('select', null);
  }
}

// Event listeners para cerrar menús
function handleClickOutside(event) {
  if (!event.target.closest('.context-menu')) {
    closeContextMenu();
  }
}

onMounted(() => {
  loadConversations();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Watch para cambios de filtro
import { watch } from 'vue';
watch(activeFilter, () => {
  loadConversations();
});
</script>

<style scoped>
.conversation-sidebar {
  width: 300px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.new-chat-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.2) 0%,
    rgba(139, 92, 246, 0.15) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: var(--primary-400);
  cursor: pointer;
  transition: all 0.3s ease;
}

.new-chat-btn:hover {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.3) 0%,
    rgba(139, 92, 246, 0.25) 100%
  );
  transform: scale(1.05);
}

.filter-tabs {
  display: flex;
  padding: 8px;
  gap: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.filter-tab {
  flex: 1;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.filter-tab:hover {
  background: rgba(255, 255, 255, 0.05);
}

.filter-tab.active {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.2) 0%,
    rgba(139, 92, 246, 0.15) 100%
  );
  color: var(--primary-400);
  font-weight: 500;
}

.tab-count {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
}

.filter-tab.active .tab-count {
  background: rgba(59, 130, 246, 0.3);
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conversation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 4px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.conversation-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.conversation-item.active {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.15) 0%,
    rgba(139, 92, 246, 0.1) 100%
  );
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.conversation-item.has-materials {
  border-left: 3px solid rgba(16, 185, 129, 0.5);
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.conversation-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-tertiary);
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
}

.conversation-item:hover .action-btn {
  opacity: 1;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-tertiary);
}

.empty-state svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0 0 16px 0;
  font-size: 14px;
}

.create-first-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.2) 0%,
    rgba(139, 92, 246, 0.15) 100%
  );
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 10px;
  color: var(--primary-400);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-first-btn:hover {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.3) 0%,
    rgba(139, 92, 246, 0.25) 100%
  );
}

.load-more-btn {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-tertiary);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(59, 130, 246, 0.2);
  border-top-color: var(--primary-400);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.glass-modal {
  width: 100%;
  max-width: 480px;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.glass-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.3s ease;
}

.glass-input:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(255, 255, 255, 0.08);
}

.glass-input::placeholder {
  color: var(--text-tertiary);
  opacity: 0.7;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-button-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.9) 0%,
    rgba(79, 70, 229, 0.8) 100%
  );
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.glass-button-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 1) 0%,
    rgba(79, 70, 229, 0.9) 100%
  );
  transform: translateY(-1px);
}

.glass-button-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.glass-button-secondary {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.glass-button-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.glass-button-danger {
  padding: 10px 20px;
  background: linear-gradient(135deg, 
    rgba(239, 68, 68, 0.9) 0%,
    rgba(220, 38, 38, 0.8) 100%
  );
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.glass-button-danger:hover {
  background: linear-gradient(135deg, 
    rgba(239, 68, 68, 1) 0%,
    rgba(220, 38, 38, 0.9) 100%
  );
}

.delete-modal .modal-body {
  text-align: center;
}

.delete-modal .modal-body p {
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.delete-modal .warning-text {
  font-size: 13px;
  color: var(--text-tertiary);
}

/* Context menu */
.context-menu {
  position: fixed;
  padding: 8px;
  background: #1e1e2e;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  z-index: 1001;
  min-width: 180px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.menu-item svg {
  color: #a0a0a0;
}

.menu-item:hover {
  background: rgba(59, 130, 246, 0.25);
  color: #ffffff;
}

.menu-item:hover svg {
  color: #60a5fa;
}

.menu-item.danger:hover {
  background: rgba(239, 68, 68, 0.25);
  color: #f87171;
}

.menu-item.danger:hover svg {
  color: #f87171;
}

.menu-divider {
  height: 1px;
  margin: 8px 0;
  background: rgba(255, 255, 255, 0.15);
}
</style>
