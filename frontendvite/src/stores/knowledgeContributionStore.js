// Store de Pinia para gestión de contribuciones de conocimiento
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import KnowledgeContributionService from '@/service/knowledgeContributionService';

export const useKnowledgeContributionStore = defineStore('knowledgeContribution', () => {
    // Estado
    const contributionHistory = ref([]);
    const publicContributions = ref([]);
    const contributionStats = ref(null);
    const loading = ref(false);
    const error = ref(null);
    
    // Contribución actual siendo editada
    const currentContribution = ref(null);

    // Getters
    const totalContributions = computed(() => contributionHistory.value.length);
    
    const pendingContributions = computed(() => 
        contributionHistory.value.filter(c => c.status === 'pending')
    );
    
    const approvedContributions = computed(() => 
        contributionHistory.value.filter(c => c.status === 'approved')
    );

    // Actions

    /**
     * Contribuye una respuesta al conocimiento base
     * @param {Object} contributionData - Datos de la contribución
     * @returns {Promise<Object>}
     */
    const contributeResponse = async (contributionData) => {
        loading.value = true;
        error.value = null;

        try {
            const result = await KnowledgeContributionService.contributeResponse(contributionData);
            
            // Añadir a la lista local
            contributionHistory.value.unshift(result.contribution);
            
            return result;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Obtiene el historial de contribuciones del usuario
     * @param {Object} options - Opciones de paginación
     * @returns {Promise<Object[]>}
     */
    const fetchContributionHistory = async (options = {}) => {
        loading.value = true;
        error.value = null;

        try {
            const data = await KnowledgeContributionService.getContributionHistory(options);
            contributionHistory.value = data.contributions || [];
            return data;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Obtiene contribuciones públicas
     * @param {Object} options - Opciones de filtrado
     * @returns {Promise<Object>}
     */
    const fetchPublicContributions = async (options = {}) => {
        loading.value = true;
        error.value = null;

        try {
            const data = await KnowledgeContributionService.getPublicContributions(options);
            publicContributions.value = data.contributions || [];
            return data;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Obtiene estadísticas de contribuciones
     * @returns {Promise<Object>}
     */
    const fetchContributionStats = async () => {
        loading.value = true;
        error.value = null;

        try {
            const data = await KnowledgeContributionService.getContributionStats();
            contributionStats.value = data;
            return data;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Verifica si el texto contiene datos sensibles
     * @param {string} text - Texto a verificar
     * @returns {Promise<Object>}
     */
    const checkSensitivity = async (text) => {
        try {
            return await KnowledgeContributionService.checkForSensitiveData(text);
        } catch (err) {
            error.value = err.message;
            throw err;
        }
    };

    /**
     * Elimina una contribución propia
     * @param {string} contributionId - ID de la contribución
     * @returns {Promise<Object>}
     */
    const deleteContribution = async (contributionId) => {
        loading.value = true;
        error.value = null;

        try {
            await KnowledgeContributionService.deleteContribution(contributionId);
            
            // Remover de la lista local
            contributionHistory.value = contributionHistory.value.filter(
                c => c.id !== contributionId
            );
            
            return { success: true };
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Establece la contribución actual siendo editada
     * @param {Object} contribution - Datos de la contribución
     */
    const setCurrentContribution = (contribution) => {
        currentContribution.value = contribution;
    };

    /**
     * Limpia la contribución actual
     */
    const clearCurrentContribution = () => {
        currentContribution.value = null;
    };

    /**
     * Limpia el estado del store
     */
    const clearState = () => {
        contributionHistory.value = [];
        publicContributions.value = [];
        contributionStats.value = null;
        currentContribution.value = null;
        error.value = null;
    };

    return {
        // Estado
        contributionHistory,
        publicContributions,
        contributionStats,
        currentContribution,
        loading,
        error,
        
        // Getters
        totalContributions,
        pendingContributions,
        approvedContributions,
        
        // Actions
        contributeResponse,
        fetchContributionHistory,
        fetchPublicContributions,
        fetchContributionStats,
        checkSensitivity,
        deleteContribution,
        setCurrentContribution,
        clearCurrentContribution,
        clearState,
    };
});
