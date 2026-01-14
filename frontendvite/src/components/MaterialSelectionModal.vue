<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="close">
      <div class="modal-content glass-modal material-modal">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-icon glass-icon-primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <div class="header-text">
            <h3>Seleccionar Materiales</h3>
            <p>Elige los documentos que quieres usar en esta conversación</p>
          </div>
          <button @click="close" class="close-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Tabs de categorías -->
        <div class="category-tabs">
          <button 
            v-for="cat in categories" 
            :key="cat.value"
            :class="['category-tab', { active: activeCategory === cat.value }]"
            @click="activeCategory = cat.value"
          >
            <span class="tab-icon">{{ cat.icon }}</span>
            <span class="tab-label">{{ cat.label }}</span>
            <span v-if="getCountByCategory(cat.value)" class="tab-count">{{ getCountByCategory(cat.value) }}</span>
          </button>
        </div>

        <!-- Buscador -->
        <div class="search-container">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Buscar materiales..."
            class="search-input"
          />
        </div>

        <!-- Lista de materiales -->
        <div class="materials-list" v-if="!loading">
          <div v-if="filteredMaterials.length === 0" class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>No se encontraron materiales</p>
            <span v-if="searchQuery">Intenta con otra búsqueda</span>
            <span v-else>Sube documentos desde las secciones de Marco Teórico o Casos de Uso</span>
          </div>

          <div 
            v-for="material in filteredMaterials" 
            :key="material.id"
            :class="['material-item', { 
              selected: isSelected(material.id),
              linked: isLinked(material.id)
            }]"
          >
            <div class="material-checkbox" @click="toggleMaterial(material)">
              <div v-if="isSelected(material.id)" class="checkbox-checked">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div v-else-if="isLinked(material.id)" class="checkbox-linked">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
              <div v-else class="checkbox-unchecked"></div>
            </div>

            <div class="material-info" @click="toggleMaterial(material)">
              <div class="material-header">
                <h4 class="material-title">{{ material.title }}</h4>
                <span :class="['category-badge', material.category]">
                  {{ getCategoryLabel(material.category) }}
                </span>
              </div>
              <div class="material-meta">
                <span v-if="material.author" class="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  {{ material.author }}
                </span>
                <span v-if="material.chunk_count" class="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  {{ material.chunk_count }} chunks
                </span>
                <span class="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {{ formatDate(material.created_at) }}
                </span>
              </div>
            </div>

            <div class="material-actions">
              <button 
                v-if="isLinked(material.id)"
                @click="unlinkMaterial(material.id)"
                class="action-btn unlink"
                title="Desvincular"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l1.72-1.71"/>
                  <line x1="2" y1="2" x2="22" y2="22"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-else class="loading-state">
          <div class="loading-spinner"></div>
          <p>Cargando materiales...</p>
        </div>

        <!-- Footer con selección -->
        <div class="modal-footer">
          <div class="selection-info">
            <span class="selected-count">{{ selectedMaterials.length }} seleccionado(s)</span>
            <span v-if="linkedMaterials.length > 0" class="linked-info">
              · {{ linkedMaterials.length }} ya vinculados
            </span>
          </div>
          <div class="footer-actions">
            <button @click="close" class="glass-button-secondary">
              Cancelar
            </button>
            <button 
              @click="linkSelectedMaterials"
              :disabled="selectedMaterials.length === 0 || linking"
              class="glass-button-primary"
            >
              <span v-if="linking">Vinculando...</span>
              <span v-else>Vincular {{ selectedMaterials.length }} material(es)</span>
            </button>
          </div>
        </div>

        <!-- Panel de materiales vinculados (opcional) -->
        <div v-if="linkedMaterials.length > 0" class="linked-panel">
          <div class="linked-header">
            <h4>Materiales vinculados ({{ linkedMaterials.length }})</h4>
          </div>
          <div class="linked-list">
            <div v-for="link in linkedMaterials" :key="link.source_id" class="linked-item">
              <span class="linked-title">{{ link.source_title }}</span>
              <span :class="['usage-badge', link.usage_category]">{{ link.usage_category }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useConversationStore } from '@/stores/conversationStore';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  conversationId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close', 'linked', 'unlinked']);

const conversationStore = useConversationStore();

// Estado local
const loading = computed(() => conversationStore.loading);
const linkedMaterials = computed(() => conversationStore.linkedMaterials);
const availableMaterials = computed(() => conversationStore.availableMaterials);

const activeCategory = ref('all');
const searchQuery = ref('');
const selectedMaterials = ref([]);
const linking = ref(false);

const categories = [
  { value: 'all', label: 'Todos', icon: '📚' },
  { value: 'MarcoTeorico', label: 'Marco Teórico', icon: '📖' },
  { value: 'CasoUso', label: 'Casos de Uso', icon: '💼' },
  { value: 'ChatUpload', label: 'Otros', icon: '📄' }
];

// Computed
const filteredMaterials = computed(() => {
  let materials = availableMaterials.value;

  // Filtrar por categoría
  if (activeCategory.value !== 'all') {
    materials = materials.filter(m => m.category === activeCategory.value);
  }

  // Filtrar por búsqueda
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    materials = materials.filter(m => 
      m.title?.toLowerCase().includes(query) ||
      m.author?.toLowerCase().includes(query)
    );
  }

  return materials;
});

const getCountByCategory = (category) => {
  let materials = availableMaterials.value;
  if (category !== 'all') {
    materials = materials.filter(m => m.category === category);
  }
  return materials.length;
};

