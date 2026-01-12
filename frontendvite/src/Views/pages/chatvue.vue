<template>
  <div class="chat-container glass-container">
    <header class="chat-header glass-navbar-elevated">
      <div class="chat-header-icon glass-icon-primary">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div>
        <h1 class="chat-title glass-text-primary"> Análisis Inteligente</h1>
        <p class="subtitle glass-text-secondary">Las respuestas verdaderas sobre temas verdaderos</p>
      </div>
    </header>

    <div ref="messagesEl" class="messages">
      <ChatMessage
        v-for="(msg, i) in conversation"
        :key="i"
        :message="msg"
        @rating-changed="handleRatingChange"
      />

      <div v-if="loading" class="msg assistant">
        <div class="meta">Asistente</div>
        <div class="typing">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <!-- Zona de Drag & Drop -->
    <div 
      class="drag-drop-zone glass-card glass-hoverable"
      :class="{ 
        'glass-drag-over': isDragOver, 
        'glass-uploading': uploadingDocuments 
      }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input 
        ref="fileInput" 
        type="file" 
        multiple 
        accept=".doc,.docx,.txt,.xlsx,.xls"
        @change="handleFileSelect"
        style="display: none"
      />
      
      <div v-if="!uploadingDocuments" class="drag-drop-content">
        <div class="upload-icon-container glass-icon-secondary">
          <svg class="upload-icon glass-icon-animated" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        <p class="drag-text glass-text-primary">Arrastra documentos aquí o haz clic para seleccionar</p>
        <p class="drag-formats glass-text-tertiary">Word (.doc, .docx), TXT, Excel (.xlsx, .xls)</p>
      </div>

      <div v-else class="uploading-content">
        <div class="glass-spinner-container">
          <div class="spinner glass-spinner"></div>
        </div>
        <p class="glass-text-secondary">Procesando documentos...</p>
      </div>
    </div>

    <!-- Lista de documentos cargados -->
    <div v-if="uploadedDocuments.length > 0" class="uploaded-documents glass-card">
      <h4 class="documents-title glass-text-primary">Documentos cargados en esta conversación:</h4>
      <div class="document-list">
        <div v-for="doc in uploadedDocuments" :key="doc.id" class="document-item glass-document-pill">
          <svg class="doc-icon glass-icon-secondary" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
          <span class="doc-name glass-text-primary">{{ doc.filename || doc.title }}</span>
          <span class="doc-badge glass-badge-primary">{{ doc.kind }}</span>
        </div>
      </div>
    </div>

    <form class="chat-form glass-form-container" @submit.prevent="sendMessage">
      <textarea 
        v-model="input" 
        class="glass-textarea glass-input-primary"
        placeholder="Escribe tu mensaje..." 
        required
      ></textarea>
      <button 
        type="submit" 
        :disabled="loading" 
        class="glass-button-primary"
      >
        <span v-if="!loading">Enviar</span>
        <span v-else class="glass-button-loading">
          <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Enviando...
        </span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useAuthStore } from "@/stores/auth";
import ChatMessage from "../../components/ChatMessage.vue";

const API_ENDPOINT = "/api/chat";
const SEND_FULL_CONVERSATION = true;
const authStore = useAuthStore();

const input = ref("");
const conversation = ref([]);
const loading = ref(false);
const messagesEl = ref(null);
const isDragOver = ref(false);
const uploadingDocuments = ref(false);
const uploadedDocuments = ref([]);
const fileInput = ref(null);

function formatText(text) {
  return text.replace(/\n/g, "<br>");
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
    }
  });
}

// Funciones para Drag & Drop
function handleDragOver(e) {
  isDragOver.value = true;
}

function handleDragLeave(e) {
  isDragOver.value = false;
}

function handleDrop(e) {
  isDragOver.value = false;
  const files = Array.from(e.dataTransfer.files);
  uploadDocuments(files);
}

function triggerFileInput() {
  fileInput.value.click();
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  uploadDocuments(files);
}

