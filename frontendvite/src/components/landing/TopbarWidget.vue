<template>
  <div class="topbar-widget relative z-40">
    <!-- Glassmorphism Navigation Bar -->
    <nav class="glass-navbar sticky top-0 left-0 right-0 h-20 flex items-center justify-between px-6 lg:px-12 py-4">
      <!-- Logo Section -->
      <div class="flex items-center gap-4">
        <router-link to="/" class="flex items-center gap-3 text-2xl font-bold text-glass-primary hover:text-glass-primary transition-all duration-300 group">
          <div class="relative">
            <!-- AI/Analytics Logo -->
            <div class="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-alt-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                <circle cx="12" cy="12" r="2" fill="white"/>
              </svg>
            </div>
            
            <!-- Glow effect -->
            <div class="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-alt-500 rounded-xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity duration-300"></div>
          </div>
          <span class="bg-gradient-to-r from-primary-500 to-primary-alt-500 bg-clip-text text-transparent">
            IA Analytics
          </span>
        </router-link>
      </div>

      <!-- Desktop Navigation -->
      <div class="hidden lg:flex items-center gap-8">
        <a href="#features" class="text-glass-secondary hover:text-primary-500 font-medium transition-all duration-300 relative group">
          Características
          <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
        </a>
        <a href="#pricing" class="text-glass-secondary hover:text-primary-500 font-medium transition-all duration-300 relative group">
          Precios
          <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
        </a>
        <a href="#about" class="text-glass-secondary hover:text-primary-500 font-medium transition-all duration-300 relative group">
          Acerca de
          <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
        </a>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-4">
        <!-- Login Button -->
        <router-link to="/auth/login" class="glass-button px-6 py-3 rounded-2xl font-semibold hover:shadow-glass-card-hover transition-all duration-300">
          Iniciar Sesión
        </router-link>
        
        <!-- CTA Button -->
        <router-link to="/auth/register" class="btn-primary px-6 py-3 rounded-2xl font-semibold hover:shadow-glass-modal transition-all duration-300">
          Comenzar Gratis
        </router-link>

        <!-- Mobile Menu Toggle -->
        <button 
          @click="toggleMobileMenu"
          class="glass-button p-3 lg:hidden animate-glass-fade hover:shadow-glass-card-hover transition-all duration-300"
          :aria-label="mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'"
        >
          <svg v-if="!mobileMenuOpen" class="w-6 h-6 text-glass-secondary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3,6H21V8H3M3,11H21V13H3M3,16H21V18H3V16Z"/>
          </svg>
          <svg v-else class="w-6 h-6 text-glass-secondary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
          </svg>
        </button>
      </div>
    </nav>

    <!-- Mobile Menu Overlay -->
    <transition name="mobile-menu">
      <div v-if="mobileMenuOpen" class="fixed inset-0 z-30 lg:hidden">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="closeMobileMenu"></div>
        
        <!-- Menu Content -->
        <div class="absolute top-20 left-0 right-0 glass-elevated mx-4 rounded-3xl p-8 animate-glass-slide">
          <nav class="space-y-6">
            <a href="#features" @click="closeMobileMenu" class="block text-glass-primary text-xl font-semibold hover:text-primary-500 transition-colors duration-300">
              Características
            </a>
            <a href="#pricing" @click="closeMobileMenu" class="block text-glass-primary text-xl font-semibold hover:text-primary-500 transition-colors duration-300">
              Precios
            </a>
            <a href="#about" @click="closeMobileMenu" class="block text-glass-primary text-xl font-semibold hover:text-primary-500 transition-colors duration-300">
              Acerca de
            </a>
            
            <!-- Mobile Menu Divider -->
            <div class="h-px bg-glass-border my-8"></div>
            
            <!-- Mobile Menu Actions -->
            <div class="space-y-4">
              <router-link to="/auth/login" @click="closeMobileMenu" class="block glass-button w-full p-4 rounded-2xl text-center font-semibold hover:shadow-glass-card-hover transition-all duration-300">
                Iniciar Sesión
              </router-link>
              <router-link to="/auth/register" @click="closeMobileMenu" class="block btn-primary w-full p-4 rounded-2xl text-center font-semibold hover:shadow-glass-modal transition-all duration-300">
                Comenzar Gratis
              </router-link>
            </div>
          </nav>
        </div>
      </div>
    </transition>

    <!-- Smooth Scroll Links Handler -->
    <div id="smooth-scroll-handler" class="hidden"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const mobileMenuOpen = ref(false)

