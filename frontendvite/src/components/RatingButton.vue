<template>
  <div class="rating-container animate-glass-slide">
    <div class="rating-wrapper glass-subtle p-4 rounded-2xl">
      <!-- Rating Statistics -->
      <div v-if="stats && stats.total_votes > 0" class="rating-stats mb-4 animate-glass-fade">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <!-- Rating Score Visualization -->
            <div class="rating-score">
              <div class="score-circle">
                <span class="score-percentage">{{ percentage }}%</span>
              </div>
              <div class="score-label">Utilidad</div>
            </div>
            
            <!-- Vote Count -->
            <div class="vote-count">
              <span class="count-number">{{ stats.total_votes }}</span>
              <span class="count-label">voto{{ stats.total_votes !== 1 ? 's' : '' }}</span>
            </div>
          </div>
          
          <!-- Visual Rating Breakdown -->
          <div class="rating-breakdown">
            <div class="breakdown-item">
              <div class="breakdown-bar useful" :style="{ width: `${usefulPercentage}%` }"></div>
              <span class="breakdown-icon">👍</span>
            </div>
            <div class="breakdown-item">
              <div class="breakdown-bar neutral" :style="{ width: `${neutralPercentage}%` }"></div>
              <span class="breakdown-icon">❓</span>
            </div>
            <div class="breakdown-item">
              <div class="breakdown-bar not-useful" :style="{ width: `${notUsefulPercentage}%` }"></div>
              <span class="breakdown-icon">👎</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Rating Buttons -->
      <div class="rating-buttons">
        <button
          v-for="option in ratingOptions"
          :key="option.value"
          :class="[
            'rating-btn',
            `rating-${option.value}`,
            { 
              'active': selectedRating === option.value,
              'disabled': isDisabled,
              'has-voted': hasVoted
            }
          ]"
          :disabled="isDisabled || loading"
          @click="handleRating(option.value)"
          :title="option.tooltip"
        >
          <!-- Icon with Glow Effect -->
          <div class="icon-wrapper">
            <span class="rating-icon">{{ option.icon }}</span>
            <div class="icon-glow" v-if="selectedRating === option.value"></div>
          </div>
          
          <!-- Label -->
          <span class="rating-label">{{ option.label }}</span>
          
          <!-- Vote Count Badge -->
          <div v-if="stats && stats[option.count_key]" class="rating-badge glass-card">
            {{ stats[option.count_key] }}
          </div>
          
          <!-- Loading Spinner -->
          <div v-if="loading" class="loading-spinner"></div>
        </button>
      </div>
      
      <!-- User Feedback Message -->
      <div v-if="hasVoted" class="rating-feedback animate-glass-fade">
        <div class="feedback-content glass-elevated">
          <span class="feedback-icon">{{ feedbackIcon }}</span>
          <span class="feedback-text">Tu calificación ha sido registrada</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits, defineProps, onMounted } from 'vue';

const props = defineProps({
  messageId: {
    type: String,
    required: true
  },
  initialStats: {
    type: Object,
    default: () => ({})
  },
  userRating: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['rating-changed']);

const loading = ref(false);
const stats = ref(props.initialStats);
const selectedRating = ref(props.userRating);

const ratingOptions = [
  {
    value: 'useful',
    label: 'Útil',
    icon: '👍',
    count_key: 'useful_count',
    tooltip: 'Marcar como respuesta útil'
  },
  {
    value: 'neutral',
    label: 'Neutral',
    icon: '❓',
    count_key: 'neutral_count',
    tooltip: 'Marcar como respuesta neutral'
  },
  {
    value: 'not_useful',
    label: 'No útil',
    icon: '👎',
    count_key: 'not_useful_count',
    tooltip: 'Marcar como respuesta no útil'
  }
];

const hasVoted = computed(() => selectedRating.value !== null);
const isDisabled = computed(() => loading.value || hasVoted.value);

const percentage = computed(() => {
  if (!stats.value || !stats.value.total_votes) return 0;
  const usefulVotes = stats.value.useful_count || 0;
  return Math.round((usefulVotes / stats.value.total_votes) * 100);
});

const usefulPercentage = computed(() => {
  if (!stats.value || !stats.value.total_votes) return 0;
  return Math.round((stats.value.useful_count || 0) / stats.value.total_votes * 100);
});

const neutralPercentage = computed(() => {
  if (!stats.value || !stats.value.total_votes) return 0;
  return Math.round((stats.value.neutral_count || 0) / stats.value.total_votes * 100);
});

const notUsefulPercentage = computed(() => {
  if (!stats.value || !stats.value.total_votes) return 0;
  return Math.round((stats.value.not_useful_count || 0) / stats.value.total_votes * 100);
});

const feedbackIcon = computed(() => {
  switch (selectedRating.value) {
    case 'useful': return '✓';
    case 'not_useful': return '⚠';
    case 'neutral': return '→';
    default: return '✓';
  }
});

async function handleRating(rating) {
  if (loading.value || hasVoted.value) return;
  
  loading.value = true;
  try {
    const response = await fetch('/api/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        message_id: props.messageId,
        rating: rating,
        user_id: getUserId()
      })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Update local statistics
    stats.value = result.stats;
    selectedRating.value = rating;
    
    // Emit event to parent component
    emit('rating-changed', {
      messageId: props.messageId,
      rating,
      stats: result.stats
    });

  } catch (error) {
    console.error('Error al enviar calificación:', error);
    // Here you could show an error notification
    // For example, using a toast library
    alert('Error al enviar la calificación. Por favor, inténtalo de nuevo.');
  } finally {
    loading.value = false;
  }
}

function getUserId() {
  return localStorage.getItem('userId') || 'anonymous';
}

