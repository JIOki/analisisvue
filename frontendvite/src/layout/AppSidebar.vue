<script setup>
import AppMenu from './AppMenu.vue';
</script>

<template>
    <!-- Glassmorphism Sidebar -->
    <div class="layout-sidebar overflow-x-auto whitespace-nowrap fixed top-20 lg:top-24 left-0 h-[calc(100vh-5rem)] lg:h-[calc(100vh-7.5rem)] w-96 glass-card border-r border-glass-border overflow-hidden transition-all duration-300 animate-glass-fade">
        <!-- Sidebar Content -->
        <div class="h-full flex flex-col">
            <!-- Menu Content -->
            <div class="flex-1 overflow-y-auto p-4">
                <app-menu></app-menu>
            </div>
            
            <!-- Sidebar Footer -->
            <div class="p-4 border-t border-glass-border">
                <div class="glass-subtle p-3 rounded-2xl animate-glass-slide">
                    <div class="flex items-center gap-3">
                        <!-- User Avatar -->
                        <div class="relative">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-alt-500 flex items-center justify-center">
                                <i class="pi pi-user text-white text-sm"></i>
                            </div>
                            <!-- Online Status Indicator -->
                            <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-semantic-success rounded-full border-2 border-white dark:border-gray-900"></div>
                        </div>
                        
                        <!-- User Info -->
                        <div class="flex-1 min-w-0">
                            <p class="text-glass-primary font-medium text-sm truncate">Usuario Demo</p>
                            <p class="text-glass-secondary text-xs truncate">Analista IA</p>
                        </div>
                        
                        <!-- Status Indicator -->
                        <div class="flex items-center gap-1">
                            <div class="w-2 h-2 bg-semantic-success rounded-full animate-pulse"></div>
                            <span class="text-glass-secondary text-xs">Online</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Glass Effect Overlay -->
        <div class="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 via-transparent to-white/5"></div>
    </div>
    
    <!-- Mobile Sidebar Overlay -->
    <div class="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300" v-if="false">
        <!-- This will be handled by the layout composable -->
    </div>
</template>

<style scoped>
/* Sidebar Base Styles */
.layout-sidebar {
    background: var(--glass-card);
    backdrop-filter: var(--backdrop-glass-light);
    -webkit-backdrop-filter: var(--backdrop-glass-light);
    border-right: 1px solid var(--glass-border);
    box-shadow: 0 0 24px rgba(0,0,0,0.08);
    transform: translateX(0);
    transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    z-index: 999;
    
}

/* Scrollbar Styling for Sidebar */
.layout-sidebar ::-webkit-scrollbar {
    width: 6px;
}

.layout-sidebar ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
}

.layout-sidebar ::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.3);
    border-radius: 3px;
    transition: background 0.3s ease;
}

.layout-sidebar ::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.5);
}

/* Sidebar States for Responsive Design */
.layout-sidebar-mobile-active {
    transform: translateX(0);
}

.layout-sidebar-overlay-active {
    transform: translateX(-280px);
}

/* Menu Animation */
.app-menu {
    animation: menuSlideIn 0.4s ease-out;
}

@keyframes menuSlideIn {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* Enhanced Glass Effect for Scrollable Area */
.layout-sidebar .overflow-y-auto {
    background: linear-gradient(to bottom, 
        rgba(255, 255, 255, 0.02), 
        rgba(255, 255, 255, 0.01), 
        rgba(255, 255, 255, 0.02));
}

/* Interactive Elements Hover Effects */
.layout-sidebar button,
.layout-sidebar a {
    position: relative;
    overflow: hidden;
}

.layout-sidebar button::before,
.layout-sidebar a::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
    transition: left 0.6s ease;
}

.layout-sidebar button:hover::before,
.layout-sidebar a:hover::before {
    left: 100%;
}

/* Mobile Responsive Adjustments */
@media (max-width: 1024px) {
    .layout-sidebar {
        transform: translateX(-100%);
        box-shadow: 8px 0 32px rgba(0,0,0,0.2);
    }
    
    .layout-sidebar-mobile-active {
        transform: translateX(0);
    }
}

/* Desktop States */
@media (min-width: 1024px) {
    .layout-sidebar {
        /* Keep fixed positioning for desktop - DO NOT change to relative */
        transform: translateX(0);
    }
}

/* High Performance Hardware Acceleration */
.layout-sidebar {
    will-change: transform;
    backface-visibility: hidden;
    perspective: 1000px;
}

/* Accessibility Enhancements */
.layout-sidebar:focus-within {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
}

.layout-sidebar *:focus-visible {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
    border-radius: 4px;
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
    .layout-sidebar {
        animation: none;
        transition: none;
    }
    
    .app-menu {
        animation: none;
    }
    
    .animate-glass-fade,
    .animate-glass-slide {
        animation: none;
    }
}

/* Dark Mode Specific Overrides */
.dark .layout-sidebar {
    background: var(--glass-card);
    box-shadow: 0 0 24px rgba(0,0,0,0.3);
}

.dark .layout-sidebar ::-webkit-scrollbar-thumb {
    background: rgba(147, 197, 253, 0.3);
}

.dark .layout-sidebar ::-webkit-scrollbar-thumb:hover {
    background: rgba(147, 197, 253, 0.5);
}

/* Glass Border Animation */
.layout-sidebar::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 2px;
    height: 100%;
    background: linear-gradient(to bottom, 
        rgba(59, 130, 246, 0.4),
        rgba(59, 130, 246, 0.2),
        rgba(59, 130, 246, 0.4));
    opacity: 0;
    transition: opacity 0.3s ease;
}

.layout-sidebar:hover::before {
    opacity: 1;
}
</style>