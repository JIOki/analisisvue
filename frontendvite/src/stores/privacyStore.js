// Store de privacidad y compartición con Pinia
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import PrivacyService from '@/service/privacyService';

export const usePrivacyStore = defineStore('privacy', () => {
    // Estado
    const materialsPrivacy = ref(new Map()); // Map<materialId, privacyConfig>
    const sharedWithMe = ref([]);
    const sharedByMe = ref([]);
    const publicMaterials = ref([]);
    const privacyDashboard = ref(null);
    const legalDisclaimer = ref('');
    const searchResults = ref([]);
    
    // Estados de carga
    const loading = ref(false);
    const error = ref(null);

    // Getters
    const hasPrivacyData = computed(() => materialsPrivacy.value.size > 0);
    
    const totalPublicMaterials = computed(() => {
        if (!privacyDashboard.value) return 0;
        return privacyDashboard.value.my_public_count || 0;
    });
    
    const totalPrivateMaterials = computed(() => {
        if (!privacyDashboard.value) return 0;
        return privacyDashboard.value.my_private_count || 0;
    });
    
    const totalSharedWithMe = computed(() => sharedWithMe.value.length);
    
    const totalSharedByMe = computed(() => sharedByMe.value.length);

    // Helper para obtener configuración de privacidad de un material
    const getMaterialPrivacyConfig = (materialId) => {
        return materialsPrivacy.value.get(materialId) || null;
    };

    // Helper para establecer configuración de privacidad
    const setMaterialPrivacyConfig = (materialId, config) => {
        materialsPrivacy.value.set(materialId, config);
    };

    // Actions

    /**
     * Obtiene y cachea la configuración de privacidad de un material
     * @param {string} materialId - ID del material
     * @returns {Promise<Object>}
     */
    const fetchMaterialPrivacy = async (materialId) => {
        loading.value = true;
        error.value = null;

        try {
            const data = await PrivacyService.getMaterialPrivacy(materialId);
            setMaterialPrivacyConfig(materialId, data);
            return data;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Actualiza el consentimiento de uso de IA para un material
     * @param {string} materialId - ID del material
     * @param {boolean} isPublicForAI - Nuevo estado
     * @param {string} [reason] - Razón del cambio
     * @returns {Promise<Object>}
     */
    const updateAIPublicConsent = async (materialId, isPublicForAI, reason = null) => {
        loading.value = true;
        error.value = null;

        try {
            const data = await PrivacyService.setAIPublicConsent(materialId, isPublicForAI, reason);
            
            // Actualizar el cache local
            const currentConfig = getMaterialPrivacyConfig(materialId);
            if (currentConfig) {
                setMaterialPrivacyConfig(materialId, {
                    ...currentConfig,
                    is_public_for_ai: isPublicForAI,
                    ai_consent_updated_at: new Date().toISOString(),
                });
            }
            
            // Refrescar dashboard si existe
            await fetchPrivacyDashboard();
            
            return data;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Comparte un material con usuarios específicos
     * Requiere aceptación del disclaimer legal
     * @param {string} materialId - ID del material
     * @param {string[]} userIds - IDs de usuarios
     * @param {boolean} acceptedDisclaimer - Aceptación del disclaimer
     * @returns {Promise<Object>}
     */
    const shareMaterialWithUsers = async (materialId, userIds, acceptedDisclaimer = false) => {
        loading.value = true;
        error.value = null;

        try {
            if (!acceptedDisclaimer && !legalDisclaimer.value) {
                // Cargar disclaimer si no existe
                legalDisclaimer.value = await PrivacyService.getLegalDisclaimer();
            }

            const data = await PrivacyService.shareMaterial(materialId, userIds, acceptedDisclaimer);
            
            // Refrescar listas compartidas
            await fetchSharedByMe();
            
            return data;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Revoca el acceso de un usuario a un material
     * @param {string} materialId - ID del material
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object>}
     */
    const revokeUserAccess = async (materialId, userId) => {
        loading.value = true;
        error.value = null;

        try {
            const data = await PrivacyService.revokeShare(materialId, userId);
            
            // Refrescar lista compartida
            await fetchSharedByMe();
            
            return data;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Obtiene usuarios con quienes está compartido un material
     * @param {string} materialId - ID del material
     * @returns {Promise<Object[]>}
     */
    const fetchSharedUsers = async (materialId) => {
        loading.value = true;
        error.value = null;

        try {
            const data = await PrivacyService.getSharedUsers(materialId);
            return data.shared_with || [];
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Busca usuarios para compartir
     * @param {string} query - Término de búsqueda
     * @returns {Promise<Object[]>}
     */
    const searchUsersToShare = async (query) => {
        if (!query || query.trim().length < 2) {
            searchResults.value = [];
            return [];
        }

        loading.value = true;
        error.value = null;

        try {
            const results = await PrivacyService.searchUsers(query);
            searchResults.value = results;
            return results;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Limpia resultados de búsqueda
     */
    const clearSearchResults = () => {
        searchResults.value = [];
    };

    /**
     * Obtiene historial de consentimiento de un material
     * @param {string} materialId - ID del material
     * @returns {Promise<Object[]>}
     */
    const fetchConsentHistory = async (materialId) => {
        loading.value = true;
        error.value = null;

        try {
            const history = await PrivacyService.getConsentHistory(materialId);
            return history;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Obtiene materiales públicos para IA
     * @param {Object} options - Opciones de paginación
     * @returns {Promise<Object>}
     */
    const fetchPublicMaterials = async (options = {}) => {
        loading.value = true;
        error.value = null;

        try {
            const data = await PrivacyService.getPublicMaterials(options);
            publicMaterials.value = data.materials || [];
            return data;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Obtiene dashboard de privacidad
     * @returns {Promise<Object>}
     */
    const fetchPrivacyDashboard = async () => {
        loading.value = true;
        error.value = null;

        try {
            const data = await PrivacyService.getPrivacyDashboard();
            privacyDashboard.value = data;
            return data;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Obtiene materiales compartidos conmigo
     * @returns {Promise<Object[]>}
     */
    const fetchSharedWithMe = async () => {
        loading.value = true;
        error.value = null;

        try {
            const materials = await PrivacyService.getSharedWithMe();
            sharedWithMe.value = materials;
            return materials;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Obtiene materiales que he compartido
     * @returns {Promise<Object[]>}
     */
    const fetchSharedByMe = async () => {
        loading.value = true;
        error.value = null;

        try {
            const materials = await PrivacyService.getSharedByMe();
            sharedByMe.value = materials;
            return materials;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Carga el disclaimer legal
     * @returns {Promise<string>}
     */
    const fetchLegalDisclaimer = async () => {
        try {
            const text = await PrivacyService.getLegalDisclaimer();
            legalDisclaimer.value = text;
            return text;
        } catch (err) {
            error.value = err.message;
            throw err;
        }
    };

    /**
     * Verifica si un material está marcado como público para IA
     * @param {string} materialId - ID del material
     * @returns {Promise<boolean>}
     */
    const isMaterialPublicForAI = async (materialId) => {
        let config = getMaterialPrivacyConfig(materialId);
        
        if (!config) {
            config = await fetchMaterialPrivacy(materialId);
        }
        
        return config?.is_public_for_ai || false;
    };

    /**
     * Verifica si tengo acceso a un material compartido
     * @param {string} materialId - ID del material
     * @returns {boolean}
     */
    const hasAccessToShared = (materialId) => {
        return sharedWithMe.value.some(m => m.id === materialId);
    };

    /**
     * Limpia el estado del store
     */
    const clearState = () => {
        materialsPrivacy.value.clear();
        sharedWithMe.value = [];
        sharedByMe.value = [];
        publicMaterials.value = [];
        privacyDashboard.value = null;
        legalDisclaimer.value = '';
        searchResults.value = [];
        error.value = null;
    };

    return {
        // Estado
        materialsPrivacy,
        sharedWithMe,
        sharedByMe,
        publicMaterials,
        privacyDashboard,
        legalDisclaimer,
        searchResults,
        loading,
        error,
        
        // Getters
        hasPrivacyData,
        totalPublicMaterials,
        totalPrivateMaterials,
        totalSharedWithMe,
        totalSharedByMe,
        
        // Helper functions
        getMaterialPrivacyConfig,
        setMaterialPrivacyConfig,
        
        // Actions
        fetchMaterialPrivacy,
        updateAIPublicConsent,
        shareMaterialWithUsers,
        revokeUserAccess,
        fetchSharedUsers,
        searchUsersToShare,
        clearSearchResults,
        fetchConsentHistory,
        fetchPublicMaterials,
        fetchPrivacyDashboard,
        fetchSharedWithMe,
        fetchSharedByMe,
        fetchLegalDisclaimer,
        isMaterialPublicForAI,
        hasAccessToShared,
        clearState,
    };
});
