<template>
  <div class="chat-with-context-page">
    <div class="chat-container glass-container">
      <!-- Header -->
      <header class="chat-header glass-navbar-elevated">
        <div class="header-left">
          <button @click="goBack" class="back-btn" title="Volver">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div class="chat-info">
            <h1 class="chat-title">{{ conversationTitle }}</h1>
            <div class="chat-meta">
              <span v-if="linkedMaterials.length > 0" class="material-indicator">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                {{ linkedMaterials.length }} material(es)
              </span>
              <span v-if="currentConversation?.llm_model" class="model-indicator">
                {{ currentConversation.llm_model }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="header-right">
          <button @click="openMaterialSelector" class="icon-btn" title="Gestionar materiales">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </button>
          <button @click="showHistory = true" class="icon-btn" title="Ver historial">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- Panel de materiales activos -->
      <div v-if="linkedMaterials.length > 0" class="active-materials-panel">
        <div class="materials-scroll">
          <div 
            v-for="material in linkedMaterials" 
            :key="material.source_id"
            class="active-material-chip"
          >
            <span class="material-dot"></span>
            {{ truncateText(material.source_title, 25) }}
            <span class="usage-badge">{{ material.usage_count }}</span>
          </div>
        </div>
      </div>

      <!-- Área de mensajes -->
      <div ref="messagesEl" class="messages">
        <div v-if="messages.length === 0" class="welcome-message">
          <div class="welcome-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h2>¡Chat con Contexto!</h2>
          <p>
            Tienes <strong>{{ linkedMaterials.length }}</strong> materiales vinculados.
            <br>Haz preguntas específicas sobre ellos.
          </p>
          <p v-if="linkedMaterials.length === 0" class="warning">
            No hay materiales vinculados.
          </p>
        </div>

        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          :class="['chat-msg', msg.role]"
        >
          <div class="chat-meta">
            <span class="role-badge">{{ msg.role === 'user' ? 'Tú' : 'IA' }}</span>
            <span class="time">{{ formatTime(msg.created_at) }}</span>
          </div>
          <div class="chat-content" v-html="formatMessage(msg.content)"></div>
        </div>

        <div v-if="loading" class="chat-msg assistant">
          <div class="chat-meta">
            <span class="role-badge">IA</span>
          </div>
          <div class="typing">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <!-- Formulario -->
      <form class="chat-form glass-form-container" @submit.prevent="submitPrompt">
        <div class="input-container">
          <textarea 
            v-model="prompt" 
            class="glass-textarea"
            placeholder="Escribe tu pregunta sobre los materiales vinculados..."
            rows="3"
            @keydown.ctrl.enter="submitPrompt"
            @keydown.enter.exact.prevent="submitPrompt"
          ></textarea>
          <span class="hint-text">Ctrl+Enter para enviar</span>
        </div>
        <button 
          type="submit"
          :disabled="loading || !prompt.trim() || linkedMaterials.length === 0"
          class="glass-button-primary"
        >
          <span v-if="loading">
            <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Enviando...
          </span>
          <span v-else>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Enviar
          </span>
        </button>
      </form>
    </div>

    <!-- Modal de selección de materiales -->
    <MaterialSelectionModal 
      :show="showMaterialModal"
      :conversationId="conversationId"
      @close="showMaterialModal = false"
    />

    <!-- Panel de historial lateral -->
    <Teleport to="body">
      <Transition name="slide">
        <div v-if="showHistory" class="history-overlay" @click.self="showHistory = false">
          <div class="history-panel">
            <div class="history-header">
              <h3>Historial de Chats</h3>
              <button @click="showHistory = false" class="close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="history-list">
              <ConversationHistory 
                :currentConversationId="conversationId"
                @select="handleSelectConversation"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useConversationStore } from '@/stores/conversationStore';
import MaterialSelectionModal from '@/components/MaterialSelectionModal.vue';
import ConversationHistory from '@/components/ConversationHistory.vue';

const route = useRoute();
const router = useRouter();
const conversationStore = useConversationStore();

// Referencias
const messagesEl = ref(null);
const prompt = ref('');
const showMaterialModal = ref(false);
const showHistory = ref(false);

// Props/Params
const conversationId = computed(() => route.params.conversationId || route.query.conversation);

// Estado
const loading = computed(() => conversationStore.loading);
const messages = computed(() => conversationStore.conversationMessages);
const linkedMaterials = computed(() => conversationStore.linkedMaterials);
const currentConversation = computed(() => conversationStore.currentConversation);

const conversationTitle = computed(() => {
  if (currentConversation.value?.title) {
    return currentConversation.value.title;
  }
  return 'Chat con Contexto';
});

// Funciones utilitarias
function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function formatMessage(content) {
  if (!content) return '';
  return content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
    }
  });
}

function goBack() {
  router.push('/pages/ConversationHistory');
}

// Cargar conversación
async function loadConversation(id) {
  if (!id) {
    // Crear nueva conversación si no hay ID
    const conv = await conversationStore.createConversation({
      title: 'Chat con Contexto',
      llm_model: 'llama3.2:1b'
    });
    router.replace({ params: { conversationId: conv.id } });
    await conversationStore.loadFullConversation(conv.id);
  } else {
    await conversationStore.loadFullConversation(id);
  }
  scrollToBottom();
}

