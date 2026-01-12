<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useKnowledgeContributionStore } from '@/stores/knowledgeContributionStore';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
    query: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    conversationId: {
        type: String,
        default: null
    },
    sourceMaterialId: {
        type: String,
        default: null
    },
    categoryTags: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['contributed', 'cancel']);

const toast = useToast();
const contributionStore = useKnowledgeContributionStore();
const authStore = useAuthStore();

// Estados del componente
const showDialog = ref(false);
const editing = ref(false);
const editedAnswer = ref('');
const selectedTags = ref([]);
const sensitivityWarning = ref(null);
const checkingSensitivity = ref(false);
const submitting = ref(false);
const showPreview = ref(false);

// Categorías disponibles para contribuciones
const availableTags = [
    { id: 'general', name: 'Conocimiento General', icon: 'pi pi-book' },
    { id: 'technical', name: 'Técnico', icon: 'pi pi-cog' },
    { id: 'procedure', name: 'Procedimientos', icon: 'pi pi-list' },
    { id: 'example', name: 'Ejemplos', icon: 'pi pi-code' },
    { id: 'explanation', name: 'Explicaciones', icon: 'pi pi-info-circle' },
    { id: 'troubleshooting', name: 'Solución de Problemas', icon: 'pi pi-exclamation-triangle' }
];

// Inicializar cuando se abre el diálogo
watch(showDialog, (newVal) => {
    if (newVal) {
        editedAnswer.value = props.answer;
        selectedTags.value = [...props.categoryTags];
        sensitivityWarning.value = null;
        showPreview.value = false;
    }
});

// Computed
const isValidLength = computed(() => {
    return editedAnswer.value.length >= 50;
});

const charCount = computed(() => {
    return editedAnswer.value.length;
});

const isSubmitDisabled = computed(() => {
    return !isValidLength.value || 
           selectedTags.value.length === 0 || 
           submitting.value ||
           checkingSensitivity.value;
});

// Métodos
function openDialog() {
    showDialog.value = true;
}

function closeDialog() {
    showDialog.value = false;
    emit('cancel');
}

async function checkSensitivity() {
    if (!editedAnswer.value.trim()) return;
    
    checkingSensitivity.value = true;
    sensitivityWarning.value = null;
    
    try {
        const result = await contributionStore.checkSensitivity(editedAnswer.value);
        
        if (!result.is_clean) {
            sensitivityWarning.value = {
                message: result.warning,
                sanitized: result.sanitized_text
            };
        }
    } catch (error) {
        console.error('Error checking sensitivity:', error);
    } finally {
        checkingSensitivity.value = false;
    }
}

function applySanitization() {
    if (sensitivityWarning.value?.sanitized) {
        editedAnswer.value = sensitivityWarning.value.sanitized;
        sensitivityWarning.value = null;
    }
}

function toggleTag(tagId) {
    const index = selectedTags.value.indexOf(tagId);
    if (index === -1) {
        selectedTags.value.push(tagId);
    } else {
        selectedTags.value.splice(index, 1);
    }
}

async function submitContribution() {
    if (!authStore.isAuthenticated) {
        toast.add({
            severity: 'warn',
            summary: 'Autenticación requerida',
            detail: 'Debes iniciar sesión para contribuir conocimiento',
            life: 5000
        });
        return;
    }
    
    submitting.value = true;
    
    try {
        const contributionData = {
            original_query: props.query,
            generated_answer: editedAnswer.value,
            category_tags: selectedTags.value,
            conversation_context: props.conversationId,
            source_material_id: props.sourceMaterialId
        };
        
        const result = await contributionStore.contributeResponse(contributionData);
        
        toast.add({
            severity: 'success',
            summary: '¡Contribución enviada!',
            detail: 'Tu respuesta será revisada y estará disponible para otros usuarios.',
            life: 5000
        });
        
        emit('contributed', result);
        closeDialog();
        
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error al contribuir',
            detail: error.message || 'No se pudo enviar la contribución',
            life: 5000
        });
    } finally {
        submitting.value = false;
    }
}

function formatAnswerPreview(text) {
    if (!text) return '';
    return text.length > 300 ? text.substring(0, 300) + '...' : text;
}

// Exponer método para abrir el diálogo desde el padre
defineExpose({ openDialog });
</script>