async function uploadDocuments(files) {
  if (!files || files.length === 0) return;
  
  // Validar tipos de archivo
  const allowedExtensions = ['doc', 'docx', 'txt', 'xlsx', 'xls'];
  const invalidFiles = files.filter(file => {
    const ext = file.name.split('.').pop().toLowerCase();
    return !allowedExtensions.includes(ext);
  });
  
  if (invalidFiles.length > 0) {
    alert(`Archivos no permitidos: ${invalidFiles.map(f => f.name).join(', ')}\nSolo se permiten: Word, TXT y Excel`);
    return;
  }
  
  uploadingDocuments.value = true;
  
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });
    
    // Obtener user_id del store de autenticación
    const userId = authStore.userId || authStore.user?.id;
    
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    formData.append('conversation_id', conversationId);
    formData.append('user_id', userId);
    
    console.log(`📤 Subiendo ${files.length} documento(s)...`);
    
    const res = await fetch('/api/chat/upload-documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      },
      body: formData
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Error al subir documentos');
    }
    
    const result = await res.json();
    console.log('✅ Documentos subidos:', result);
    
    // Agregar mensaje del sistema notificando la carga
    conversation.value.push({
      role: 'system',
      content: `✓ ${result.sources.length} documento(s) cargado(s): ${result.sources.map(s => s.filename).join(', ')}`,
      timestamp: new Date().toISOString()
    });
    
    // Actualizar lista de documentos
    await loadUploadedDocuments();
    
    scrollToBottom();
    
  } catch (err) {
    console.error('Error al subir documentos:', err);
    conversation.value.push({
      role: 'system',
      content: `Error al cargar documentos: ${err.message}`,
      timestamp: new Date().toISOString()
    });
    scrollToBottom();
  } finally {
    uploadingDocuments.value = false;
    // Limpiar input de archivos
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
}

async function loadUploadedDocuments() {
  const conversationId = localStorage.getItem('conversationId');
  if (!conversationId) return;
  
  try {
    const res = await fetch(`/api/chat/${conversationId}/documents`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    if (res.ok) {
      const docs = await res.json();
      uploadedDocuments.value = docs;
    }
  } catch (err) {
    console.error('Error al cargar documentos:', err);
  }
}

/*async function sendMessage() {
  if (!input.value.trim()) return;

  const userMsg = { role: "user", content: input.value };
  conversation.value.push(userMsg);
  input.value = "";
  scrollToBottom();

  loading.value = true;
  try {
    const payload = SEND_FULL_CONVERSATION
      ? { conversation: conversation.value }
      : { message: userMsg.content };

    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Error en servidor");
    const j = await res.json();
    const replyText =
      j.reply ??
      (j.choices?.[0]?.message?.content ?? "Sin respuesta del servidor");

    conversation.value.push({ role: "assistant", content: replyText });
  } catch (err) {
    conversation.value.push({
      role: "assistant",
      content: "⚠️ Error: no se pudo contactar con el servidor.",
    });
    console.error(err);
  } finally {
    loading.value = false;
    //scrollToBottom();
  }
}
*/

async function sendMessage() {
  if (!input.value.trim()) return;

  const userMsg = { role: "user", content: input.value };
  conversation.value.push(userMsg);
  scrollToBottom();

  const payload = {
    conversation_id: localStorage.getItem('conversationId'),
    message: userMsg.content
  };

  input.value = "";
  loading.value = true;

  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authStore.token}`
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Error en servidor");
    const j = await res.json();
    const replyText = j.reply ?? "Sin respuesta del servidor";
    const messageId = j.message_id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const assistantMessage = { 
      role: "assistant", 
      content: replyText,
      id: messageId,
      timestamp: new Date().toISOString(),
      rating_stats: { useful_count: 0, not_useful_count: 0, neutral_count: 0, total_votes: 0 },
      user_rating: null
    };

    conversation.value.push(assistantMessage);
  } catch (err) {
    conversation.value.push({
      role: "assistant",
      content: "⚠️ Error: no se pudo contactar con el servidor.",
    });
    console.error(err);
  } finally {
    loading.value = false;
    scrollToBottom();
  }
}




onMounted(() => {
  conversation.value.push({ 
    role: "system", 
    content: "¡Bienvenido al Análisis Inteligente! Puedes preguntar sobre tus documentos cargados y evaluar las respuestas con el sistema de calificaciones.",
    timestamp: new Date().toISOString()
  });
  scrollToBottom();
  setTimeout(() => initConversation(), 0); // evita el warning
});

async function initConversation() {
  const existingId = localStorage.getItem('conversationId');
  if (!existingId) {
    await startConversation();
  } else {
    await loadConversationHistory();
    await loadUploadedDocuments(); // Cargar documentos cuando se carga la conversación
  }
}


////////////////////Al cargar la vista de análisis inteligente, si no hay una conversación activa
async function startConversation() {
  const marcoIds = JSON.parse(localStorage.getItem('marcoTeoricoIds') || '[]');
  const casoIds = JSON.parse(localStorage.getItem('casosDeUsoIds') || '[]');
  const sourceIds = [...marcoIds, ...casoIds];
  console.log("iniciando nueva conversación con fuentes:", sourceIds);


  const res = await fetch('api/conversations/start', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authStore.token}`
    },
    body: JSON.stringify({
      user_id: authStore.userId || authStore.user?.id,
      source_ids: sourceIds,
      title: 'Análisis Inteligente'
    })
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  localStorage.setItem('conversationId', data.conversation_id);
}

