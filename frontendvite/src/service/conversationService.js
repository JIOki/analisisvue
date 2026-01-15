// frontendvite/src/service/conversationService.js
// Servicio de API para gestión de historial de conversaciones y materiales
// Fase 5: Chat History y Gestión de Materiales

const API_BASE = '/api';

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

async function handleResponse(response) {
    // Obtener el texto primero para debugging
    const responseText = await response.text();

    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        // Si no es JSON, usar el texto directamente
        data = { error: responseText };
    }

    if (!response.ok) {
        //优先使用 data.error，其次使用 data.details，最后使用状态码和状态文本
        const errorMessage = data.error || data.details || `Error ${response.status}: ${response.statusText}`;
        console.error('API Error:', {
            status: response.status,
            statusText: response.statusText,
            error: data.error,
            details: data.details,
            response: responseText.substring(0, 500)
        });
        throw new Error(errorMessage);
    }
    return data;
}

// ============================================
// GESTIÓN DE CONVERSACIONES
// ============================================

export const conversationService = {
    // Listar conversaciones del usuario
    async listConversations(params = {}) {
        const { status = 'active', limit = 20, offset = 0 } = params;
        const query = new URLSearchParams({ status, limit, offset }).toString();
        const response = await fetch(`${API_BASE}/conversations?${query}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    // Obtener detalles de una conversación
    async getConversation(conversationId) {
        const response = await fetch(`${API_BASE}/conversations/${conversationId}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    // Crear nueva conversación
    async createConversation(data) {
        const response = await fetch(`${API_BASE}/conversations`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    // Actualizar conversación
    async updateConversation(conversationId, data) {
        const response = await fetch(`${API_BASE}/conversations/${conversationId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    // Eliminar conversación (soft delete)
    async deleteConversation(conversationId) {
        const response = await fetch(`${API_BASE}/conversations/${conversationId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    // Obtener mensajes de una conversación
    async getMessages(conversationId) {
        const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    // Guardar datos de verificación de un mensaje
    async saveVerification(messageId, verificationData) {
        const response = await fetch(`${API_BASE}/messages/${messageId}/verification`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ verification_data: verificationData })
        });
        return handleResponse(response);
    }
};

// ============================================
// GESTIÓN DE MATERIALES POR CONVERSACIÓN
// ============================================

export const conversationMaterialsService = {
    // Obtener materiales vinculados a una conversación
    async getLinkedMaterials(conversationId) {
        const response = await fetch(`${API_BASE}/conversations/${conversationId}/materials`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    // Obtener materiales disponibles para vincular
    async getAvailableMaterials(conversationId) {
        const response = await fetch(`${API_BASE}/conversations/${conversationId}/available-materials`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    // Vincular material a conversación
    async linkMaterial(conversationId, sourceId, options = {}) {
        const { link_type = 'manual', relevance_order = 0, usage_category = 'context' } = options;
        const response = await fetch(`${API_BASE}/conversations/${conversationId}/materials`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                source_id: sourceId,
                link_type,
                relevance_order,
                usage_category
            })
        });
        return handleResponse(response);
    },

    // Desvincular material de conversación
    async unlinkMaterial(conversationId, sourceId, reason = null) {
        const response = await fetch(`${API_BASE}/conversations/${conversationId}/materials/${sourceId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            body: JSON.stringify({ reason })
        });
        return handleResponse(response);
    },

    // Actualizar vinculación de material
    async updateLink(conversationId, sourceId, data) {
        const response = await fetch(`${API_BASE}/conversations/${conversationId}/materials/${sourceId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    }
};

// ============================================
// GESTIÓN DE SESIONES DE CHAT
// ============================================

export const chatSessionService = {
    // Obtener sesiones de una conversación
    async getSessions(conversationId) {
        const response = await fetch(`${API_BASE}/conversations/${conversationId}/sessions`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    // Iniciar nueva sesión
    async startSession(conversationId, data = {}) {
        const response = await fetch(`${API_BASE}/conversations/${conversationId}/sessions`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    // Obtener detalles de sesión
    async getSession(sessionId) {
        const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    // Finalizar sesión
    async endSession(sessionId, status = 'completed') {
        const response = await fetch(`${API_BASE}/sessions/${sessionId}/end`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status })
        });
        return handleResponse(response);
    }
};

// ============================================
// CHAT CON CONTEXTO DE CONVERSACIÓN
// ============================================

export const conversationChatService = {
    // Enviar mensaje con RAG filtrado por conversación
    async sendMessage(conversationId, message, sessionId = null) {
        const response = await fetch(`${API_BASE}/conversations/${conversationId}/chat`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ message, session_id: sessionId })
        });
        return handleResponse(response);
    }
};

export default {
    conversation: conversationService,
    materials: conversationMaterialsService,
    sessions: chatSessionService,
    chat: conversationChatService
};
