<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { usePrivacyStore } from '@/stores/privacyStore';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
    materialId: {
        type: String,
        required: true
    },
    materialTitle: {
        type: String,
        default: ''
    },
    initialIsPublic: {
        type: Boolean,
        default: null
    },
    category: {
        type: String,
        default: 'MarcoTeorico'
    }
});

const emit = defineEmits(['privacy-changed', 'share-updated']);

const toast = useToast();
const privacyStore = usePrivacyStore();
const authStore = useAuthStore();

// Estados del componente
const activeTab = ref('privacy');
const loading = ref(false);
const showShareDialog = ref(false);
const showDisclaimerDialog = ref(false);
const showHistoryDialog = ref(false);

// Configuración de privacidad
const isPublicForAI = ref(props.initialIsPublic);
const privacyReason = ref('');

// Compartición
const selectedUsers = ref([]);
const searchQuery = ref('');
const searchedUsers = ref([]);
const sharing = ref(false);
const disclaimerAccepted = ref(false);

// Datos
const sharedUsersList = ref([]);
const consentHistory = ref([]);

// Categoría del material
const isTheoreticalCategory = computed(() => {
    return props.category === 'MarcoTeorico';
});

// Cargar configuración inicial
onMounted(async () => {
    if (props.materialId) {
        await loadPrivacyConfig();
        await loadSharedUsers();
    }
});

// Observar cambios en materialId
watch(() => props.materialId, async (newId) => {
    if (newId) {
        await loadPrivacyConfig();
        await loadSharedUsers();
    }
});

async function loadPrivacyConfig() {
    try {
        const config = await privacyStore.fetchMaterialPrivacy(props.materialId);
        if (config) {
            isPublicForAI.value = config.is_public_for_ai;
        }
    } catch (error) {
        console.error('Error al cargar configuración de privacidad:', error);
    }
}

async function loadSharedUsers() {
    try {
        sharedUsersList.value = await privacyStore.fetchSharedUsers(props.materialId);
    } catch (error) {
        console.error('Error al cargar usuarios compartidos:', error);
    }
}

// Toggle de privacidad
async function togglePrivacy() {
    if (loading.value) return;
    
    loading.value = true;
    
    try {
        await privacyStore.updateAIPublicConsent(
            props.materialId, 
            isPublicForAI.value,
            privacyReason.value || 'Cambio manual de privacidad'
        );
        
        toast.add({
            severity: 'success',
            summary: 'Configuración actualizada',
            detail: isPublicForAI.value 
                ? 'El material ahora es público para que la IA lo use como conocimiento' 
                : 'El material ahora es privado y solo tú podrás usarlo',
            life: 3000
        });
        
        emit('privacy-changed', { 
            materialId: props.materialId, 
            isPublic: isPublicForAI.value 
        });
    } catch (error) {
        // Revertir cambio en caso de error
        isPublicForAI.value = !isPublicForAI.value;
        
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'No se pudo actualizar la configuración',
            life: 5000
        });
    } finally {
        loading.value = false;
    }
}

// Búsqueda de usuarios
async function searchUsers() {
    if (!searchQuery.value || searchQuery.value.trim().length < 2) {
        searchedUsers.value = [];
        return;
    }
    
    try {
        searchedUsers.value = await privacyStore.searchUsersToShare(searchQuery.value);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error en búsqueda',
            detail: 'No se pudieron buscar usuarios',
            life: 3000
        });
    }
}

// Abrir diálogo de compartición
function openShareDialog() {
    selectedUsers.value = [];
    searchQuery.value = '';
    searchedUsers.value = [];
    disclaimerAccepted.value = false;
    showShareDialog.value = true;
}

// Verificar si un usuario ya está compartido
function isUserShared(userId) {
    return sharedUsersList.value.some(u => u.id === userId);
}

// Obtener usuarios no compartidos para mostrar en búsqueda
function getUnsharedUsers() {
    return searchedUsers.value.filter(u => !isUserShared(u.id));
}

// Compartir material
async function confirmShare() {
    if (selectedUsers.value.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Sin selección',
            detail: 'Por favor selecciona al menos un usuario',
            life: 3000
        });
        return;
    }
    
    // Si no ha aceptado el disclaimer, mostrar diálogo de confirmación
    if (!disclaimerAccepted.value) {
        if (!privacyStore.legalDisclaimer) {
            try {
                await privacyStore.fetchLegalDisclaimer();
            } catch (error) {
                console.error('Error al cargar disclaimer:', error);
            }
        }
        showDisclaimerDialog.value = true;
        return;
    }
    
    await performShare();
}

