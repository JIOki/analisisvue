<script setup>
import { useLayout } from '@/layout/composables/layout';
import AppConfigurator from './AppConfigurator.vue';

const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();
</script>

<template>
    <!-- Glassmorphism Topbar -->
    <div class="layout-topbar fixed top-0 left-0 right-0 z-50 h-16 lg:h-20 glass-navbar">
        <div class="layout-topbar-content flex items-center justify-between h-full px-4 lg:px-6">
            <!-- Logo Section -->
            <div class="layout-topbar-logo-container flex items-center">
                <!-- Mobile Menu Toggle -->
                <button class="layout-menu-button glass-button p-3 lg:hidden animate-glass-fade" @click="toggleMenu">
                    <i class="pi pi-bars text-lg"></i>
                </button>
                
                <!-- Logo -->
                <router-link to="/" class="layout-topbar-logo flex items-center gap-3 text-xl lg:text-2xl font-bold text-glass-primary hover:text-glass-primary transition-all duration-300 group">
                    <div class="relative">
                        <!-- AI/Analytics Icon -->
                        <svg class="w-8 h-8 lg:w-10 lg:h-10 text-primary-500 group-hover:text-primary-600 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            <circle cx="12" cy="12" r="3" fill="currentColor"/>
                        </svg>
                        
                        <!-- Glass overlay effect -->
                        <div class="absolute inset-0 glass-subtle rounded-full animate-pulse"></div>
                    </div>
                    <span class="bg-gradient-to-r from-primary-500 to-primary-alt-500 bg-clip-text text-transparent">
                        IA Analytics
                    </span>
                </router-link>
            </div>

            <!-- Actions Section -->
            <div class="layout-topbar-actions flex items-center gap-2 lg:gap-4">
                <!-- Desktop Menu Actions -->
                <div class="hidden lg:flex layout-topbar-menu-content items-center gap-2">
                    <button type="button" class="layout-topbar-action glass-button p-3 group hover:shadow-glass-card-hover transition-all duration-300">
                        <i class="pi pi-calendar text-glass-secondary group-hover:text-primary-500 transition-colors"></i>
                        <span class="text-glass-secondary group-hover:text-primary-500 transition-colors">Calendario</span>
                    </button>
                    <button type="button" class="layout-topbar-action glass-button p-3 group hover:shadow-glass-card-hover transition-all duration-300">
                        <i class="pi pi-inbox text-glass-secondary group-hover:text-primary-500 transition-colors"></i>
                        <span class="text-glass-secondary group-hover:text-primary-500 transition-colors">Mensajes</span>
                    </button>
                    <button type="button" class="layout-topbar-action glass-button p-3 group hover:shadow-glass-card-hover transition-all duration-300">
                        <i class="pi pi-user text-glass-secondary group-hover:text-primary-500 transition-colors"></i>
                        <span class="text-glass-secondary group-hover:text-primary-500 transition-colors">Perfil</span>
                    </button>
                </div>

                <!-- Theme Toggle -->
                <button 
                    type="button" 
                    class="layout-topbar-action glass-button p-3 lg:p-4 animate-glass-fade hover:shadow-glass-card-hover transition-all duration-300" 
                    @click="toggleDarkMode"
                    :aria-label="isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'"
                >
                    <i :class="['pi transition-all duration-300', { 
                        'pi-moon text-yellow-400': isDarkTheme, 
                        'pi-sun text-primary-500': !isDarkTheme 
                    }]"></i>
                </button>

                <!-- Configuration Menu -->
                <div class="relative">
                    <button
                        v-styleclass="{ 
                            selector: '@next', 
                            enterFromClass: 'hidden opacity-0 scale-95', 
                            enterActiveClass: 'animate-glass-slide', 
                            leaveToClass: 'hidden opacity-0 scale-95', 
                            leaveActiveClass: 'animate-glass-fade', 
                            hideOnOutsideClick: true 
                        }"
                        type="button"
                        class="layout-topbar-action layout-topbar-action-highlight glass-button p-3 lg:p-4 animate-glass-fade hover:shadow-glass-card-hover transition-all duration-300"
                    >
                        <i class="pi pi-palette text-primary-alt-500"></i>
                    </button>
                    
                    <!-- Glass Configurator -->
                    <div class="hidden absolute right-0 top-full mt-2 w-80 glass-elevated animate-glass-fade">
                        <AppConfigurator />
                    </div>
                </div>

                <!-- Mobile Menu Button -->
                <button
                    v-styleclass="{ 
                        selector: '@next', 
                        enterFromClass: 'hidden opacity-0 scale-95', 
                        enterActiveClass: 'animate-glass-slide', 
                        leaveToClass: 'hidden opacity-0 scale-95', 
                        leaveActiveClass: 'animate-glass-fade', 
                        hideOnOutsideClick: true 
                    }"
                    class="layout-topbar-menu-button glass-button p-3 lg:hidden animate-glass-fade hover:shadow-glass-card-hover transition-all duration-300"
                >
                    <i class="pi pi-ellipsis-v text-glass-secondary"></i>
                </button>

                <!-- Mobile Menu (Hidden by default) -->
                <div class="hidden absolute right-0 top-full mt-2 w-64 glass-elevated lg:hidden animate-glass-fade">
                    <div class="p-4 space-y-2">
                        <button type="button" class="w-full layout-topbar-action glass-button p-3 text-left hover:shadow-glass-card-hover transition-all duration-300">
                            <i class="pi pi-calendar mr-3"></i>
                            <span>Calendario</span>
                        </button>
                        <button type="button" class="w-full layout-topbar-action glass-button p-3 text-left hover:shadow-glass-card-hover transition-all duration-300">
                            <i class="pi pi-inbox mr-3"></i>
                            <span>Mensajes</span>
                        </button>
                        <button type="button" class="w-full layout-topbar-action glass-button p-3 text-left hover:shadow-glass-card-hover transition-all duration-300">
                            <i class="pi pi-user mr-3"></i>
                            <span>Perfil</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Bottom Border Effect -->
        <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent"></div>
    </div>
    
    <!-- Spacer to prevent content from hiding behind fixed topbar -->
    <div class="h-16 lg:h-20"></div>
