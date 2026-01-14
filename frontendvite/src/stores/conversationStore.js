// frontendvite/src/stores/conversationStore.js
// Store de Pinia para gestión de historial de conversaciones y materiales
// Fase 5: Chat History y Gestión de Materiales

import { defineStore } from 'pinia';
import conversationService from '@/service/conversationService';
import { useVerificationStore } from './verificationStore';

export const useConversationStore = defineStore('conversation', {
    state: () => ({
        // Conversaciones
        conversations: [],
        currentConversation: null,
        conversationMessages: [],
        
        // Materiales
        linkedMaterials: [],
        availableMaterials: [],
        
        // Sesiones
        sessions: [],
        currentSession: null,
        
        // Chunks de contexto del último mensaje (para verificación RAG)
        lastContextChunks: [],
        
        // Estado general
        loading: false,
        error: null,
        
        // Paginación
        pagination: {
            limit: 20,
            offset: 0,
            hasMore: false
        }
    }),

    getters: {
        activeConversations: (state) => state.conversations.filter(c => c.status === 'active'),
        archivedConversations: (state) => state.conversations.filter(c => c.status === 'archived'),
        sortedConversations: (state) => [...state.conversations].sort((a, b) => 
            new Date(b.last_activity_at) - new Date(a.last_activity_at)
        ),
        hasLinkedMaterials: (state) => state.linkedMaterials.length > 0,
        materialCount: (state) => state.linkedMaterials.length,
        conversationCount: (state) => state.conversations.length
    },

    actions: {
        // ============================================
        // GESTIÓN DE CONVERSACIONES
        // ============================================

        async fetchConversations(params = {}) {
            this.loading = true;
            this.error = null;
            try {
                const result = await conversationService.conversation.listConversations(params);
                this.conversations = result.conversations || [];
                this.pagination = result.pagination || this.pagination;
            } catch (error) {
                this.error = error.message;
                console.error('Error fetching conversations:', error);
            } finally {
                this.loading = false;
            }
        },

        async fetchConversation(conversationId) {
            this.loading = true;
            this.error = null;
            try {
                this.currentConversation = await conversationService.conversation.getConversation(conversationId);
                return this.currentConversation;
            } catch (error) {
                this.error = error.message;
                console.error('Error fetching conversation:', error);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async createConversation(data) {
            this.loading = true;
            this.error = null;
            try {
                const newConversation = await conversationService.conversation.createConversation(data);
                this.conversations.unshift(newConversation);
                this.currentConversation = newConversation;
                return newConversation;
            } catch (error) {
                this.error = error.message;
                console.error('Error creating conversation:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async updateConversation(conversationId, data) {
            this.loading = true;
            this.error = null;
            try {
                const updated = await conversationService.conversation.updateConversation(conversationId, data);
                const index = this.conversations.findIndex(c => c.id === conversationId);
                if (index !== -1) {
                    this.conversations[index] = { ...this.conversations[index], ...updated };
                }
                if (this.currentConversation?.id === conversationId) {
                    this.currentConversation = { ...this.currentConversation, ...updated };
                }
                return updated;
            } catch (error) {
                this.error = error.message;
                console.error('Error updating conversation:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async deleteConversation(conversationId) {
            this.loading = true;
            this.error = null;
            try {
                await conversationService.conversation.deleteConversation(conversationId);
                this.conversations = this.conversations.filter(c => c.id !== conversationId);
                if (this.currentConversation?.id === conversationId) {
                    this.currentConversation = null;
                }
            } catch (error) {
                this.error = error.message;
                console.error('Error deleting conversation:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async fetchMessages(conversationId) {
            this.loading = true;
            this.error = null;
            try {
                this.conversationMessages = await conversationService.conversation.getMessages(conversationId);
                
                // Hydrate verification data from database into verificationStore
                const verificationStore = useVerificationStore();
                verificationStore.loadVerificationsFromMessages(this.conversationMessages);
                
                return this.conversationMessages;
            } catch (error) {
                this.error = error.message;
                console.error('Error fetching messages:', error);
                return [];
            } finally {
                this.loading = false;
            }
        },

        // ============================================
        // GESTIÓN DE MATERIALES
        // ============================================

        async fetchLinkedMaterials(conversationId) {
            this.loading = true;
            this.error = null;
            try {
                const result = await conversationService.materials.getLinkedMaterials(conversationId);
                this.linkedMaterials = result.materials || [];
                return this.linkedMaterials;
            } catch (error) {
                this.error = error.message;
                console.error('Error fetching linked materials:', error);
                return [];
            } finally {
                this.loading = false;
            }
        },

        async fetchAvailableMaterials(conversationId) {
            this.loading = true;
            this.error = null;
            try {
                const result = await conversationService.materials.getAvailableMaterials(conversationId);
                this.availableMaterials = result.materials || [];
                return this.availableMaterials;
            } catch (error) {
                this.error = error.message;
                console.error('Error fetching available materials:', error);
                return [];
            } finally {
                this.loading = false;
            }
        },

        async linkMaterial(conversationId, sourceId, options = {}) {
            this.loading = true;
            this.error = null;
            try {
                const result = await conversationService.materials.linkMaterial(conversationId, sourceId, options);
                await this.fetchLinkedMaterials(conversationId);
                return result;
            } catch (error) {
                this.error = error.message;
                console.error('Error linking material:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async unlinkMaterial(conversationId, sourceId, reason = null) {
            this.loading = true;
            this.error = null;
            try {
                await conversationService.materials.unlinkMaterial(conversationId, sourceId, reason);
                this.linkedMaterials = this.linkedMaterials.filter(m => m.source_id !== sourceId);
            } catch (error) {
                this.error = error.message;
                console.error('Error unlinking material:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async updateMaterialLink(conversationId, sourceId, data) {
            this.loading = true;
            this.error = null;
            try {
                const updated = await conversationService.materials.updateLink(conversationId, sourceId, data);
                const index = this.linkedMaterials.findIndex(m => m.source_id === sourceId);
                if (index !== -1) {
                    this.linkedMaterials[index] = { ...this.linkedMaterials[index], ...updated };
                }
                return updated;
            } catch (error) {
                this.error = error.message;
                console.error('Error updating material link:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        // ============================================
        // GESTIÓN DE SESIONES
        // ============================================

        async fetchSessions(conversationId) {
            this.loading = true;
            this.error = null;
            try {
                const result = await conversationService.sessions.getSessions(conversationId);
                this.sessions = result.sessions || [];
                return this.sessions;
            } catch (error) {
                this.error = error.message;
                console.error('Error fetching sessions:', error);
                return [];
            } finally {
                this.loading = false;
            }
        },

        async startSession(conversationId, data = {}) {
            this.loading = true;
            this.error = null;
            try {
                const session = await conversationService.sessions.startSession(conversationId, data);
                this.sessions.unshift(session);
                this.currentSession = session;
                return session;
            } catch (error) {
                this.error = error.message;
                console.error('Error starting session:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async endSession(sessionId) {
            this.loading = true;
            this.error = null;
            try {
                const result = await conversationService.sessions.endSession(sessionId);
                const index = this.sessions.findIndex(s => s.id === sessionId);
                if (index !== -1) {
                    this.sessions[index] = result.session;
                }
                if (this.currentSession?.id === sessionId) {
                    this.currentSession = null;
                }
                return result;
            } catch (error) {
                this.error = error.message;
                console.error('Error ending session:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        // ============================================
        // CHAT CON CONTEXTO
        // ============================================

        async sendChatMessage(conversationId, message, sessionId = null) {
            this.loading = true;
            this.error = null;
            this.lastContextChunks = []; // Limpiar chunks anteriores
            try {
                const result = await conversationService.chat.sendMessage(conversationId, message, sessionId);
                
                // Guardar chunks de contexto para verificación RAG
                if (result.context_chunks && result.context_chunks.length > 0) {
                    this.lastContextChunks = result.context_chunks;
                }
                
                // Add user message to local state immediately for instant feedback
                if (result.user_message) {
                    this.conversationMessages.push(result.user_message);
                }
                
                // Add assistant response to local state if available
                if (result.assistant_message) {
                    this.conversationMessages.push(result.assistant_message);
                }
                
                // If messages were returned, update the local state
                if (result.messages && result.messages.length > 0) {
                    this.conversationMessages = result.messages;
                } else {
                    // Otherwise fetch updated messages from server
                    await this.fetchMessages(conversationId);
                }
                
                // Update linked materials if sources were returned
                if (result.sources) {
                    await this.fetchLinkedMaterials(conversationId);
                }
                
                return result;
            } catch (error) {
                this.error = error.message;
                console.error('Error sending message:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        // ============================================
        // UTILIDADES
        // ============================================

        setCurrentConversation(conversation) {
            this.currentConversation = conversation;
        },

        clearCurrentConversation() {
            this.currentConversation = null;
            this.linkedMaterials = [];
            this.conversationMessages = [];
            this.currentSession = null;
        },

        clearError() {
            this.error = null;
        },

        // Cargar conversación completa con todos sus datos
        async loadFullConversation(conversationId) {
            await Promise.all([
                this.fetchConversation(conversationId),
                this.fetchLinkedMaterials(conversationId),
                this.fetchMessages(conversationId),
                this.fetchSessions(conversationId)
            ]);
        },

        // Crear nueva conversación con materiales iniciales
        async createConversationWithMaterials(data) {
            const { source_ids, ...rest } = data;
            const conversation = await this.createConversation(rest);
            if (source_ids && source_ids.length > 0) {
                for (const sourceId of source_ids) {
                    await this.linkMaterial(conversation.id, sourceId);
                }
            }
            return conversation;
        }
    }
});
