<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { usePrivacyStore } from '@/stores/privacyStore';
import { useAuthStore } from '@/stores/auth';

const toast = useToast();
const router = useRouter();
const privacyStore = usePrivacyStore();
const authStore = useAuthStore();

// Estados
const loading = ref(true);
const activeSection = ref('overview');

// Cards de estadísticas
const stats = computed(() => ({
    totalMaterials: privacyStore.totalPublicMaterials + privacyStore.totalPrivateMaterials,
    publicMaterials: privacyStore.totalPublicMaterials,
    privateMaterials: privacyStore.totalPrivateMaterials,
    sharedWithMe: privacyStore.totalSharedWithMe,
    sharedByMe: privacyStore.totalSharedByMe
}));

// Cargar datos al montar
onMounted(async () => {
    await loadDashboardData();
});

async function loadDashboardData() {
    loading.value = true;
    
    try {
        await Promise.all([
            privacyStore.fetchPrivacyDashboard(),
            privacyStore.fetchSharedWithMe(),
            privacyStore.fetchSharedByMe()
        ]);
    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar la información de privacidad',
            life: 5000
        });
    } finally {
        loading.value = false;
    }
}

function navigateTo(section) {
    activeSection.value = section;
}

function getCategoryLabel(category) {
    const labels = {
        'MarcoTeorico': 'Marco Teórico',
        'CasoUso': 'Caso de Uso',
        'ChatUpload': 'Carga de Chat',
        'AIResponse': 'Respuesta IA'
    };
    return labels[category] || category;
}

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
    <div class="privacy-dashboard">
        <!-- Header -->
        <div class="dashboard-header">
            <div class="header-content">
                <h1><i class="pi pi-shield mr-2"></i>Centro de Privacidad</h1>
                <p class="text-600">Gestiona la visibilidad de tus materiales y controla quién puede acceder a tu contenido</p>
            </div>
        </div>
        
        <!-- Loading -->
        <div v-if="loading" class="loading-container">
            <ProgressSpinner />
            <p>Cargando información de privacidad...</p>
        </div>
        
        <div v-else class="dashboard-content">
            <!-- Barra de navegación rápida -->
            <div class="quick-nav mb-4">
                <Button 
                    label="Resumen" 
                    icon="pi pi-chart-bar" 
                    :severity="activeSection === 'overview' ? 'primary' : 'secondary'"
                    class="mr-2"
                    @click="navigateTo('overview')"
                />
                <Button 
                    label="Compartidos conmigo" 
                    icon="pi pi-download" 
                    :severity="activeSection === 'received' ? 'primary' : 'secondary'"
                    class="mr-2"
                    @click="navigateTo('received')"
                />
                <Button 
                    label="Compartidos por mí" 
                    icon="pi pi-upload" 
                    :severity="activeSection === 'sent' ? 'primary' : 'secondary'"
                    class="mr-2"
                    @click="navigateTo('sent')"
                />
                <Button 
                    label="Biblioteca pública" 
                    icon="pi pi-globe" 
                    :severity="activeSection === 'public' ? 'primary' : 'secondary'"
                    @click="navigateTo('public')"
                />
            </div>
            
            <!-- Sección de Resumen -->
            <div v-if="activeSection === 'overview'" class="overview-section">
                <!-- Tarjetas de estadísticas -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon bg-blue-100">
                            <i class="pi pi-book text-blue-600"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">{{ stats.totalMaterials }}</span>
                            <span class="stat-label">Total de materiales</span>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon bg-green-100">
                            <i class="pi pi-globe text-green-600"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">{{ stats.publicMaterials }}</span>
                            <span class="stat-label">Públicos para IA</span>
                        </div>
                        <Tag severity="success" value="Contribuyendo" class="stat-badge" />
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon bg-orange-100">
                            <i class="pi pi-lock text-orange-600"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">{{ stats.privateMaterials }}</span>
                            <span class="stat-label">Privados</span>
                        </div>
                        <Tag severity="warning" value="Solo tú" class="stat-badge" />
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon bg-purple-100">
                            <i class="pi pi-download text-purple-600"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">{{ stats.sharedWithMe }}</span>
                            <span class="stat-label">Recibidos</span>
                        </div>
                        <Tag severity="info" value="Compartidos" class="stat-badge" />
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon bg-cyan-100">
                            <i class="pi pi-share-alt text-cyan-600"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">{{ stats.sharedByMe }}</span>
                            <span class="stat-label">Compartidos</span>
                        </div>
                    </div>
                </div>
                
                <!-- Información del sistema -->
                <div class="info-cards mt-4">
                    <div class="info-card">
                        <div class="info-header">
                            <i class="pi pi-info-circle text-blue-600 mr-2"></i>
                            <h4>¿Cómo funciona la privacidad?</h4>
                        </div>
                        <div class="info-body">
                            <p>
                                Tus materiales están protegidos por dos niveles de privacidad:
                            </p>
                            <ul>
                                <li>
                                    <strong>Público para IA:</strong> Tu material se indexa en la base de 
                                    conocimiento vectorial y la IA lo usa para generar respuestas más 
                                    precisas para todos los usuarios. Los casos teóricos son públicos por defecto.
                                </li>
                                <li>
                                    <strong>Compartición directa:</strong> Concedes acceso específico a 
                                    usuarios seleccionados. El material no se hace público para la IA, 
                                    solo esos usuarios pueden verlo.
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <div class="info-header">
                            <i class="pi pi-exclamation-triangle text-yellow-600 mr-2"></i>
                            <h4>Responsabilidad legal</h4>
                        </div>
                        <div class="info-body">
                            <p>
                                Al compartir materiales con otros usuarios, aceptas que eres responsable 
                                del contenido compartido. El sistema actúa únicamente como intermediario 
                                y no se hace responsable del uso que otros usuarios den al contenido.
                            </p>
                            <p class="mt-2">
                                <strong>Recomendación:</strong> Solo comparte contenido cuyos derechos 
                                tengas o que quieras compartir voluntariamente.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Sección de Compartidos conmigo -->
            <div v-if="activeSection === 'received'" class="received-section">
                <h3><i class="pi pi-download mr-2"></i>Materiales compartidos contigo</h3>
                
                <div v-if="privacyStore.sharedWithMe.length > 0" class="shared-list">
                    <Card v-for="material in privacyStore.sharedWithMe" :key="material.id" class="shared-card mb-3">
                        <template #title>
                            <div class="flex justify-content-between align-items-center">
                                <span>{{ material.title || 'Material #' + material.id }}</span>
                                <Tag severity="info" value="Compartido" />
                            </div>
                        </template>
                        <template #subtitle>
                            Compartido por: {{ material.owner_name || 'Usuario desconocido' }}
                        </template>
                        <template #content>
                            <p class="shared-date">
                                <i class="pi pi-calendar mr-1"></i>
                                {{ formatDate(material.shared_at) }}
                            </p>
                            <div v-if="material.category" class="mt-2">
                                <Tag :severity="material.category === 'MarcoTeorico' ? 'info' : 'warning'" 
                                     :value="getCategoryLabel(material.category)" />
                            </div>
                        </template>
                        <template #footer>
                            <Button label="Ver material" icon="pi pi-eye" size="small" />
                        </template>
                    </Card>
                </div>
                
                <div v-else class="empty-state">
                    <i class="pi pi-inbox text-5xl text-300"></i>
                    <p>No tienes materiales compartidos contigo</p>
                    <small class="text-500">Cuando otros usuarios compartan materiales contigo, aparecerán aquí.</small>
                </div>
            </div>
            
            <!-- Sección de Compartidos por mí -->
            <div v-if="activeSection === 'sent'" class="sent-section">
                <h3><i class="pi pi-upload mr-2"></i>Materiales compartidos por ti</h3>
                
                <div v-if="privacyStore.sharedByMe.length > 0" class="shared-list">
                    <Card v-for="material in privacyStore.sharedByMe" :key="material.id" class="shared-card mb-3">
                        <template #title>
                            <div class="flex justify-content-between align-items-center">
                                <span>{{ material.title || 'Material #' + material.id }}</span>
                                <Tag severity="success" value="Compartido" />
                            </div>
                        </template>
                        <template #subtitle>
                            {{ material.shared_count || 0 }} usuario(s) con acceso
                        </template>
                        <template #content>
                            <p class="shared-date">
                                <i class="pi pi-calendar mr-1"></i>
                                Compartido desde: {{ formatDate(material.created_at) }}
                            </p>
                            <div v-if="material.shared_with_users && material.shared_with_users.length > 0" class="shared-users-preview mt-2">
                                <span class="text-sm text-500">Acceso concedido a:</span>
                                <div class="user-avatars mt-1">
                                    <Avatar 
                                        v-for="user in material.shared_with_users.slice(0, 3)" 
                                        :key="user.id"
                                        :label="user.name?.charAt(0) || 'U'" 
                                        shape="circle" 
                                        class="user-avatar"
                                        v-tooltip="user.name"
                                    />
                                    <span v-if="material.shared_with_users.length > 3" class="more-users ml-2">
                                        +{{ material.shared_with_users.length - 3 }}
                                    </span>
                                </div>
                            </div>
                        </template>
                        <template #footer>
                            <Button label="Gestionar" icon="pi pi-cog" size="small" severity="secondary" />
                        </template>
                    </Card>
                </div>
                
                <div v-else class="empty-state">
                    <i class="pi pi-share-alt text-5xl text-300"></i>
                    <p>No has compartido materiales</p>
                    <small class="text-500">Puedes compartir tus materiales con usuarios específicos desde la gestión de cada material.</small>
                </div>
            </div>
            
            <!-- Sección de Biblioteca pública -->
            <div v-if="activeSection === 'public'" class="public-section">
                <h3><i class="pi pi-globe mr-2"></i>Biblioteca de conocimiento público</h3>
                
                <p class="text-600 mb-4">
                    Estos son los materiales que los usuarios han marcado como públicos para que la IA los use 
                    como conocimiento general. Todos los usuarios del sistema se benefician de este contenido.
                </p>
                
                <div v-if="privacyStore.publicMaterials.length > 0" class="public-list">
                    <DataTable :value="privacyStore.publicMaterials" :paginator="true" :rows="10" class="public-table">
                        <Column field="title" header="Título" sortable />
                        <Column field="owner_name" header="Propietario" sortable />
                        <Column field="category" header="Tipo">
                            <template #body="slotProps">
                                <Tag :severity="slotProps.data.category === 'MarcoTeorico' ? 'info' : 'warning'" 
                                     :value="getCategoryLabel(slotProps.data.category)" />
                            </template>
                        </Column>
                        <Column field="created_at" header="Agregado">
                            <template #body="slotProps">
                                {{ formatDate(slotProps.data.created_at) }}
                            </template>
                        </Column>
                    </DataTable>
                </div>
                
                <div v-else class="empty-state">
                    <i class="pi pi-book text-5xl text-300"></i>
                    <p>No hay materiales públicos aún</p>
                    <small class="text-500">Sé el primero en contribuir al conocimiento público.</small>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.privacy-dashboard {
    padding: 1.5rem;
}