/////////////Enviar mensaje y guardar automáticamente

//const conversationId = localStorage.getItem('conversationId');

async function loadConversationHistory() {
  const conversationId = localStorage.getItem('conversationId');
  if (!conversationId) return;
  console.log("Cargando historial de la conversación")
  const res = await fetch(`/api/conversations/${conversationId}/messages`, {
    headers: {
      'Authorization': `Bearer ${authStore.token}`
    }
  });
  if (!res.ok) {
    console.error("Error al recuperar historial");
    const text = await res.text();
    console.error("Respuesta inesperada:", text);
    throw new Error(`Error ${res.status}: ${res.statusText}`);
    
  }

  const messages = await res.json();
  conversation.value = messages.map(m => ({
    role: m.role,
    content: m.content,
    id: m.id || `msg_${m.message_id}`,
    timestamp: m.timestamp,
    rating_stats: m.rating_stats || { useful_count: 0, not_useful_count: 0, neutral_count: 0, total_votes: 0 },
    user_rating: m.user_rating || null
  }));
  
  // Cargar ratings del usuario después de cargar el historial
  await loadUserRatings();
}

////////////////////////// Sistema de Ratings //////////////////////////

async function handleRatingChange(event) {
  try {
    // Encontrar el mensaje en la conversación y actualizar sus datos
    const messageIndex = conversation.value.findIndex(msg => msg.id === event.messageId);
    
    if (messageIndex !== -1) {
      conversation.value[messageIndex] = {
        ...conversation.value[messageIndex],
        rating_stats: event.stats,
        user_rating: event.rating
      };
    }
    
    console.log('Rating actualizado:', event);
    
    // Opcionalmente, guardar en localStorage para persistencia local
    saveUserRatingToLocal(event.messageId, event.rating);
    
  } catch (error) {
    console.error('Error al manejar cambio de rating:', error);
  }
}

