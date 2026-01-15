<template>
  <div class="smart-chat-page">
    <!-- Conversation History Sidebar - Outside main container, alongside menu -->
    <div class="conversation-sidebar">
      <ConversationHistory 
        :currentConversationId="selectedConversationId"
        @select="handleSelectConversation"
        @created="handleConversationCreated"
      />
    </div>

    <!-- Main Chat Area - Standalone -->
    <div class="chat-main-area">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Smart Chat
        </h1>
        <p class="page-subtitle">
          Chat inteligente con contexto de materiales vinculados
        </p>
      </div>

      <div v-if="selectedConversationId" class="chat-container">
        <div class="chat-content">
          <!-- Chat Header -->
          <div class="chat-header-panel">
            <div class="conversation-info">
              <h2 class="conversation-title">{{ currentConversation?.title || 'Conversación' }}</h2>
              <div class="conversation-meta">
                <span v-if="currentConversation?.llm_model" class="model-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  {{ currentConversation.llm_model }}
                </span>
                <span v-if="linkedMaterials.length > 0" class="materials-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  {{ linkedMaterials.length }} material(es)
                </span>
              </div>
            </div>
            
            <div class="chat-actions">
              <button @click="openMaterialSelector" class="action-btn" title="Gestionar materiales">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                Materiales
              </button>
              
              <button @click="openNewSession" class="action-btn secondary" title="Nueva sesión de chat">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Nueva Sesión
              </button>
            </div>
          </div>

        <!-- Materials Panel with enhanced styling -->
        <div v-if="linkedMaterials.length > 0" class="materials-panel">
          <div class="materials-header">
            <div class="materials-title-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span class="materials-title">Materiales en contexto</span>
            </div>
            <button @click="openMaterialSelector" class="manage-materials-btn">
              Gestionar
            </button>
          </div>
          <div class="materials-list">
            <div 
              v-for="material in linkedMaterials" 
              :key="material.source_id"
              class="material-chip"
              :class="{ 'high-usage': material.usage_count > 5 }"
            >
              <span class="material-status-dot"></span>
              <span class="material-name">{{ truncateText(material.source_title, 30) }}</span>
              <span class="usage-badge">
                {{ material.usage_count }} {{ material.usage_count === 1 ? 'uso' : 'usos' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Messages Area with scrollbar -->
        <div ref="messagesEl" class="messages-area">
          <div v-if="messages.length === 0" class="empty-chat">
            <div class="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3>¡Chat con Contexto!</h3>
            <p>
              Tienes <strong>{{ linkedMaterials.length }}</strong> materiales vinculados.
              <br>Envía tu primer mensaje para comenzar.
            </p>
            <div v-if="linkedMaterials.length === 0" class="empty-action">
              <button @click="openMaterialSelector" class="action-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                Vincular materiales
              </button>
            </div>
          </div>

          <div 
            v-for="(msg, index) in messages" 
            :key="index"
            :class="['message-bubble', msg.role]"
            @click="msg.role === 'assistant' ? viewVerification(index) : null"
          >
            <div class="message-header">
              <span :class="['role-badge', msg.role]">
                <svg v-if="msg.role === 'user'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                </svg>
                {{ msg.role === 'user' ? 'Tú' : msg.role === 'assistant' ? 'IA' : 'Sistema' }}
              </span>
              <span class="message-time">{{ formatTime(msg.created_at) }}</span>
              <VerificationBadge 
                v-if="msg.role === 'assistant'"
                :level="msg.id ? (verificationStore.getVerificationByMessageId(msg.id)?.confidence_level || 'nula') : 'nula'"
                :score="msg.id ? (verificationStore.getVerificationByMessageId(msg.id)?.confidence_score || 0) : 0"
                :showScore="true"
              />
            </div>
            <div class="message-content" v-html="formatMessage(msg.content)"></div>
            <div v-if="msg.role === 'assistant'" class="verify-hint">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              Verificar
            </div>
          </div>

          <div v-if="loading" class="loading-indicator">
            <div class="typing-animation">
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
            </div>
            <span class="loading-text">Procesando respuesta...</span>
          </div>
        </div>

        <!-- Input Area -->
        <div class="input-area">
          <div class="input-wrapper">
            <textarea 
              v-model="userMessage"
              placeholder="Escribe tu mensaje sobre los materiales vinculados..."
              rows="3"
              class="message-input"
              @keydown.enter.exact.prevent="sendMessage"
              @keydown.ctrl.enter="sendMessage"
              ref="inputEl"
            ></textarea>
            <span class="input-hint">Ctrl+Enter para enviar</span>
          </div>
          <div class="input-footer">
            <span class="char-count" :class="{ 'near-limit': userMessage.length > 500 }">
              {{ userMessage.length }} caracteres
            </span>
            <button 
              @click="sendMessage"
              :disabled="!userMessage.trim() || loading || linkedMaterials.length === 0"
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
      </div>

      <!-- Empty State - No conversation selected -->
      <div v-else class="empty-state">
        <div class="empty-state-content">
          <div class="empty-state-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h2>Selecciona una conversación</h2>
          <p>Elige una conversación del historial o crea una nueva para comenzar a chatear con tus materiales</p>
          
          <div class="empty-state-actions">
            <button @click="createNewConversation" class="create-btn primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nueva Conversación
            </button>
            
            <button @click="quickStartWithMaterials" class="create-btn secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              Con Mis Materiales
            </button>
          </div>

          <div class="quick-tips">
            <h4>💡 Cómo usar Smart Chat</h4>
            <ul>
              <li>Selecciona una conversación previa para continuar</li>
              <li>Crea una nueva conversación vinculada a materiales específicos</li>
              <li>Gestiona los materiales desde el panel superior</li>
              <li>Cada sesión mantiene el contexto de la conversación</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Verification Panel -->
    <Transition name="slide">
      <div v-if="verificationStore.showPanel" class="verification-sidebar">
        <VerificationPanel 
          :verification="currentVerification"
          @close="closeVerificationPanel"
        />
      </div>
    </Transition>

    <!-- Material Selection Modal -->
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
import { useVerificationStore } from '@/stores/verificationStore';
import ConversationHistory from '@/components/ConversationHistory.vue';
import MaterialSelectionModal from '@/components/MaterialSelectionModal.vue';
import VerificationBadge from '@/components/VerificationBadge.vue';
import VerificationPanel from '@/components/VerificationPanel.vue';

const route = useRoute();
const conversationStore = useConversationStore();
const verificationStore = useVerificationStore();

// References
const messagesEl = ref(null);
const inputEl = ref(null);
const userMessage = ref('');
const selectedConversationId = ref(null);
const showMaterialModal = ref(false);

// Store state
const loading = computed(() => conversationStore.loading);
const currentConversation = computed(() => conversationStore.currentConversation);
const linkedMaterials = computed(() => conversationStore.linkedMaterials);
const messages = computed(() => conversationStore.conversationMessages);
const currentVerification = computed(() => verificationStore.currentVerification);
const verificationLoading = computed(() => verificationStore.verifying);

// Format timestamp
function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

// Format message content with basic HTML handling
function formatMessage(content) {
  if (!content) return '';
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

// Truncate text
function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Scroll to bottom
function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
    }
  });
}

