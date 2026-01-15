/**
 * Store de Pinia para Verificacion RAG
 * Gestiona el estado de verificacion de respuestas
 */

import { defineStore } from 'pinia';
import verificationService from '@/service/verificationService';
import { conversationService } from '@/service/conversationService';

/**
 * Sanitiza un objeto de verificacion para que sea serializable a JSON
 * Convierte objetos Date, Enums y otros tipos no serializables a strings
 * @param {Object} obj - Objeto a sanitizar
 * @returns {Object} Objeto sanitizado
 */
function sanitizeVerificationData(obj) {
    if (obj === null || obj === undefined) {
        return null;
    }

    // Manejar strings, números y booleanos directamente
    if (typeof obj !== 'object') {
        return obj;
    }

    // Manejar arrays
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeVerificationData(item));
    }

    const sanitized = {};

    // Obtener todas las claves, incluyendo símbolos si los hay
    const keys = Object.keys(obj);

    for (const key of keys) {
        try {
            const value = obj[key];

            // Valores primitivos
            if (value === null || value === undefined) {
                continue; // O usar sanitized[key] = null;
            }

            if (typeof value === 'function') {
                continue;
            }

            if (typeof value === 'bigint') {
                sanitized[key] = value.toString();
                continue;
            }

            // Manejar Date y objetos similares
            if (value instanceof Date) {
                sanitized[key] = value.toISOString();
                continue;
            }

            // Manejar objetos con toISOString (como datetime de Python serializado)
            if (value && typeof value === 'object' && value !== null) {
                // Verificar si es un objeto de tipo Pydantic Enum (tiene propiedad 'value')
                if (value.value !== undefined && Object.keys(value).length <= 2 &&
                    (value.value !== null || Object.keys(value).length === 1)) {
                    sanitized[key] = value.value;
                    continue;
                }

                // Verificar si tiene toISOString (Date de Python)
                if (typeof value.toISOString === 'function') {
                    sanitized[key] = value.toISOString();
                    continue;
                }

                // Manejar objetos anidados recursivamente
                if (typeof value === 'object' && !Array.isArray(value)) {
                    // Verificar si es un Set, Map o RegExp
                    if (value instanceof Set || value instanceof Map || value instanceof RegExp) {
                        continue;
                    }

                    // Verificar si tiene constructor personalizado (clases)
                    if (value.constructor && value.constructor.name !== 'Object') {
                        // Convertir a su valor primitivo si es posible
                        if (value.valueOf && typeof value.valueOf === 'function') {
                            sanitized[key] = value.valueOf();
                        } else {
                            // Intentar serializar como JSON primero
                            try {
                                const jsonStr = JSON.stringify(value);
                                sanitized[key] = JSON.parse(jsonStr);
                            } catch (e) {
                                continue; // Skip si no se puede serializar
                            }
                        }
                        continue;
                    }

                    // Procesar objetos normales recursivamente
                    sanitized[key] = sanitizeVerificationData(value);
                    continue;
                }
            }

            // Valor primitivo o ya procesado
            sanitized[key] = value;
        } catch (err) {
            // Si hay error al procesar una clave, continuar con las demás
            console.warn(`Error sanitizando clave '${key}':`, err.message);
        }
    }

    return sanitized;
}

