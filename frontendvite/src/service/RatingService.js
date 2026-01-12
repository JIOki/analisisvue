// Ejemplo de implementación del backend para el sistema de ratings
// Este código debería ir en tu backend (Node.js/Express)

// POST /api/ratings
// Enviar/actualizar una calificación para un mensaje
router.post('/ratings', async (req, res) => {
  try {
    const { message_id, rating, user_id } = req.body;
    
    // Validar datos
    if (!message_id || !rating || !user_id) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    
    // Validar que el rating sea válido
    const validRatings = ['useful', 'not_useful', 'neutral'];
    if (!validRatings.includes(rating)) {
      return res.status(400).json({ error: 'Rating inválido' });
    }
    
    // Verificar si ya existe una calificación del usuario para este mensaje
    const existingRating = await Rating.findOne({
      where: { message_id, user_id }
    });
    
    if (existingRating) {
      // Actualizar calificación existente
      await existingRating.update({ rating });
    } else {
      // Crear nueva calificación
      await Rating.create({ message_id, user_id, rating });
    }
    
    // Obtener estadísticas actualizadas
    const stats = await getMessageRatingStats(message_id);
    
    res.json({
      success: true,
      message: 'Calificación guardada correctamente',
      stats
    });
    
  } catch (error) {
    console.error('Error al guardar calificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/ratings/message/:message_id
// Obtener estadísticas de calificaciones para un mensaje
router.get('/ratings/message/:message_id', async (req, res) => {
  try {
    const { message_id } = req.params;
    
    const stats = await getMessageRatingStats(message_id);
    
    res.json(stats);
    
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/ratings/user/:user_id
// Obtener todas las calificaciones de un usuario
router.get('/ratings/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const userRatings = await Rating.findAll({
      where: { user_id },
      attributes: ['message_id', 'rating']
    });
    
    // Convertir a formato de objeto para fácil acceso
    const ratingsMap = {};
    userRatings.forEach(rating => {
      ratingsMap[rating.message_id] = {
        rating: rating.rating,
        timestamp: rating.updated_at
      };
    });
    
    res.json(ratingsMap);
    
  } catch (error) {
    console.error('Error al obtener calificaciones del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Función auxiliar para obtener estadísticas de calificaciones
async function getMessageRatingStats(message_id) {
  const ratings = await Rating.findAll({
    where: { message_id },
    attributes: [
      'rating',
      [sequelize.fn('COUNT', sequelize.col('rating')), 'count']
    ],
    group: ['rating']
  });
  
  let stats = {
    useful_count: 0,
    not_useful_count: 0,
    neutral_count: 0,
    total_votes: 0
  };
  
  ratings.forEach(rating => {
    const count = parseInt(rating.get('count'));
    stats.total_votes += count;
    
    switch (rating.rating) {
      case 'useful':
        stats.useful_count = count;
        break;
      case 'not_useful':
        stats.not_useful_count = count;
        break;
      case 'neutral':
        stats.neutral_count = count;
        break;
    }
  });
  
  return stats;
}

// Esquema de la base de datos para Ratings
/*
CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  message_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  rating ENUM('useful', 'not_useful', 'neutral') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_message (message_id, user_id)
);
*/