// Mobile menu functions
function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
  
  // Prevent body scroll when menu is open
  if (mobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
  document.body.style.overflow = ''
}

// Smooth scroll for anchor links
function smoothScrollTo(targetId) {
  const element = document.getElementById(targetId)
  if (element) {
    const headerOffset = 80 // Account for fixed topbar
    const elementPosition = element.offsetTop
    const offsetPosition = elementPosition - headerOffset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }
}

// Handle smooth scroll links
onMounted(() => {
  // Add smooth scroll to all anchor links
  const links = document.querySelectorAll('a[href^="#"]')
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').substring(1)
      if (targetId) {
        e.preventDefault()
        smoothScrollTo(targetId)
        closeMobileMenu()
      }
    })
  })
  
  // Close mobile menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenuOpen.value) {
      closeMobileMenu()
    }
  })
  
  // Close mobile menu on window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) { // lg breakpoint
      closeMobileMenu()
    }
  })
})
</script>

<style scoped>
/* Mobile menu animation */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* Topbar enhancements */
.topbar-widget .glass-navbar {
  backdrop-filter: var(--backdrop-glass-navbar);
  -webkit-backdrop-filter: var(--backdrop-glass-navbar);
  border-bottom: 1px solid var(--glass-border);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  z-index: 1000;
}

/* Logo hover effects */
.topbar-widget .group {
  position: relative;
  overflow: hidden;
}

.topbar-widget .group::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59,130,246,0.1), transparent);
  transition: left 0.6s ease;
}

.topbar-widget .group:hover::before {
  left: 100%;
}

/* Navigation link hover effects */
.topbar-widget a {
  position: relative;
  overflow: hidden;
}

/* Mobile menu backdrop blur */
.topbar-widget .backdrop-blur-sm {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* Button hover enhancements */
.topbar-widget button,
.topbar-widget .btn-primary,
.topbar-widget .glass-button {
  position: relative;
  overflow: hidden;
}

.topbar-widget button::before,
.topbar-widget .btn-primary::before,
.topbar-widget .glass-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.6s ease;
}

.topbar-widget button:hover::before,
.topbar-widget .btn-primary:hover::before,
.topbar-widget .glass-button:hover::before {
  left: 100%;
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .topbar-widget .glass-navbar {
    height: 64px;
    padding: 1rem 1.5rem;
  }
  
  .topbar-widget .absolute.top-20 {
    top: 64px;
  }
  
  .topbar-widget .mx-4 {
    margin-left: 1rem;
    margin-right: 1rem;
  }
}

/* Accessibility enhancements */
.topbar-widget button:focus-visible,
.topbar-widget a:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

.topbar-widget *:focus {
  outline: none;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .topbar-widget .glass-navbar {
    background: rgba(255, 255, 255, 0.98);
    border-bottom: 2px solid #3B82F6;
  }
  
  .dark .topbar-widget .glass-navbar {
    background: rgba(0, 0, 0, 0.98);
  }
  
  .topbar-widget .glass-elevated {
    background: rgba(255, 255, 255, 0.98);
    border: 2px solid #3B82F6;
  }
  
  .dark .topbar-widget .glass-elevated {
    background: rgba(0, 0, 0, 0.98);
  }
  
  .topbar-widget .glass-button {
    border: 2px solid rgba(59, 130, 246, 0.5);
  }
  
  .topbar-widget .glass-button:hover {
    border-color: #3B82F6;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .topbar-widget * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .mobile-menu-enter-active,
  .mobile-menu-leave-active {
    transition: none;
  }
  
  .topbar-widget .glass-navbar,
  .topbar-widget .glass-elevated {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
  
  .topbar-widget .glass-navbar {
    background: rgba(255,255,255,0.95) !important;
  }
  
  .dark .topbar-widget .glass-navbar {
    background: rgba(0,0,0,0.95) !important;
  }
}

/* Scroll effects */
@keyframes navbarScroll {
  0% {
    transform: translateY(0);
    backdrop-filter: blur(15px) saturate(180%);
  }
  100% {
    transform: translateY(0);
    backdrop-filter: blur(20px) saturate(180%);
  }
}

.topbar-widget .glass-navbar {
  animation: navbarScroll 0.3s ease-out;
}

/* Glass effect shimmer */
.topbar-widget::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent);
  opacity: 0;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% {
    opacity: 0;
    transform: translateX(-100%);
  }
  50% {
    opacity: 1;
    transform: translateX(100%);
  }
}
</style>