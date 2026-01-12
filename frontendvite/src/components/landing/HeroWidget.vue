<template>
  <div class="hero-section relative overflow-hidden">
    <!-- Background Glassmorphism Effect -->
    <div class="absolute inset-0 glass-subtle"></div>
    
    <!-- Content Container -->
    <div class="relative container mx-auto px-6 py-20 lg:py-32">
      <div class="glass-card p-12 lg:p-20 text-center animate-glass-fade">
        <!-- Main Heading -->
        <div class="mb-8">
          <h1 class="text-5xl lg:text-7xl font-bold text-glass-primary mb-6 leading-tight">
            <span class="bg-gradient-to-r from-primary-500 via-primary-alt-500 to-primary-600 bg-clip-text text-transparent">
              Sistema RAG
            </span>
            <br />
            <span class="text-glass-primary">con Inteligencia Artificial</span>
          </h1>
          <p class="text-xl lg:text-2xl text-glass-secondary max-w-3xl mx-auto leading-relaxed">
            Análisis inteligente de documentos con búsqueda semántica avanzada. 
            Transforma tu información en insights accionables.
          </p>
        </div>

        <!-- Feature Highlights -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div class="glass-hover p-6 rounded-2xl animate-glass-slide">
            <div class="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-primary-500 to-primary-alt-500 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-glass-primary mb-2">Chat Inteligente</h3>
            <p class="text-glass-secondary text-sm">Conversaciones naturales con tu documentación</p>
          </div>
          
          <div class="glass-hover p-6 rounded-2xl animate-glass-slide" style="animation-delay: 0.1s">
            <div class="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-primary-500 to-primary-alt-500 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-glass-primary mb-2">Drag & Drop</h3>
            <p class="text-glass-secondary text-sm">Carga documentos Word, Excel y TXT fácilmente</p>
          </div>
          
          <div class="glass-hover p-6 rounded-2xl animate-glass-slide" style="animation-delay: 0.2s">
            <div class="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-primary-500 to-primary-alt-500 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-glass-primary mb-2">Búsqueda Semántica</h3>
            <p class="text-glass-secondary text-sm">Encuentra información relevante al instante</p>
          </div>
        </div>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button class="btn-primary px-8 py-4 text-lg font-semibold rounded-2xl hover:shadow-glass-modal transition-all duration-300 transform hover:scale-105 animate-glass-slide">
            <span class="flex items-center gap-3">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
              </svg>
              Comenzar Gratis
            </span>
          </button>
          
          <button class="glass-button px-8 py-4 text-lg font-semibold rounded-2xl hover:shadow-glass-card-hover transition-all duration-300 animate-glass-slide" style="animation-delay: 0.1s">
            Ver Demo
          </button>
        </div>

        <!-- Trust Indicators -->
        <div class="mt-16 pt-8 border-t border-glass-border">
          <p class="text-glass-secondary text-sm mb-6">Confiado por empresas líderes</p>
          <div class="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div class="glass-subtle px-6 py-3 rounded-xl">
              <span class="text-glass-primary font-medium">TechCorp</span>
            </div>
            <div class="glass-subtle px-6 py-3 rounded-xl">
              <span class="text-glass-primary font-medium">DataPro</span>
            </div>
            <div class="glass-subtle px-6 py-3 rounded-xl">
              <span class="text-glass-primary font-medium">AI Solutions</span>
            </div>
            <div class="glass-subtle px-6 py-3 rounded-xl">
              <span class="text-glass-primary font-medium">Analytics Inc</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Decorative Glass Elements -->
    <div class="absolute top-20 left-10 w-32 h-32 glass-subtle rounded-full animate-glass-fade"></div>
    <div class="absolute bottom-20 right-10 w-24 h-24 glass-subtle rounded-full animate-glass-fade" style="animation-delay: 0.5s"></div>
    <div class="absolute top-1/2 right-20 w-16 h-16 glass-subtle rounded-full animate-glass-fade" style="animation-delay: 1s"></div>
  </div>
</template>

<script setup>
// Hero functionality would go here
</script>

<style scoped>
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  position: relative;
}

/* Enhanced text styling */
.hero-section h1 {
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  font-feature-settings: 'cv11', 'ss01';
  letter-spacing: -0.02em;
}

/* Glass card enhancements */
.hero-section .glass-card {
  backdrop-filter: var(--backdrop-glass-heavy);
  -webkit-backdrop-filter: var(--backdrop-glass-heavy);
  box-shadow: 0 32px 128px rgba(0,0,0,0.1);
}

/* Floating animation for decorative elements */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.hero-section .absolute.w-32,
.hero-section .absolute.w-24,
.hero-section .absolute.w-16 {
  animation: float 6s ease-in-out infinite;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .hero-section {
    min-height: 90vh;
  }
  
  .hero-section .glass-card {
    margin: 0 1rem;
  }
  
  .hero-section h1 {
    font-size: 2.5rem;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .hero-section .glass-card {
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid #3B82F6;
  }
  
  .dark .hero-section .glass-card {
    background: rgba(0, 0, 0, 0.95);
  }
}
</style>