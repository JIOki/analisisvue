# Documentación Técnica del Sistema de Privacidad

## Sistema RAG con Gestión de Privacidad

**Versión del Documento:** 1.0  
**Fecha:** 7 de enero de 2025  
**Autor:** MiniMax Agent

---

## 1. Resumen del Sistema

El Sistema RAG (Retrieval-Augmented Generation) con Gestión de Privacidad es una aplicación que permite a los usuarios cargar material teórico y práctico, consultarlo mediante un modelo de lenguaje natural, y controlar quién puede acceder a su contenido. El sistema implementa un modelo dual de permisos que diferencia entre el acceso personal y la compartición con otros usuarios.

La arquitectura del sistema se compone de cuatro módulos principales interconectados. El módulo de gestión de documentos permite la carga y procesamiento de archivos en múltiples formatos, extrayendo texto y generando representaciones vectoriales para búsqueda semántica. El módulo de procesamiento de casos de uso gestiona el análisis de material práctico que sirve como referencia contextual para las respuestas del sistema. El módulo de chat inteligente proporciona la interfaz conversacional donde los usuarios realizan consultas y reciben respuestas fundamentadas en su biblioteca de conocimiento. Finalmente, el módulo de privacidad y compartición controla todos los niveles de acceso y los consentimientos necesarios para cada operación.

---

## 2. Arquitectura del Sistema

### 2.1 Componentes del Stack Tecnológico

El backend de la aplicación está construido sobre Node.js con Express, proporcionando una API RESTful robusta y escalable para todas las operaciones del sistema. La gestión de estado del servidor se complementa con JWT (JSON Web Tokens) para autenticación stateless, permitiendo un manejo eficiente de sesiones de usuario sin dependencia de almacenamiento server-side.

El frontend utiliza Vue.js 3 con la Composition API, aprovechando el sistema de reactividad del framework para mantener interfaces dinámicas y responsivas. La gestión de estado global se implementa mediante Pinia, el store oficial de Vue.js, que proporciona una API intuitiva para el manejo de datos compartidos entre componentes. El sistema de diseño se basa en PrimeVue, una biblioteca de componentes UI profesionales que garantiza consistencia visual y accesibilidad.

La capa de persistencia emplea PostgreSQL como base de datos relacional, complementada con la extensión pgvector para el almacenamiento y búsqueda de vectores de alta dimensionalidad. Esta combinación permite realizar consultas de similitud semántica eficientes, fundamentales para el funcionamiento del sistema RAG. Ollama proporciona los modelos de embedding y lenguaje, ejecutándose localmente para garantizar privacidad de datos y reducir latencia.

### 2.2 Flujo de Datos entre Componentes

El flujo de datos en el sistema sigue un patrón de capas claramente definido. Las solicitudes del usuario son recibidas por el router de Express, que las dirige al controlador correspondiente según el endpoint solicitado. Los controladores delegan la lógica de negocio a los servicios especializados, que a su vez interactúan con la base de datos PostgreSQL para persistencia y recuperación de información. El pipeline RAG integra búsquedas vectoriales con generación de texto mediante el modelo de lenguaje, aplicando filtros de privacidad en cada etapa del proceso.

---

## 3. Sistema de Privacidad

### 3.1 Modelo de Permisos Dual

El sistema implementa un modelo de permisos que distingue entre dos conceptos fundamentales: la accesibilidad del material para el propietario y su disponibilidad para otros usuarios. Esta diferenciación es crucial para mantener la funcionalidad del sistema como herramienta personal mientras permite la construcción progresiva de una base de conocimiento comunitaria.

El campo `is_ai_accessible` indica que el material está indexado en la base de conocimiento vectorial y disponible para consultas del propietario. Este campo siempre tiene valor TRUE para el usuario que posee el material, garantizando que cada usuario pueda utilizar su propia biblioteca en sus casos de uso y preguntas. Este campo no puede establecerse en FALSE ya que representa la capacidad fundamental del sistema de permitir acceso al material propio.

El campo `is_public_for_ai` determina si el material está disponible para que otros usuarios lo utilicen en sus consultas al sistema experto. Este campo acepta valores diferenciados según la categoría del material. Para material teórico como libros, revistas y documentos académicos, el valor por defecto es TRUE, reflejando la presunción de que este tipo de contenido es generalmente seguro para compartir. Para casos de uso prácticos, preguntas de chat y respuestas generadas, el valor por defecto es FALSE, protegiendo información potencialmente sensible.

### 3.2 Tabla de Compartición Entre Usuarios

La tabla `material_shares` gestiona la compartición directa de material entre usuarios específicos, independiente del flag `is_public_for_ai`. Esta estructura permite implementar un sistema de compartición granular donde los usuarios mantienen control total sobre quién accede a su contenido.

Los campos principales de la tabla incluyen `shared_by_user_id` identificando al usuario que comparte, `shared_with_user_id` identificando al destinatario, `legal_disclaimer_accepted` como boolean obligatorio que debe ser TRUE para validar la compartición, y campos de auditoría que registran la versión del aviso aceptado, dirección IP y timestamp de aceptación.

### 3.3 Tabla de Auditoría de Consentimientos

La tabla `consent_audit_log` mantiene un registro completo de todas las acciones de consentimiento realizadas por los usuarios. Los campos incluyen el tipo de consentimiento, referencia al recurso afectado, identificador del usuario, detalles adicionales en formato JSON, información de auditoría técnica como dirección IP y user agent, y campos para registrar revocaciones posteriores.

