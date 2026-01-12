/**
 * Servicio de Privacidad y Consentimiento
 * Maneja toda la lógica de negocio relacionada con:
 * - Flags de is_public_for_ai para materiales
 * - Compartición de material entre usuarios
 * - Auditoría de consentimientos
 * - Filtros de privacidad para el pipeline RAG
 */

import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Obtiene la configuración de privacidad de un material
 * @param {string} materialId - ID del material
 * @param {string} userId - ID del usuario solicitante
 * @returns {Promise<Object|null>} Configuración de privacidad o null si no existe
 */
export async function getMaterialPrivacy(materialId, userId) {
  try {
    const query = `
      SELECT 
        id, user_id, is_ai_accessible, is_public_for_ai, 
        ai_consent_at, ai_consent_version, category, title
      FROM sources 
      WHERE id = $1 AND is_deleted = FALSE
    `;
    const result = await pool.query(query, [materialId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error en getMaterialPrivacy:', error);
    throw error;
  }
}

/**
 * Verifica si un usuario puede acceder a un material para uso de IA
 * Reglas:
 * - El propietario SIEMPRE tiene acceso (is_ai_accessible = TRUE)
 * - Otros usuarios solo si is_public_for_ai = TRUE
 * - Usuarios con quienes se compartió directamente también tienen acceso
 * @param {string} materialId - ID del material
 * @param {string} userId - ID del usuario solicitante
 * @returns {Promise<Object>} Objeto con acceso permitido y razón
 */
export async function canUserAccessForAI(materialId, userId) {
  try {
    const material = await getMaterialPrivacy(materialId, userId);
    
    if (!material) {
      return { allowed: false, reason: 'Material no encontrado' };
    }
    
    // El propietario siempre tiene acceso
    if (material.user_id === userId) {
      return { allowed: true, reason: 'Propietario del material', isOwner: true };
    }
    
    // Verificar si es público para IA
    if (material.is_public_for_ai === true) {
      return { allowed: true, reason: 'Material público para IA', isOwner: false };
    }
    
    // Verificar compartición directa
    const shareCheck = await pool.query(
      `SELECT id, permission_level FROM material_shares 
       WHERE material_id = $1 AND shared_with_user_id = $2 AND status = 'active'
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [materialId, userId]
    );
    
    if (shareCheck.rows.length > 0) {
      return { 
        allowed: true, 
        reason: 'Material compartido directamente', 
        isOwner: false,
        permission: shareCheck.rows[0].permission_level 
      };
    }
    
    return { allowed: false, reason: 'Material privado' };
  } catch (error) {
    console.error('Error en canUserAccessForAI:', error);
    throw error;
  }
}

/**
 * Modifica el flag is_public_for_ai de un material
 * Solo el propietario puede modificar este flag
 * @param {string} materialId - ID del material
 * @param {string} userId - ID del usuario propietario
 * @param {boolean} isPublic - Nuevo valor para is_public_for_ai
 * @param {string} userIp - IP del usuario (para auditoría)
 * @param {string} userAgent - User agent del usuario (para auditoría)
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function setMaterialPublicForAI(materialId, userId, isPublic, userIp = null, userAgent = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Verificar propiedad del material
    const ownerCheck = await client.query(
      `SELECT id, user_id, title, category FROM sources WHERE id = $1 AND is_deleted = FALSE`,
      [materialId]
    );
    
    if (ownerCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Material no encontrado' };
    }
    
    if (ownerCheck.rows[0].user_id !== userId) {
      await client.query('ROLLBACK');
      return { success: false, error: 'No autorizado a modificar este material' };
    }
    
    const material = ownerCheck.rows[0];
    
    // Verificar restricciones por categoría
    // Los casos prácticos no pueden ser públicos por defecto, pero el usuario puede elegir
    // Esta verificación es informativa, no bloqueante (el usuario tiene control)
    
    // Actualizar el material principal
    const updateQuery = `
      UPDATE sources 
      SET is_public_for_ai = $1, ai_consent_at = NOW(), ai_consent_version = 'v2.0'
      WHERE id = $2
      RETURNING id, is_public_for_ai, ai_consent_at
    `;
    const updateResult = await client.query(updateQuery, [isPublic, materialId]);
    
    // Actualizar chunks asociados
    await client.query(
      `UPDATE chunks SET is_public_for_ai = $1 WHERE source_id = $2`,
      [isPublic, materialId]
    );
    
    // Actualizar records asociados
    await client.query(
      `UPDATE records SET is_public_for_ai = $1 WHERE source_id = $2`,
      [isPublic, materialId]
    );
    
    // Registrar en auditoría de consentimientos
    const auditId = uuidv4();
    await client.query(
      `INSERT INTO consent_audit_log 
       (id, consent_type, resource_type, resource_id, user_id, consent_details, ip_address, user_agent, consent_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        auditId,
        'ai_knowledge',
        'source',
        materialId,
        userId,
        JSON.stringify({
          material_title: material.title,
          material_category: material.category,
          previous_value: !isPublic,
          new_value: isPublic
        }),
        userIp,
        userAgent,
        'v2.0'
      ]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      data: {
        materialId,
        isPublicForAI: isPublic,
        aiConsentAt: updateResult.rows[0].ai_consent_at
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en setMaterialPublicForAI:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Comparte un material con otro usuario específico
 * Requiere aceptación del aviso legal de responsabilidad
 * @param {string} materialId - ID del material a compartir
 * @param {string} ownerId - ID del usuario propietario
 * @param {string} targetEmail - Email del usuario con quien compartir
 * @param {string} permissionLevel - Nivel de permiso ('viewer' o 'editor')
 * @param {boolean} legalAccepted - Aceptación del aviso legal
 * @param {string} userIp - IP del usuario (para auditoría)
 * @param {string} userAgent - User agent del usuario
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function shareMaterialWithUser(materialId, ownerId, targetEmail, permissionLevel, legalAccepted, userIp = null, userAgent = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Verificar que el usuario objetivo existe
    const targetUser = await client.query(
      `SELECT id, username, email FROM users WHERE email = $1 AND is_active = true`,
      [targetEmail]
    );
    
    if (targetUser.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Usuario destinatario no encontrado o inactivo' };
    }
    
    const targetUserId = targetUser.rows[0].id;
    
    // No se puede compartir consigo mismo
    if (targetUserId === ownerId) {
      await client.query('ROLLBACK');
      return { success: false, error: 'No puede compartir el material consigo mismo' };
    }
    
    // Verificar propiedad del material
    const ownerCheck = await client.query(
      `SELECT id, user_id, title FROM sources WHERE id = $1 AND is_deleted = FALSE`,
      [materialId]
    );
    
    if (ownerCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Material no encontrado' };
    }
    
    if (ownerCheck.rows[0].user_id !== ownerId) {
      await client.query('ROLLBACK');
      return { success: false, error: 'No autorizado a compartir este material' };
    }
    
    // Verificar aceptación del aviso legal (OBLIGATORIO)
    if (legalAccepted !== true) {
      await client.query('ROLLBACK');
      return { 
        success: false, 
        error: 'Debe aceptar el aviso legal de responsabilidad para compartir',
        legalRequired: true
      };
    }
    
    // Verificar si ya existe una compartición
    const existingShare = await client.query(
      `SELECT id, status FROM material_shares 
       WHERE material_id = $1 AND shared_with_user_id = $2`,
      [materialId, targetUserId]
    );
    
    if (existingShare.rows.length > 0) {
      if (existingShare.rows[0].status === 'active') {
        await client.query('ROLLBACK');
        return { success: false, error: 'El material ya está compartido con este usuario' };
      }
      
      // Si existe pero está inactiva, reactivar
      await client.query(
        `UPDATE material_shares 
         SET status = 'active', shared_by_user_id = $1, permission_level = $2,
             legal_disclaimer_accepted = $3, legal_disclaimer_accepted_at = NOW(),
             legal_disclaimer_ip = $4, updated_at = NOW()
         WHERE id = $5`,
        [ownerId, permissionLevel, legalAccepted, userIp, existingShare.rows[0].id]
      );
    } else {
      // Crear nueva compartición
      const shareId = uuidv4();
      await client.query(
        `INSERT INTO material_shares 
         (id, material_id, shared_by_user_id, shared_with_user_id, permission_level,
          legal_disclaimer_accepted, legal_disclaimer_version, legal_disclaimer_accepted_at,
          legal_disclaimer_ip, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'v1.0', NOW(), $7, 'active')`,
        [shareId, materialId, ownerId, targetUserId, permissionLevel, legalAccepted, userIp]
      );
    }
    
    // Registrar en auditoría
    const auditId = uuidv4();
    await client.query(
      `INSERT INTO consent_audit_log 
       (id, consent_type, resource_type, resource_id, user_id, consent_details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        auditId,
        'share_material',
        'material_share',
        materialId,
        ownerId,
        JSON.stringify({
          shared_with: targetEmail,
          shared_with_user_id: targetUserId,
          permission_level: permissionLevel,
          material_title: ownerCheck.rows[0].title
        }),
        userIp,
        userAgent
      ]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      data: {
        materialId,
        sharedWith: targetEmail,
        permissionLevel,
        sharedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en shareMaterialWithUser:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Revoca la compartición de un material con un usuario específico
 * @param {string} materialId - ID del material
 * @param {string} ownerId - ID del usuario propietario
 * @param {string} targetUserId - ID del usuario con quien se compartió
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function revokeMaterialShare(materialId, ownerId, targetUserId) {
  try {
    // Verificar propiedad del material
    const ownerCheck = await pool.query(
      `SELECT id, user_id FROM sources WHERE id = $1 AND is_deleted = FALSE`,
      [materialId]
    );
    
    if (ownerCheck.rows.length === 0) {
      return { success: false, error: 'Material no encontrado' };
    }
    
    if (ownerCheck.rows[0].user_id !== ownerId) {
      return { success: false, error: 'No autorizado a revocar compartición de este material' };
    }
    
    // Actualizar estado de la compartición
    const result = await pool.query(
      `UPDATE material_shares 
       SET status = 'revoked', updated_at = NOW()
       WHERE material_id = $1 AND shared_with_user_id = $2 AND status = 'active'
       RETURNING id`,
      [materialId, targetUserId]
    );
    
    if (result.rowCount === 0) {
      return { success: false, error: 'No se encontró compartición activa para revocar' };
    }
    
    return {
      success: true,
      data: {
        materialId,
        revokedForUserId: targetUserId,
        revokedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error en revokeMaterialShare:', error);
    throw error;
  }
}

/**
 * Obtiene la lista de usuarios con quienes se ha compartido un material
 * @param {string} materialId - ID del material
 * @param {string} ownerId - ID del usuario propietario
 * @returns {Promise<Array>} Lista de comparticiones
 */
export async function getMaterialShares(materialId, ownerId) {
  try {
    // Verificar propiedad
    const ownerCheck = await pool.query(
      `SELECT id, user_id FROM sources WHERE id = $1 AND is_deleted = FALSE`,
      [materialId]
    );
    
    if (ownerCheck.rows.length === 0) {
      return { success: false, error: 'Material no encontrado' };
    }
    
    if (ownerCheck.rows[0].user_id !== ownerId) {
      return { success: false, error: 'No autorizado a ver comparticiones de este material' };
    }
    
    const query = `
      SELECT 
        ms.id, ms.permission_level, ms.status, ms.created_at, ms.expires_at,
        u.id as shared_user_id, u.username, u.email, u.name
      FROM material_shares ms
      JOIN users u ON ms.shared_with_user_id = u.id
      WHERE ms.material_id = $1 AND ms.shared_by_user_id = $2
      ORDER BY ms.created_at DESC
    `;
    
    const result = await pool.query(query, [materialId, ownerId]);
    
    return {
      success: true,
      data: result.rows
    };
  } catch (error) {
    console.error('Error en getMaterialShares:', error);
    throw error;
  }
}

/**
 * Obtiene materiales compartidos con un usuario específico
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de materiales compartidos
 */
export async function getSharedWithMe(userId) {
  try {
    const query = `
      SELECT 
        s.*, ms.id as share_id, ms.permission_level, ms.shared_by_user_id,
        ms.created_at as shared_at,
        owner.username as owner_username, owner.email as owner_email, owner.name as owner_name
      FROM material_shares ms
      JOIN sources s ON ms.material_id = s.id
      JOIN users owner ON ms.shared_by_user_id = owner.id
      WHERE ms.shared_with_user_id = $1 
        AND ms.status = 'active'
        AND (ms.expires_at IS NULL OR ms.expires_at > NOW())
        AND s.is_deleted = FALSE
      ORDER BY ms.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    return {
      success: true,
      data: result.rows
    };
  } catch (error) {
    console.error('Error en getSharedWithMe:', error);
    throw error;
  }
}

/**
 * Construye los filtros de privacidad para consultas RAG
 * Este es el método principal usado por el pipeline RAG
 * @param {string} userId - ID del usuario realizando la consulta
 * @returns {Object} Objeto con filtros SQL para la búsqueda vectorial
 */
export function buildPrivacyFilters(userId) {
  return {
    // Filtro para el propietario: siempre tiene acceso a su material
    ownerAccess: `s.user_id = '${userId}'`,
    
    // Filtro para material público para IA
    publicAI: `s.is_public_for_ai = true`,
    
    // Filtro para material compartido directamente
    sharedAccess: `s.id IN (
      SELECT material_id FROM material_shares 
      WHERE shared_with_user_id = '${userId}' 
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
    )`,
    
    // Filtro combinado para buscar en todo el contenido accesible
    combinedAccess: `(s.user_id = '${userId}' OR s.is_public_for_ai = true OR s.id IN (
      SELECT material_id FROM material_shares 
      WHERE shared_with_user_id = '${userId}' 
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
    ))`
  };
}

/**
 * Obtiene los chunks accesibles para un usuario en consultas RAG
 * Aplica los filtros de privacidad automáticamente
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} Lista de chunks accesibles
 */
export async function getAccessibleChunksForUser(userId, limit = 100) {
  try {
    const filters = buildPrivacyFilters(userId);
    
    const query = `
      SELECT 
        c.id, c.source_id, c.chunk_index, c.content, c.embedding,
        s.title as source_title, s.category, s.user_id as owner_id,
        s.is_public_for_ai
      FROM chunks c
      JOIN sources s ON c.source_id = s.id
      WHERE s.is_deleted = FALSE
        AND (${filters.combinedAccess})
      ORDER BY c.created_at DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    
    return {
      success: true,
      data: result.rows,
      count: result.rows.length,
      filters: {
        isOwner: true,
        isPublicAI: true,
        isShared: true
      }
    };
  } catch (error) {
    console.error('Error en getAccessibleChunksForUser:', error);
    throw error;
  }
}

/**
 * Busca chunks relevantes aplicando filtros de privacidad
 * @param {string} userId - ID del usuario
 * @param {Array<number>} embedding - Vector de embedding de la consulta
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} Chunks más similares accesibles para el usuario
 */
export async function searchRelevantChunksWithPrivacy(userId, embedding, limit = 10) {
  try {
    const filters = buildPrivacyFilters(userId);
    
    // Consulta usando pgvector con filtros de privacidad
    const query = `
      SELECT 
        c.id, c.source_id, c.chunk_index, c.content, c.embedding,
        s.title as source_title, s.category, s.user_id as owner_id,
        s.is_public_for_ai,
        1 - (c.embedding <=> $1) as similarity
      FROM chunks c
      JOIN sources s ON c.source_id = s.id
      WHERE s.is_deleted = FALSE
        AND (${filters.combinedAccess})
      ORDER BY c.embedding <=> $1
      LIMIT $2
    `;
    
    const result = await pool.query(query, [embedding, limit]);
    
    return {
      success: true,
      data: result.rows,
      count: result.rows.length
    };
  } catch (error) {
    console.error('Error en searchRelevantChunksWithPrivacy:', error);
    throw error;
  }
}

/**
 * Obtiene el historial de consentimientos de un usuario
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de registros
 * @returns {Promise<Array>} Historial de consentimientos
 */
export async function getConsentHistory(userId, limit = 50) {
  try {
    const query = `
      SELECT *
      FROM consent_audit_log
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [userId, limit]);
    
    return {
      success: true,
      data: result.rows
    };
  } catch (error) {
    console.error('Error en getConsentHistory:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de privacidad para un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estadísticas de materiales
 */
export async function getPrivacyStats(userId) {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_materials,
        COUNT(*) FILTER (WHERE is_public_for_ai = true) as public_materials,
        COUNT(*) FILTER (WHERE is_public_for_ai = false) as private_materials,
        COUNT(*) FILTER (WHERE category = 'MarcoTeorico') as theoretical,
        COUNT(*) FILTER (WHERE category = 'CasoUso') as practical,
        COUNT(*) FILTER (WHERE category = 'ChatUpload') as chat_uploads,
        COUNT(*) FILTER (WHERE category = 'AIResponse') as ai_responses
      FROM sources
      WHERE user_id = $1 AND is_deleted = FALSE
    `;
    
    const statsResult = await pool.query(statsQuery, [userId]);
    
    const sharesQuery = `
      SELECT 
        COUNT(*) as total_shares,
        COUNT(*) FILTER (WHERE status = 'active') as active_shares
      FROM material_shares
      WHERE shared_by_user_id = $1
    `;
    
    const sharesResult = await pool.query(sharesQuery, [userId]);
    
    const receivedQuery = `
      SELECT COUNT(*) as received_count
      FROM material_shares
      WHERE shared_with_user_id = $1 AND status = 'active'
    `;
    
    const receivedResult = await pool.query(receivedQuery, [userId]);
    
    return {
      success: true,
      data: {
        materials: statsResult.rows[0],
        shares: sharesResult.rows[0],
        received: receivedResult.rows[0]
      }
    };
  } catch (error) {
    console.error('Error en getPrivacyStats:', error);
    throw error;
  }
}

export default {
  getMaterialPrivacy,
  canUserAccessForAI,
  setMaterialPublicForAI,
  shareMaterialWithUser,
  revokeMaterialShare,
  getMaterialShares,
  getSharedWithMe,
  buildPrivacyFilters,
  getAccessibleChunksForUser,
  searchRelevantChunksWithPrivacy,
  getConsentHistory,
  getPrivacyStats
};