function saveUserRatingToLocal(messageId, rating) {
  const ratings = JSON.parse(localStorage.getItem('userRatings') || '{}');
  ratings[messageId] = {
    rating,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('userRatings', JSON.stringify(ratings));
}

async function loadUserRatings() {
  try {
    const userId = getUserId();
    
    // Cargar ratings del usuario desde el backend
    const res = await fetch(`/api/ratings/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    if (res.ok) {
      const userRatings = await res.json();
      
      // Actualizar mensajes con los ratings del usuario
      conversation.value.forEach(msg => {
        if (msg.id && userRatings[msg.id]) {
          msg.user_rating = userRatings[msg.id].rating;
        }
      });
    }
  } catch (error) {
    console.error('Error al cargar ratings:', error);
  }
}

function getUserId() {
  return localStorage.getItem('userId') || 'anonymous';
}

///////////////////////////////Si el usuario vuelve a esta vista con una conversación activa:




/////////////////////
</script>

<style scoped>
/* === GLASSMORPHISM CHAT INTERFACE === */

/* Chat Container - Glass Container */
.chat-container {
  display: grid;
  grid-template-rows: 64px 1fr auto auto auto auto;
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
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 1px 0 rgba(255, 255, 255, 0.2) inset;
}

/* Chat Header - Glass Navigation */
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
  -webkit-backdrop-filter: blur(30px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  position: relative;
}

.chat-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(59, 130, 246, 0.3) 50%, 
    transparent 100%
  );
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
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: var(--primary-400);
  transition: all 0.3s ease;
}

.chat-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  margin-top: 2px;
  opacity: 0.8;
}

/* Messages Area */
.messages {
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
  scroll-behavior: smooth;
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
  transition: background 0.3s ease;
}

.messages::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.5);
}

/* Chat Form - Glass Interface */
.chat-form {
  display: flex;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.chat-form::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(59, 130, 246, 0.2) 50%, 
    transparent 100%
  );
}

.glass-textarea {
  flex: 1;
  resize: none;
  min-height: 60px;
  max-height: 200px;
  padding: 16px 20px;
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(15px);
  color: var(--text-primary);
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.2) inset;
}

.glass-textarea::placeholder {
  color: var(--text-tertiary);
  opacity: 0.7;
}

.glass-textarea:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.4);
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  box-shadow: 
    0 8px 25px rgba(59, 130, 246, 0.15),
    0 1px 0 rgba(255, 255, 255, 0.3) inset;
}

.glass-button-primary {
  background: linear-gradient(135deg, 
    var(--primary-500) 0%,
    var(--primary-600) 100%
  );
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 16px 24px;
  border-radius: 14px;
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 8px 25px rgba(59, 130, 246, 0.3),
    0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 100px;
  justify-content: center;
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

.glass-button-primary:active {
  transform: translateY(0);
  box-shadow: 
    0 4px 12px rgba(59, 130, 246, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.15);
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

/* Drag & Drop Zone - Glass Card */
.drag-drop-zone {
  margin: 16px;
  padding: 40px 32px;
  border-radius: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.drag-drop-zone::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: inherit;
  transition: all 0.3s ease;
}

.drag-drop-zone:hover::before {
  border-color: rgba(59, 130, 246, 0.3);
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.08) 0%,
    rgba(59, 130, 246, 0.03) 100%
  );
}

.glass-drag-over::before {
  border-color: rgba(59, 130, 246, 0.6) !important;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.15) 0%,
    rgba(59, 130, 246, 0.08) 100%
  ) !important;
  transform: scale(1.02);
}

.glass-uploading::before {
  border-color: rgba(107, 114, 128, 0.4) !important;
  background: linear-gradient(135deg, 
    rgba(107, 114, 128, 0.1) 0%,
    rgba(107, 114, 128, 0.05) 100%
  ) !important;
  cursor: not-allowed;
}

.drag-drop-zone > * {
  position: relative;
  z-index: 1;
}

.drag-drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon-container {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.15) 0%,
    rgba(139, 92, 246, 0.1) 100%
  );
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-icon-animated {
  color: rgba(59, 130, 246, 0.8);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}

.drag-text {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.drag-formats {
  margin: 0;
  font-size: 13px;
  opacity: 0.7;
}

.uploading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.glass-spinner-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.glass-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: rgba(59, 130, 246, 0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Document List - Glass Pills */
.uploaded-documents {
  margin: 16px;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.08) 0%,
    rgba(59, 130, 246, 0.03) 100%
  );
  backdrop-filter: blur(20px);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.documents-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.document-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.glass-document-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.06) 100%
  );
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.05),
    0 1px 0 rgba(255, 255, 255, 0.2) inset;
}

.glass-document-pill:hover {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.18) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  transform: translateY(-1px);
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.1),
    0 2px 0 rgba(255, 255, 255, 0.3) inset;
}

.doc-icon {
  color: rgba(59, 130, 246, 0.7);
  flex-shrink: 0;
}

.doc-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.glass-badge-primary {
  padding: 6px 12px;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.2) 0%,
    rgba(59, 130, 246, 0.1) 100%
  );
  color: var(--primary-400);
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

/* Loading States - Glass Animation */
.typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 0;
}

.typing span {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-400);
  opacity: 0.4;
  animation: typing-blink 1.4s infinite;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.typing span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-blink {
  0%, 60%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  30% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* Utility Classes - Glass Typography */
.glass-text-primary {
  color: var(--text-primary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.glass-text-secondary {
  color: var(--text-secondary);
  opacity: 0.8;
}

.glass-text-tertiary {
  color: var(--text-tertiary);
  opacity: 0.6;
}

.glass-icon-primary {
  color: var(--primary-400);
}

.glass-icon-secondary {
  color: rgba(59, 130, 246, 0.7);
}

/* Responsive Design */
@media (max-width: 768px) {
  .chat-container {
    margin: 0;
    border-radius: 0;
    height: 100vh;
  }
  
  .chat-header {
    padding: 12px 16px;
  }
  
  .messages {
    padding: 16px;
  }
  
  .drag-drop-zone {
    margin: 12px;
    padding: 24px 20px;
  }
  
  .uploaded-documents {
    margin: 12px;
    padding: 16px;
  }
  
  .chat-form {
    padding: 16px;
    flex-direction: column;
  }
  
  .glass-textarea {
    min-height: 80px;
    margin-bottom: 8px;
  }
  
  .glass-button-primary {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .chat-header {
    gap: 12px;
  }
  
  .chat-header-icon {
    width: 40px;
    height: 40px;
  }
  
  .chat-title {
    font-size: 18px;
  }
  
  .upload-icon-container {
    width: 60px;
    height: 60px;
  }
}
</style>