// Focus input
function focusInput() {
  nextTick(() => {
    if (inputEl.value) {
      inputEl.value.focus();
    }
  });
}

// Handle conversation selection
async function handleSelectConversation(conversationId) {
  if (!conversationId) {
    selectedConversationId.value = null;
    return;
  }
  
  selectedConversationId.value = conversationId;
  await conversationStore.loadFullConversation(conversationId);
  scrollToBottom();
}

// Handle conversation creation
async function handleConversationCreated(conversationId) {
  await handleSelectConversation(conversationId);
}

// Create new conversation
async function createNewConversation() {
  const conversation = await conversationStore.createConversation({
    title: 'Nueva Conversación',
    llm_model: 'llama3.2:1b'
  });
  await handleSelectConversation(conversation.id);
}

// Quick start with user's materials
async function quickStartWithMaterials() {
  const conversation = await conversationStore.createConversation({
    title: 'Chat con Materiales',
    llm_model: 'llama3.2:1b'
  });
  await handleSelectConversation(conversation.id);
  showMaterialModal.value = true;
}

// Open material selector
function openMaterialSelector() {
  if (!selectedConversationId.value) {
    alert('Selecciona o crea una conversación primero');
    return;
  }
  showMaterialModal.value = true;
}

// Handle materials linked
function handleMaterialsLinked(materialIds) {
  console.log('Materiales vinculados:', materialIds);
}

