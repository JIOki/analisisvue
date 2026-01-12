# Sistema de Ratings para Chat - Guía de Integración

## Descripción
Sistema completo de calificaciones para evaluar la utilidad de las respuestas del chat, con indicadores visuales en tiempo real y persistencia en backend.

## Componentes Creados

### 1. RatingButton.vue
Componente reutilizable para calificar respuestas con:
- Botones para útiles (👍), neutrales (❓) y no útiles (👎)
- Indicadores de porcentaje de utilidad
- Contador de votos en tiempo real
- Estados visuales diferenciados
- Deshabilitación automática tras votar
- Tooltips informativos

### 2. ChatMessage.vue
Componente mejorado para mostrar mensajes del chat:
- Formateo de texto con soporte para markdown
- Integración automática con RatingButton
- Timestamps y metadatos
- Responsive design
- Código destacado y enlaces clickeables

### 3. ChatInterface.vue (chatvue.vue)
Interfaz de chat actualizada con:
- Sistema de ratings integrado
- Persistencia de calificaciones del usuario
- Manejo de eventos de rating
- Carga de estadísticas desde backend

### 4. RatingService.js
Servicio backend de ejemplo con endpoints:
- `POST /api/ratings` - Enviar/actualizar calificación
- `GET /api/ratings/message/:id` - Estadísticas de mensaje
- `GET /api/ratings/user/:id` - Calificaciones del usuario

## Características Técnicas

### Funcionalidad
- ✅ Calificación en 3 niveles (útil/neutral/no útil)
- ✅ Actualización de contadores en tiempo real
- ✅ Indicador de porcentaje de utilidad
- ✅ Prevención de votos duplicados por usuario
- ✅ Persistencia en backend vía API REST
- ✅ Estados visuales diferenciados
- ✅ Responsive para móviles y desktop

### Diseño
- 🎨 Iconos claros (👍 👎 ❓)
- 🎨 Colores distintivos (verde, rojo, gris)
- 🎨 Animaciones suaves en hover y click
- 🎨 Tooltips informativos en español
- 🎨 Interfaz responsive

### Integración
- 🔗 Eventos Vue para comunicación entre componentes
- 🔗 API REST estándar para backend
- 🔗 Compatibilidad con sistemas de autenticación
- 🔗 Manejo de errores y estados de carga

## Endpoints del Backend

```javascript
// Enviar/actualizar calificación
POST /api/ratings
{
  "message_id": "msg_123",
  "rating": "useful",
  "user_id": "user_456"
}

// Respuesta
{
  "success": true,
  "stats": {
    "useful_count": 5,
    "not_useful_count": 1,
    "neutral_count": 2,
    "total_votes": 8
  }
}

// Obtener estadísticas de un mensaje
GET /api/ratings/message/:message_id

// Obtener calificaciones de un usuario
GET /api/ratings/user/:user_id
```

## Esquema de Base de Datos

```sql
CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  message_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  rating ENUM('useful', 'not_useful', 'neutral') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_message (message_id, user_id)
);
```

## Uso

### En el Template
```vue
<ChatMessage
  :message="messageData"
  @rating-changed="handleRatingChange"
/>
```

### En el Script
```javascript
function handleRatingChange(event) {
  console.log('Rating actualizado:', event);
  // event = { messageId, rating, stats }
}
```

### Props del RatingButton
```vue
<RatingButton
  message-id="msg_123"
  :initial-stats="{ useful_count: 5, total_votes: 8 }"
  user-rating="useful"
  @rating-changed="handleRatingChange"
/>
```

## Personalización

### Colores
Los colores se pueden personalizar en los estilos de RatingButton.vue:
- Útil: `#10b981` (verde)
- No útil: `#ef4444` (rojo)  
- Neutral: `#9ca3af` (gris)

### Iconos
Cambiar iconos en `ratingOptions`:
```javascript
const ratingOptions = [
  {
    value: 'useful',
    label: 'Útil',
    icon: '✅', // Cambiar aquí
    count_key: 'useful_count',
    tooltip: 'Marcar como respuesta útil'
  },
  // ...
];
```

### Estados Visuales
Modificar clases CSS:
- `active` - Botón seleccionado
- `disabled` - Botón deshabilitado
- `has-voted` - Usuario ya votó
- `loading` - Estado de carga

## Notas de Implementación

1. **Compatibilidad**: Compatible con Vue 3 y Composition API
2. **Rendimiento**: Componentes optimizados con computed properties
3. **Accesibilidad**: Semántica HTML adecuada y tooltips
4. **Responsive**: Funciona en móviles y desktop
5. **Estado**: Manejo reactivo del estado con Vue
6. **Error Handling**: Manejo de errores en todas las operaciones async

## Próximos Pasos

1. Implementar endpoints en el backend
2. Crear tabla de ratings en la base de datos
3. Configurar sistema de autenticación de usuarios
4. Añadir notificaciones (toast) para feedback visual
5. Implementar analytics de ratings
6. Añadir filtros y ordenamiento por utilidad