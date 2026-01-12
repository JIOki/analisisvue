// Rutas de conocimiento - Contribución de respuestas al sistema RAG
import express from 'express';
import { contributeKnowledge, getContributionHistory, getContributionStatus, deleteContribution, getPublicContributions, checkSensitivity, getContributionStats } from '../controllers/knowledgeController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * POST /api/knowledge/contribute
 * Contribuye una respuesta generada al conocimiento base
 */
router.post('/contribute', contributeKnowledge);

/**
 * GET /api/knowledge/contributions
 * Obtiene el historial de contribuciones del usuario
 */
router.get('/contributions', getContributionHistory);

/**
 * GET /api/knowledge/contributions/:id/status
 * Obtiene el estado de una contribución específica
 */
router.get('/contributions/:id/status', getContributionStatus);

/**
 * DELETE /api/knowledge/contributions/:id
 * Elimina una contribución propia (solo si está pendiente)
 */
router.delete('/contributions/:id', deleteContribution);

/**
 * GET /api/knowledge/public
 * Obtiene contribuciones públicas (aprobadas)
 */
router.get('/public', getPublicContributions);

/**
 * POST /api/knowledge/check-sensitivity
 * Verifica si el texto contiene datos sensibles
 */
router.post('/check-sensitivity', checkSensitivity);

/**
 * GET /api/knowledge/stats
 * Obtiene estadísticas de contribuciones del usuario
 */
router.get('/stats', getContributionStats);

export default router;
