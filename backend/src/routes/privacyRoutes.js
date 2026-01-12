/**
 * Rutas de Privacidad y Consentimiento
 * Endpoints para gestión de:
 * - Configuración de privacidad de materiales
 * - Compartición de material entre usuarios
 * - Auditoría de consentimientos
 * - Consultas RAG con filtros de privacidad
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import privacyService from '../services/privacyService.js';

const router = Router();

// ============================================================================
// ENDPOINT: Obtener configuración de privacidad de un material
// ============================================================================
/**
 * GET /api/privacy/material/:id
 * Obtiene la configuración de privacidad de un material específico
 */
router.get('/material/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await privacyService.getMaterialPrivacy(id, userId);
    
    if (!result) {
      return res.status(404).json({ 
        error: 'Material no encontrado',
        message: 'El material solicitado no existe o ha sido eliminado'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: result.id,
        title: result.title,
        category: result.category,
        isAiAccessible: result.is_ai_accessible,
        isPublicForAI: result.is_public_for_ai,
        aiConsentAt: result.ai_consent_at,
        isOwner: result.user_id === userId,
        defaultForCategory: result.category === 'MarcoTeorico'
      }
    });
  } catch (error) {
    console.error('Error en GET /api/privacy/material/:id:', error);
    res.status(500).json({ 
      error: 'Error interno',
      message: 'Error al obtener configuración de privacidad' 
    });
  }
});

// ============================================================================
// ENDPOINT: Modificar flag is_public_for_ai de un material
// ============================================================================
/**
 * PATCH /api/privacy/material/:id/ai-consent
 * Modifica el flag de consentimiento para uso por IA
 * Body: { isPublicForAI: boolean }
 */
router.patch('/material/:id/ai-consent', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublicForAI } = req.body;
    const userId = req.user.id;
    
    // Validación de entrada
    if (typeof isPublicForAI !== 'boolean') {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'El campo isPublicForAI es obligatorio y debe ser un valor booleano'
      });
    }
    
    // Obtener información del material para mostrar advertencias
    const materialInfo = await privacyService.getMaterialPrivacy(id, userId);
    
    if (!materialInfo) {
      return res.status(404).json({
        error: 'Material no encontrado',
        message: 'El material solicitado no existe'
      });
    }
    
    // Advertencias específicas por categoría
    let warning = null;
    if (materialInfo.category === 'CasoUso' && isPublicForAI) {
      warning = 'ADVERTENCIA: Los casos de uso pueden contener información sensible. Al marcar como público, otros usuarios podrán acceder a este conocimiento.';
    } else if (materialInfo.category === 'ChatUpload' && isPublicForAI) {
      warning = 'ADVERTENCIA: Las preguntas y material de chat pueden contener información confidencial. Considere anonimizar antes de hacer público.';
    }
    
    const result = await privacyService.setMaterialPublicForAI(
      id,
      userId,
      isPublicForAI,
      req.ip || req.connection.remoteAddress,
      req.headers['user-agent']
    );
    
    if (!result.success) {
      return res.status(403).json({
        error: 'Operación no permitida',
        message: result.error
      });
    }
    
    res.json({
      success: true,
      message: isPublicForAI 
        ? 'Material теперь доступен для использования ИИ другими пользователями'
        : 'Material теперь приватен для использования ИИ',
      warning: warning,
      data: {
        materialId: result.data.materialId,
        isPublicForAI: result.data.isPublicForAI,
        aiConsentAt: result.data.aiConsentAt
      }
    });
  } catch (error) {
    console.error('Error en PATCH /api/privacy/material/:id/ai-consent:', error);
    res.status(500).json({ 
      error: 'Error interno',
      message: 'Error al actualizar consentimiento de IA' 
    });
  }
});

// ============================================================================
// ENDPOINT: Compartir material con otro usuario
// ============================================================================
/**
 * POST /api/privacy/material/:id/share
 * Comparte un material con otro usuario específico
 * Body: { targetEmail: string, permissionLevel: 'viewer'|'editor', legalAccepted: boolean }
 */
router.post('/material/:id/share', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { targetEmail, permissionLevel, legalAccepted } = req.body;
    const userId = req.user.id;
    
    // Validación de entrada
    if (!targetEmail || typeof targetEmail !== 'string') {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'El campo targetEmail es obligatorio'
      });
    }
    
    if (!permissionLevel || !['viewer', 'editor'].includes(permissionLevel)) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'permissionLevel debe ser "viewer" o "editor"'
      });
    }
    
    if (legalAccepted !== true) {
      return res.status(400).json({
        error: 'Aviso legal requerido',
        message: 'Debe aceptar el aviso legal de responsabilidad para compartir',
        legalRequired: true,
        legalDisclaimer: {
          title: 'Aviso Legal de Responsabilidad',
          content: 'Al compartir este material, usted asume total responsabilidad sobre: (1) Los derechos de autor del contenido compartido; (2) La veracidad y precisión de la información; (3) Cualquier consecuencia derivada del uso del material por parte del destinatario. El sistema actúa únicamente como medio de transmisión y no se hace responsable del contenido compartido entre usuarios.'
        }
      });
    }
    
    const result = await privacyService.shareMaterialWithUser(
      id,
      userId,
      targetEmail.toLowerCase().trim(),
      permissionLevel,
      legalAccepted,
      req.ip || req.connection.remoteAddress,
      req.headers['user-agent']
    );
    
    if (!result.success) {
      if (result.legalRequired) {
        return res.status(400).json({
          error: 'Aviso legal requerido',
          message: result.error
        });
      }
      return res.status(400).json({
        error: 'Operación fallida',
        message: result.error
      });
    }
    
    res.json({
      success: true,
      message: `Material compartido exitosamente con ${result.data.sharedWith}`,
      data: result.data
    });
  } catch (error) {
    console.error('Error en POST /api/privacy/material/:id/share:', error);
    res.status(500).json({ 
      error: 'Error interno',
      message: 'Error al compartir material' 
    });
  }
});

