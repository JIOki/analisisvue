<template>
  <div class="highlights-section relative py-20 lg:py-32">
    <div class="container mx-auto px-6">
      <!-- Section Header -->
      <div class="text-center mb-16 animate-glass-fade">
        <h2 class="text-4xl lg:text-5xl font-bold text-glass-primary mb-6">
          ¿Por qué elegir nuestro <span class="bg-gradient-to-r from-primary-500 to-primary-alt-500 bg-clip-text text-transparent">Sistema RAG</span>?
        </h2>
        <p class="text-xl text-glass-secondary max-w-3xl mx-auto">
          Descubre las ventajas que nos distinguen y cómo podemos transformar tu forma de trabajar con información
        </p>
      </div>

      <!-- Main Content Split Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <!-- Left Side - Benefits -->
        <div class="lg:col-span-7 space-y-8">
          <!-- Benefit 1 -->
          <div class="glass-card p-8 group hover:shadow-glass-card-hover transition-all duration-500 animate-glass-slide">
            <div class="flex items-start gap-6">
              <div class="w-12 h-12 bg-gradient-to-r from-semantic-success to-green-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-glass-primary mb-3">Procesamiento Inteligente</h3>
                <p class="text-glass-secondary leading-relaxed">
                  Nuestro sistema utiliza modelos de IA avanzados para entender y procesar documentos complejos, 
                  extrayendo insights valiosos que tradicionalmente requerirían horas de análisis manual.
                </p>
              </div>
            </div>
          </div>

          <!-- Benefit 2 -->
          <div class="glass-card p-8 group hover:shadow-glass-card-hover transition-all duration-500 animate-glass-slide" style="animation-delay: 0.1s">
            <div class="flex items-start gap-6">
              <div class="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-alt-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6Z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-glass-primary mb-3">Confiabilidad y Precisión</h3>
                <p class="text-glass-secondary leading-relaxed">
                  Cada respuesta es respaldada por fuentes específicas de tus documentos, asegurando 
                  transparencia y permitiendo verificar la información de forma inmediata.
                </p>
              </div>
            </div>
          </div>

          <!-- Benefit 3 -->
          <div class="glass-card p-8 group hover:shadow-glass-card-hover transition-all duration-500 animate-glass-slide" style="animation-delay: 0.2s">
            <div class="flex items-start gap-6">
              <div class="w-12 h-12 bg-gradient-to-r from-primary-alt-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13,9V3.5L18.5,9M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6Z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-glass-primary mb-3">Facilidad de Uso</h3>
                <p class="text-glass-secondary leading-relaxed">
                  Interface intuitiva que no requiere entrenamiento técnico. Arrastra, suelta y pregunta. 
                  Nuestro sistema se adapta a tu forma natural de trabajar.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side - Use Cases -->
        <div class="lg:col-span-5">
          <div class="glass-card p-8 lg:p-10 animate-glass-slide" style="animation-delay: 0.3s">
            <h3 class="text-2xl font-bold text-glass-primary mb-8 text-center">
              Casos de <span class="bg-gradient-to-r from-primary-500 to-primary-alt-500 bg-clip-text text-transparent">Uso</span>
            </h3>
            
            <!-- Use Cases List -->
            <div class="space-y-6">
              <!-- Use Case 1 -->
              <div class="border-l-4 border-primary-500 pl-6 py-3">
                <h4 class="font-semibold text-glass-primary mb-2">Investigación Académica</h4>
                <p class="text-glass-secondary text-sm">
                  Analiza papers, tesis y estudios para extraer conclusiones y identificar patrones 
                  en grandes volúmenes de literatura científica.
                </p>
              </div>

              <!-- Use Case 2 -->
              <div class="border-l-4 border-primary-alt-500 pl-6 py-3">
                <h4 class="font-semibold text-glass-primary mb-2">Análisis Legal</h4>
                <p class="text-glass-secondary text-sm">
                  Busca precedentes, cláusulas relevantes y citas específicas en contratos y 
                  documentos legales de forma precisa y rápida.
                </p>
              </div>

              <!-- Use Case 3 -->
              <div class="border-l-4 border-purple-500 pl-6 py-3">
                <h4 class="font-semibold text-glass-primary mb-2">Inteligencia de Negocios</h4>
                <p class="text-glass-secondary text-sm">
                  Combina datos de reportes, presentaciones y análisis para generar insights 
                  estratégicos y tomar decisiones informadas.
                </p>
              </div>

              <!-- Use Case 4 -->
              <div class="border-l-4 border-green-500 pl-6 py-3">
                <h4 class="font-semibold text-glass-primary mb-2">Soporte Técnico</h4>
                <p class="text-glass-secondary text-sm">
                  Consulta documentación técnica, manuales y FAQs para resolver problemas 
                  complejos con información precisa al momento.
                </p>
              </div>
            </div>

            <!-- CTA Button -->
            <div class="mt-8 pt-6 border-t border-glass-border text-center">
              <button class="btn-primary px-6 py-3 rounded-xl font-semibold hover:shadow-glass-card-hover transition-all duration-300">
                Ver Casos de Estudio
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="mt-20">
        <div class="glass-card p-8 lg:p-12 text-center animate-glass-fade">
          <h3 class="text-2xl font-bold text-glass-primary mb-12">
            Números que <span class="bg-gradient-to-r from-primary-500 to-primary-alt-500 bg-clip-text text-transparent">Hablan por Sí Solos</span>
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div class="space-y-2">
              <div class="text-4xl lg:text-5xl font-bold text-glass-primary">95%</div>
              <div class="text-glass-secondary">Precisión en Respuestas</div>
            </div>
            <div class="space-y-2">
              <div class="text-4xl lg:text-5xl font-bold text-glass-primary">10x</div>
              <div class="text-glass-secondary">Tiempo Ahorrado</div>
            </div>
            <div class="space-y-2">
              <div class="text-4xl lg:text-5xl font-bold text-glass-primary">500+</div>
              <div class="text-glass-secondary">Empresas Confiando</div>
            </div>
            <div class="space-y-2">
              <div class="text-4xl lg:text-5xl font-bold text-glass-primary">24/7</div>
              <div class="text-glass-secondary">Disponibilidad</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Decorative Elements -->
    <div class="absolute top-1/4 left-0 w-40 h-40 glass-subtle rounded-full opacity-20 animate-glass-fade"></div>
    <div class="absolute bottom-1/4 right-0 w-32 h-32 glass-subtle rounded-full opacity-30 animate-glass-fade" style="animation-delay: 2s"></div>
  </div>
