/**
 * Servicio de Verificación RAG
 * Comunicacion con el microservicio Python/FastAPI
 */

const VERIFICATION_API_URL = import.meta.env.VITE_VERIFICATION_API_URL || 'http://localhost:8001';
const API_BASE = `${VERIFICATION_API_URL}/api/v1/verify`;

class VerificationService {
    /**
     * Verifica una respuesta del modelo
     * @param {Object} params - Parametros de verificacion
     * @returns {Promise<Object>} Resultado de verificacion
     */
    async verifyResponse(params) {
        const {
            query,
            response: aiResponse,
            conversationId = null,
            userId = null,
            linkedMaterialIds = [],
            contextChunks = null,
            contextText = null
        } = params;

        try {
            const response = await fetch(`${API_BASE}/response`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query,
                    response: aiResponse,
                    conversation_id: conversationId,
                    user_id: userId,
                    linked_material_ids: linkedMaterialIds,
                    context_chunks: contextChunks,
                    context_text: contextText
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error verificando respuesta:', error);
            throw error;
        }
    }

    /**
     * Verificacion rapida de confianza
     * @param {Object} params - Parametros de verificacion
     * @returns {Promise<Object>} Resultado de confianza
     */
    async checkConfidence(params) {
        const { query, response: aiResponse, threshold = null } = params;

        try {
            const response = await fetch(`${API_BASE}/confidence`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query,
                    response: aiResponse,
                    threshold
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error verificando confianza:', error);
            throw error;
        }
    }

    /**
     * Busca fuentes relevantes para una consulta
     * @param {Object} params - Parametros de busqueda
     * @returns {Promise<Object>} Fuentes encontradas
     */
    async searchSources(params) {
        const { query, topK = 5, sourceIds = null, userId = null } = params;

        try {
            const url = new URL(`${API_BASE}/sources`);
            url.searchParams.append('q', query);
            url.searchParams.append('top_k', topK);
            
            if (sourceIds && sourceIds.length > 0) {
                url.searchParams.append('source_ids', sourceIds.join(','));
            }
            if (userId) {
                url.searchParams.append('user_id', userId);
            }

            const response = await fetch(url.toString());

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error buscando fuentes:', error);
            throw error;
        }
    }

    /**
     * Verificacion en lote
     * @param {Array} items - Lista de items a verificar
     * @returns {Promise<Array>} Resultados de verificacion
     */
    async verifyBatch(items) {
        try {
            const response = await fetch(`${API_BASE}/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    items
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error en verificacion en lote:', error);
            throw error;
        }
    }

    /**
     * Verifica la salud del servicio
     * @returns {Promise<Object>} Estado del servicio
     */
    async healthCheck() {
        try {
            const response = await fetch(`${VERIFICATION_API_URL}/health/`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error en health check:', error);
            throw error;
        }
    }
}

export default new VerificationService();