async function performShare() {
    sharing.value = true;
    
    try {
        await privacyStore.shareMaterialWithUsers(
            props.materialId,
            selectedUsers.value,
            true
        );
        
        toast.add({
            severity: 'success',
            summary: 'Material compartido',
            detail: `El material ha sido compartido con ${selectedUsers.value.length} usuario(s)`,
            life: 3000
        });
        
        showShareDialog.value = false;
        showDisclaimerDialog.value = false;
        await loadSharedUsers();
        
        emit('share-updated', { 
            materialId: props.materialId, 
            sharedWith: selectedUsers.value 
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error al compartir',
            detail: error.message || 'No se pudo compartir el material',
            life: 5000
        });
    } finally {
        sharing.value = false;
    }
}

// Revocar acceso
async function revokeAccess(userId) {
    try {
        await privacyStore.revokeUserAccess(props.materialId, userId);
        
        toast.add({
            severity: 'success',
            summary: 'Acceso revocado',
            detail: 'El usuario ya no tiene acceso al material',
            life: 3000
        });
        
        await loadSharedUsers();
        emit('share-updated', { materialId: props.materialId });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo revoke el acceso',
            life: 3000
        });
    }
}

// Ver historial
async function viewHistory() {
    try {
        consentHistory.value = await privacyStore.fetchConsentHistory(props.materialId);
        showHistoryDialog.value = true;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar el historial',
            life: 3000
        });
    }
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
</script>

