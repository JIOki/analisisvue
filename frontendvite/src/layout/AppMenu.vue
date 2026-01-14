<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToast } from 'primevue/usetoast';
import AppMenuItem from './AppMenuItem.vue';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

// Manejar logout
const handleLogout = async () => {
    try {
        await authStore.logout();

        toast.add({
            severity: 'success',
            summary: 'Sesión Cerrada',
            detail: 'Has cerrado sesión correctamente',
            life: 3000
        });

        router.push('/auth/login');
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cerrar sesión',
            life: 3000
        });
    }
};

const model = ref([
    {
        label: 'Paginas',
        icon: 'pi pi-fw pi-briefcase',
        to: '/pages',
        items: [
            {
                label: 'Biblioteca Marco Teorica',
                icon: 'pi pi-fw pi-book',
                to: '/pages/uploadtheory'
            },
            {
                label: 'Biblioteca de casos de uso',
                icon: 'pi pi-fw pi-folder',
                to: '/pages/uploadcase'
            },
            {
                label: 'Biblioteca de resultados',
                icon: 'pi pi-fw pi-chart-bar',
                to: '/pages/Resultados'
            },
            
           /* {
                label: 'Chat Inteligente',
                icon: 'pi pi-fw pi-comments',
                to: '/pages/chatinteligente'
            },
            {
                label: 'Chat Inteligente 2',
                icon: 'pi pi-fw pi-comment',
                to: '/pages/chatvue'
            },
            
           
           
              {
                label: 'Historial de Conversaciones',
                icon: 'pi pi-fw pi-history',
                to: '/pages/ConversationHistory'
            },
          {
                label: 'Chat con Contexto',
                icon: 'pi pi-fw pi-database',
                to: '/pages/Chat'
            },*/
            {
                label: 'Smart Chat (NUEVO)',
                icon: 'pi pi-fw pi-sparkles',
                to: '/pages/SmartChat'
            },
             {
                label: 'Centro de Privacidad',
                icon: 'pi pi-fw pi-shield',
                to: '/pages/PrivacyDashboard'
            },
             {
                separator: true
            },
        ]
    },
    {
        label: 'Share',
        items: [
            {
                label: 'Materiales compartidos',
                icon: 'pi pi-fw pi-share-alt',
                to: '/'
            },
        ]
    },
    {
        label: 'Mi Cuenta',
        items: [
            {
                label: 'Mi Perfil',
                icon: 'pi pi-fw pi-user',
                to: '/profile'
            },
            {
                label: 'Cerrar Sesión',
                icon: 'pi pi-fw pi-sign-out',
                command: handleLogout
            },

        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