</template>

<style scoped>
/* Topbar Specific Styles */
.layout-topbar {
    transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    backdrop-filter: var(--backdrop-glass-navbar);
    -webkit-backdrop-filter: var(--backdrop-glass-navbar);
}

/* Logo Container Enhancements */
.layout-topbar-logo {
    position: relative;
    overflow: hidden;
}

.layout-topbar-logo::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    transition: left 0.6s ease;
}

.layout-topbar-logo:hover::before {
    left: 100%;
}

/* Action Buttons Enhancements */
.layout-topbar-action {
    position: relative;
    overflow: hidden;
}

.layout-topbar-action::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(59, 130, 246, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.3s ease;
}

.layout-topbar-action:hover::before {
    width: 200px;
    height: 200px;
}

/* Animation Classes */
.animate-scalein {
    animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
    from {
        opacity: 0;
        transform: scale(0.9) translateY(-10px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.animate-fadeout {
    animation: fadeOut 0.2s ease-out;
}

@keyframes fadeOut {
    from {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
    to {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
    }
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .layout-topbar {
        height: 64px;
    }
    
    .layout-topbar-actions {
        gap: 0.5rem;
    }
    
    .layout-topbar-logo span {
        display: none;
    }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    .layout-topbar {
        background: rgba(255, 255, 255, 0.95);
        border-bottom: 2px solid #3B82F6;
    }
    
    .dark .layout-topbar {
        background: rgba(0, 0, 0, 0.95);
    }
    
    .glass-button {
        border: 2px solid rgba(59, 130, 246, 0.5);
    }
    
    .glass-button:hover {
        border-color: #3B82F6;
        background: rgba(59, 130, 246, 0.1);
    }
}
</style>