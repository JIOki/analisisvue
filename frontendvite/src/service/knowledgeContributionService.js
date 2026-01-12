// Servicio para contribución de conocimiento desde respuestas del chat
import { useAuthStore } from '@/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Helper para hacer peticiones autenticadas
 */
const fetchWithAuth = async (url, options = {}) => {
    const authStore = useAuthStore();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401 || response.status === 403) {
        await authStore.logout();
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }

    return response;
};

export const KnowledgeContributionService = {
    /**
     * Contribuye una respuesta generada al conocimiento base del sistema
     * @param {Object} contributionData - Datos de la contribución
     * @returns {Promise<Object>}
     */
    async contributeResponse(contributionData) {
        const response = await fetchWithAuth(`${API_URL}/knowledge/contribute`, {
            method: 'POST',
            body: JSON.stringify(contributionData),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al contribuir conocimiento');
        }
        
        return data;
    },

    /**
     * Obtiene el historial de contribuciones del usuario
     * @param {Object} options - Opciones de paginación
     * @returns {Promise<Object>}
     */
    async getContributionHistory(options = {}) {
        const { page = 1, limit = 20 } = options;
        const response = await fetchWithAuth(
            `${API_URL}/knowledge/contributions?page=${page}&limit=${limit}`
        );
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al obtener historial de contribuciones');
        }
        
        return data;
    },

    /**
     * Obtiene el estado de una contribución (pendiente/aprobada)
     * @param {string} contributionId - ID de la contribución
     * @returns {Promise<Object>}
     */
    async getContributionStatus(contributionId) {
        const response = await fetchWithAuth(
            `${API_URL}/knowledge/contributions/${contributionId}/status`
        );
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al obtener estado');
        }
        
        return data;
    },

    /**
     * Elimina una contribución propia (solo si está pendiente)
     * @param {string} contributionId - ID de la contribución
     * @returns {Promise<Object>}
     */
    async deleteContribution(contributionId) {
        const response = await fetchWithAuth(
            `${API_URL}/knowledge/contributions/${contributionId}`,
            { method: 'DELETE' }
        );
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al eliminar contribución');
        }
        
        return data;
    },

    /**
     * Obtiene contribuciones públicas disponibles para todos los usuarios
     * @param {Object} options - Opciones de filtrado
     * @returns {Promise<Object>}
     */
    async getPublicContributions(options = {}) {
        const { page = 1, limit = 20, category = null } = options;
        let url = `${API_URL}/knowledge/public?page=${page}&limit=${limit}`;
        
        if (category) {
            url += `&category=${category}`;
        }
        
        const response = await fetchWithAuth(url);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al obtener contribuciones públicas');
        }
        
        return data;
    },

    /**
     * Verifica si el texto contiene información potencialmente sensible
     * @param {string} text - Texto a verificar
     * @returns {Promise<Object>}
     */
    async checkForSensitiveData(text) {
        const response = await fetchWithAuth(`${API_URL}/knowledge/check-sensitivity`, {
            method: 'POST',
            body: JSON.stringify({ text }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al verificar datos sensibles');
        }
        
        return data;
    },

    /**
     * Obtiene estadísticas de contribuciones del usuario
     * @returns {Promise<Object>}
     */
    async getContributionStats() {
        const response = await fetchWithAuth(`${API_URL}/knowledge/stats`);
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al obtener estadísticas');
        }
        
        return data;
    },
};

export default KnowledgeContributionService;
