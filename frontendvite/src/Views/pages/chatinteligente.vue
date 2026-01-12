<template>
  <div class="chat-container glass-container">
    <!-- Header -->
    <header class="chat-header glass-navbar-elevated">
      <div class="chat-header-icon glass-icon-primary">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div>
        <h1 class="chat-title glass-text-primary">Análisis Inteligente</h1>
        <p class="subtitle glass-text-secondary">Pregunta sobre tu teoría y casos de uso</p>
      </div>
    </header>

    <!-- Área de mensajes -->
    <div ref="messagesEl" class="messages">
      <!-- Mensaje de bienvenida -->
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="welcome-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h2 class="welcome-title">¡Bienvenido al Análisis Inteligente!</h2>
        <p class="welcome-text">
          He cargado <strong>{{ marcoTeoricoCount }}</strong> documento(s) de Marco Teórico y 
          <strong>{{ casosCount }}</strong> documento(s) de Casos de Uso.
        </p>
        <p class="welcome-hint">Escribe tu pregunta para comenzar el análisis.</p>
      </div>

      <!-- Mensajes de la conversación -->
      <div v-for="(msg, index) in messages" :key="index" 
           class="chat-msg" 
           :class="msg.role">
        <div class="chat-meta">
          <span v-if="msg.role === 'user'" class="role-badge user">Tú</span>
          <span v-else-if="msg.role === 'assistant'" class="role-badge assistant">IA</span>
          <span v-else class="role-badge system">Sistema</span>
          <span class="time">{{ formatTime(msg.timestamp) }}</span>
        </div>
        <div class="chat-content" v-html="formatMessage(msg.content)"></div>
      </div>

      <!-- Indicador de escritura -->
      <div v-if="loading" class="chat-msg assistant">
        <div class="chat-meta">
          <span class="role-badge assistant">IA</span>
        </div>
        <div class="typing">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <!-- Panel de documentos cargados -->
    <div v-if="marcoTeoricoCount > 0 || casosCount > 0" class="sources-panel glass-card">
      <h4 class="sources-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        Documentos cargados para análisis
      </h4>
      <div class="sources-badges">
        <span v-if="marcoTeoricoCount > 0" class="source-badge theory">
          📚 {{ marcoTeoricoCount }} Marco Teórico
        </span>
        <span v-if="casosCount > 0" class="source-badge cases">
          💼 {{ casosCount }} Casos de Uso
        </span>
      </div>
    </div>

    <!-- Formulario de envío -->
    <form class="chat-form glass-form-container" @submit.prevent="submitPrompt">
      <div class="input-container">
        <textarea 
          id="prompt"
          v-model="prompt" 
          class="glass-textarea glass-input-primary"
          placeholder="Escribe tu pregunta o análisis..." 
          rows="3"
          @keydown.ctrl.enter="submitPrompt"
          @keydown.enter.exact.prevent="submitPrompt"
        ></textarea>
        <span class="hint-text">Ctrl+Enter para enviar</span>
      </div>
      <button 
        type="submit" 
        :disabled="loading || !prompt.trim()"
        class="glass-button-primary"
      >
        <span v-if="!loading">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
          Enviar
        </span>
        <span v-else class="glass-button-loading">
          <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          Enviando...
        </span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

// Referencias
const messagesEl = ref(null);
const prompt = ref('');
const messages = ref([]);
const loading = ref(false);

// Obtener fuentes desde localStorage
const marcoIds = JSON.parse(localStorage.getItem('marcoTeoricoIds') || '[]');
const casosIds = JSON.parse(localStorage.getItem('casosDeUsoIds') || '[]');
const marcoTeoricoCount = ref(marcoIds.length);
const casosCount = ref(casosIds.length);

const sourceIds = [...marcoIds, ...casosIds];

// Formatear timestamp
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

// Formatear mensaje con saltos de línea
function formatMessage(content) {
  if (!content) return '';
  // Escapar HTML básico y convertir saltos de línea
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

// Scroll al fondo
function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
    }
  });
}

// Cargar historial de conversación
async function loadConversationHistory() {
  const conversationId = localStorage.getItem('conversationId');
  if (!conversationId) return false;

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:4000/api/conversations/${conversationId}/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.status === 403) {
      console.log('⚠️ Conversación no pertenece al usuario');
      return false;
    }

    if (!res.ok) {
      throw new Error('Error al cargar historial');
    }

    const messagesData = await res.json();
    
    // Agregar mensajes al chat
    messagesData.forEach(msg => {
      messages.value.push({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      });
    });
    
    console.log('✅ Historial cargado:', messagesData.length, 'mensajes');
    return true;
  } catch (err) {
    console.warn('⚠️ No se pudo cargar el historial:', err.message);
    return false;
  }
}