// Start new session
async function openNewSession() {
  if (selectedConversationId.value) {
    await conversationStore.startSession(selectedConversationId.value);
  }
}

// Send message
async function sendMessage() {
  if (!userMessage.value.trim() || loading.value) return;
  if (!selectedConversationId.value) {
    alert('Selecciona o crea una conversación primero');
    return;
  }
  if (linkedMaterials.value.length === 0) {
    showMaterialModal.value = true;
    return;
  }

  const message = userMessage.value.trim();
  const timestamp = new Date().toISOString();
  
  // Add user message immediately to UI for instant feedback
  conversationStore.conversationMessages.push({
    role: 'user',
    content: message,
    created_at: timestamp
  });
  
  // Clear input and scroll
  userMessage.value = '';
  scrollToBottom();

  try {
    await conversationStore.sendChatMessage(selectedConversationId.value, message);
    
    // Scroll y focus
    scrollToBottom();
    focusInput();
    
    // Auto-verify el mensaje del asistente - esperar a que se actualice el store
    let attempts = 0;
    let assistantMessageId = null;
    
    while (attempts < 10 && !assistantMessageId) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const msgs = conversationStore.conversationMessages;
      const lastAssistant = msgs.filter(m => m.role === 'assistant').pop();
      
      if (lastAssistant?.id) {
        assistantMessageId = lastAssistant.id;
      }
      attempts++;
    }
    
    if (assistantMessageId) {
      await verifyAssistantMessageById(assistantMessageId);
    } else {
      console.warn('No se pudo obtener ID del mensaje del asistente después de 2 segundos');
    }
    
  } catch (error) {
    console.error('Error sending message:', error);
    // Remove the user message we added if there was an error
    conversationStore.conversationMessages.pop();
    // Add error message to chat
    conversationStore.conversationMessages.push({
      role: 'assistant',
      content: `Error: ${error.message}`,
      created_at: new Date().toISOString()
    });
    scrollToBottom();
  }
}

// Verification functions
/**
 * Verifica un mensaje específico por su ID
 * @param {string} messageId - ID del mensaje a verificar
 */
async function verifyAssistantMessageById(messageId) {
  if (!messageId) return;
  
  const messages = conversationStore.conversationMessages;
  const msgIndex = messages.findIndex(m => m.id === messageId);
  
  if (msgIndex === -1) {
    console.warn('No se encontró el mensaje con ID:', messageId);
    return;
  }
  
  if (msgIndex === 0) return;
  
  const assistantMsg = messages[msgIndex];
  const userMsg = messages[msgIndex - 1];
  
  if (!userMsg || userMsg.role !== 'user') return;
  
  try {
    await verificationStore.verifyMessage({
      messageId: messageId,  // Usar el ID del mensaje del store
      query: userMsg.content,
      response: assistantMsg.content,
      conversationId: selectedConversationId.value,
      linkedMaterialIds: linkedMaterials.value.map(m => m.source_id),
      contextChunks: conversationStore.lastContextChunks
    });
  } catch (error) {
    console.error('Error verifying message by ID:', error);
  }
}

/**
 * Verifica el último mensaje del asistente (versión legacy)
 * @deprecated Usar verifyAssistantMessageById en su lugar
 */
async function verifyLastAssistantMessage() {
  const messages = conversationStore.conversationMessages;
  const lastAssistantMsg = messages.filter(m => m.role === 'assistant').pop();
  
  if (!lastAssistantMsg) return;
  
  // Verificar que tenemos el ID real del mensaje
  if (!lastAssistantMsg.id) {
    console.warn('El mensaje del asistente no tiene ID');
    return;
  }
  
  await verifyAssistantMessageById(lastAssistantMsg.id);
}

function viewVerification(messageIndex) {
  const msg = messages.value[messageIndex];
  if (!msg) return;
  
  // Si el mensaje tiene ID real, usar ese ID
  const verificationId = msg.id || `msg-${messageIndex}`;
  
  // Find corresponding verification
  const verification = verificationStore.getVerificationByMessageId(verificationId);
  
  if (verification) {
    verificationStore.selectMessage(verificationId);
  } else {
    // Try to verify on-demand
    verifyMessageOnDemand(messageIndex);
  }
}