Los tipos de consentimiento soportados incluyen `ai_knowledge` para consentimiento de uso por la inteligencia artificial, `share_material` para consentimiento al compartir con otros usuarios, `response_public` para consentimiento de hacer pública una respuesta generada, y `question_public` para consentimiento de contribuir preguntas al conocimiento general.

---

## 4. Base de Datos

### 4.1 Esquema de Tablas Principales

La tabla `users` almacena la información de usuarios del sistema, incluyendo credenciales de autenticación y metadatos de perfil. La tabla `sources` contiene el material cargado por los usuarios, con campos para título, autor, categoría, estado de privacidad y fechas de creación y modificación. La tabla `chunks` almacena las fragmentaciones del material fuente con sus vectores correspondientes. La tabla `records` mantiene los registros de conversaciones y consultas realizadas por los usuarios.

Las tablas de privacidad incluyen `material_shares` para comparticiones directas, `consent_audit_log` para auditoría de consentimientos, y `knowledge_contributions` para contribuciones de usuarios al conocimiento general del sistema.

### 4.2 Triggers y Funciones

La función `set_privacy_defaults_by_category()` se ejecuta mediante un trigger antes de cada inserción en la tabla de fuentes. Esta función examina la categoría del material y aplica el valor por defecto apropiado para `is_public_for_ai`, respetando cualquier elección explícita del usuario.

La función `set_material_ai_accessible()` proporciona un mecanismo unificado para modificar el estado de privacidad de un material y todos sus elementos relacionados. Cuando un usuario cambia un material de privado a público o viceversa, esta función actualiza simultáneamente el registro principal, todos los chunks asociados y todos los registros de conversación, garantizando consistencia en toda la estructura de datos.

---

## 5. API de Privacidad

### 5.1 Endpoints de Consentimiento

El endpoint `PATCH /api/privacy/material/:id/ai-consent` permite modificar el flag `is_public_for_ai` de un material específico. El endpoint verifica que el usuario solicitante es el propietario del material, registra la acción en la tabla de auditoría de consentimientos y propaga los cambios a todos los elementos relacionados mediante la función `set_material_ai_accessible()`.

El endpoint `POST /api/privacy/material/:id/share` gestiona la compartición de material con otros usuarios. Recibe como parámetros el identificador del usuario destinatario, el nivel de permisos deseado y obligatoriamente el flag de aceptación del aviso legal. Si el flag de aceptación legal es FALSE, el endpoint rechaza la solicitud con un código de error 400.

### 5.2 Endpoints de Consulta

El endpoint `GET /api/privacy/material/:id` devuelve la configuración de privacidad de un material específico, incluyendo el estado de los flags de accesibilidad, la categoría del material y timestamps de modificación.

El endpoint `GET /api/privacy/dashboard` proporciona estadísticas agregadas sobre los materiales del usuario, incluyendo conteos de materiales públicos, privados, compartidos conmigo y compartidos por mí.

---

## 6. Pipeline RAG con Privacidad

### 6.1 Filtrado de Búsqueda

Cuando un usuario realiza una consulta, el sistema ejecuta la búsqueda vectorial contra múltiples conjuntos de datos. Primero, incluye los chunks y records propiedad del usuario identificado por `is_ai_accessible = TRUE` y `user_id = current_user`. Segundo, incluye los chunks y records marcados como públicos para la inteligencia artificial por cualquier usuario, identificados por `is_public_for_ai = TRUE`. Tercero, incluye los chunks y records de materiales compartidos directamente con el usuario mediante una subconsulta contra la tabla `material_shares`.

Esta lógica de filtrado se implementa en la capa de servicio del backend, antes de ejecutar la consulta vectorial, garantizando que ningún material no autorizado sea procesado por el modelo de lenguaje.

### 6.2 Contribución de Conocimiento

El endpoint `POST /api/knowledge/contribute` permite a los usuarios contribuir respuestas generadas al conocimiento base del sistema. El proceso incluye sanitización de texto para eliminar información personal potencialmente sensible, generación de embeddings para el par pregunta/respuesta, y persistencia con un flag de `status = pending_review` para moderación opcional antes de hacer el contenido públicamente disponible.

---

## 7. Seguridad

### 7.1 Autenticación y Autorización

El sistema emplea JWT para autenticación stateless, con tokens que incluyen el identificador del usuario y fecha de expiración. Los endpoints protegidos verifican la validez del token y la identidad del usuario antes de permitir operaciones. La verificación de propiedad de recursos se implementa en cada endpoint que modifica o consulta datos sensibles.

### 7.2 Protección contra Amenazas

Las medidas de seguridad incluyen protección contra inyección SQL mediante consultas parametrizadas, sanitización de entradas de usuario, validación de tipos y formatos de datos, y limitación de tasas para prevenir ataques de fuerza bruta. La información sensible en logs se maneja según las políticas de privacidad configuradas.

---

## 8. Mantenimiento y Escalabilidad

### 8.1 Índices de Rendimiento

La base de datos emplea índices en campos frecuentemente consultados para optimizar el rendimiento de las operaciones de privacidad. Los índices principales incluyen idx_sources_user_id para consultas por propietario, idx_sources_category para filtrado por tipo de material, idx_sources_is_public_for_ai para búsquedas de material público, e idx_material_shares_shared_with_user_id para consultas de compartición.

### 8.2 Monitoreo

El endpoint `/health` proporciona verificación del estado del sistema, incluyendo conectividad de base de datos y disponibilidad de servicios externos. El script de health check ubicado en `/scripts/health_check.sh` permite verificar múltiples aspectos del sistema de manera automatizada.

---

**Documento preparado para参考 y mantenimiento del sistema.**