// Inicializar conversación
onMounted(async () => {
  console.log('📄 Fuentes cargadas:', {
    marcoTeorico: marcoIds,
    casosUso: casosIds,
    total: sourceIds.length
  });

  const token = localStorage.getItem('token');
  const savedConversationId = localStorage.getItem('conversationId');

  // Verificar si hay una conversación guardada y si es válida
  if (savedConversationId && sourceIds.length > 0) {
    try {
      console.log('🔍 Verificando conversación existente:', savedConversationId);
      
      const isValid = await loadConversationHistory();
      
      if (!isValid) {
        console.log('⚠️ Conversación no válida o no pertenece al usuario, creando nueva...');
        localStorage.removeItem('conversationId');
        messages.value = []; // Limpiar mensajes
      }
    } catch (err) {
      console.log('⚠️ Error al verificar conversación, creando nueva...');
      localStorage.removeItem('conversationId');
      messages.value = [];
    }
  }

  if (sourceIds.length === 0) {
    messages.value.push({
      role: 'system',
      content: '⚠️ No hay documentos cargados. Por favor, selecciona documentos desde las páginas de Marco Teórico y Casos de Uso primero.',
      timestamp: new Date().toISOString()
    });
  } else if (!localStorage.getItem('conversationId')) {
    // Crear nueva conversación si no hay una válida
    messages.value.push({
      role: 'system',
      content: `✅ Se cargaron ${sourceIds.length} documento(s) para análisis. Nueva conversación creada.`,
      timestamp: new Date().toISOString()
    });
  } else {
    messages.value.push({
      role: 'system',
      content: `✅ Se cargaron ${sourceIds.length} documento(s) para análisis. Puedes comenzar a hacer preguntas.`,
      timestamp: new Date().toISOString()
    });
  }
  
  scrollToBottom();
});

// Enviar pregunta
async function submitPrompt() {
  if (!prompt.value.trim() || loading.value) return;
  if (sourceIds.length === 0) {
    alert('Por favor, selecciona documentos desde las páginas de Marco Teórico y Casos de Uso primero.');
    return;
  }

  const userQuestion = prompt.value.trim();
  
  // Agregar mensaje del usuario
  messages.value.push({
    role: 'user',
    content: userQuestion,
    timestamp: new Date().toISOString()
  });
  
  prompt.value = '';
  scrollToBottom();
  
  scrollToBottom();
  
  loading.value = true;

  try {
    const token = localStorage.getItem('token');
    const userId = authStore.userId || authStore.user?.id;
    
    // Obtener o crear conversation_id
    let conversationId = localStorage.getItem('conversationId');
    
    // Función para crear nueva conversación
    const createConversation = async () => {
      console.log('📝 Creando nueva conversación con fuentes:', sourceIds);
      const createRes = await fetch('http://localhost:4000/api/conversations/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          source_ids: sourceIds,
          title: 'Análisis Inteligente'
        })
      });
      
      if (!createRes.ok) {
        throw new Error('No se pudo crear la conversación');
      }
      
      const convData = await createRes.json();
      conversationId = convData.conversation_id;
      localStorage.setItem('conversationId', conversationId);
      console.log('✅ Conversación creada:', conversationId);
      return conversationId;
    };

    if (!conversationId && sourceIds.length > 0) {
      conversationId = await createConversation();
    }

    if (!conversationId) {
      throw new Error('No hay conversación activa');
    }

    console.log('📤 Enviando pregunta:', userQuestion);
    console.log('💬 Conversation ID:', conversationId);

    const payload = {
      conversation_id: conversationId,
      message: userQuestion
    };

    let res = await fetch('http://localhost:4000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    // Si hay error 403, la conversación no pertenece al usuario - crear nueva
    if (res.status === 403) {
      console.log('⚠️ Conversación no válida, creando nueva...');
      localStorage.removeItem('conversationId');
      conversationId = await createConversation();
      
      // Reintentar con la nueva conversación
      payload.conversation_id = conversationId;
      console.log('🔄 Reintentando con nueva conversación:', conversationId);
      
      res = await fetch('http://localhost:4000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Error ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    
    // Agregar respuesta de la IA
    messages.value.push({
      role: 'assistant',
      content: data.response || data.reply || 'No se recibió respuesta del servidor.',
      timestamp: new Date().toISOString()
    });

    console.log('✅ Respuesta recibida');

  } catch (err) {
    console.error('❌ Error:', err.message);
    messages.value.push({
      role: 'assistant',
      content: `⚠️ Lo siento, ocurrió un error al procesar tu pregunta: ${err.message}. Por favor, intenta de nuevo.`,
      timestamp: new Date().toISOString()
    });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
}
</script>

<style scoped>
/* === CONTENEDOR PRINCIPAL === */
.chat-container {
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  height: 100%;
  max-width: 900px;
  margin: auto;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.03) 50%,
    rgba(255, 255, 255, 0.02) 100%
  );
  backdrop-filter: blur(25px) saturate(160%);
  -webkit-backdrop-filter: blur(25px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

/* === HEADER === */
.chat-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.06) 100%
  );
  backdrop-filter: blur(30px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.chat-header-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.2) 0%,
    rgba(139, 92, 246, 0.15) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: var(--primary-400);
}