async function verifyMessageOnDemand(messageIndex) {
  const msg = messages.value[messageIndex];
  if (!msg || msg.role !== 'assistant') return;
  
  // Verificar que tenemos el ID real
  if (!msg.id) {
    console.warn('El mensaje no tiene ID, no se puede verificar');
    return;
  }
  
  // Find preceding user message
  if (messageIndex === 0) return;
  const userMsg = messages.value[messageIndex - 1];
  if (!userMsg || userMsg.role !== 'user') return;
  
  try {
    await verificationStore.verifyMessage({
      messageId: msg.id,  // Usar ID real
      query: userMsg.content,
      response: msg.content,
      conversationId: selectedConversationId.value,
      linkedMaterialIds: linkedMaterials.value.map(m => m.source_id),
      contextChunks: conversationStore.lastContextChunks
    });
    
    verificationStore.selectMessage(msg.id);
  } catch (error) {
    console.error('Error verifying message:', error);
  }
}

function closeVerificationPanel() {
  verificationStore.clearSelection();
}

// Check route on mount
onMounted(async () => {
  const routeConversationId = route.query.conversation;
  if (routeConversationId) {
    await handleSelectConversation(routeConversationId);
  }
});

// Watch for route changes
watch(() => route.query.conversation, async (newId) => {
  if (newId) {
    await handleSelectConversation(newId);
  }
});

// Watch for changes in messages to ensure UI stays in sync
watch(() => conversationStore.conversationMessages, () => {
  nextTick(() => {
    scrollToBottom();
  });
}, { deep: true });

// Clear verification when conversation changes
watch(() => selectedConversationId.value, () => {
  verificationStore.clearAll();
});
</script>

<style scoped>
.smart-chat-page {
  display: flex;
  gap: 24px;
  height: 100%;
  min-height: 0;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

/* Conversation Sidebar - Alongside main menu */
.conversation-sidebar {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Custom scrollbar for conversation sidebar */
.conversation-sidebar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

.conversation-sidebar::-webkit-scrollbar {
  width: 6px;
}

.conversation-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.conversation-sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.conversation-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* Main Chat Area - Standalone */
.chat-main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

/* Page Header */
.page-header {
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

/* Chat Container */
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(20px);
}

/* Chat Content - Wrapper interno */
.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: 20px;
}

/* Chat Header */
.chat-header-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.conversation-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.conversation-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.conversation-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.model-badge,
.materials-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
}

.model-badge {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
}

.materials-badge {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10B981;
}

.chat-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 12px;
  color: var(--primary-400);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
  color: var(--text-secondary);
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

/* Materials Panel */
.materials-panel {
  padding: 16px 24px;
  background: linear-gradient(180deg, 
    rgba(16, 185, 129, 0.08) 0%,
    rgba(16, 185, 129, 0.02) 100%
  );
  border-bottom: 1px solid rgba(16, 185, 129, 0.15);
  flex-shrink: 0;
}

.materials-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.materials-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #10B981;
}

.materials-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.manage-materials-btn {
  padding: 4px 12px;
  background: transparent;
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 6px;
  color: #10B981;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.manage-materials-btn:hover {
  background: rgba(16, 185, 129, 0.1);
}

.materials-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.material-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 12px;
  font-size: 13px;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.material-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
}

.material-chip.high-usage {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.4);
}

.material-status-dot {
  width: 8px;
  height: 8px;
  background: #10B981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.material-name {
  font-weight: 500;
}

.usage-badge {
  padding: 3px 8px;
  background: rgba(16, 185, 129, 0.25);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #10B981;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Messages Area */
.messages-area {
  flex: 1;
  overflow-y: scroll;
  overflow-x: hidden;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.02) 0%,
    rgba(255, 255, 255, 0.01) 100%
  );
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.messages-area::-webkit-scrollbar {
  width: 8px;
}

.messages-area::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.messages-area::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.messages-area::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}


.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
}

.empty-icon {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.15) 0%,
    rgba(139, 92, 246, 0.1) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  color: var(--primary-400);
  margin-bottom: 24px;
}

.empty-chat h3 {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-chat p {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary);
  max-width: 400px;
}

.empty-action {
  margin-top: 20px;
}

.action-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 10px;
  color: #10B981;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-link:hover {
  background: rgba(16, 185, 129, 0.25);
  transform: translateY(-2px);
}

