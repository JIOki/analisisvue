<template>
  <div class="message-wrapper animate-glass-slide">
    <div :class="['message-container', `message-${message.role}`]">
      <!-- Message Header -->
      <div class="message-header">
        <div class="message-meta">
          <!-- Avatar and Role -->
          <div class="flex items-center gap-3">
            <!-- User Avatar -->
            <div v-if="message.role === 'user'" class="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-alt-500 flex items-center justify-center text-white font-semibold text-sm">
              <span>U</span>
            </div>
            
            <!-- Assistant Avatar -->
            <div v-else-if="message.role === 'assistant'" class="w-8 h-8 rounded-full bg-gradient-to-r from-semantic-success to-green-400 flex items-center justify-center text-white">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M13,17H11V15H13V17M13,13H11V7H13V13Z"/>
              </svg>
            </div>
            
            <!-- System Avatar -->
            <div v-else-if="message.role === 'system'" class="w-8 h-8 rounded-full bg-gradient-to-r from-semantic-warning to-yellow-400 flex items-center justify-center text-white">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"/>
              </svg>
            </div>
            
            <!-- Role and Time -->
            <div class="flex flex-col">
              <span class="message-role">{{ getRoleLabel(message.role) }}</span>
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Message Content -->
      <div class="message-content" v-html="formatMessage(message.content)"></div>
      
      <!-- Verification Badge for Assistant Messages -->
      <div v-if="message.role === 'assistant' && hasVerification" class="verification-badge-container">
        <VerificationBadge 
          :level="verificationLevel"
          :score="verificationScore"
          :show-score="true"
        />
      </div>
      
      <!-- Rating System for Assistant Messages -->
      <RatingButton
        v-if="message.role === 'assistant' && message.id"
        :message-id="message.id"
        :initial-stats="message.rating_stats"
        :user-rating="message.user_rating"
        @rating-changed="handleRatingChange"
      />
      
      <!-- Copy Button for Assistant Messages -->
      <button 
        v-if="message.role === 'assistant'" 
        @click="copyToClipboard"
        class="copy-button glass-button p-2 rounded-lg hover:shadow-glass-card-hover transition-all duration-300"
        :title="'Copiar mensaje'"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16,1H4C2.89,1 2,1.89 2,3V17H4V3H16V1M19,5H8C6.89,5 6,5.89 6,7V21C6,22.11 6.89,23 8,23H19C20.11,23 21,22.11 21,21V7C21,5.89 20.11,5 19,5M19,21H8V7H19V21Z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import RatingButton from './RatingButton.vue';
import VerificationBadge from './VerificationBadge.vue';

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['rating-changed']);

