<template>
  <div class="conversation-history-page">
    <div class="page-header">
      <h1 class="page-title">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Historial de Conversaciones
      </h1>
      <p class="page-subtitle">
        Gestiona tus conversaciones y el contexto de materiales utilizado en cada una
      </p>
    </div>

    <div class="content-layout">
      <!-- Sidebar con historial -->
      <div class="sidebar-container">
        <ConversationHistory 
          :currentConversationId="selectedConversationId"
          @select="handleSelectConversation"
          @created="handleConversationCreated"
        />
      </div>

      <!-- Área principal -->
      <div class="main-area">
        <div v-if="selectedConversationId" class="chat-container">
          <!-- Header del chat -->
          <div class="chat-header-panel">
            <div class="conversation-details">
              <h2 class="conversation-title">{{ currentConversation?.title || 'Conversación' }}</h2>
              <span v-if="currentConversation?.llm_model" class="model-badge">
                {{ currentConversation.llm_model }}
              </span>
            </div>
            
            <div class="chat-actions">
              <button @click="openMaterialSelector" class="action-btn" title="Gestionar materiales">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                Materiales ({{ linkedMaterials.length }})
              </button>
              
              <button @click="openNewSession" class="action-btn secondary" title="Nueva sesión">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Nueva Sesión
              </button>
            </div>
          </div>

          <!-- Panel de materiales vinculados -->
          <div v-if="linkedMaterials.length > 0" class="materials-panel">
            <div class="materials-header">
              <span class="materials-title">Materiales en contexto</span>
            </div>
            <div class="materials-list">
              <div 
                v-for="material in linkedMaterials" 
                :key="material.source_id"
                class="material-chip"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                {{ material.source_title }}
                <span class="usage-count">{{ material.usage_count }} usos</span>
              </div>
            </div>
          </div>

          <!-- Área de mensajes -->
          <div ref="messagesEl" class="messages-area">
            <div v-if="messages.length === 0" class="empty-chat">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <h3>Sin mensajes aún</h3>
              <p>Envía tu primer mensaje para comenzar la conversación</p>
            </div>

            <div 
              v-for="(msg, index) in messages" 
              :key="index"
              :class="['message-bubble', msg.role]"
            >
              <div class="message-header">
                <span :class="['role-badge', msg.role]">
                  {{ msg.role === 'user' ? 'Tú' : msg.role === 'assistant' ? 'IA' : 'Sistema' }}
                </span>
                <span class="message-time">{{ formatTime(msg.created_at) }}</span>
              </div>
              <div class="message-content">{{ msg.content }}</div>
            </div>

            <div v-if="loading" class="loading-indicator">
              <div class="typing-dots">
                <span></span><span></span><span></span>
              </div>
              <span>Procesando respuesta...</span>
            </div>
          </div>

          <!-- Área de input -->
          <div class="input-area">
            <textarea 
              v-model="userMessage"
              placeholder="Escribe tu mensaje..."
              rows="3"
              class="message-input"
              @keydown.enter.exact.prevent="sendMessage"
            ></textarea>
            <div class="input-actions">
              <span class="char-count">{{ userMessage.length }} caracteres</span>
              <button 
                @click="sendMessage"
                :disabled="!userMessage.trim() || loading"
                class="send-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Enviar
              </button>
            </div>
          </div>
        </div>

        <!-- Estado vacío -->
        <div v-else class="empty-state">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <h2>Selecciona una conversación</h2>
          <p>Elige una conversación del historial o crea una nueva para comenzar</p>
          <button @click="createNewConversation" class="create-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva Conversación
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de selección de materiales -->
    <MaterialSelectionModal 
      :show="showMaterialModal"
      :conversationId="selectedConversationId"
      @close="showMaterialModal = false"
      @linked="handleMaterialsLinked"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useConversationStore } from '@/stores/conversationStore';
import ConversationHistory from '@/components/ConversationHistory.vue';
import MaterialSelectionModal from '@/components/MaterialSelectionModal.vue';

const route = useRoute();
const conversationStore = useConversationStore();

// Referencias
const messagesEl = ref(null);
const userMessage = ref('');
const selectedConversationId = ref(null);
const showMaterialModal = ref(false);

// Estado del store
const loading = computed(() => conversationStore.loading);
const currentConversation = computed(() => conversationStore.currentConversation);
const linkedMaterials = computed(() => conversationStore.linkedMaterials);
const messages = computed(() => conversationStore.conversationMessages);

// Formatear tiempo
function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

// Scroll al fondo
function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
    }
  });
}

// Manejar selección de conversación
async function handleSelectConversation(conversationId) {
  if (!conversationId) {
    selectedConversationId.value = null;
    return;
  }
  
  selectedConversationId.value = conversationId;
  await conversationStore.loadFullConversation(conversationId);
  scrollToBottom();
}

// Manejar creación de conversación
async function handleConversationCreated(conversationId) {
  await handleSelectConversation(conversationId);
}