const isSelected = (materialId) => {
  return selectedMaterials.value.includes(materialId);
};

const isLinked = (materialId) => {
  return linkedMaterials.value.some(l => l.source_id === materialId);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};

const getCategoryLabel = (category) => {
  const cat = categories.find(c => c.value === category);
  return cat ? cat.label : category;
};

// Acciones
function toggleMaterial(material) {
  const index = selectedMaterials.value.indexOf(material.id);
  if (index === -1) {
    selectedMaterials.value.push(material.id);
  } else {
    selectedMaterials.value.splice(index, 1);
  }
}

function selectAll() {
  filteredMaterials.value.forEach(m => {
    if (!isSelected(m.id) && !isLinked(m.id)) {
      selectedMaterials.value.push(m.id);
    }
  });
}

function clearSelection() {
  selectedMaterials.value = [];
}

async function linkSelectedMaterials() {
  if (selectedMaterials.value.length === 0) return;

  linking.value = true;
  try {
    for (const sourceId of selectedMaterials.value) {
      await conversationStore.linkMaterial(props.conversationId, sourceId, {
        link_type: 'manual',
        relevance_order: linkedMaterials.value.length
      });
    }
    selectedMaterials.value = [];
    emit('linked', selectedMaterials.value);
  } catch (error) {
    console.error('Error linking materials:', error);
    alert('Error al vincular materiales: ' + error.message);
  } finally {
    linking.value = false;
  }
}

async function unlinkMaterial(sourceId) {
  try {
    await conversationStore.unlinkMaterial(props.conversationId, sourceId, 'Desvinculado desde modal');
    emit('unlinked', sourceId);
  } catch (error) {
    console.error('Error unlinking material:', error);
  }
}

function close() {
  selectedMaterials.value = [];
  searchQuery.value = '';
  emit('close');
}

// Cargar datos cuando se abre el modal
watch(() => props.show, async (show) => {
  if (show && props.conversationId) {
    await Promise.all([
      conversationStore.fetchLinkedMaterials(props.conversationId),
      conversationStore.fetchAvailableMaterials(props.conversationId)
    ]);
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 15, 25, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.glass-modal {
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: #16162a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  color: #60A5FA;
}

.header-text {
  flex: 1;
}

.header-text h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #e0e0e0;
}

.header-text p {
  margin: 0;
  font-size: 14px;
  color: #a0a0b0;
}

.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: #909090;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
}

.category-tabs {
  display: flex;
  padding: 12px 24px;
  gap: 8px;
  background: #16162a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #1e1e30;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #a0a0b0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-tab:hover {
  background: #252540;
  border-color: rgba(255, 255, 255, 0.2);
}

.category-tab.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.4);
  color: #60A5FA;
}

.tab-icon {
  font-size: 14px;
}

.tab-count {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 11px;
}

.category-tab.active .tab-count {
  background: rgba(59, 130, 246, 0.3);
}

.search-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 24px;
  padding: 12px 16px;
  background: #1e1e30;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.search-container svg {
  color: #808090;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #e0e0e0;
  font-size: 14px;
}

.search-input::placeholder {
  color: #606070;
}

.materials-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px;
  max-height: 300px;
  background: #1a1a2e;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #808090;
}

.empty-state svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #c0c0c0;
}

.empty-state span {
  font-size: 12px;
  color: #909090;
}

.material-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  margin-bottom: 8px;
  background: #252540;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.material-item:hover {
  background: #2d2d48;
  border-color: rgba(255, 255, 255, 0.2);
}

.material-item.selected {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.4);
}

.material-item.linked {
  opacity: 0.8;
  background: #1f1f38;
}

.material-checkbox {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.checkbox-unchecked {
  width: 18px;
  height: 18px;
  background: #2a2a45;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
}

.checkbox-checked {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 6px;
  color: white;
}

.checkbox-linked {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.4);
  border-radius: 6px;
  color: #10B981;
}

.material-info {
  flex: 1;
  min-width: 0;
}

.material-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.material-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
}

.category-badge.MarcoTeorico {
  background: rgba(59, 130, 246, 0.2);
  color: #60A5FA;
}

.category-badge.CasoUso {
  background: rgba(16, 185, 129, 0.2);
  color: #10B981;
}

.category-badge.ChatUpload {
  background: rgba(139, 92, 246, 0.2);
  color: #A78BFA;
}

.material-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909090;
}

.material-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #909090;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
}

.action-btn.unlink:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #EF4444;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #808090;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #16162a;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.selection-info {
  font-size: 13px;
  color: #c0c0c0;
}

.selected-count {
  font-weight: 500;
  color: #60A5FA;
}

.linked-info {
  color: #808090;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.glass-button-primary {
  padding: 10px 20px;
  background: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.glass-button-primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.glass-button-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.glass-button-secondary {
  padding: 10px 20px;
  background: #252540;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #e0e0e0;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.glass-button-secondary:hover {
  background: #2d2d48;
}

.linked-panel {
  padding: 16px 24px;
  background: #141428;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.linked-header h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #10B981;
}

.linked-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.linked-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 8px;
}

.linked-title {
  font-size: 12px;
  color: #d0d0d0;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.usage-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
}

.usage-badge.primary {
  background: rgba(59, 130, 246, 0.2);
  color: #60A5FA;
}

.usage-badge.context {
  background: rgba(139, 92, 246, 0.2);
  color: #A78BFA;
}

.usage-badge.reference {
  background: rgba(16, 185, 129, 0.2);
  color: #10B981;
}
</style>
