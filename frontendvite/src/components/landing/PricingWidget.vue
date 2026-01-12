<template>
  <div class="pricing-section relative py-20 lg:py-32">
    <div class="container mx-auto px-6">
      <!-- Section Header -->
      <div class="text-center mb-16 animate-glass-fade">
        <h2 class="text-4xl lg:text-5xl font-bold text-glass-primary mb-6">
          Planes y <span class="bg-gradient-to-r from-primary-500 to-primary-alt-500 bg-clip-text text-transparent">Precios</span>
        </h2>
        <p class="text-xl text-glass-secondary max-w-3xl mx-auto">
          Elige el plan que mejor se adapte a tus necesidades. Todas las opciones incluyen acceso completo a las funcionalidades core.
        </p>
      </div>

      <!-- Pricing Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-8 max-w-6xl mx-auto">
        <!-- Starter Plan -->
        <div class="glass-card p-8 lg:p-10 text-center group hover:shadow-glass-card-hover transition-all duration-500 animate-glass-slide">
          <div class="mb-8">
            <h3 class="text-2xl font-bold text-glass-primary mb-4">Starter</h3>
            <p class="text-glass-secondary mb-6">Perfecto para individuos y proyectos pequeños</p>
            
            <!-- Price -->
            <div class="mb-6">
              <span class="text-4xl font-bold text-glass-primary">Gratis</span>
              <span class="text-glass-secondary">/永久</span>
            </div>
            
            <!-- Features -->
            <ul class="space-y-4 text-left mb-8">
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-semantic-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                <span class="text-glass-secondary">Hasta 10 documentos</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-semantic-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                <span class="text-glass-secondary">Chat ilimitado</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-semantic-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                <span class="text-glass-secondary">Búsqueda semántica</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-semantic-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                <span class="text-glass-secondary">Soporte comunitario</span>
              </li>
            </ul>
          </div>
          
          <button class="glass-button w-full py-4 rounded-2xl font-semibold hover:shadow-glass-card-hover transition-all duration-300">
            Comenzar Gratis
          </button>
        </div>

        <!-- Professional Plan (Featured) -->
        <div class="glass-elevated p-8 lg:p-10 text-center group relative transform scale-105 animate-glass-slide" style="animation-delay: 0.1s">
          <!-- Popular Badge -->
          <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div class="bg-gradient-to-r from-primary-500 to-primary-alt-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
              Más Popular
            </div>
          </div>
          
          <div class="mb-8">
            <h3 class="text-2xl font-bold text-glass-primary mb-4">Professional</h3>
            <p class="text-glass-secondary mb-6">Ideal para profesionales y equipos pequeños</p>
            
            <!-- Price -->
            <div class="mb-6">
              <span class="text-4xl font-bold text-glass-primary">$29</span>
              <span class="text-glass-secondary">/mes</span>
            </div>
            
            <!-- Features -->
            <ul class="space-y-4 text-left mb-8">
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-semantic-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                <span class="text-glass-secondary">Hasta 500 documentos</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-semantic-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                <span class="text-glass-secondary">Chat ilimitado</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-semantic-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                <span class="text-glass-secondary">Análisis avanzados</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-semantic-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                <span class="text-glass-secondary">Sistema de calificaciones</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-semantic-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                <span class="text-glass-secondary">Soporte por email</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-semantic-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                <span class="text-glass-secondary">Exportación de resultados</span>
              </li>
            </ul>
          </div>
          
          <button class="btn-primary w-full py-4 rounded-2xl font-semibold hover:shadow-glass-modal transition-all duration-300">
            Probar Profesional
          </button>
        </div>

        <!-- Enterprise Plan -->
        <div class="glass-card p-8 lg:p-10 text-center group hover:shadow-glass-card-hover transition-all duration-500 animate-glass-slide" style="animation-delay: 0.2s">
          <div class="mb-8">
            <h3 class="text-2xl font-bold text-glass-primary mb-4">Enterprise</h3>
            <p class="text-glass-secondary mb-6">Para organizaciones grandes y uso intensivo</p>
            
            <!-- Price -->
            <div class="mb-6">
              <span class="text-4xl font-bold text-glass-primary">Personalizado</span>
            </div>
            
            <!-- Features -->
            <ul class="space-y-4 text-left mb-8">
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-semantic-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                <span class="text-glass-secondary">Documentos ilimitados</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-semantic-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                <span class="text-glass-secondary">Configuración personalizada</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-semantic-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                <span class="text-glass-secondary">APIs y integraciones</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-semantic-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                <span class="text-glass-secondary">Soporte dedicado 24/7</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-semantic-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                <span class="text-glass-secondary">Formación y onboarding</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-semantic-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                <span class="text-glass-secondary">SLA garantizado</span>
              </li>
            </ul>
          </div>
          
          <button class="glass-button w-full py-4 rounded-2xl font-semibold hover:shadow-glass-card-hover transition-all duration-300">
            Contactar Ventas
          </button>
        </div>
      </div>

      <!-- Bottom Section -->
      <div class="text-center mt-16 animate-glass-fade">
        <div class="glass-subtle inline-block p-8 rounded-3xl">
          <h3 class="text-2xl font-bold text-glass-primary mb-4">
            ¿Necesitas algo diferente?
          </h3>
          <p class="text-glass-secondary mb-6">
            También ofrecemos planes personalizados para organizaciones con necesidades específicas
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button class="glass-button px-6 py-3 rounded-xl font-semibold hover:shadow-glass-card-hover transition-all duration-300">
              Solicitar Demo
            </button>
            <button class="glass-button px-6 py-3 rounded-xl font-semibold hover:shadow-glass-card-hover transition-all duration-300">
              Hablar con Ventas
            </button>
          </div>
        </div>
      </div>

      <!-- Money Back Guarantee -->
      <div class="text-center mt-8">
        <div class="glass-card inline-flex items-center gap-4 p-4 rounded-2xl">
          <svg class="w-8 h-8 text-semantic-success" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
          </svg>
          <div class="text-left">
            <div class="text-glass-primary font-semibold">Garantía de 30 días</div>
            <div class="text-glass-secondary text-sm">Sin preguntas, reembolso completo</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Decorative Elements -->
    <div class="absolute top-20 left-20 w-56 h-56 glass-subtle rounded-full opacity-20 animate-glass-fade"></div>
    <div class="absolute bottom-20 right-20 w-40 h-40 glass-subtle rounded-full opacity-30 animate-glass-fade" style="animation-delay: 1.5s"></div>
  </div>
