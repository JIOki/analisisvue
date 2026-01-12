<script setup>
import { ref } from 'vue';

const user = ref({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 890',
    company: 'Acme Corp',
    bio: 'Software Developer passionate about AI and modern web technologies.'
});

const isEditing = ref(false);

const saveProfile = () => {
    // Aquí iría la lógica para guardar el perfil
    console.log('Saving profile:', user.value);
    isEditing.value = false;
};

const cancelEdit = () => {
    // Restaurar datos originales si es necesario
    isEditing.value = false;
};
</script>

<template>
    <div class="card">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-primary">Mi Perfil</h2>
            <Button 
                v-if="!isEditing" 
                label="Editar Perfil" 
                icon="pi pi-pencil" 
                @click="isEditing = true"
            />
            <div v-else class="flex gap-2">
                <Button label="Cancelar" severity="secondary" @click="cancelEdit" />
                <Button label="Guardar" icon="pi pi-save" @click="saveProfile" />
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Información Personal -->
            <div class="glass-card glass-elevated">
                <h3 class="text-xl font-semibold mb-4 text-primary">Información Personal</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Nombre Completo</label>
                        <InputText 
                            v-model="user.name" 
                            :disabled="!isEditing"
                            class="w-full"
                            :class="{ 'glass-input-disabled': !isEditing }"
                        />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Email</label>
                        <InputText 
                            v-model="user.email" 
                            type="email"
                            :disabled="!isEditing"
                            class="w-full"
                            :class="{ 'glass-input-disabled': !isEditing }"
                        />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Teléfono</label>
                        <InputText 
                            v-model="user.phone" 
                            :disabled="!isEditing"
                            class="w-full"
                            :class="{ 'glass-input-disabled': !isEditing }"
                        />
                    </div>
                </div>
            </div>

            <!-- Información Profesional -->
            <div class="glass-card glass-elevated">
                <h3 class="text-xl font-semibold mb-4 text-primary">Información Profesional</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Empresa</label>
                        <InputText 
                            v-model="user.company" 
                            :disabled="!isEditing"
                            class="w-full"
                            :class="{ 'glass-input-disabled': !isEditing }"
                        />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Biografía</label>
                        <Textarea 
                            v-model="user.bio" 
                            :disabled="!isEditing"
                            class="w-full"
                            rows="4"
                            :class="{ 'glass-input-disabled': !isEditing }"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Configuración de Cuenta -->
        <div class="mt-6 glass-card">
            <h3 class="text-xl font-semibold mb-4 text-primary">Configuración de Cuenta</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex items-center justify-between">
                    <div>
                        <label class="font-medium">Notificaciones por Email</label>
                        <p class="text-sm text-muted-color">Recibe actualizaciones por correo electrónico</p>
                    </div>
                    <InputSwitch />
                </div>
                
                <div class="flex items-center justify-between">
                    <div>
                        <label class="font-medium">Tema Oscuro</label>
                        <p class="text-sm text-muted-color">Cambiar al modo oscuro</p>
                    </div>
                    <InputSwitch />
                </div>
            </div>
        </div>

        <!-- Acciones de Seguridad -->
        <div class="mt-6 glass-card glass-uploading">
            <h3 class="text-xl font-semibold mb-4 text-primary">Seguridad</h3>
            <div class="flex flex-col sm:flex-row gap-4">
                <Button 
                    label="Cambiar Contraseña" 
                    icon="pi pi-lock"
                    severity="secondary"
                    class="flex-1"
                />
                <Button 
                    label="Cerrar Sesión" 
                    icon="pi pi-sign-out"
                    severity="danger"
                    class="flex-1"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Estilos para el perfil de usuario con glassmorphism */
.glass-card {
    background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.1) 0%,
        rgba(255, 255, 255, 0.05) 100%
    );
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 
        0 8px 25px rgba(0, 0, 0, 0.08),
        0 1px 0 rgba(255, 255, 255, 0.2) inset;
}

.glass-elevated {
    transform: translateY(-2px);
    box-shadow: 
        0 12px 35px rgba(0, 0, 0, 0.12),
        0 2px 0 rgba(255, 255, 255, 0.3) inset;
}

.glass-uploading {
    border-color: rgba(239, 68, 68, 0.3);
    background: linear-gradient(135deg, 
        rgba(239, 68, 68, 0.08) 0%,
        rgba(239, 68, 68, 0.03) 100%
    );
}

.glass-input-disabled {
    background: rgba(255, 255, 255, 0.03) !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
    color: var(--text-secondary);
}

@media (max-width: 768px) {
    .glass-card {
        padding: 16px;
    }
}
</style>