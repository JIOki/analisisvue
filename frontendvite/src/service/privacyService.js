// Servicio de API para funcionalidades de privacidad y compartición
import { useAuthStore } from '@/stores/auth';

const API_URL = '/api';

/**
 * Helper para hacer peticiones autenticadas
 * @param {string} url - URL del endpoint
 * @param {Object} options - Opciones de fetch
 * @returns {Promise<Response>}
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

    // Manejar token expirado
    if (response.status === 401 || response.status === 403) {
        await authStore.logout();
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }

    return response;
};

export const PrivacyService = {
    /**
     * Obtiene la configuración de privacidad de un material específico
     * @param {string} materialId - ID del material
     * @returns {Promise<Object>}
     */
    async getMaterialPrivacy(materialId) {
        const response = await fetchWithAuth(`${API_URL}/privacy/material/${materialId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al obtener configuración de privacidad');
        }
        
        return data;
    },

    /**
     * Actualiza el consentimiento de uso de IA para un material
     * @param {string} materialId - ID del material
     * @param {boolean} isPublicForAI - Si el material será usado por la IA para otros usuarios
     * @param {string} [reason] - Razón opcional del cambio
     * @returns {Promise<Object>}
     */
    async setAIPublicConsent(materialId, isPublicForAI, reason = null) {
        const response = await fetchWithAuth(`${API_URL}/privacy/material/${materialId}/ai-consent`, {
            method: 'PATCH',
            body: JSON.stringify({ 
                is_public_for_ai: isPublicForAI,
                reason 
            }),
        });
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al actualizar consentimiento de IA');
        }
        
        return data;
    },

    /**
     * Comparte un material con usuarios específicos
     * @param {string} materialId - ID del material a compartir
     * @param {string[]} userIds - Array de IDs de usuarios con quienes compartir
     * @param {boolean} legalDisclaimerAccepted - Debe ser true para proceder
     * @returns {Promise<Object>}
     */
    async shareMaterial(materialId, userIds, legalDisclaimerAccepted = false) {
        const response = await fetchWithAuth(`${API_URL}/privacy/material/${materialId}/share`, {
            method: 'POST',
            body: JSON.stringify({
                shared_with_user_ids: userIds,
                legal_disclaimer_accepted: legalDisclaimerAccepted,
            }),
        });
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al compartir material');
        }
        
        return data;
    },

    /**
     * Revoca el acceso de un usuario a un material compartido
     * @param {string} materialId - ID del material
     * @param {string} userId - ID del usuario a quien se le revocará el acceso
     * @returns {Promise<Object>}
     */
    async revokeShare(materialId, userId) {
        const response = await fetchWithAuth(`${API_URL}/privacy/material/${materialId}/share/${userId}`, {
            method: 'DELETE',
        });
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al revocar acceso');
        }
        
        return data;
    },

    /**
     * Obtiene la lista de usuarios con quienes está compartido un material
     * @param {string} materialId - ID del material
     * @returns {Promise<Object>}
     */
    async getSharedUsers(materialId) {
        const response = await fetchWithAuth(`${API_URL}/privacy/material/${materialId}/shares`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al obtener usuarios compartidos');
        }
        
        return data;
    },

    /**
     * Busca usuarios por email o nombre para compartir
     * @param {string} query - Término de búsqueda
     * @returns {Promise<Object[]>}
     */
    async searchUsers(query) {
        const response = await fetchWithAuth(`${API_URL}/privacy/users/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al buscar usuarios');
        }
        
        return data.users || [];
    },

    /**
     * Obtiene el historial de consentimiento de un material
     * @param {string} materialId - ID del material
     * @returns {Promise<Object[]>}
     */
    async getConsentHistory(materialId) {
        const response = await fetchWithAuth(`${API_URL}/privacy/material/${materialId}/consent-history`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al obtener historial de consentimiento');
        }
        
        return data.history || [];
    },

    /**
     * Obtiene todos los materiales públicos para IA del sistema
     * @param {Object} options - Opciones de paginación
     * @returns {Promise<Object>}
     */
    async getPublicMaterials(options = {}) {
        const { page = 1, limit = 20, category = null } = options;
        let url = `${API_URL}/privacy/public-materials?page=${page}&limit=${limit}`;
        
        if (category) {
            url += `&category=${category}`;
        }
        
        const response = await fetchWithAuth(url);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al obtener materiales públicos');
        }
        
        return data;
    },

    /**
     * Obtiene el dashboard de privacidad con estadísticas
     * @returns {Promise<Object>}
     */
    async getPrivacyDashboard() {
        const response = await fetchWithAuth(`${API_URL}/privacy/dashboard`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al obtener dashboard de privacidad');
        }
        
        return data;
    },

    /**
     * Obtiene materiales compartidos conmigo por otros usuarios
     * @returns {Promise<Object[]>}
     */
    async getSharedWithMe() {
        const response = await fetchWithAuth(`${API_URL}/privacy/shared-with-me`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al obtener materiales compartidos');
        }
        
        return data.materials || [];
    },

    /**
     * Obtiene materiales que yo he compartido con otros
     * @returns {Promise<Object[]>}
     */
    async getSharedByMe() {
        const response = await fetchWithAuth(`${API_URL}/privacy/shared-by-me`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al obtener materiales compartidos');
        }
        
        return data.materials || [];
    },

    /**
     * Obtiene el texto del disclaimer legal para mostrar al usuario
     * @returns {Promise<string>}
     */
    async getLegalDisclaimer() {
        const response = await fetchWithAuth(`${API_URL}/privacy/legal-disclaimer`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al obtener disclaimer legal');
        }
        
        return data.disclaimer || '';
    },
};

export default PrivacyService;
