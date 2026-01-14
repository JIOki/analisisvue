<template>
    <span 
        :class="['verification-badge', `level-${level}`]"
        :title="tooltipText"
    >
        <svg 
            v-if="level === 'alta'" 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        
        <svg 
            v-else-if="level === 'media'" 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
        >
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        
        <svg 
            v-else-if="level === 'baja'" 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
        >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        
        <svg 
            v-else 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
        >
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        
        <span class="badge-label">{{ label }}</span>
        <span v-if="showScore" class="badge-score">{{ scoreText }}</span>
    </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    level: {
        type: String,
        default: 'nula',
        validator: (value) => ['alta', 'media', 'baja', 'nula'].includes(value)
    },
    score: {
        type: Number,
        default: 0
    },
    showScore: {
        type: Boolean,
        default: false
    }
});

const labelMap = {
    alta: 'Verificado',
    media: 'Parcial',
    baja: 'Dudoso',
    nula: 'Sin respaldo'
};

const label = computed(() => labelMap[props.level] || 'Desconocido');

const scoreText = computed(() => {
    return `${(props.score * 100).toFixed(0)}%`;
});

const tooltipText = computed(() => {
    const texts = {
        alta: 'La respuesta tiene alto respaldo en las fuentes consultadas',
        media: 'La respuesta está parcialmente respaldada por las fuentes',
        baja: 'La respuesta tiene poco respaldo en las fuentes consultadas',
        nula: 'La respuesta no tiene respaldo en las fuentes consultadas'
    };
    return texts[props.level] || 'Verificación no disponible';
});
</script>

<style scoped>
.verification-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    cursor: help;
    transition: all 0.2s ease;
}

.verification-badge.level-alta {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10B981;
}

.verification-badge.level-media {
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: #F59E0B;
}

.verification-badge.level-baja {
    background: rgba(249, 115, 22, 0.15);
    border: 1px solid rgba(249, 115, 22, 0.3);
    color: #F97316;
}

.verification-badge.level-nula {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #EF4444;
}

.badge-label {
    font-weight: 600;
}

.badge-score {
    opacity: 0.8;
    font-size: 11px;
}

.verification-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