/* Message Bubbles */
.message-bubble {
  max-width: 80%;
  padding: 16px 20px;
  border-radius: 20px;
  align-self: flex-start;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-bubble.user {
  max-width: 85%;
  margin-left: auto;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.95) 0%,
    rgba(79, 70, 229, 0.9) 100%
  );
  color: white;
  border-bottom-right-radius: 6px;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}

.message-bubble.assistant {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.06) 100%
  );
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
  border-bottom-left-radius: 6px;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.role-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.role-badge.user {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.role-badge.assistant {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.25) 0%,
    rgba(139, 92, 246, 0.2) 100%
  );
  color: #a78bfa;
}

.message-time {
  font-size: 11px;
  color: var(--text-tertiary);
  opacity: 0.7;
}

.message-content {
  font-size: 15px;
  line-height: 1.7;
  white-space: pre-wrap;
}

/* Loading Indicator */
.loading-indicator {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  align-self: flex-start;
}

.typing-animation {
  display: flex;
  gap: 5px;
}

.typing-dot {
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
  border-radius: 50%;
  animation: typingBounce 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

.loading-text {
  font-size: 13px;
  color: var(--text-secondary);
  font-style: italic;
}

/* Input Area */
.input-area {
  padding: 20px 24px;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.input-wrapper {
  position: relative;
}

.message-input {
  width: 100%;
  padding: 16px 18px;
  padding-bottom: 36px;
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  color: var(--text-primary);
  font-size: 15px;
  font-family: inherit;
  resize: none;
  transition: all 0.3s ease;
}

.message-input:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.message-input::placeholder {
  color: var(--text-tertiary);
  opacity: 0.7;
}

.input-hint {
  position: absolute;
  bottom: 12px;
  right: 16px;
  font-size: 11px;
  color: var(--text-tertiary);
  opacity: 0.6;
}

.input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.char-count {
  font-size: 12px;
  color: var(--text-tertiary);
  transition: color 0.2s ease;
}

.char-count.near-limit {
  color: #f59e0b;
}

.send-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.9) 0%,
    rgba(79, 70, 229, 0.85) 100%
  );
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 14px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.35);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Empty State */
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state-content {
  text-align: center;
  max-width: 500px;
  padding: 40px;
}

.empty-state-icon {
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 30px;
  color: var(--text-tertiary);
  opacity: 0.6;
}

.empty-state h2 {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-state p {
  margin: 0 0 32px 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.empty-state-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 40px;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-btn.primary {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.9) 0%,
    rgba(79, 70, 229, 0.8) 100%
  );
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: white;
}

.create-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(59, 130, 246, 0.4);
}

.create-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
}

.create-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.quick-tips {
  text-align: left;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.quick-tips h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.quick-tips ul {
  margin: 0;
  padding-left: 20px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.8;
}

/* Scrollbar Styling */
.messages-area,
.materials-list,
.chat-main-area,
.conversation-sidebar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.messages-area::-webkit-scrollbar,
.materials-list::-webkit-scrollbar,
.chat-main-area::-webkit-scrollbar,
.conversation-sidebar::-webkit-scrollbar {
  width: 8px;
}

.messages-area::-webkit-scrollbar-track,
.materials-list::-webkit-scrollbar-track,
.chat-main-area::-webkit-scrollbar-track,
.conversation-sidebar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.messages-area::-webkit-scrollbar-thumb,
.materials-list::-webkit-scrollbar-thumb,
.chat-main-area::-webkit-scrollbar-thumb,
.conversation-sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.messages-area::-webkit-scrollbar-thumb:hover,
.materials-list::-webkit-scrollbar-thumb:hover,
.chat-main-area::-webkit-scrollbar-thumb:hover,
.conversation-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Verification Panel Sidebar */
.verification-sidebar {
  width: 360px;
  flex-shrink: 0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

/* Verify hint on assistant messages */
.verify-hint {
  display: none;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 11px;
  color: var(--text-tertiary);
  opacity: 0.7;
  cursor: pointer;
  transition: all 0.2s ease;
}

.message-bubble.assistant:hover .verify-hint {
  display: flex;
}

.verify-hint:hover {
  opacity: 1;
  color: var(--primary-400);
}

/* Message header adjustments with verification badge */
.message-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

/* Slide transition for verification panel */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .verification-sidebar {
    width: 320px;
  }
}

@media (max-width: 992px) {
  .verification-sidebar {
    display: none;
  }
}
</style>