</template>

<script setup>
// Pricing functionality would go here
</script>

<style scoped>
.pricing-section {
  position: relative;
}

/* Featured plan special effects */
.pricing-section .glass-elevated {
  position: relative;
  background: var(--glass-elevated);
}

.pricing-section .glass-elevated::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, #3B82F6, #8B5CF6, #3B82F6);
  border-radius: inherit;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.pricing-section .glass-elevated:hover::before {
  opacity: 1;
}

/* Price animation */
.pricing-section .text-4xl {
  background: linear-gradient(135deg, #3B82F6, #8B5CF6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: priceGlow 3s ease-in-out infinite alternate;
}

@keyframes priceGlow {
  from {
    background: linear-gradient(135deg, #3B82F6, #8B5CF6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  to {
    background: linear-gradient(135deg, #2563EB, #7C3AED);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

/* List item hover effects */
.pricing-section li {
  transition: all 0.3s ease;
  position: relative;
}

.pricing-section li:hover {
  transform: translateX(3px);
  color: var(--text-primary);
}

/* Button hover effects */
.pricing-section button {
  position: relative;
  overflow: hidden;
}

.pricing-section button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.6s ease;
}

.pricing-section button:hover::before {
  left: 100%;
}

/* Guarantee badge animation */
.pricing-section .text-semantic-success {
  animation: shieldPulse 2s ease-in-out infinite;
}

@keyframes shieldPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* Floating decorative elements */
@keyframes gentleFloat {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-10px) rotate(1deg);
  }
  66% {
    transform: translateY(-5px) rotate(-1deg);
  }
}

.pricing-section .absolute.w-56,
.pricing-section .absolute.w-40 {
  animation: gentleFloat 12s ease-in-out infinite;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .pricing-section .lg\:col-span-3 {
    grid-template-columns: 1fr;
  }
  
  .pricing-section .glass-elevated {
    transform: none;
  }
  
  .pricing-section h2 {
    font-size: 2rem;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .pricing-section .glass-card,
  .pricing-section .glass-elevated {
    background: rgba(255, 255, 255, 0.98);
    border: 2px solid #3B82F6;
  }
  
  .dark .pricing-section .glass-card,
  .dark .pricing-section .glass-elevated {
    background: rgba(0, 0, 0, 0.98);
  }
  
  .pricing-section .glass-elevated::before {
    display: none;
  }
}
</style>