<template>
    <div class="contribution-manager">
        <!-- Botón de contribución -->
        <Button 
            v-if="!showDialog"
            label="Contribuir respuesta" 
            icon="pi pi-share-alt" 
            severity="secondary"
            size="small"
            outlined
            @click="openDialog"
            v-tooltip.top="'Ayuda a otros usuarios compartiendo este conocimiento'"
        />
        
        <!-- Diálogo de contribución -->
        <Dialog 
            v-model:visible="showDialog" 
            header="Contribuir al conocimiento general" 
            :style="{ width: '700px' }"
            modal
            class="contribution-dialog"
            :closable="!submitting"
        >
            <div class="contribution-content">
                <!-- Información del proceso -->
                <div class="process-info mb-4 p-3 surface-50 border-round">
                    <div class="info-row">
                        <i class="pi pi-info-circle text-blue-600 mr-2"></i>
                        <span>Tu respuesta será revisada y, si es aprobada, estará disponible para todos los usuarios del sistema.</span>
                    </div>
                </div>
                
                <!-- Pregunta original -->
                <div class="query-section mb-4">
                    <label class="font-semibold block mb-2">Pregunta original</label>
                    <div class="query-display p-3 surface-100 border-round">
                        {{ query }}
                    </div>
                </div>
                
                <!-- Editor de respuesta -->
                <div class="answer-section mb-4">
                    <div class="flex justify-content-between align-items-center mb-2">
                        <label class="font-semibold">Tu respuesta</label>
                        <span :class="{'text-red-500': !isValidLength, 'text-green-500': isValidLength}">
                            {{ charCount }} caracteres {{ isValidLength ? '(mínimo 50)' : '(mínimo 50 requerido)' }}
                        </span>
                    </div>
                    
                    <Textarea 
                        v-model="editedAnswer" 
                        rows="6" 
                        class="w-full answer-textarea"
                        placeholder="Edita tu respuesta si es necesario..."
                        :disabled="submitting"
                    />
                    
                    <div class="flex justify-content-between mt-2">
                        <Button 
                            label="Verificar datos sensibles" 
                            icon="pi pi-shield" 
                            severity="secondary"
                            size="small"
                            :loading="checkingSensitivity"
                            @click="checkSensitivity"
                        />
                        <Button 
                            label="Vista previa" 
                            icon="pi pi-eye" 
                            severity="secondary"
                            size="small"
                            outlined
                            @click="showPreview = !showPreview"
                        />
                    </div>
                    
                    <!-- Warning de sensibilidad -->
                    <div v-if="sensitivityWarning" class="sensitivity-warning mt-3 p-3 yellow-100 border-round">
                        <div class="flex align-items-start">
                            <i class="pi pi-exclamation-triangle text-yellow-600 mr-2 mt-1"></i>
                            <div class="flex-1">
                                <p class="m-0 font-semibold text-yellow-800">{{ sensitivityWarning.message }}</p>
                                <Button 
                                    label="Aplicar sanitización automática" 
                                    size="small"
                                    severity="warning"
                                    class="mt-2"
                                    @click="applySanitization"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Vista previa -->
                <div v-if="showPreview" class="preview-section mb-4 p-3 surface-50 border-round">
                    <label class="font-semibold block mb-2">Vista previa</label>
                    <div class="preview-content">
                        {{ formatAnswerPreview(editedAnswer) }}
                    </div>
                </div>
                
                <!-- Selector de categorías -->
                <div class="tags-section mb-4">
                    <label class="font-semibold block mb-2">Categorías (selecciona al menos una)</label>
                    <div class="tags-container">
                        <Chip 
                            v-for="tag in availableTags" 
                            :key="tag.id"
                            :label="tag.name"
                            :icon="tag.icon"
                            :class="{ 'selected-tag': selectedTags.includes(tag.id) }"
                            class="tag-chip"
                            @click="toggleTag(tag.id)"
                        />
                    </div>
                </div>
                
                <!-- Advertencia final -->
                <div class="final-warning p-3 red-50 border-round border-red-200">
                    <div class="flex align-items-start">
                        <i class="pi pi-exclamation-triangle text-red-600 mr-2 mt-1"></i>
                        <div>
                            <p class="m-0 font-semibold text-red-800">Antes de contribuir, verifica que:</p>
                            <ul class="m-0 mt-1 pl-4 text-red-700">
                                <li>La información es precisa y útil para otros usuarios</li>
                                <li>No contiene datos personales tuyos ni de terceros</li>
                                <li>No revela información confidencial o sensible</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <template #footer>
                <Button 
                    label="Cancelar" 
                    icon="pi pi-times" 
                    text 
                    @click="closeDialog"
                    :disabled="submitting"
                />
                <Button 
                    label="Contribuir respuesta" 
                    icon="pi pi-check" 
                    :loading="submitting"
                    :disabled="isSubmitDisabled"
                    @click="submitContribution"
                />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.contribution-manager {
    display: inline-block;
}

.contribution-content {
    max-height: 70vh;
    overflow-y: auto;
}

.process-info {
    background: var(--surface-50);
}

.info-row {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
    color: var(--text-color-secondary);
}

.query-display {
    background: var(--surface-100);
    font-style: italic;
    color: var(--text-color);
    line-height: 1.6;
}

.answer-textarea :deep(.p-inputtext) {
    font-family: inherit;
    line-height: 1.6;
}

.sensitivity-warning {
    background: #fef9c3;
    border: 1px solid #eab308;
}

.preview-content {
    background: var(--surface-0);
    padding: 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    line-height: 1.6;
    max-height: 150px;
    overflow-y: auto;
}

.tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.tag-chip {
    cursor: pointer;
    transition: all 0.2s ease;
}

.tag-chip:hover {
    background: var(--surface-100);
}

.tag-chip.selected-tag {
    background: var(--primary-color);
    color: white;
}

.tag-chip.selected-tag :deep(.p-chip-icon) {
    color: white;
}

.final-warning {
    background: #fef2f2;
    border: 1px solid #fecaca;
}

.final-warning ul {
    font-size: 0.85rem;
}

.final-warning li {
    margin-bottom: 0.25rem;
}

@media (max-width: 600px) {
    .contribution-dialog {
        width: 95vw !important;
    }
}
</style>