function getRoleLabel(role) {
  const labels = {
    user: 'Tú',
    assistant: 'Asistente IA',
    system: 'Sistema'
  };
  return labels[role] || role;
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatMessage(content) {
  if (!content) return '';
  
  // Convertir saltos de línea a <br>
  let formatted = content.replace(/\n/g, '<br>');
  
  // Detectar y formatear URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener" class="message-link">$1</a>');
  
  // Detectar código inline
  const codeRegex =/`([^`]+)`/g;
  formatted = formatted.replace(codeRegex, '<code class="inline-code">$1</code>');
  
  // Detectar bloques de código
  const codeBlockRegex = /```([\s\S]*?)```/g;
  formatted = formatted.replace(codeBlockRegex, '<pre class="code-block"><code>$1</code></pre>');
  
  // Resaltar texto en negrita
  const boldRegex = /\*\*(.*?)\*\*/g;
  formatted = formatted.replace(boldRegex, '<strong class="message-strong">$1</strong>');
  
  // Resaltar texto en cursiva
  const italicRegex = /\*(.*?)\*/g;
  formatted = formatted.replace(italicRegex, '<em class="message-em">$1</em>');
  
  return formatted;
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(props.message.content);
    // Show success feedback (could add a toast notification here)
    console.log('Message copied to clipboard');
  } catch (err) {
    console.error('Failed to copy message:', err);
  }
}

function handleRatingChange(event) {
  emit('rating-changed', event);
  
  // Update local message data
  if (props.message.id === event.messageId) {
    props.message.user_rating = event.rating;
    props.message.rating_stats = event.stats;
  }
}

// ============================================
// VERIFICATION DATA COMPUTED PROPERTIES
// ============================================

// Get verification data from message (handles both direct and nested formats)
const verificationData = computed(() => {
  const msg = props.message;
  if (!msg) return null;
  
  // Try direct verification_data field (from API)
  if (msg.verification_data) {
    return typeof msg.verification_data === 'string' 
      ? JSON.parse(msg.verification_data) 
      : msg.verification_data;
  }
  
  // Try nested in verification object (from realtime response)
  if (msg.verification && typeof msg.verification === 'object') {
    return msg.verification;
  }
  
  return null;
});

// Check if message has verification data
const hasVerification = computed(() => {
  const data = verificationData.value;
  return data && data.confidence_score !== undefined;
});

// Get confidence score (0-1)
const verificationScore = computed(() => {
  const data = verificationData.value;
  if (!data) return 0;
  return data.confidence_score || 0;
});

// Get confidence level string
const verificationLevel = computed(() => {
  const data = verificationData.value;
  if (!data) return 'nula';
  return data.confidence_level || 'nula';
});
</script>

<style scoped>
.message-wrapper {
  animation: glassSlideIn 0.4s ease-out;
}

/* Verification Badge Container */
.verification-badge-container {
  margin-top: 12px;
  margin-bottom: 8px;
}

@keyframes glassSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-container {
  max-width: 80%;
  padding: 20px 24px;
  border-radius: 20px;
  line-height: 1.6;
  position: relative;
  transition: all 0.3s ease-out;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  animation: messageFloat 0.3s ease-out;
}

@keyframes messageFloat {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* User Messages */
.message-user {
  margin-left: auto;
  background: var(--glass-card);
  border: 1px solid rgba(59, 130, 246, 0.2);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  color: var(--text-primary);
  text-align: right;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
  position: relative;
  overflow: hidden;
}

.message-user::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.message-user:hover::before {
  opacity: 1;
}

/* Assistant Messages */
.message-assistant {
  margin-right: auto;
  background: var(--glass-card);
  border: 1px solid rgba(16, 185, 129, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: var(--text-on-glass);
  text-align: left;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.message-assistant::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.message-assistant:hover::before {
  opacity: 1;
}

/* System Messages */
.message-system {
  margin: 0 auto;
  background: var(--glass-subtle);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 16px;
  color: var(--text-secondary);
  text-align: center;
  font-style: italic;
  max-width: 70%;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* Message Header */
.message-header {
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.message-role {
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-primary);
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
  color: var(--text-secondary);
}

.message-content {
  word-wrap: break-word;
  overflow-wrap: break-word;
  position: relative;
  z-index: 1;
}

/* Message Content Styling */
.message-content :deep(.inline-code) {
  background: var(--glass-subtle);
  padding: 4px 8px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.85em;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.message-content :deep(.code-block) {
  background: var(--glass-elevated);
  padding: 16px;
  border-radius: 12px;
  margin: 12px 0;
  overflow-x: auto;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.8em;
  line-height: 1.5;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.message-content :deep(.code-block code) {
  color: var(--text-on-glass);
}

.message-content :deep(.message-strong) {
  font-weight: 600;
  color: var(--text-primary);
}

.message-content :deep(.message-em) {
  font-style: italic;
  color: var(--text-secondary);
}

.message-content :deep(.message-link) {
  color: var(--primary-500);
  text-decoration: none;
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  transition: all 0.2s ease;
  position: relative;
}

.message-content :deep(.message-link:hover) {
  color: var(--primary-600);
  border-bottom-color: var(--primary-500);
}

/* Copy Button */
.copy-button {
  position: absolute;
  top: 16px;
  right: 16px;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s ease;
}

.message-container:hover .copy-button {
  opacity: 1;
  transform: scale(1);
}

/* Responsive Design */
@media (max-width: 768px) {
  .message-container {
    max-width: 90%;
    padding: 16px 20px;
  }
  
  .message-meta {
    font-size: 0.8rem;
  }
  
  .message-content :deep(.code-block) {
    padding: 12px;
    font-size: 0.75em;
  }
  
  .copy-button {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 480px) {
  .message-container {
    max-width: 95%;
    padding: 12px 16px;
  }
  
  .message-meta {
    font-size: 0.75rem;
  }
}

/* Animation for new messages */
.message-wrapper:nth-child(even) .message-container {
  animation-delay: 0.1s;
}

.message-wrapper:nth-child(3n) .message-container {
  animation-delay: 0.2s;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .message-user,
  .message-assistant {
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid #3B82F6;
    color: #000;
  }
  
  .message-user::before,
  .message-assistant::before {
    display: none;
  }
  
  .message-content :deep(.inline-code),
  .message-content :deep(.code-block) {
    background: #000;
    color: #fff;
    border-color: #3B82F6;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .message-wrapper,
  .message-container,
  .message-user::before,
  .message-assistant::before {
    animation: none;
    transition: none;
  }
}
</style>