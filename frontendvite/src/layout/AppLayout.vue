<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed, ref, watch } from 'vue';
import AppFooter from './AppFooter.vue';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';

const { layoutConfig, layoutState, isSidebarActive } = useLayout();

const outsideClickListener = ref(null);

watch(isSidebarActive, (newVal) => {
    if (newVal) {
        bindOutsideClickListener();
    } else {
        unbindOutsideClickListener();
    }
});

const containerClass = computed(() => {
    return {
        'layout-overlay': layoutConfig.menuMode === 'overlay',
        'layout-static': layoutConfig.menuMode === 'static',
        'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': layoutState.staticMenuMobileActive
    };
});

function bindOutsideClickListener() {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                layoutState.overlayMenuActive = false;
                layoutState.staticMenuMobileActive = false;
                layoutState.menuHoverActive = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
}

function unbindOutsideClickListener() {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener);
        outsideClickListener.value = null;
    }
}

function isOutsideClicked(event) {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const topbarEl = document.querySelector('.layout-menu-button');

    return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
}
</script>

<template>
    <div class="layout-wrapper relative min-h-screen" :class="containerClass">
        <!-- Glassmorphism Topbar -->
        <app-topbar></app-topbar>
        
        <!-- Glassmorphism Sidebar -->
        <app-sidebar></app-sidebar>
        
        <!-- Main Content Container -->
        <div class="layout-main-container flex flex-col min-h-screen">
            <!-- Main Content Area -->
            <div class="layout-main flex-1 p-6 lg:p-8">
                <!-- Glass Card Wrapper for Main Content -->
                <div class="glass-card p-8 lg:p-10 min-h-full animate-glass-fade">
                    <router-view></router-view>
                </div>
            </div>
            
            <!-- Glassmorphism Footer -->
            <app-footer></app-footer>
        </div>
        
        <!-- Overlay Mask for Mobile -->
        <div class="layout-mask animate-glass-fade backdrop-blur-sm bg-black/20" v-if="layoutState.overlayMenuActive || layoutState.staticMenuMobileActive"></div>
    </div>
    
    <!-- Toast Notifications with Glassmorphism -->
    <div class="fixed top-20 right-6 z-50 space-y-2">
        <!-- Toast component will be styled with glassmorphism -->
    </div>
</template>

<style scoped>
/* Layout Wrapper Enhancements */
.layout-wrapper {
    background: transparent;
    position: relative;
}

.layout-main-container {
   
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    justify-content: space-between;
    padding: 6rem 2rem 0 2rem;
    
    
}
/* Sidebar States */
.layout-overlay .layout-main-container,
.layout-overlay-active .layout-main-container {
    margin-left: 0;
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .layout-main-container {
        margin-left: 0;
    }
    
    .layout-mobile-active .layout-main-container {
        margin-left: 280px;
    }
}

/* Main Content Glass Enhancements */
.layout-main {
    position: relative;
    z-index: 1;
}

/* Toast Styling Override */
:deep(.p-toast) {
    z-index: 9999;
}

:deep(.p-toast .p-toast-message) {
    background: var(--glass-elevated);
    backdrop-filter: var(--backdrop-glass-heavy);
    -webkit-backdrop-filter: var(--backdrop-glass-heavy);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.16);
    color: var(--text-on-glass);
}

:deep(.p-toast .p-toast-message.p-toast-message-success) {
    border-left: 4px solid #10B981;
}

:deep(.p-toast .p-toast-message.p-toast-message-error) {
    border-left: 4px solid #EF4444;
}

:deep(.p-toast .p-toast-message.p-toast-message-warn) {
    border-left: 4px solid #F59E0B;
}

:deep(.p-toast .p-toast-message.p-toast-message-info) {
    border-left: 4px solid #3B82F6;
}

/* Animation for layout changes */
.layout-main-container {
    transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Glass mask overlay */
.layout-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 998;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
}

/* Enhanced focus styles for accessibility */
.layout-wrapper *:focus {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
}

.layout-wrapper *:focus:not(:focus-visible) {
    outline: none;
}

/* Glass Card with internal scroll */
.glass-card {
    height: 100%;
    width: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

/* Asegurar que router-view ocupe todo el espacio */
.glass-card > * {
    flex-shrink: 0;
}

/* Permitir que el contenido interno crezca */
.glass-card .router-view-container,
.glass-card .flex,
.glass-card .card {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

</style>