// Load message statistics when component mounts
onMounted(async () => {
  try {
    const response = await fetch(`/api/ratings/message/${props.messageId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (response.ok) {
      const messageStats = await response.json();
      stats.value = messageStats;
    }
  } catch (error) {
    console.error('Error al cargar estadísticas del mensaje:', error);
  }
});
</script>

<style scoped>
.rating-container {
  margin-top: 16px;
  animation: ratingSlideIn 0.4s ease-out;
}

@keyframes ratingSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rating-wrapper {
  position: relative;
  backdrop-filter: var(--backdrop-glass-light);
  -webkit-backdrop-filter: var(--backdrop-glass-light);
  border: 1px solid var(--glass-border);
  transition: all 0.3s ease-out;
}

.rating-wrapper:hover {
  backdrop-filter: var(--backdrop-glass-medium);
  -webkit-backdrop-filter: var(--backdrop-glass-medium);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

/* Rating Statistics */
.rating-stats {
  animation: statsFadeIn 0.6s ease-out;
}

@keyframes statsFadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rating-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.score-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--semantic-success), #34D399);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.score-circle::before {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background: var(--glass-card);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.score-percentage {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-on-glass);
  z-index: 1;
}

.score-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.vote-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.count-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.count-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

/* Rating Breakdown */
.rating-breakdown {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 80px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breakdown-bar {
  height: 4px;
  border-radius: 2px;
  transition: width 0.8s ease-out;
  position: relative;
  overflow: hidden;
}

.breakdown-bar.useful {
  background: linear-gradient(90deg, var(--semantic-success), #34D399);
}

.breakdown-bar.neutral {
  background: linear-gradient(90deg, var(--text-secondary), #9CA3AF);
}

.breakdown-bar.not-useful {
  background: linear-gradient(90deg, var(--semantic-error), #F87171);
}

.breakdown-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: barShine 2s ease-in-out infinite;
}

@keyframes barShine {
  0%, 100% {
    left: -100%;
  }
  50% {
    left: 100%;
  }
}

.breakdown-icon {
  font-size: 0.75rem;
  opacity: 0.7;
}

/* Rating Buttons */
.rating-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.rating-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  background: var(--glass-card);
  color: var(--text-on-glass);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease-out;
  position: relative;
  overflow: hidden;
  min-width: 80px;
  justify-content: center;
  font-weight: 500;
  backdrop-filter: var(--backdrop-glass-light);
  -webkit-backdrop-filter: var(--backdrop-glass-light);
}

.rating-btn:hover:not(.disabled):not(.has-voted) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  border-color: var(--primary-500);
}

.rating-btn:active:not(.disabled) {
  transform: translateY(0);
  transition: transform 0.1s ease;
}

.rating-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.rating-btn.has-voted,
.rating-btn.active {
  background: var(--glass-elevated);
  border-color: var(--primary-500);
  box-shadow: 0 4px 16px rgba(59,130,246,0.2);
}

/* Icon Styling */
.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rating-icon {
  font-size: 1.1em;
  z-index: 2;
  transition: transform 0.3s ease;
}

.rating-btn:hover .rating-icon {
  transform: scale(1.1);
}

.icon-glow {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--primary-500), transparent);
  opacity: 0.3;
  animation: pulse 2s ease-in-out infinite;
  z-index: 1;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

/* Rating Badge */
.rating-badge {
  font-size: 0.75rem;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 0 6px;
  font-weight: 600;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border);
}

/* Loading Spinner */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Feedback */
.rating-feedback {
  margin-top: 12px;
}

.feedback-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  color: var(--semantic-success);
  font-weight: 500;
  backdrop-filter: var(--backdrop-glass-light);
  -webkit-backdrop-filter: var(--backdrop-glass-light);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.feedback-icon {
  font-size: 1em;
}

/* Color-specific animations */
.rating-useful:hover:not(.disabled):not(.has-voted) {
  border-color: var(--semantic-success);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2);
}

.rating-not_useful:hover:not(.disabled):not(.has-voted) {
  border-color: var(--semantic-error);
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.2);
}

.rating-neutral:hover:not(.disabled):not(.has-voted) {
  border-color: var(--text-secondary);
  box-shadow: 0 8px 24px rgba(156, 163, 175, 0.2);
}

/* Responsive Design */
@media (max-width: 768px) {
  .rating-buttons {
    gap: 6px;
  }
  
  .rating-btn {
    padding: 10px 12px;
    font-size: 0.8rem;
    min-width: 70px;
    gap: 6px;
  }
  
  .rating-label {
    display: none;
  }
  
  .rating-stats .flex {
    flex-direction: column;
    gap: 8px;
  }
  
  .rating-breakdown {
    flex-direction: row;
    min-width: auto;
    width: 100%;
  }
  
  .score-circle {
    width: 40px;
    height: 40px;
  }
  
  .score-percentage {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .rating-container {
    margin-top: 12px;
  }
  
  .rating-btn {
    padding: 8px 10px;
    min-width: 60px;
  }
  
  .icon-wrapper {
    font-size: 0.9em;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .rating-wrapper,
  .rating-btn,
  .feedback-content {
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid #3B82F6;
  }
  
  .dark .rating-wrapper,
  .dark .rating-btn,
  .dark .feedback-content {
    background: rgba(0, 0, 0, 0.95);
  }
  
  .score-circle {
    background: #3B82F6;
  }
  
  .score-circle::before {
    background: inherit;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .rating-container,
  .rating-wrapper,
  .rating-btn,
  .icon-glow,
  .breakdown-bar::after,
  .loading-spinner {
    animation: none;
    transition: none;
  }
  
  .rating-btn:hover {
    transform: none;
  }
  
  .icon-glow {
    display: none;
  }
}
</style>