/**
 * Audit Service - Registro de acciones de usuarios para compliance y seguridad
 */

import pool from '../db.js';

/**
 * Registra una acción en el log de auditoría
 * @param {object} params - Parámetros del registro
 * @param {string} params.action - Tipo de acción (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, etc.)
 * @param {number|string} params.userId - ID del usuario que realizó la acción
 * @param {string} params.resourceType - Tipo de recurso afectado
 * @param {string} params.resourceId - ID del recurso afectado
 * @param {object} params.metadata - Metadatos adicionales de la acción
 * @param {object} params.req - Request object para obtener IP y user agent
 */
export const logAudit = async ({ action, userId, resourceType, resourceId, metadata = {}, req }) => {
    try {
        const ip = req?.headers?.['x-forwarded-for']?.split(',')[0] ||
                   req?.socket?.remoteAddress ||
                   req?.ip ||
                   'unknown';

        const userAgent = req?.headers?.['user-agent'] || 'unknown';

        const insertQuery = `
            INSERT INTO audit_logs (
                user_id,
                action,
                resource_type,
                resource_id,
                ip_address,
                user_agent,
                metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;

        const result = await pool.query(insertQuery, [
            userId,
            action,
            resourceType,
            resourceId,
            ip,
            userAgent,
            JSON.stringify(metadata)
        ]);

        return result.rows[0]?.id;
    } catch (error) {
        console.error('Error al registrar auditoría:', error);
        // No lanzamos el error para no interrumpir la operación principal
        // pero sí lo registramos
        return null;
    }
};

/**
 * Obtiene los logs de auditoría de un usuario
 * @param {number|string} userId - ID del usuario
 * @param {object} options - Opciones de paginación y filtros
 */
export const getUserAuditLogs = async (userId, { page = 1, limit = 50, action = null } = {}) => {
    try {
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE user_id = $1';
        const params = [userId];

        if (action) {
            whereClause += ` AND action = $2`;
            params.push(action);
        }

        params.push(limit, offset);

        const selectQuery = `
            SELECT
                id,
                action,
                resource_type,
                resource_id,
                ip_address,
                user_agent,
                metadata,
                created_at
            FROM audit_logs
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `;

        const result = await pool.query(selectQuery, params);
        return result.rows;
    } catch (error) {
        console.error('Error al obtener logs de auditoría:', error);
        throw error;
    }
};

/**
 * Obtiene los logs de auditoría de un recurso específico
 * @param {string} resourceType - Tipo de recurso
 * @param {string} resourceId - ID del recurso
 */
export const getResourceAuditLogs = async (resourceType, resourceId) => {
    try {
        const selectQuery = `
            SELECT
                id,
                user_id,
                action,
                ip_address,
                user_agent,
                metadata,
                created_at
            FROM audit_logs
            WHERE resource_type = $1 AND resource_id = $2
            ORDER BY created_at DESC
        `;

        const result = await pool.query(selectQuery, [resourceType, resourceId]);
        return result.rows;
    } catch (error) {
        console.error('Error al obtener logs de auditoría del recurso:', error);
        throw error;
    }
};

export default {
    logAudit,
    getUserAuditLogs,
    getResourceAuditLogs
};