// Enviar mensaje
async function submitPrompt() {
  if (!prompt.value.trim() || loading.value) return;
  
  if (linkedMaterials.value.length === 0) {
    showMaterialModal.value = true;
    return;
  }

  const userQuestion = prompt.value.trim();
  messages.value.push({
    role: 'user',
    content: userQuestion,
    created_at: new Date().toISOString()
  });

  prompt.value = '';
  scrollToBottom();

  try {
    await conversationStore.sendChatMessage(conversationId.value, userQuestion);
    scrollToBottom();
  } catch (err) {
    console.error('Error:', err);
    messages.value.push({
      role: 'assistant',
      content: `Error: ${err.message}`,
      created_at: new Date().toISOString()
    });
    scrollToBottom();
  }
}

// Manejar selección desde el historial
async function handleSelectConversation(id) {
  if (id && id !== conversationId.value) {
    router.replace({ params: { conversationId: id } });
    await loadConversation(id);
    showHistory.value = false;
  }
}

function openMaterialSelector() {
  showMaterialModal.value = true;
}

// Lifecycle
onMounted(async () => {
  await loadConversation(conversationId.value);
});

// Watch para cambios de conversación en la ruta
watch(() => route.params.conversationId, async (newId) => {
  if (newId) {
    await loadConversation(newId);
  }
});
</script>

<style scoped>
.chat-with-context-page {
  height: 100%;
  display: flex;
  justify-content: center;
  padding: 24px;
}

.chat-container {
  width: 100%;
  max-width: 900px;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  height: 100%;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.03) 50%,
    rgba(255, 255, 255, 0.02) 100%
  );
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.06) 100%
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
}

.chat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.chat-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.material-indicator,
.model-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-right {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--primary-400);
}

.active-materials-panel {
  padding: 12px 24px;
  background: rgba(16, 185, 129, 0.05);
  border-bottom: 1px solid rgba(16, 185, 129, 0.1);
}

.materials-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.active-material-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 20px;
  font-size: 12px;
  color: var(--text-primary);
  white-space: nowrap;
}

.material-dot {
  width: 6px;
  height: 6px;
  background: #10B981;
  border-radius: 50%;
}

.usage-badge {
  padding: 2px 6px;
  background: rgba(16, 185, 129, 0.2);
  border-radius: 10px;
  font-size: 10px;
  color: #10B981;
}

.messages {
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.02) 0%,
    rgba(255, 255, 255, 0.01) 100%
  );
}

.welcome-message {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.welcome-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.15) 0%,
    rgba(139, 92, 246, 0.1) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: var(--primary-400);
}

.welcome-message h2 {
  font-size: 24px;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.welcome-message p {
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.welcome-message .warning {
  color: #F59E0B;
  margin-top: 16px;
  padding: 12px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 10px;
}

.chat-msg {
  max-width: 85%;
  padding: 16px 20px;
  border-radius: 16px;
}

.chat-msg.user {
  margin-left: auto;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.9) 0%,
    rgba(79, 70, 229, 0.8) 100%
  );
  color: white;
  border-bottom-right-radius: 4px;
}

.chat-msg.assistant {
  margin-right: auto;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.06) 100%
  );
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
  border-bottom-left-radius: 4px;
}

.chat-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 12px;
}

.role-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 11px;
}

.chat-msg.user .role-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.chat-msg.assistant .role-badge {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.2) 0%,
    rgba(139, 92, 246, 0.2) 100%
  );
  color: var(--primary-400);
}

.time {
  color: var(--text-tertiary);
  opacity: 0.7;
}

.chat-content {
  font-size: 14px;
  line-height: 1.6;
}

.typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
}

.typing span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-400);
  opacity: 0.4;
  animation: typing 1.4s infinite;
}

.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { opacity: 0.4; transform: scale(1); }
  30% { opacity: 1; transform: scale(1.2); }
}

.chat-form {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.input-container {
  flex: 1;
  position: relative;
}

.glass-textarea {
  width: 100%;
  resize: none;
  padding: 14px 18px;
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(15px);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  transition: all 0.3s ease;
}

.glass-textarea::placeholder {
  color: var(--text-tertiary);
  opacity: 0.7;
}

.glass-textarea:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.4);
}

.hint-text {
  position: absolute;
  bottom: 8px;
  right: 14px;
  font-size: 11px;
  color: var(--text-tertiary);
  opacity: 0.6;
}

.glass-button-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.9) 0%,
    rgba(79, 70, 229, 0.8) 100%
  );
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 14px;
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.glass-button-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
}

.glass-button-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* History Panel */
.history-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.history-panel {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 320px;
  background: linear-gradient(180deg, 
    rgba(30, 30, 40, 0.98) 0%,
    rgba(20, 20, 30, 0.98) 100%
  );
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.history-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from .history-panel,
.slide-leave-to .history-panel {
  transform: translateX(-100%);
}
</style>