// Crear nueva conversación
async function createNewConversation() {
  const conversation = await conversationStore.createConversation({
    title: 'Nueva Conversación',
    llm_model: 'llama3.2:1b'
  });
  await handleSelectConversation(conversation.id);
}

// Abrir selector de materiales
function openMaterialSelector() {
  showMaterialModal.value = true;
}

// Manejar vinculación de materiales
function handleMaterialsLinked(materialIds) {
  console.log('Materiales vinculados:', materialIds);
}

// Nueva sesión
async function openNewSession() {
  if (selectedConversationId.value) {
    await conversationStore.startSession(selectedConversationId.value);
  }
}

// Enviar mensaje
async function sendMessage() {
  if (!userMessage.value.trim() || loading.value) return;
  if (!selectedConversationId.value) {
    alert('Selecciona o crea una conversación primero');
    return;
  }
  if (linkedMaterials.value.length === 0) {
    alert('Vincula al menos un material a la conversación');
    showMaterialModal.value = true;
    return;
  }

  const message = userMessage.value.trim();
  userMessage.value = '';

  try {
    await conversationStore.sendChatMessage(selectedConversationId.value, message);
    scrollToBottom();
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Error al enviar mensaje: ' + error.message);
  }
}

// Verificar si hay conversationId en la ruta
onMounted(async () => {
  const routeConversationId = route.query.conversation;
  if (routeConversationId) {
    await handleSelectConversation(routeConversationId);
  }
});

// Watch para cambios en la ruta
watch(() => route.query.conversation, async (newId) => {
  if (newId) {
    await handleSelectConversation(newId);
  }
});
</script>

<style scoped>
.conversation-history-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 24px;
}

.page-header {
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.page-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.content-layout {
  flex: 1;
  display: flex;
  gap: 24px;
  min-height: 0;
}

.sidebar-container {
  width: 320px;
  flex-shrink: 0;
}

.main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
}

.chat-header-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.conversation-details {
  display: flex;
  align-items: center;
  gap: 12px;
}

.conversation-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.model-badge {
  padding: 4px 10px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  font-size: 12px;
  color: var(--primary-400);
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 10px;
  color: var(--primary-400);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  transform: translateY(-1px);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.materials-panel {
  padding: 12px 20px;
  background: rgba(16, 185, 129, 0.05);
  border-bottom: 1px solid rgba(16, 185, 129, 0.1);
}

.materials-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.materials-title {
  font-size: 12px;
  font-weight: 600;
  color: #10B981;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.materials-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.material-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-primary);
}

.usage-count {
  padding: 2px 6px;
  background: rgba(16, 185, 129, 0.2);
  border-radius: 4px;
  font-size: 10px;
  color: #10B981;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-tertiary);
}

.empty-chat svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-chat h3 {
  margin: 0 0 8px 0;
  color: var(--text-secondary);
}

.empty-chat p {
  margin: 0;
  font-size: 14px;
}

.message-bubble {
  max-width: 80%;
  padding: 14px 18px;
  border-radius: 16px;
  align-self: flex-start;
}

.message-bubble.user {
  max-width: 85%;
  margin-left: auto;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.9) 0%,
    rgba(79, 70, 229, 0.8) 100%
  );
  color: white;
  border-bottom-right-radius: 4px;
}

.message-bubble.assistant {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  border-bottom-left-radius: 4px;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.role-badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.role-badge.user {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.role-badge.assistant {
  background: rgba(59, 130, 246, 0.2);
  color: var(--primary-400);
}

.message-time {
  font-size: 11px;
  color: var(--text-tertiary);
  opacity: 0.7;
}

.message-content {
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-400);
  opacity: 0.4;
  animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { opacity: 0.4; transform: scale(1); }
  30% { opacity: 1; transform: scale(1.2); }
}

.input-area {
  padding: 16px 20px;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.03) 0%,
    rgba(255, 255, 255, 0.01) 100%
  );
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.message-input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 14px;
  resize: none;
  transition: all 0.3s ease;
}

.message-input:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(255, 255, 255, 0.08);
}

.message-input::placeholder {
  color: var(--text-tertiary);
  opacity: 0.7;
}

.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.char-count {
  font-size: 12px;
  color: var(--text-tertiary);
}

.send-btn {
  display: flex;
  align-items: center;
  gap: 8px;
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

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 1) 0%,
    rgba(79, 70, 229, 0.9) 100%
  );
  transform: translateY(-1px);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-secondary);
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.03) 0%,
    rgba(255, 255, 255, 0.01) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.empty-state svg {
  margin-bottom: 24px;
  opacity: 0.5;
}

.empty-state h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: var(--text-primary);
}

.empty-state p {
  margin: 0 0 24px 0;
  font-size: 14px;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.2) 0%,
    rgba(139, 92, 246, 0.15) 100%
  );
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  color: var(--primary-400);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-btn:hover {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.3) 0%,
    rgba(139, 92, 246, 0.25) 100%
  );
  transform: translateY(-2px);
}
</style>