</template>

<script setup>
// Highlights functionality would go here
</script>

<style scoped>
.highlights-section {
  position: relative;
}

/* Enhanced stats animation */
.highlights-section .text-4xl,
.highlights-section .text-5xl {
  background: linear-gradient(135deg, #3B82F6, #8B5CF6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: statsGlow 2s ease-in-out infinite alternate;
}

@keyframes statsGlow {
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

/* Use case borders animation */
.highlights-section .border-l-4 {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.highlights-section .border-l-4::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(to bottom, transparent, currentColor, transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.highlights-section .border-l-4:hover::before {
  opacity: 1;
}

/* Benefit cards enhanced hover */
.highlights-section .glass-card {
  position: relative;
  overflow: hidden;
}

.highlights-section .glass-card::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.highlights-section .glass-card:hover::after {
  opacity: 1;
}

/* Floating animation for decorative elements */
@keyframes gentleFloat {
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-15px) scale(1.05);
  }
}

.highlights-section .absolute.w-40,
.highlights-section .absolute.w-32 {
  animation: gentleFloat 10s ease-in-out infinite;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .highlights-section .grid {
    grid-template-columns: 1fr;
  }
  
  .highlights-section .lg\:col-span-7,
  .highlights-section .lg\:col-span-5 {
    grid-column: span 1;
  }
  
  .highlights-section h2 {
    font-size: 2rem;
  }
  
  .highlights-section h3 {
    font-size: 1.5rem;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .highlights-section .glass-card {
    background: rgba(255, 255, 255, 0.98);
    border: 2px solid #3B82F6;
  }
  
  .dark .highlights-section .glass-card {
    background: rgba(0, 0, 0, 0.98);
  }
  
  .highlights-section .border-l-4 {
    border-left-width: 6px;
  }
}
</style>