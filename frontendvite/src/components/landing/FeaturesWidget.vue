<template>
  <div class="features-section relative py-20 lg:py-32">
    <div class="container mx-auto px-6">
      <!-- Section Header -->
      <div class="text-center mb-16 animate-glass-fade">
        <h2 class="text-4xl lg:text-5xl font-bold text-glass-primary mb-6">
          Características <span class="bg-gradient-to-r from-primary-500 to-primary-alt-500 bg-clip-text text-transparent">Potentes</span>
        </h2>
        <p class="text-xl text-glass-secondary max-w-3xl mx-auto">
          Descubre cómo nuestro sistema RAG transforma la manera en que interactúas con tu información
        </p>
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <!-- Feature 1: Intelligent Chat -->
        <div class="glass-card p-8 lg:p-10 group hover:shadow-glass-card-hover transition-all duration-500 animate-glass-slide">
          <div class="flex items-start gap-6">
            <div class="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-alt-500 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4h16v2H4zm0 4h10v2H4zm0 4h16v2H4zm0 4h10v2H4z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-glass-primary mb-4">Chat Inteligente</h3>
              <p class="text-glass-secondary mb-6 leading-relaxed">
                Mantén conversaciones naturales con tu documentación. Nuestro modelo IA comprende el contexto 
                y proporciona respuestas precisas basadas en tus documentos.
              </p>
              <ul class="space-y-3">
                <li class="flex items-center gap-3 text-glass-secondary">
                  <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                  Conversaciones contextuales avanzadas
                </li>
                <li class="flex items-center gap-3 text-glass-secondary">
                  <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                  Respuestas basadas en evidencia
                </li>
                <li class="flex items-center gap-3 text-glass-secondary">
                  <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                  Sistema de calificaciones de calidad
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Feature 2: Document Processing -->
        <div class="glass-card p-8 lg:p-10 group hover:shadow-glass-card-hover transition-all duration-500 animate-glass-slide" style="animation-delay: 0.1s">
          <div class="flex items-start gap-6">
            <div class="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-alt-500 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-glass-primary mb-4">Procesamiento de Documentos</h3>
              <p class="text-glass-secondary mb-6 leading-relaxed">
                Carga y procesa documentos fácilmente con nuestro sistema drag & drop. 
                Soportamos múltiples formatos y extraemos información relevante automáticamente.
              </p>
              <ul class="space-y-3">
                <li class="flex items-center gap-3 text-glass-secondary">
                  <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                  Formatos: Word, Excel, TXT
                </li>
                <li class="flex items-center gap-3 text-glass-secondary">
                  <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                  Extracción automática de texto
                </li>
                <li class="flex items-center gap-3 text-glass-secondary">
                  <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                  Procesamiento en tiempo real
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Feature 3: Semantic Search -->
        <div class="glass-card p-8 lg:p-10 group hover:shadow-glass-card-hover transition-all duration-500 animate-glass-slide" style="animation-delay: 0.2s">
          <div class="flex items-start gap-6">
            <div class="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-alt-500 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-glass-primary mb-4">Búsqueda Semántica</h3>
              <p class="text-glass-secondary mb-6 leading-relaxed">
                Encuentra exactamente lo que necesitas con nuestra búsqueda inteligente. 
                Comprende el significado detrás de tus consultas, no solo las palabras.
              </p>
              <ul class="space-y-3">
                <li class="flex items-center gap-3 text-glass-secondary">
                  <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                  Algoritmos de embeddings avanzados
                </li>
                <li class="flex items-center gap-3 text-glass-secondary">
                  <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                  Comprensión contextual profunda
                </li>
                <li class="flex items-center gap-3 text-glass-secondary">
                  <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                  Resultados relevantes al instante
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Feature 4: Multi-User Support -->
        <div class="glass-card p-8 lg:p-10 group hover:shadow-glass-card-hover transition-all duration-500 animate-glass-slide" style="animation-delay: 0.3s">
          <div class="flex items-start gap-6">
            <div class="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-alt-500 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-glass-primary mb-4">Sistema Multiusuario</h3>
              <p class="text-glass-secondary mb-6 leading-relaxed">
                Colabora de manera segura con tu equipo. Cada usuario tiene su propio espacio 
                con autenticación robusta y gestión de permisos.
              </p>
              <ul class="space-y-3">
                <li class="flex items-center gap-3 text-glass-secondary">
                  <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                  Autenticación JWT segura
                </li>
                <li class="flex items-center gap-3 text-glass-secondary">
                  <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                  Espacios de trabajo privados
                </li>
                <li class="flex items-center gap-3 text-glass-secondary">
                  <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                  Gestión de usuarios y roles
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom CTA -->
      <div class="text-center mt-16 animate-glass-fade">
        <div class="glass-subtle inline-block p-8 rounded-3xl">
          <h3 class="text-2xl font-bold text-glass-primary mb-4">
            ¿Listo para revolucionar tu análisis de documentos?
          </h3>
          <p class="text-glass-secondary mb-6">
            Únete a cientos de empresas que ya usan nuestro sistema RAG
          </p>
          <button class="btn-primary px-8 py-4 rounded-2xl font-semibold hover:shadow-glass-modal transition-all duration-300">
            Comenzar Ahora
          </button>
        </div>
      </div>
    </div>

    <!-- Decorative Background Elements -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      <div class="absolute top-20 left-10 w-64 h-64 glass-subtle rounded-full opacity-30 animate-glass-fade"></div>
      <div class="absolute bottom-20 right-10 w-48 h-48 glass-subtle rounded-full opacity-20 animate-glass-fade" style="animation-delay: 1s"></div>
      <div class="absolute top-1/2 left-1/4 w-32 h-32 glass-subtle rounded-full opacity-25 animate-glass-fade" style="animation-delay: 2s"></div>
    </div>
  </div>
</template>

<script setup>
// Features functionality would go here
</script>

<style scoped>
.features-section {
  position: relative;
}

/* Enhanced card hover effects */
.features-section .glass-card {
  position: relative;
  overflow: hidden;
}

.features-section .glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transition: left 0.6s ease;
}

.features-section .glass-card:hover::before {
  left: 100%;
}

/* Floating decorative elements animation */
@keyframes floatSlow {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

.features-section .absolute.w-64,
.features-section .absolute.w-48,
.features-section .absolute.w-32 {
  animation: floatSlow 8s ease-in-out infinite;
}

/* List item hover effects */
.features-section li {
  transition: all 0.3s ease;
  position: relative;
}

.features-section li:hover {
  transform: translateX(5px);
  color: var(--text-primary);
}

/* Gradient text effects */
.features-section .bg-gradient-to-r {
  position: relative;
}

.features-section .bg-gradient-to-r::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(to right, #3B82F6, #8B5CF6);
  border-radius: 1px;
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.features-section .bg-gradient-to-r:hover::after {
  transform: scaleX(1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .features-section .glass-card {
    margin-bottom: 1rem;
  }
  
  .features-section h2 {
    font-size: 2rem;
  }
  
  .features-section h3 {
    font-size: 1.5rem;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .features-section .glass-card {
    background: rgba(255, 255, 255, 0.98);
    border: 2px solid #3B82F6;
  }
  
  .dark .features-section .glass-card {
    background: rgba(0, 0, 0, 0.98);
  }
  
  .features-section li:hover {
    color: #3B82F6;
  }
}
</style>