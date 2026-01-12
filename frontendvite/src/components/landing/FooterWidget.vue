<template>
  <div class="footer-section relative">
    <!-- Main Footer Content -->
    <footer class="glass-subtle py-16 lg:py-20 mt-20">
      <div class="container mx-auto px-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <!-- Company Info -->
          <div class="lg:col-span-4 space-y-6">
            <!-- Logo and Description -->
            <div>
              <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-alt-500 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <span class="text-2xl font-bold text-glass-primary">IA Analytics</span>
              </div>
              <p class="text-glass-secondary leading-relaxed">
                Revolucionando la forma en que las organizaciones interactúan con su información 
                mediante sistemas RAG inteligentes y análisis semántico avanzado.
              </p>
            </div>

            <!-- Social Links -->
            <div>
              <h4 class="text-glass-primary font-semibold mb-4">Síguenos</h4>
              <div class="flex gap-4">
                <a href="#" class="w-10 h-10 glass-card rounded-xl flex items-center justify-center hover:shadow-glass-card-hover transition-all duration-300 group">
                  <svg class="w-5 h-5 text-glass-secondary group-hover:text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" class="w-10 h-10 glass-card rounded-xl flex items-center justify-center hover:shadow-glass-card-hover transition-all duration-300 group">
                  <svg class="w-5 h-5 text-glass-secondary group-hover:text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" class="w-10 h-10 glass-card rounded-xl flex items-center justify-center hover:shadow-glass-card-hover transition-all duration-300 group">
                  <svg class="w-5 h-5 text-glass-secondary group-hover:text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" class="w-10 h-10 glass-card rounded-xl flex items-center justify-center hover:shadow-glass-card-hover transition-all duration-300 group">
                  <svg class="w-5 h-5 text-glass-secondary group-hover:text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <!-- Product Links -->
          <div class="lg:col-span-2">
            <h4 class="text-glass-primary font-semibold mb-6">Producto</h4>
            <ul class="space-y-4">
              <li><a href="#" class="text-glass-secondary hover:text-primary-500 transition-colors duration-300">Características</a></li>
              <li><a href="#" class="text-glass-secondary hover:text-primary-500 transition-colors duration-300">Precios</a></li>
              <li><a href="#" class="text-glass-secondary hover:text-primary-500 transition-colors duration-300">Demo</a></li>
              <li><a href="#" class="text-glass-secondary hover:text-primary-500 transition-colors duration-300">API</a></li>
              <li><a href="#" class="text-glass-secondary hover:text-primary-500 transition-colors duration-300">Integraciones</a></li>
            </ul>
          </div>

          <!-- Company Links -->
          <div class="lg:col-span-2">
            <h4 class="text-glass-primary font-semibold mb-6">Empresa</h4>
            <ul class="space-y-4">
              <li><a href="#" class="text-glass-secondary hover:text-primary-500 transition-colors duration-300">Acerca de</a></li>
              <li><a href="#" class="text-glass-secondary hover:text-primary-500 transition-colors duration-300">Blog</a></li>
              <li><a href="#" class="text-glass-secondary hover:text-primary-500 transition-colors duration-300">Carreras</a></li>
              <li><a href="#" class="text-glass-secondary hover:text-primary-500 transition-colors duration-300">Prensa</a></li>
              <li><a href="#" class="text-glass-secondary hover:text-primary-500 transition-colors duration-300">Contacto</a></li>
            </ul>
          </div>

          <!-- Support Links -->
          <div class="lg:col-span-2">
            <h4 class="text-glass-primary font-semibold mb-6">Soporte</h4>
            <ul class="space-y-4">
              <li><a href="#" class="text-glass-secondary hover:text-primary-500 transition-colors duration-300">Centro de Ayuda</a></li>
              <li><a href="#" class="text-glass-secondary hover:text-primary-500 transition-colors duration-300">Documentación</a></li>
              <li><a href="#" class="text-glass-secondary hover:text-primary-500 transition-colors duration-300">Comunidad</a></li>
              <li><a href="#" class="text-glass-secondary hover:text-primary-500 transition-colors duration-300">Estado del Sistema</a></li>
              <li><a href="#" class="text-glass-secondary hover:text-primary-500 transition-colors duration-300">Reportar Bug</a></li>
            </ul>
          </div>

          <!-- Newsletter -->
          <div class="lg:col-span-2">
            <h4 class="text-glass-primary font-semibold mb-6">Newsletter</h4>
            <p class="text-glass-secondary text-sm mb-4">
              Recibe actualizaciones sobre nuevas funcionalidades y mejores prácticas.
            </p>
            <form class="space-y-4">
              <div class="flex gap-2">
                <input 
                  type="email" 
                  placeholder="tu@email.com"
                  class="glass-input flex-1 p-3 rounded-xl text-glass-primary placeholder-glass-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button type="submit" class="btn-primary px-6 py-3 rounded-xl font-semibold hover:shadow-glass-card-hover transition-all duration-300">
                  Suscribirse
                </button>
              </div>
              <p class="text-glass-secondary text-xs">
                No spam. Cancelar suscripción en cualquier momento.
              </p>
            </form>
          </div>
        </div>

        <!-- Bottom Section -->
        <div class="mt-16 pt-8 border-t border-glass-border">
          <div class="flex flex-col lg:flex-row justify-between items-center gap-6">
            <!-- Copyright -->
            <div class="text-glass-secondary text-sm">
              © 2025 IA Analytics. Todos los derechos reservados.
            </div>

            <!-- Legal Links -->
            <div class="flex gap-6">
              <a href="#" class="text-glass-secondary hover:text-primary-500 text-sm transition-colors duration-300">Privacidad</a>
              <a href="#" class="text-glass-secondary hover:text-primary-500 text-sm transition-colors duration-300">Términos</a>
              <a href="#" class="text-glass-secondary hover:text-primary-500 text-sm transition-colors duration-300">Cookies</a>
            </div>

            <!-- Language/Currency -->
            <div class="flex gap-4">
              <button class="glass-button px-4 py-2 rounded-xl text-sm hover:shadow-glass-card-hover transition-all duration-300">
                🇪🇸 Español
              </button>
              <button class="glass-button px-4 py-2 rounded-xl text-sm hover:shadow-glass-card-hover transition-all duration-300">
                💶 EUR
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>

    <!-- Decorative Elements -->
    <div class="absolute bottom-0 left-0 w-64 h-64 glass-subtle rounded-full opacity-10"></div>
    <div class="absolute bottom-0 right-0 w-48 h-48 glass-subtle rounded-full opacity-15"></div>
  </div>