.chat-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  margin-top: 2px;
}

/* === MENSAJES === */
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

.messages::-webkit-scrollbar {
  width: 6px;
}

.messages::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.messages::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.3);
  border-radius: 3px;
}

/* Mensaje de bienvenida */
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

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.welcome-text {
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 8px 0;
}

.welcome-hint {
  font-size: 14px;
  opacity: 0.7;
  margin: 0;
}

/* Mensajes del chat */
.chat-msg {
  max-width: 85%;
  padding: 16px 20px;
  border-radius: 16px;
  line-height: 1.6;
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

.chat-msg.system {
  margin: 0 auto;
  background: linear-gradient(135deg, 
    rgba(251, 191, 36, 0.15) 0%,
    rgba(245, 158, 11, 0.1) 100%
  );
  border: 1px solid rgba(251, 191, 36, 0.3);
  color: var(--text-primary);
  text-align: center;
  max-width: 90%;
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

.role-badge.user {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.role-badge.assistant {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.2) 0%,
    rgba(139, 92, 246, 0.2) 100%
  );
  color: var(--primary-300);
}

.role-badge.system {
  background: rgba(251, 191, 36, 0.2);
  color: #F59E0B;
}

.time {
  color: var(--text-tertiary);
  opacity: 0.7;
}

.chat-content {
  font-size: 14px;
}

/* Indicador de escritura */
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

/* === PANEL DE FUENTES === */
.sources-panel {
  margin: 16px 24px;
  padding: 16px 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.08) 0%,
    rgba(16, 185, 129, 0.05) 100%
  );
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.sources-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.sources-badges {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.source-badge {
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.source-badge.theory {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.15) 0%,
    rgba(59, 130, 246, 0.08) 100%
  );
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: var(--primary-300);
}

.source-badge.cases {
  background: linear-gradient(135deg, 
    rgba(16, 185, 129, 0.15) 0%,
    rgba(16, 185, 129, 0.08) 100%
  );
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10B981;
}

/* === FORMULARIO === */
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-textarea::placeholder {
  color: var(--text-tertiary);
  opacity: 0.7;
}

.glass-textarea:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.4);
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  box-shadow: 
    0 8px 25px rgba(59, 130, 246, 0.15),
    0 1px 0 rgba(255, 255, 255, 0.3) inset;
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
    var(--primary-500) 0%,
    var(--primary-600) 100%
  );
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 14px;
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 8px 25px rgba(59, 130, 246, 0.3),
    0 4px 12px rgba(0, 0, 0, 0.15);
}

.glass-button-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, 
    var(--primary-400) 0%,
    var(--primary-500) 100%
  );
  box-shadow: 
    0 12px 35px rgba(59, 130, 246, 0.4),
    0 6px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.glass-button-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.glass-button-loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* === UTILIDADES === */
.glass-text-primary { color: var(--text-primary); }
.glass-text-secondary { color: var(--text-secondary); }
.glass-text-tertiary { color: var(--text-tertiary); }
.glass-icon-primary { color: var(--primary-400); }

/* === RESPONSIVE === */
@media (max-width: 768px) {
  .chat-container {
    margin: 0;
    border-radius: 0;
    height: 100vh;
  }
  
  .chat-header { padding: 12px 16px; }
  
  .messages { padding: 16px; }
  
  .sources-panel { margin: 12px 16px; }
  
  .chat-form {
    padding: 16px;
    flex-direction: column;
  }
  
  .glass-button-primary { width: 100%; justify-content: center; }
}
</style>