<template>
    <div class="privacy-manager">
        <!-- Tabs de navegación -->
        <TabView v-model:activeIndex="activeTab" class="privacy-tabs">
            <!-- Tab de Privacidad AI -->
            <TabPanel>
                <template #header>
                    <div class="flex align-items-center gap-2">
                        <i class="pi pi-shield"></i>
                        <span>Privacidad IA</span>
                    </div>
                </template>
                
                <div class="privacy-content">
                    <div class="config-header">
                        <h4>Configuración de privacidad para IA</h4>
                        <p class="text-600">
                            Controla si tu material puede ser usado por la inteligencia artificial 
                            para responder preguntas de otros usuarios.
                        </p>
                    </div>
                    
                    <!-- Indicador de categoría -->
                    <div class="category-badge mb-4">
                        <Tag :severity="isTheoreticalCategory ? 'info' : 'warning'" :value="isTheoreticalCategory ? 'Marco Teórico (público por defecto)' : 'Caso de Uso (privado por defecto')" />
                    </div>
                    
                    <!-- Toggle de privacidad -->
                    <div class="privacy-toggle-container">
                        <div class="toggle-info">
                            <div class="toggle-label">
                                <i :class="isPublicForAI ? 'pi pi-globe' : 'pi pi-lock'"></i>
                                <span>{{ isPublicForAI ? 'Público para IA' : 'Privado para IA' }}</span>
                            </div>
                            <p class="toggle-description">
                                {{ isPublicForAI 
                                    ? 'El material será indexado y usado por la IA como conocimiento general. Otros usuarios se beneficiarán de este contenido.'
                                    : 'El material solo será visible y usable por ti. No contribuirá al conocimiento de la IA.'
                                }}
                            </p>
                        </div>
                        
                        <div class="toggle-action">
                            <InputSwitch 
                                v-model="isPublicForAI" 
                                @change="togglePrivacy"
                                :disabled="loading"
                            />
                            <span class="ml-2 font-semibold">
                                {{ isPublicForAI ? 'Activado' : 'Desactivado' }}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Loading overlay -->
                    <div v-if="loading" class="loading-overlay">
                        <ProgressSpinner style="width: 40px; height: 40px" />
                        <span>Actualizando configuración...</span>
                    </div>
                    
                    <!-- Información adicional -->
                    <div class="privacy-info mt-4 p-3 surface-100 border-round">
                        <div class="info-item">
                            <i class="pi pi-info-circle mr-2"></i>
                            <span>Esta configuración no afecta tu acceso personal al material.</span>
                        </div>
                        <div class="info-item mt-2">
                            <i class="pi pi-history mr-2"></i>
                            <Button label="Ver historial de cambios" text size="small" @click="viewHistory" />
                        </div>
                    </div>
                </div>
            </TabPanel>
            
            <!-- Tab de Compartición -->
            <TabPanel>
                <template #header>
                    <div class="flex align-items-center gap-2">
                        <i class="pi pi-users"></i>
                        <span>Compartición</span>
                        <Badge v-if="sharedUsersList.length" :value="sharedUsersList.length" severity="info" />
                    </div>
                </template>
                
                <div class="share-content">
                    <div class="config-header">
                        <h4>Compartir con usuarios específicos</h4>
                        <p class="text-600">
                            Concede acceso directo a tu material a usuarios específicos de la plataforma.
                        </p>
                    </div>
                    
                    <!-- Lista de usuarios con acceso -->
                    <div v-if="sharedUsersList.length > 0" class="shared-users-list">
                        <h5>Usuarios con acceso ({{ sharedUsersList.length }})</h5>
                        <Listbox 
                            :options="sharedUsersList" 
                            optionLabel="name" 
                            class="w-full"
                        >
                            <template #option="slotProps">
                                <div class="shared-user-item">
                                    <div class="user-info">
                                        <Avatar :label="slotProps.option.name?.charAt(0) || 'U'" shape="circle" class="mr-2" />
                                        <div>
                                            <div class="font-semibold">{{ slotProps.option.name }}</div>
                                            <div class="text-sm text-500">{{ slotProps.option.email }}</div>
                                        </div>
                                    </div>
                                    <Button 
                                        icon="pi pi-times" 
                                        severity="danger" 
                                        text 
                                        rounded 
                                        @click="revokeAccess(slotProps.option.id)"
                                        v-tooltip.top="'Revocar acceso'"
                                    />
                                </div>
                            </template>
                        </Listbox>
                    </div>
                    
                    <!-- Mensaje si no hay usuarios -->
                    <div v-else class="no-shared-users">
                        <i class="pi pi-users text-4xl text-300"></i>
                        <p>No has compartido este material con nadie</p>
                    </div>
                    
                    <!-- Botón para compartir -->
                    <Button 
                        label="Compartir con usuarios" 
                        icon="pi pi-share-alt" 
                        class="mt-4 w-full"
                        @click="openShareDialog"
                    />
                </div>
            </TabPanel>
            
            <!-- Tab de Información -->
            <TabPanel>
                <template #header>
                    <div class="flex align-items-center gap-2">
                        <i class="pi pi-info-circle"></i>
                        <span>Información</span>
                    </div>
                </template>
                
                <div class="info-content">
                    <h4>Acerca de la privacidad</h4>
                    
                    <div class="info-section">
                        <h5><i class="pi pi-brain mr-2"></i>Uso por la IA</h5>
                        <p>
                            Cuando un material está marcado como "Público para IA", la inteligencia artificial 
                            puede usar su contenido para generar respuestas más precisas y contextualizadas 
                            para todos los usuarios del sistema. El material se indexa en la base de conocimiento 
                            vectorial compartida.
                        </p>
                    </div>
                    
                    <div class="info-section">
                        <h5><i class="pi pi-lock mr-2"></i>Compartición directa</h5>
                        <p>
                            La compartición directa te permite otorgar acceso a usuarios específicos. 
                            El material no se hace público para la IA, solo los usuarios seleccionados 
                            podrán ver y usar el material en sus consultas.
                        </p>
                    </div>
                    
                    <div class="info-section">
                        <h5><i class="pi pi-exclamation-triangle mr-2"></i>Responsabilidad</h5>
                        <p>
                            Al compartir material, aceptas que los destinatarios tendrán acceso al contenido 
                            completo. Eres responsable del contenido que compartes y de garantizar que 
                            tienes los derechos necesarios para ello.
                        </p>
                    </div>
                </div>
            </TabPanel>
        </TabView>
        
        <!-- Diálogo de compartición -->
        <Dialog 
            v-model:visible="showShareDialog" 
            header="Compartir material" 
            :style="{ width: '600px' }"
            modal
            class="share-dialog"
        >
            <div class="share-dialog-content">
                <!-- Material a compartir -->
                <div class="shared-material-info mb-4 p-3 surface-100 border-round">
                    <span class="font-semibold">{{ materialTitle || 'Material #' + materialId }}</span>
                </div>
                
                <!-- Búsqueda de usuarios -->
                <div class="user-search mb-4">
                    <span class="p-input-icon-left w-full">
                        <i class="pi pi-search" />
                        <InputText 
                            v-model="searchQuery" 
                            @input="searchUsers"
                            placeholder="Buscar por nombre o email..." 
                            class="w-full"
                        />
                    </span>
                </div>
                
                <!-- Resultados de búsqueda -->
                <div v-if="searchedUsers.length > 0" class="search-results mb-4">
                    <h6>Resultados de búsqueda</h6>
                    <div class="user-selection-list">
                        <div 
                            v-for="user in getUnsharedUsers()" 
                            :key="user.id"
                            class="user-select-item"
                        >
                            <div class="user-details">
                                <Avatar :label="user.name?.charAt(0) || 'U'" shape="circle" class="mr-2" />
                                <div>
                                    <div class="font-semibold">{{ user.name }}</div>
                                    <div class="text-sm text-500">{{ user.email }}</div>
                                </div>
                            </div>
                            <Checkbox 
                                v-model="selectedUsers" 
                                :value="user.id" 
                                :binary="false"
                            />
                        </div>
                        <div v-if="getUnsharedUsers().length === 0" class="text-center text-500 p-3">
                            Todos los usuarios encontrados ya tienen acceso
                        </div>
                    </div>
                </div>
                
                <!-- Usuarios seleccionados -->
                <div v-if="selectedUsers.length > 0" class="selected-summary p-3 surface-50 border-round">
                    <i class="pi pi-check-circle text-green-500 mr-2"></i>
                    <span>{{ selectedUsers.length }} usuario(s) seleccionado(s)</span>
                </div>
            </div>
            
            <template #footer>
                <Button 
                    label="Cancelar" 
                    icon="pi pi-times" 
                    text 
                    @click="showShareDialog = false" 
                />
                <Button 
                    label="Compartir" 
                    icon="pi pi-check" 
                    :loading="sharing"
                    :disabled="selectedUsers.length === 0"
                    @click="confirmShare" 
                />
            </template>
        </Dialog>
        
        <!-- Diálogo de disclaimer legal -->
        <Dialog 
            v-model:visible="showDisclaimerDialog" 
            header="Aviso Legal Importante" 
            :style="{ width: '600px' }"
            modal
            class="disclaimer-dialog"
        >
            <div class="disclaimer-content">
                <div class="disclaimer-icon text-center mb-4">
                    <i class="pi pi-exclamation-triangle text-5xl text-yellow-500"></i>
                </div>
                
                <p class="disclaimer-text">
                    Al compartir este material, aceptas lo siguiente:
                </p>
                
                <ul class="disclaimer-list">
                    <li>Eres propietario del contenido o tienes los derechos para compartirlo.</li>
                    <li>Los usuarios con quienes compartes tendrán acceso completo al material.</li>
                    <li>Asumes toda responsabilidad sobre el contenido compartido.</li>
                    <li>El sistema no se hace responsable del uso que otros usuarios den al material.</li>
                </ul>
                
                <div class="disclaimer-acceptance mt-4">
                    <Checkbox 
                        v-model="disclaimerAccepted" 
                        :binary="true" 
                        inputId="acceptDisclaimer"
                    />
                    <label for="acceptDisclaimer" class="ml-2 cursor-pointer">
                        He leído y acepto los términos de responsabilidad
                    </label>
                </div>
            </div>
            
            <template #footer>
                <Button 
                    label="Cancelar" 
                    icon="pi pi-times" 
                    text 
                    @click="showDisclaimerDialog = false" 
                />
                <Button 
                    label="Confirmar compartición" 
                    icon="pi pi-check" 
                    :loading="sharing"
                    :disabled="!disclaimerAccepted"
                    @click="performShare" 
                />
            </template>
        </Dialog>
        
        <!-- Diálogo de historial -->
        <Dialog 
            v-model:visible="showHistoryDialog" 
            header="Historial de cambios de privacidad" 
            :style="{ width: '600px' }"
            modal
        >
            <div class="history-content">
                <Timeline v-if="consentHistory.length > 0" class="privacy-timeline">
                    <template #marker="slotProps">
                        <span class="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1"
                            :class="slotProps.item.is_public_for_ai ? 'bg-green-500' : 'bg-red-500'">
                            <i :class="slotProps.item.is_public_for_ai ? 'pi pi-globe' : 'pi pi-lock'"></i>
                        </span>
                    </template>
                    <template #content="slotProps">
                        <div class="history-entry">
                            <div class="entry-header">
                                <Tag 
                                    :severity="slotProps.item.is_public_for_ai ? 'success' : 'danger'" 
                                    :value="slotProps.item.is_public_for_ai ? 'Público' : 'Privado'"
                                />
                                <span class="entry-date ml-2">{{ formatDate(slotProps.item.changed_at) }}</span>
                            </div>
                            <div class="entry-details mt-2">
                                <p v-if="slotProps.item.changed_by">
                                    <strong>Cambiado por:</strong> {{ slotProps.item.changed_by }}
                                </p>
                                <p v-if="slotProps.item.reason">
                                    <strong>Razón:</strong> {{ slotProps.item.reason }}
                                </p>
                            </div>
                        </div>
                    </template>
                </Timeline>
                <div v-else class="no-history text-center p-4">
                    <i class="pi pi-history text-4xl text-300"></i>
                    <p class="mt-2">No hay registros de cambios</p>
                </div>
            </div>
            
            <template #footer>
                <Button 
                    label="Cerrar" 
                    icon="pi pi-times" 
                    @click="showHistoryDialog = false" 
                />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.privacy-manager {
    width: 100%;
}

