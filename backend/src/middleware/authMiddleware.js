// backend/src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import db from '../db.js';

// Secret para JWT (debe estar en .env en producción)
const JWT_SECRET = process.env.JWT_SECRET || 'desarrollo-secret-cambiar-en-produccion-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Middleware para verificar token JWT y autenticar usuario
 * Agrega req.user con los datos del usuario autenticado
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({ 
        error: 'Acceso denegado',
        message: 'No se proporcionó token de autenticación' 
      });
    }

    // Verificar y decodificar token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expirado',
          message: 'Su sesión ha expirado, por favor inicie sesión nuevamente' 
        });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Token inválido',
          message: 'Token de autenticación inválido' 
        });
      }
      throw err;
    }

    // Verificar que el usuario existe y está activo
    const result = await db.query(
      'SELECT id, username, email, name, is_active, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Usuario no encontrado',
        message: 'El usuario asociado al token no existe' 
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ 
        error: 'Cuenta desactivada',
        message: 'Su cuenta ha sido desactivada' 
      });
    }

    // Agregar información del usuario al request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      isActive: user.is_active
    };

    next();
  } catch (error) {
    console.error('Error en authMiddleware:', error);
    return res.status(500).json({ 
      error: 'Error de autenticación',
      message: 'Error al verificar el token de autenticación' 
    });
  }
};

/**
 * Middleware opcional que no falla si no hay token
 * Útil para endpoints que funcionan con o sin autenticación
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await db.query(
      'SELECT id, username, email, name, is_active FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (result.rows.length > 0) {
      req.user = {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        name: result.rows[0].name
      };
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }

  next();
};

/**
 * Genera un token JWT para un usuario
 */
export const generateToken = (userId, expiresIn = JWT_EXPIRES_IN) => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Verifica si un token es válido sin lanzar error
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

/**
 * Middleware para verificar que el usuario es admin (si se necesita)
 */
export const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  // Verificar si el usuario es admin (email específico o role admin si se agrega)
  const result = await db.query(
    'SELECT email FROM users WHERE id = $1',
    [req.user.id]
  );

  if (result.rows.length > 0 && result.rows[0].email === 'admin@sistema-rag.local') {
    next();
  } else {
    return res.status(403).json({ 
      error: 'Acceso denegado',
      message: 'Se requieren permisos de administrador' 
    });
  }
};

export default {
  authenticateToken,
  optionalAuth,
  generateToken,
  verifyToken,
  requireAdmin
};
