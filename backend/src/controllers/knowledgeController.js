// Controlador de conocimiento - Maneja contribuciones de usuarios al sistema RAG
import pool from '../db.js';
import { embed } from '../ollama.js';
import { sanitizeText } from '../utils/privacyUtils.js';
import { logAudit } from '../services/auditService.js';

/**
 * Contribuye una respuesta generada al conocimiento base del sistema
 * POST /api/knowledge/contribute
 */
export const contributeKnowledge = async (req, res) => {
    try {
        const {
            original_pool,
            generated_answer,
            category_tags = [],
            conversation_context,
            source_material_id
        } = req.body;

        const userId = req.user.id;

        // Validación básica
        if (!original_pool.query || !generated_answer) {
            return res.status(400).json({
                error: 'Faltan datos requeridos',
                details: 'La pregunta original y la respuesta generada son obligatorias'
            });
        }

        // Validación de longitud
        if (generated_answer.length < 50) {
            return res.status(400).json({
                error: 'Respuesta demasiado corta',
                details: 'Las contribuciones deben tener al menos 50 caracteres de contenido sustancial'
            });
        }

        // Sanitización de texto - Eliminar PII antes de guardar
        const sanitizedAnswer = sanitizeText(generated_answer);
        const sanitizedQuery = sanitizeText(original_pool.query);

        // Verificar si después de sanitización hay contenido
        if (sanitizedAnswer.length < 50) {
            return res.status(400).json({
                error: 'Contenido insuficiente después de sanitización',
                details: 'La respuesta contenía datos personales sensibles o fue demasiado reducida al eliminar datos sensibles'
            });
        }

        // Generar embedding para la contribución
        const embeddingText = `Pregunta: ${sanitizedQuery}\nRespuesta: ${sanitizedAnswer}`;
        const embedding = await embed(embeddingText);

        // Insertar en la base de datos
        const insertQuery = `
            INSERT INTO knowledge_contributions (
                user_id,
                original_pool.query,
                generated_answer,
                sanitized_pool.query,
                sanitized_answer,
                embedding,
                category_tags,
                conversation_context,
                source_material_id,
                source_type,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'user_contribution', 'pending_review')
            RETURNING id, created_at, status
        `;

        const result = await pool.query(insertQuery, [
            userId,
            original_pool.query,
            generated_answer,
            sanitizedQuery,
            sanitizedAnswer,
            JSON.stringify(embedding),
            category_tags,
            conversation_context || null,
            source_material_id || null
        ]);

        const contribution = result.rows[0];

        // Registrar en auditoría
        await logAudit({
            action: 'KNOWLEDGE_CONTRIBUTION',
            userId,
            resourceType: 'knowledge_contribution',
            resourceId: contribution.id,
            metadata: {
                category_tags,
                has_source_material: !!source_material_id,
                answer_length: generated_answer.length,
                sanitized_length: sanitizedAnswer.length
            },
            req
        });

        res.status(201).json({
            message: 'Contribución recibida exitosamente',
            contribution: {
                id: contribution.id,
                status: contribution.status,
                created_at: contribution.created_at,
                message: 'Tu contribución será revisada y estará disponible públicamente tras aprobación'
            }
        });

    } catch (error) {
        console.error('Error en contributeKnowledge:', error);
        res.status(500).json({
            error: 'Error interno al procesar contribución',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtiene el historial de contribuciones del usuario
 * GET /api/knowledge/contributions
 */
export const getContributionHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.pool.query.page) || 1;
        const limit = Math.min(parseInt(req.pool.query.limit) || 20, 100);
        const offset = (page - 1) * limit;

        // Obtener total de contribuciones
        const countQuery = `
            SELECT COUNT(*) as total
            FROM knowledge_contributions
            WHERE user_id = $1
        `;
        const countResult = await pool.query(countQuery, [userId]);
        const total = parseInt(countResult.rows[0].total);

        // Obtener contribuciones con paginación
        const selectQuery = `
            SELECT
                id,
                original_pool.query,
                generated_answer,
                sanitized_answer,
                category_tags,
                status,
                review_notes,
                created_at,
                updated_at,
                (SELECT COUNT(*) FROM knowledge_contributions WHERE user_id = $1) as total_count
            FROM knowledge_contributions
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await pool.query(selectQuery, [userId, limit, offset]);

        res.json({
            contributions: result.rows.map(row => ({
                id: row.id,
                query_preview: row.original_pool.query.substring(0, 100) + '...',
                answer_preview: row.generated_answer.substring(0, 100) + '...',
                category_tags: row.category_tags,
                status: row.status,
                review_notes: row.review_notes,
                created_at: row.created_at,
                updated_at: row.updated_at
            })),
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error en getContributionHistory:', error);
        res.status(500).json({
            error: 'Error al obtener historial de contribuciones'
        });
    }
};

/**
 * Obtiene estado de una contribución específica
 * GET /api/knowledge/contributions/:id/status
 */
export const getContributionStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const contributionId = req.params.id;

        const queryStr = `
            SELECT
                id,
                status,
                review_notes,
                created_at,
                updated_at,
                sanitized_answer
            FROM knowledge_contributions
            WHERE id = $1 AND user_id = $2
        `;

        const result = await pool.query(pool.queryStr, [contributionId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Contribución no encontrada'
            });
        }

        const contribution = result.rows[0];

        res.json({
            contribution: {
                id: contribution.id,
                status: contribution.status,
                status_label: getStatusLabel(contribution.status),
                review_notes: contribution.review_notes,
                created_at: contribution.created_at,
                updated_at: contribution.updated_at,
                is_public: contribution.status === 'approved'
            }
        });

    } catch (error) {
        console.error('Error en getContributionStatus:', error);
        res.status(500).json({
            error: 'Error al obtener estado de contribución'
        });
    }
};

/**
 * Elimina una contribución propia (solo si está pendiente)
 * DELETE /api/knowledge/contributions/:id
 */
export const deleteContribution = async (req, res) => {
    try {
        const userId = req.user.id;
        const contributionId = req.params.id;

        // Verificar que la contribución existe y pertenece al usuario
        const checkQuery = `
            SELECT status FROM knowledge_contributions
            WHERE id = $1 AND user_id = $2
        `;

        const checkResult = await pool.query(checkQuery, [contributionId, userId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Contribución no encontrada'
            });
        }

        if (checkResult.rows[0].status !== 'pending_review') {
            return res.status(400).json({
                error: 'No se puede eliminar',
                details: 'Solo se pueden eliminar contribuciones en estado pendiente de revisión'
            });
        }

        // Eliminar contribución
        const deleteQuery = `
            DELETE FROM knowledge_contributions
            WHERE id = $1 AND user_id = $2
            RETURNING id
        `;

        await pool.query(deleteQuery, [contributionId, userId]);

        // Registrar auditoría
        await logAudit({
            action: 'KNOWLEDGE_CONTRIBUTION_DELETE',
            userId,
            resourceType: 'knowledge_contribution',
            resourceId: contributionId,
            req
        });

        res.json({
            message: 'Contribución eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error en deleteContribution:', error);
        res.status(500).json({
            error: 'Error al eliminar contribución'
        });
    }
};

/**
 * Obtiene contribuciones públicas (aprobadas)
 * GET /api/knowledge/public
 */
export const getPublicContributions = async (req, res) => {
    try {
        const page = parseInt(req.pool.query.page) || 1;
        const limit = Math.min(parseInt(req.pool.query.limit) || 20, 100);
        const offset = (page - 1) * limit;
        const category = req.pool.query.category;

        // Construir pool.query con filtros opcionales
        let whereClause = "WHERE status = 'approved'";
        const params = [limit, offset];

        if (category) {
            whereClause += ` AND $3 = ANY(category_tags)`;
            params.unshift(category);
        }

        // Contar total
        const countQuery = `
            SELECT COUNT(*) as total
            FROM knowledge_contributions
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, params.slice(0, -2));
        const total = parseInt(countResult.rows[0].total);

        // Obtener contribuciones
        const selectQuery = `
            SELECT
                id,
                sanitized_pool.query,
                sanitized_answer,
                category_tags,
                contributor_name,
                created_at
            FROM knowledge_contributions
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `;

        const result = await pool.query(selectQuery, params);

        res.json({
            contributions: result.rows.map(row => ({
                id: row.id,
                query: row.sanitized_pool.query,
                answer: row.sanitized_answer,
                category_tags: row.category_tags,
                contributor_name: row.contributor_name || 'Anónimo',
                created_at: row.created_at
            })),
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error en getPublicContributions:', error);
        res.status(500).json({
            error: 'Error al obtener contribuciones públicas'
        });
    }
};

/**
 * Verifica si el texto contiene datos sensibles
 * POST /api/knowledge/check-sensitivity
 */
export const checkSensitivity = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                error: 'Texto requerido'
            });
        }

        const sanitized = sanitizeText(text);
        const wasModified = sanitized !== text;

        res.json({
            is_clean: !wasModified,
            original_length: text.length,
            sanitized_length: sanitized.length,
            warning: wasModified ? 'El texto fue modificado para proteger información sensible' : null,
            sanitized_text: sanitized
        });

    } catch (error) {
        console.error('Error en checkSensitivity:', error);
        res.status(500).json({
            error: 'Error al verificar sensibilidad del texto'
        });
    }
};

/**
 * Obtiene estadísticas de contribuciones del usuario
 * GET /api/knowledge/stats
 */
export const getContributionStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const queryStr = `
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as approval_rate
            FROM knowledge_contributions
            WHERE user_id = $1
        `;

        const result = await pool.query(pool.queryStr, [userId]);
        const stats = result.rows[0];

        res.json({
            stats: {
                total: parseInt(stats.total),
                pending: parseInt(stats.pending),
                approved: parseInt(stats.approved),
                rejected: parseInt(stats.rejected),
                approval_rate: stats.approval_rate ? parseFloat(stats.approval_rate).toFixed(1) : 0
            }
        });

    } catch (error) {
        console.error('Error en getContributionStats:', error);
        res.status(500).json({
            error: 'Error al obtener estadísticas'
        });
    }
};

/**
 * Helper para obtener etiqueta legible del estado
 */
function getStatusLabel(status) {
    const labels = {
        'pending_review': 'Pendiente de revisión',
        'approved': 'Aprobado',
        'rejected': 'Rechazado'
    };
    return labels[status] || status;
}
