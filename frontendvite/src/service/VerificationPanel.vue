<template>
    <div class="verification-panel" v-if="verification">
        <!-- Header -->
        <div class="panel-header">
            <div class="header-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>Verificación de Respuesta</span>
            </div>
            <button class="close-btn" @click="$emit('close')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>

        <!-- Confidence Score -->
        <div class="confidence-section">
            <div class="confidence-circle" :class="confidenceClass">
                <span class="confidence-value">{{ (verification.confidence_score * 100).toFixed(0) }}%</span>
                <span class="confidence-label">Confianza</span>
            </div>
            <VerificationBadge 
                :level="verification.confidence_level" 
                :score="verification.confidence_score"
                :showScore="false"
            />
        </div>

        <!-- Metrics Grid -->
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-icon supported">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>
                <div class="metric-info">
                    <span class="metric-value">{{ metrics.supported_claims }}</span>
                    <span class="metric-label">Afirmaciones resp.</span>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-icon unsupported">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </div>
                <div class="metric-info">
                    <span class="metric-value">{{ metrics.unsupported_claims }}</span>
                    <span class="metric-label">Sin respaldo</span>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-icon sources">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                </div>
                <div class="metric-info">
                    <span class="metric-value">{{ metrics.total_evidence_sources }}</span>
                    <span class="metric-label">Fuentes</span>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-icon similarity">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                    </svg>
                </div>
                <div class="metric-info">
                    <span class="metric-value">{{ (metrics.max_similarity * 100).toFixed(0) }}%</span>
                    <span class="metric-label">Similitud máx</span>
                </div>
            </div>
        </div>

        <!-- Warnings -->
        <div v-if="verification.warnings && verification.warnings.length > 0" class="warnings-section">
            <div class="warning-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>Advertencias</span>
            </div>
            <ul class="warning-list">
                <li v-for="(warning, index) in verification.warnings" :key="index">
                    {{ warning }}
                </li>
            </ul>
        </div>

        <!-- Sources Section -->
        <div class="sources-section" v-if="verification.relevant_sources && verification.relevant_sources.length > 0">
            <div class="section-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>Fuentes de Respaldo</span>
            </div>
            
            <div class="sources-list">
                <div 
                    v-for="source in verification.relevant_sources" 
                    :key="source.id"
                    class="source-card"
                >
                    <div class="source-header">
                        <span class="source-title">{{ source.source_title }}</span>
                        <span class="source-similarity">
                            {{ (source.similarity * 100).toFixed(0) }}% similitud
                        </span>
                    </div>
                    <p class="source-content">{{ truncateText(source.content, 150) }}</p>
                </div>
            </div>
        </div>

        <!-- Processing Time -->
        <div class="panel-footer">
            <span class="processing-time">
                Procesado en {{ verification.processing_time_ms?.toFixed(0) || 0 }}ms
            </span>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import VerificationBadge from './VerificationBadge.vue';

const props = defineProps({
    verification: {
        type: Object,
        default: null
    }
});

defineEmits(['close']);

const metrics = computed(() => props.verification?.metrics || {});

const confidenceClass = computed(() => {
    const level = props.verification?.confidence_level || 'nula';
    return `confidence-${level}`;
});

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
</script>

<style scoped>
.verification-panel {
    background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.08) 0%, 
        rgba(255, 255, 255, 0.03) 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    backdrop-filter: blur(20px);
    padding: 20px;
    color: var(--text-primary, #e5e7eb);
    max-width: 400px;
}

.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary, #e5e7eb);
}

.close-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary, #9ca3af);
    cursor: pointer;
    padding: 4px;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary, #e5e7eb);
}

.confidence-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}

.confidence-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 3px solid;
}

.confidence-circle.confidence-alta {
    background: rgba(16, 185, 129, 0.1);
    border-color: #10B981;
}

.confidence-circle.confidence-media {
    background: rgba(245, 158, 11, 0.1);
    border-color: #F59E0B;
}

.confidence-circle.confidence-baja {
    background: rgba(249, 115, 22, 0.1);
    border-color: #F97316;
}

.confidence-circle.confidence-nula {
    background: rgba(239, 68, 68, 0.1);
    border-color: #EF4444;
}

.confidence-value {
    font-size: 24px;
    font-weight: 700;
}

.confidence-label {
    font-size: 10px;
    text-transform: uppercase;
    opacity: 0.8;
}

.metrics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
}

.metric-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
}

.metric-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.metric-icon.supported {
    background: rgba(16, 185, 129, 0.15);
    color: #10B981;
}

.metric-icon.unsupported {
    background: rgba(239, 68, 68, 0.15);
    color: #EF4444;
}

.metric-icon.sources {
    background: rgba(59, 130, 246, 0.15);
    color: #3B82F6;
}

.metric-icon.similarity {
    background: rgba(139, 92, 246, 0.15);
    color: #8B5CF6;
}

.metric-info {
    display: flex;
    flex-direction: column;
}

.metric-value {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary, #e5e7eb);
}

.metric-label {
    font-size: 11px;
    color: var(--text-secondary, #9ca3af);
}

.warnings-section {
    margin-bottom: 20px;
    padding: 12px;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.2);
    border-radius: 12px;
}

.warning-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    color: #F59E0B;
    font-size: 13px;
    font-weight: 600;
}

.warning-list {
    margin: 0;
    padding-left: 20px;
    color: var(--text-secondary, #9ca3af);
    font-size: 12px;
}

.warning-list li {
    margin-bottom: 4px;
}

.sources-section {
    margin-bottom: 16px;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    color: var(--text-primary, #e5e7eb);
    font-size: 14px;
    font-weight: 600;
}

.sources-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 200px;
    overflow-y: auto;
}

.source-card {
    padding: 12px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
}

.source-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.source-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary, #e5e7eb);
}

.source-similarity {
    font-size: 11px;
    color: #3B82F6;
    background: rgba(59, 130, 246, 0.15);
    padding: 2px 8px;
    border-radius: 10px;
}

.source-content {
    margin: 0;
    font-size: 12px;
    color: var(--text-secondary, #9ca3af);
    line-height: 1.5;
}

.panel-footer {
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    text-align: center;
}

.processing-time {
    font-size: 11px;
    color: var(--text-tertiary, #6b7280);
}

/* Scrollbar for sources list */
.sources-list::-webkit-scrollbar {
    width: 4px;
}

.sources-list::-webkit-scrollbar-track {
    background: transparent;
}

.sources-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
}
</style>