</template>

<style scoped>
.footer-section {
  position: relative;
}

/* Newsletter form enhancements */
.footer-section input:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Social link hover effects */
.footer-section .w-10 {
  position: relative;
  overflow: hidden;
}

.footer-section .w-10::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent);
  transition: left 0.6s ease;
}

.footer-section .w-10:hover::before {
  left: 100%;
}

/* Links hover effects */
.footer-section a {
  position: relative;
  overflow: hidden;
}

.footer-section a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: #3B82F6;
  transition: width 0.3s ease;
}

.footer-section a:hover::after {
  width: 100%;
}

/* Button hover effects */
.footer-section button {
  position: relative;
  overflow: hidden;
}

.footer-section button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.6s ease;
}

.footer-section button:hover::before {
  left: 100%;
}

/* Glass border animation */
.footer-section .border-t {
  position: relative;
}

.footer-section .border-t::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent);
  animation: borderShine 3s ease-in-out infinite;
}

@keyframes borderShine {
  0%, 100% {
    left: -100%;
  }
  50% {
    left: 100%;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .footer-section .lg\:col-span-4,
  .footer-section .lg\:col-span-2 {
    grid-column: span 1;
  }
  
  .footer-section .grid {
    grid-template-columns: 1fr;
  }
  
  .footer-section .flex {
    flex-direction: column;
    text-align: center;
  }
  
  .footer-section .gap-6 {
    gap: 1rem;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .footer-section .glass-subtle {
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid #3B82F6;
  }
  
  .dark .footer-section .glass-subtle {
    background: rgba(0, 0, 0, 0.98);
  }
  
  .footer-section .w-10 {
    border: 2px solid rgba(59, 130, 246, 0.5);
  }
  
  .footer-section .w-10:hover {
    border-color: #3B82F6;
    background: rgba(59, 130, 246, 0.1);
  }
}
</style>