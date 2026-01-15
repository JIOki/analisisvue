// backend/src/routes/authRoutes.js
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import db from '../db.js';
import { authenticateToken, generateToken } from '../middleware/authMiddleware.js';
import fs from 'fs-extra';
import path from 'path';

const router = Router();
const SALT_ROUNDS = 12;

/**
 * POST /api/auth/register
 * Registro de nuevo usuario
 */
router.post('/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('name').trim().isLength({ min: 2 }).withMessage('El nombre es requerido'),
    body('username').optional().trim().isLength({ min: 3 })
  ],
  async (req, res) => {
    try {
      // Validar inputs
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          details: errors.array() 
        });
      }

      const { email, password, name, username } = req.body;

      // Verificar si el email ya existe
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Email ya registrado',
          message: 'Ya existe una cuenta con este email' 
        });
      }

      // Hashear password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Generar username si no se proporciona
      const finalUsername = username || email.split('@')[0];

      // Crear usuario
      const result = await db.query(
        `INSERT INTO users (username, email, password_hash, name, is_active, created_at)
         VALUES ($1, $2, $3, $4, true, NOW())
         RETURNING id, username, email, name, created_at`,
        [finalUsername, email, passwordHash, name]
      );

      const newUser = result.rows[0];

      // Crear carpeta personal del usuario para documentos
      const userUploadPath = path.join(process.cwd(), 'uploads', newUser.id.toString());
      await fs.ensureDir(userUploadPath);
      console.log(`📁 Carpeta creada para usuario ${newUser.id}: ${userUploadPath}`);

      // Generar token
      const token = generateToken(newUser.id);

      console.log(`Nuevo usuario registrado: ${email}`);

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.name,
          createdAt: newUser.created_at
        },
        token
      });

    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ 
        error: 'Error al registrar usuario',
        message: 'Ocurrió un error al crear la cuenta' 
      });
    }
  }
);

/**
 * POST /api/auth/login
 * Login de usuario
 */
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          details: errors.array() 
        });
      }

      const { email, password } = req.body;

      // Buscar usuario
      const result = await db.query(
        'SELECT id, username, email, password_hash, name, is_active FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ 
          error: 'Credenciales inválidas',
          message: 'Email o contraseña incorrectos' 
        });
      }

      const user = result.rows[0];

      // Verificar si la cuenta está activa
      if (!user.is_active) {
        return res.status(403).json({ 
          error: 'Cuenta desactivada',
          message: 'Su cuenta ha sido desactivada. Contacte al administrador.' 
        });
      }

      // Verificar password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ 
          error: 'Credenciales inválidas',
          message: 'Email o contraseña incorrectos' 
        });
      }

      // Actualizar last_login
      await db.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      // Generar token
      const token = generateToken(user.id);

      console.log(`Usuario logueado: ${email}`);

      res.json({
        message: 'Login exitoso',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name
        },
        token
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ 
        error: 'Error al iniciar sesión',
        message: 'Ocurrió un error al procesar el login' 
      });
    }
  }
);

/**
 * GET /api/auth/profile
 * Obtener perfil del usuario autenticado
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, username, email, name, created_at, last_login 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // Obtener estadísticas del usuario
    const statsResult = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM sources WHERE user_id = $1) as total_documents,
        (SELECT COUNT(*) FROM conversations WHERE user_id = $1) as total_conversations,
        (SELECT COUNT(*) FROM messages m 
         JOIN conversations c ON m.conversation_id = c.id 
         WHERE c.user_id = $1 AND m.role = 'assistant') as total_responses
      `,
      [req.user.id]
    );

    const stats = statsResult.rows[0];

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        lastLogin: user.last_login
      },
      stats: {
        totalDocuments: parseInt(stats.total_documents),
        totalConversations: parseInt(stats.total_conversations),
        totalResponses: parseInt(stats.total_responses)
      }
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

/**
 * PUT /api/auth/profile
 * Actualizar perfil del usuario
 */
router.put('/profile',
  authenticateToken,
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('username').optional().trim().isLength({ min: 3 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          details: errors.array() 
        });
      }

      const { name, username } = req.body;
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name) {
        updates.push(`name = $${paramCount}`);
        values.push(name);
        paramCount++;
      }

      if (username) {
        updates.push(`username = $${paramCount}`);
        values.push(username);
        paramCount++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No hay datos para actualizar' });
      }

      values.push(req.user.id);

      const result = await db.query(
        `UPDATE users SET ${updates.join(', ')} 
         WHERE id = $${paramCount}
         RETURNING id, username, email, name`,
        values
      );

      res.json({
        message: 'Perfil actualizado exitosamente',
        user: result.rows[0]
      });

    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({ error: 'Error al actualizar perfil' });
    }
  }
);

/**
 * PUT /api/auth/change-password
 * Cambiar contraseña
 */
router.put('/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          details: errors.array() 
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Obtener password actual
      const result = await db.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Verificar contraseña actual
      const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

      if (!isValid) {
        return res.status(401).json({ 
          error: 'Contraseña incorrecta',
          message: 'La contraseña actual no es correcta' 
        });
      }

      // Hashear nueva contraseña
      const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

      // Actualizar contraseña
      await db.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, req.user.id]
      );

      console.log(`Contraseña cambiada para usuario: ${req.user.email}`);

      res.json({ message: 'Contraseña actualizada exitosamente' });

    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({ error: 'Error al cambiar contraseña' });
    }
  }
);

/**
 * POST /api/auth/logout
 * Logout (cliente debe eliminar el token)
 */
router.post('/logout', authenticateToken, async (req, res) => {
  // En un sistema con sesiones, aquí se invalidaría el token
  // Por ahora, el cliente simplemente elimina el token
  console.log(`Usuario deslogueado: ${req.user.email}`);
  res.json({ message: 'Logout exitoso' });
});

/**
 * GET /api/auth/verify
 * Verificar si el token es válido
 */
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      name: req.user.name
    }
  });
});

export default router;