export const useVerificationStore = defineStore('verification', {
    state: () => ({
        // Verificaciones por mensaje
        messageVerifications: new Map(), // messageId -> verificationResult
        
        // Estado global de verificacion
        verifying: false,
        error: null,
        
        // Configuracion
        autoVerify: true,
        showPanel: false,
        selectedMessageId: null,
        
        // Estadisticas
        stats: {
            totalVerifications: 0,
            avgConfidence: 0,
            distribution: {
                alta: 0,
                media: 0,
                baja: 0,
                nula: 0
            }
        }
    }),

    getters: {
        getVerificationByMessageId: (state) => (messageId) => {
            return state.messageVerifications.get(messageId) || null;
        },
        
        hasVerification: (state) => (messageId) => {
            return state.messageVerifications.has(messageId);
        },
        
        currentVerification: (state) => {
            if (state.selectedMessageId) {
                return state.messageVerifications.get(state.selectedMessageId) || null;
            }
            return null;
        },
        
        confidenceDistribution: (state) => {
            return state.stats.distribution;
        },
        
        averageConfidence: (state) => {
            return state.stats.avgConfidence;
        }
    },

    actions: {
        /**
         * Verifica una respuesta del modelo
         * @param {Object} params - Parametros de verificacion
         * @returns {Promise<Object>} Resultado de verificacion
         */
        async verifyMessage(params) {
            const {
                messageId,
                query,
                response,
                conversationId = null,
                userId = null,
                linkedMaterialIds = [],
                contextChunks = null,
                contextText = null,
                persistToDb = true  // Nueva opción para persistir en base de datos
            } = params;

            this.verifying = true;
            this.error = null;

            try {
                const result = await verificationService.verifyResponse({
                    query,
                    response,
                    conversationId,
                    userId,
                    linkedMaterialIds,
                    contextChunks,
                    contextText
                });

                // Guardar verificacion por ID de mensaje
                if (messageId) {
                    this.messageVerifications.set(messageId, result);
                }

                // Persistir en base de datos si está habilitado
                if (persistToDb && messageId && conversationId) {
                    try {
                        // Sanitizar el resultado para convertir objetos no serializables (como Date)
                        const sanitizedResult = sanitizeVerificationData(result);

                        console.log('[Verification] Guardando verificación en BD:', {
                            messageId,
                            conversationId,
                            hasConfidenceScore: sanitizedResult?.confidence_score !== undefined,
                            confidenceScore: sanitizedResult?.confidence_score,
                            confidenceLevel: sanitizedResult?.confidence_level,
                            sanitizedKeys: sanitizedResult ? Object.keys(sanitizedResult) : null
                        });

                        await conversationService.saveVerification(messageId, sanitizedResult);

                        console.log('[Verification] Verificación guardada exitosamente');
                    } catch (dbError) {
                        console.error('[Verification] Error guardando verificación en BD:', dbError.message);
                        console.error('[Verification] Error details:', dbError);
                        // No fallar la verificación por error de persistencia
                    }
                }

                // Actualizar estadisticas
                this.updateStats(result);

                return result;
            } catch (error) {
                this.error = error.message;
                console.error('Error en verificationStore.verifyMessage:', error);
                throw error;
            } finally {
                this.verifying = false;
            }
        },

        /**
         * Verificacion rapida de confianza
         * @param {Object} params - Parametros
         * @returns {Promise<Object>} Resultado
         */
        async quickCheck(params) {
            this.verifying = true;
            this.error = null;

            try {
                return await verificationService.checkConfidence(params);
            } catch (error) {
                this.error = error.message;
                console.error('Error en quickCheck:', error);
                throw error;
            } finally {
                this.verifying = false;
            }
        },

        /**
         * Busca fuentes relevantes
         * @param {Object} params - Parametros de busqueda
         * @returns {Promise<Object>} Fuentes encontradas
         */
        async searchSources(params) {
            try {
                return await verificationService.searchSources(params);
            } catch (error) {
                this.error = error.message;
                console.error('Error buscando fuentes:', error);
                throw error;
            }
        },

        /**
         * Verificacion en lote
         * @param {Array} items - Items a verificar
         * @returns {Promise<Array>} Resultados
         */
        async verifyBatch(items) {
            this.verifying = true;
            this.error = null;

            try {
                const results = await verificationService.verifyBatch(items);
                
                // Guardar todas las verificaciones
                results.forEach((result, index) => {
                    if (items[index].messageId) {
                        this.messageVerifications.set(items[index].messageId, result);
                    }
                    this.updateStats(result);
                });

                return results;
            } catch (error) {
                this.error = error.message;
                console.error('Error en verifyBatch:', error);
                throw error;
            } finally {
                this.verifying = false;
            }
        },

        /**
         * Actualiza las estadisticas con un resultado
         * @param {Object} result - Resultado de verificacion
         */
        updateStats(result) {
            this.stats.totalVerifications++;
            
            const confidence = result.confidence_score || 0;
            this.stats.avgConfidence = 
                (this.stats.avgConfidence * (this.stats.totalVerifications - 1) + confidence) / 
                this.stats.totalVerifications;

            const level = result.confidence_level || 'nula';
            this.stats.distribution[level]++;
        },

        /**
         * Selecciona un mensaje para ver su verificacion
         * @param {string} messageId - ID del mensaje
         */
        selectMessage(messageId) {
            this.selectedMessageId = messageId;
            this.showPanel = true;
        },

        /**
         * Limpia la seleccion actual
         */
        clearSelection() {
            this.selectedMessageId = null;
            this.showPanel = false;
        },

        /**
         * Alterna la visibilidad del panel
         */
        togglePanel() {
            this.showPanel = !this.showPanel;
        },

        /**
         * Elimina la verificacion de un mensaje
         * @param {string} messageId - ID del mensaje
         */
        removeVerification(messageId) {
            this.messageVerifications.delete(messageId);
            if (this.selectedMessageId === messageId) {
                this.clearSelection();
            }
        },

        /**
         * Carga verificaciones desde la base de datos
         * @param {Array} messages - Lista de mensajes con verification_data
         */
        loadVerificationsFromMessages(messages) {
            messages.forEach(message => {
                if (message.verification_data && message.id) {
                    this.messageVerifications.set(message.id, message.verification_data);
                }
            });
        },

        /**
         * Limpia todas las verificaciones
         */
        clearAll() {
            this.messageVerifications.clear();
            this.selectedMessageId = null;
            this.error = null;
            this.stats = {
                totalVerifications: 0,
                avgConfidence: 0,
                distribution: {
                    alta: 0,
                    media: 0,
                    baja: 0,
                    nula: 0
                }
            };
        },

        /**
         * Verifica el estado del servicio
         * @returns {Promise<Object>} Estado del servicio
         */
        async checkServiceHealth() {
            try {
                return await verificationService.healthCheck();
            } catch (error) {
                console.error('Error checking service health:', error);
                return { status: 'unhealthy', database: false, ollama: false };
            }
        }
    }
});