.privacy-tabs :deep(.p-tabview-panels) {
    padding: 1.5rem;
}

.config-header {
    margin-bottom: 1.5rem;
}

.config-header h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
}

.config-header p {
    margin: 0;
    color: var(--text-color-secondary);
}

.privacy-toggle-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: var(--surface-0);
    border: 1px solid var(--surface-200);
    border-radius: 8px;
}

.toggle-info {
    flex: 1;
}

.toggle-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.toggle-label i {
    font-size: 1.3rem;
}

.toggle-description {
    color: var(--text-color-secondary);
    font-size: 0.9rem;
    margin: 0;
    padding-right: 1rem;
}

.toggle-action {
    display: flex;
    align-items: center;
}

.loading-overlay {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
    padding: 1rem;
    background: var(--surface-50);
    border-radius: 8px;
}

.privacy-info .info-item {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
    color: var(--text-color-secondary);
}

.shared-users-list h5 {
    margin-bottom: 1rem;
}

.shared-user-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.no-shared-users {
    text-align: center;
    padding: 2rem;
    color: var(--text-color-secondary);
}

.no-shared-users i {
    margin-bottom: 1rem;
}

.info-section {
    margin-bottom: 1.5rem;
}

.info-section h5 {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
    color: var(--text-color);
}

.info-section p {
    margin: 0;
    color: var(--text-color-secondary);
    line-height: 1.6;
}