// ============================================================================
// ENDPOINT: Revocar compartición de material
// ============================================================================
/**
 * DELETE /api/privacy/material/:id/share/:targetUserId
 * Revoca la compartición de un material con un usuario específico
 */
router.delete('/material/:id/share/:targetUserId', authenticateToken, async (req, res) => {
  try {
    const { id, targetUserId } = req.params;
    const userId = req.user.id;
    
    const result = await privacyService.revokeMaterialShare(id, userId, targetUserId);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Operación fallida',
        message: result.error
      });
    }
    
    res.json({
      success: true,
      message: 'Compartición revocada exitosamente',
      data: result.data
    });
  } catch (error) {
    console.error('Error en DELETE /api/privacy/material/:id/share/:targetUserId:', error);
    res.status(500).json({ 
      error: 'Error interno',
      message: 'Error al revocar compartición' 
    });
  }
});

// ============================================================================
// ENDPOINT: Obtener lista de usuarios con quienes se ha compartido un material
// ============================================================================
/**
 * GET /api/privacy/material/:id/shares
 * Obtiene la lista de usuarios con quienes se ha compartido un material
 */
router.get('/material/:id/shares', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await privacyService.getMaterialShares(id, userId);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Operación fallida',
        message: result.error
      });
    }
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error en GET /api/privacy/material/:id/shares:', error);
    res.status(500).json({ 
      error: 'Error interno',
      message: 'Error al obtener lista de comparticiones' 
    });
  }
});

// ============================================================================
// ENDPOINT: Obtener materiales compartidos conmigo
// ============================================================================
/**
 * GET /api/privacy/shared-with-me
 * Obtiene la lista de materiales que otros usuarios han compartido conmigo
 */
router.get('/shared-with-me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await privacyService.getSharedWithMe(userId);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error en GET /api/privacy/shared-with-me:', error);
    res.status(500).json({ 
      error: 'Error interno',
      message: 'Error al obtener materiales compartidos' 
    });
  }
});

// ============================================================================
// ENDPOINT: Obtener estadísticas de privacidad
// ============================================================================
/**
 * GET /api/privacy/stats
 * Obtiene estadísticas de privacidad y materiales del usuario
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await privacyService.getPrivacyStats(userId);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error en GET /api/privacy/stats:', error);
    res.status(500).json({ 
      error: 'Error interno',
      message: 'Error al obtener estadísticas' 
    });
  }
});

// ============================================================================
// ENDPOINT: Obtener historial de consentimientos
// ============================================================================
/**
 * GET /api/privacy/consent-history
 * Obtiene el historial de consentimientos del usuario
 */
router.get('/consent-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    
    const result = await privacyService.getConsentHistory(userId, limit);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error en GET /api/privacy/consent-history:', error);
    res.status(500).json({ 
      error: 'Error interno',
      message: 'Error al obtener historial de consentimientos' 
    });
  }
});

// ============================================================================
// ENDPOINT: Verificar acceso a material para IA (para el pipeline RAG)
// ============================================================================
/**
 * POST /api/privacy/check-access
 * Verifica si el usuario puede acceder a un material para uso de IA
 * Body: { materialId: string }
 */
router.post('/check-access', authenticateToken, async (req, res) => {
  try {
    const { materialId } = req.body;
    const userId = req.user.id;
    
    if (!materialId) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'El campo materialId es obligatorio'
      });
    }
    
    const result = await privacyService.canUserAccessForAI(materialId, userId);
    
    res.json({
      success: true,
      data: {
        materialId,
        allowed: result.allowed,
        reason: result.reason,
        isOwner: result.isOwner || false,
        permission: result.permission || null
      }
    });
  } catch (error) {
    console.error('Error en POST /api/privacy/check-access:', error);
    res.status(500).json({ 
      error: 'Error interno',
      message: 'Error al verificar acceso' 
    });
  }
});

// ============================================================================
// ENDPOINT: Obtener filtros de privacidad para consultas RAG
// ============================================================================
/**
 * GET /api/privacy/rag-filters
 * Obtiene los filtros de privacidad formateados para usar en consultas RAG
 */
router.get('/rag-filters', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const filters = privacyService.buildPrivacyFilters(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        filters: filters,
        description: {
          ownerAccess: 'Material propio del usuario (siempre accesible)',
          publicAI: 'Material marcado como público para IA por cualquier usuario',
          sharedAccess: 'Material compartido directamente con el usuario',
          combinedAccess: 'Combinación de todos los filtros anteriores'
        }
      }
    });
  } catch (error) {
    console.error('Error en GET /api/privacy/rag-filters:', error);
    res.status(500).json({ 
      error: 'Error interno',
      message: 'Error al obtener filtros RAG' 
    });
  }
});

export default router;
