import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // Rutas de autenticación (sin layout)
        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/Views/pages/auth/Login.vue'),
            meta: { requiresGuest: true }
        },
        {
            path: '/auth/register',
            name: 'register',
            component: () => import('@/Views/pages/auth/Register.vue'),
            meta: { requiresGuest: true }
        },
        // Rutas protegidas (con layout)
        {
            path: '/',
            component: AppLayout,
            meta: { requiresAuth: true },
            children: [
                {
                    path: '/',
                    name: 'Persona',
                    component: () => import('@/Views/Persona.vue')
                },
                {
                    path: '/profile',
                    name: 'profile',
                    component: () => import('@/Views/pages/auth/Profile.vue')
                },
                {
                    path: '/pages/UploadTheory',
                    name: 'UploadTheory',
                    component: () => import('@/Views/pages/UploadTheory.vue')
                },
                {
                    path: '/pages/UploadCase',
                    name: 'UploadCase',
                    component: () => import('@/Views/pages/UploadCase.vue')
                },
                {
                    path: '/pages/ChatInteligente',
                    name: 'chatinteligente',
                    component: () => import('@/Views/pages/chatinteligente.vue')
                },
                {
                    path: '/pages/Resultados',
                    name: 'Resultados',
                    component: () => import('@/Views/pages/Resultados.vue')
                },
                {
                    path: '/pages/chatvue',
                    name: 'chatvue',
                    component: () => import('@/Views/pages/chatvue.vue')
                },
                {
                    path: '/pages/PrivacyDashboard',
                    name: 'PrivacyDashboard',
                    component: () => import('@/Views/pages/PrivacyDashboard.vue')
                },
                // Fase 5: Smart Chat (unificado)
                {
                    path: '/pages/SmartChat',
                    name: 'SmartChat',
                    component: () => import('@/Views/pages/SmartChat.vue')
                },
                // Fase 5: Historial de Conversaciones (mantenido para compatibilidad)
                {
                    path: '/pages/ConversationHistory',
                    name: 'ConversationHistory',
                    component: () => import('@/Views/pages/ConversationHistory.vue')
                },
                {
                    path: '/pages/Chat/:conversationId?',
                    name: 'ChatWithContext',
                    component: () => import('@/Views/pages/ChatWithContext.vue')
                },
            ]
        },
    ]
});

// Navigation guard global
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    
    // Intentar verificar token si existe pero no hay usuario cargado
    if (authStore.token && !authStore.user) {
        try {
            await authStore.verifyToken();
        } catch (error) {
            // Token inválido, se limpiará automáticamente
        }
    }

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiresGuest = to.matched.some(record => record.meta.requiresGuest);
    const isAuthenticated = authStore.isAuthenticated;

    if (requiresAuth && !isAuthenticated) {
        // Ruta protegida sin autenticación -> redirigir a login
        next({
            path: '/auth/login',
            query: { redirect: to.fullPath }
        });
    } else if (requiresGuest && isAuthenticated) {
        // Ruta de guest (login/register) con autenticación -> redirigir a home
        next('/');
    } else {
        // Permitir navegación
        next();
    }
});

export default router;