/* Share Dialog */
.share-dialog-content .shared-material-info {
    background: var(--surface-100);
}

.user-selection-list {
    max-height: 250px;
    overflow-y: auto;
}

.user-select-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border-bottom: 1px solid var(--surface-200);
}

.user-select-item:last-child {
    border-bottom: none;
}

.user-details {
    display: flex;
    align-items: center;
}

.selected-summary {
    background: var(--surface-50);
    display: flex;
    align-items: center;
}

/* Disclaimer Dialog */
.disclaimer-icon {
    padding-top: 1rem;
}

.disclaimer-text {
    font-weight: 600;
    margin-bottom: 1rem;
}

.disclaimer-list {
    padding-left: 1.5rem;
    line-height: 1.8;
}

.disclaimer-acceptance {
    display: flex;
    align-items: center;
    padding: 1rem;
    background: var(--surface-50);
    border-radius: 8px;
}

/* History Timeline */
.history-entry {
    padding: 0.5rem;
}

.entry-header {
    display: flex;
    align-items: center;
}

.entry-date {
    font-size: 0.85rem;
    color: var(--text-color-secondary);
}

.entry-details p {
    margin: 0.25rem 0;
    font-size: 0.9rem;
}

.no-history {
    color: var(--text-color-secondary);
}

@media (max-width: 768px) {
    .privacy-toggle-container {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
    
    .toggle-action {
        width: 100%;
        justify-content: flex-end;
    }
}
</style>