.dashboard-header {
    margin-bottom: 2rem;
}

.dashboard-header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 1.75rem;
}

.dashboard-header p {
    margin: 0;
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    gap: 1rem;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border: 1px solid var(--surface-100);
    position: relative;
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.stat-icon i {
    font-size: 1.5rem;
}

.stat-info {
    display: flex;
    flex-direction: column;
}

.stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1;
}

.stat-label {
    font-size: 0.85rem;
    color: var(--text-color-secondary);
    margin-top: 0.25rem;
}

.stat-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
}

.info-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
}

.info-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border: 1px solid var(--surface-100);
}

.info-header {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
}

.info-header h4 {
    margin: 0;
}

.info-body {
    color: var(--text-color-secondary);
    font-size: 0.9rem;
    line-height: 1.6;
}

.info-body ul {
    padding-left: 1.5rem;
    margin-top: 0.5rem;
}

.info-body li {
    margin-bottom: 0.5rem;
}

/* Section specific styles */
h3 {
    margin: 0 0 1.5rem 0;
    display: flex;
    align-items: center;
}

.shared-list {
    display: grid;
    gap: 1rem;
}

.shared-card :deep(.p-card-body) {
    padding: 1.5rem;
}

.shared-date {
    color: var(--text-color-secondary);
    font-size: 0.9rem;
    margin: 0;
}

.user-avatars {
    display: flex;
    align-items: center;
}

.user-avatar {
    margin-right: -0.5rem;
    border: 2px solid white;
}

.more-users {
    font-size: 0.85rem;
    color: var(--text-color-secondary);
}

.public-section .public-table {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
}

.empty-state {
    text-align: center;
    padding: 3rem;
    background: var(--surface-50);
    border-radius: 12px;
    color: var(--text-color-secondary);
}

.empty-state i {
    margin-bottom: 1rem;
}

.empty-state p {
    margin: 0.5rem 0;
    font-size: 1.1rem;
}

@media (max-width: 768px) {
    .quick-nav {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    
    .quick-nav .p-button {
        flex: 1;
        min-width: 140px;
    }
    
    .info-cards {
        grid-template-columns: 1fr;
    }
    
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>
