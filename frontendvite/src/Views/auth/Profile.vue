<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <h5>Mi Perfil</h5>
        <p class="text-600">Gestiona tu información personal y configuración de cuenta</p>

        <TabView>
          <!-- Pestaña de Información Personal -->
          <TabPanel header="Información Personal">
            <form @submit.prevent="handleUpdateProfile" class="p-fluid">
              <div class="grid">
                <div class="col-12 md:col-6">
                  <div class="field">
                    <label for="name">Nombre completo</label>
                    <InputText 
                      id="name" 
                      v-model="profileForm.name" 
                      :class="{ 'p-invalid': nameError }"
                      required
                    />
                    <small v-if="nameError" class="p-error">{{ nameError }}</small>
                  </div>
                </div>

                <div class="col-12 md:col-6">
                  <div class="field">
                    <label for="email">Email</label>
                    <InputText 
                      id="email" 
                      v-model="profileForm.email" 
                      type="email"
                      :class="{ 'p-invalid': emailError }"
                      required
                    />
                    <small v-if="emailError" class="p-error">{{ emailError }}</small>
                  </div>
                </div>

                <div class="col-12">
                  <div class="field">
                    <label>Fecha de registro</label>
                    <p class="text-600">{{ formatDate(authStore.user?.created_at) }}</p>
                  </div>
                </div>

                <div class="col-12">
                  <div class="field">
                    <label>Último acceso</label>
                    <p class="text-600">{{ formatDate(authStore.user?.last_login) }}</p>
                  </div>
                </div>

                <div class="col-12">
                  <Message v-if="profileMessage" :severity="profileMessageSeverity" :closable="false">
                    {{ profileMessage }}
                  </Message>
                </div>

                <div class="col-12">
                  <Button 
                    label="Guardar Cambios" 
                    icon="pi pi-save"
                    type="submit"
                    :loading="profileLoading"
                    :disabled="profileLoading"
                  />
                </div>
              </div>
            </form>
          </TabPanel>

          <!-- Pestaña de Cambiar Contraseña -->
          <TabPanel header="Cambiar Contraseña">
            <form @submit.prevent="handleChangePassword" class="p-fluid">
              <div class="grid">
                <div class="col-12">
                  <div class="field">
                    <label for="currentPassword">Contraseña actual</label>
                    <Password 
                      id="currentPassword" 
                      v-model="passwordForm.currentPassword" 
                      :toggleMask="true"
                      :feedback="false"
                      :class="{ 'p-invalid': currentPasswordError }"
                      required
                    />
                    <small v-if="currentPasswordError" class="p-error">{{ currentPasswordError }}</small>
                  </div>
                </div>

                <div class="col-12">
                  <div class="field">
                    <label for="newPassword">Nueva contraseña</label>
                    <Password 
                      id="newPassword" 
                      v-model="passwordForm.newPassword" 
                      :toggleMask="true"
                      :class="{ 'p-invalid': newPasswordError }"
                      required
                    >
                      <template #footer>
                        <div class="p-3">
                          <p class="mt-2">Recomendaciones:</p>
                          <ul class="pl-2 ml-2 mt-0" style="line-height: 1.5">
                            <li>Al menos 6 caracteres</li>
                            <li>Combinar letras y números</li>
                          </ul>
                        </div>
                      </template>
                    </Password>
                    <small v-if="newPasswordError" class="p-error">{{ newPasswordError }}</small>
                  </div>
                </div>

                <div class="col-12">
                  <div class="field">
                    <label for="confirmNewPassword">Confirmar nueva contraseña</label>
                    <Password 
                      id="confirmNewPassword" 
                      v-model="passwordForm.confirmNewPassword" 
                      :toggleMask="true"
                      :feedback="false"
                      :class="{ 'p-invalid': confirmNewPasswordError }"
                      required
                    />
                    <small v-if="confirmNewPasswordError" class="p-error">{{ confirmNewPasswordError }}</small>
                  </div>
                </div>

                <div class="col-12">
                  <Message v-if="passwordMessage" :severity="passwordMessageSeverity" :closable="false">
                    {{ passwordMessage }}
                  </Message>
                </div>

                <div class="col-12">
                  <Button 
                    label="Cambiar Contraseña" 
                    icon="pi pi-lock"
                    type="submit"
                    :loading="passwordLoading"
                    :disabled="passwordLoading"
                  />
                </div>
              </div>
            </form>
          </TabPanel>

          <!-- Pestaña de Estadísticas -->
          <TabPanel header="Estadísticas">
            <div class="grid" v-if="statistics">
              <div class="col-12 md:col-6 lg:col-3">
                <div class="surface-card shadow-2 p-3 border-round">
                  <div class="flex justify-content-between mb-3">
                    <div>
                      <span class="block text-500 font-medium mb-3">Documentos</span>
                      <div class="text-900 font-medium text-xl">{{ statistics.totalDocuments || 0 }}</div>
                    </div>
                    <div class="flex align-items-center justify-content-center bg-blue-100 border-round" style="width: 2.5rem; height: 2.5rem">
                      <i class="pi pi-file text-blue-500 text-xl"></i>
                    </div>
                  </div>
                  <span class="text-500">Total de documentos subidos</span>
                </div>
              </div>

              <div class="col-12 md:col-6 lg:col-3">
                <div class="surface-card shadow-2 p-3 border-round">
                  <div class="flex justify-content-between mb-3">
                    <div>
                      <span class="block text-500 font-medium mb-3">Conversaciones</span>
                      <div class="text-900 font-medium text-xl">{{ statistics.totalConversations || 0 }}</div>
                    </div>
                    <div class="flex align-items-center justify-content-center bg-orange-100 border-round" style="width: 2.5rem; height: 2.5rem">
                      <i class="pi pi-comments text-orange-500 text-xl"></i>
                    </div>
                  </div>
                  <span class="text-500">Total de conversaciones</span>
                </div>
              </div>

              <div class="col-12 md:col-6 lg:col-3">
                <div class="surface-card shadow-2 p-3 border-round">
                  <div class="flex justify-content-between mb-3">
                    <div>
                      <span class="block text-500 font-medium mb-3">Chunks</span>
                      <div class="text-900 font-medium text-xl">{{ statistics.totalChunks || 0 }}</div>
                    </div>
                    <div class="flex align-items-center justify-content-center bg-cyan-100 border-round" style="width: 2.5rem; height: 2.5rem">
                      <i class="pi pi-database text-cyan-500 text-xl"></i>
                    </div>
                  </div>
                  <span class="text-500">Fragmentos de texto procesados</span>
                </div>
              </div>

              <div class="col-12 md:col-6 lg:col-3">
                <div class="surface-card shadow-2 p-3 border-round">
                  <div class="flex justify-content-between mb-3">
                    <div>
                      <span class="block text-500 font-medium mb-3">Cuenta</span>
                      <div class="text-900 font-medium text-xl">{{ authStore.user?.role || 'user' }}</div>
                    </div>
                    <div class="flex align-items-center justify-content-center bg-purple-100 border-round" style="width: 2.5rem; height: 2.5rem">
                      <i class="pi pi-user text-purple-500 text-xl"></i>
                    </div>
                  </div>
                  <span class="text-500">Tipo de cuenta</span>
                </div>
              </div>
            </div>

            <div v-else class="text-center p-5">
              <ProgressSpinner />
              <p class="mt-3">Cargando estadísticas...</p>
            </div>
          </TabPanel>
        </TabView>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useToast } from 'primevue/usetoast';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';

const authStore = useAuthStore();
const toast = useToast();

// Estado de perfil
const profileForm = ref({
  name: '',
  email: '',
});
const profileLoading = ref(false);
const profileMessage = ref('');
const profileMessageSeverity = ref('success');
const nameError = ref('');
const emailError = ref('');

// Estado de contraseña
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
});
const passwordLoading = ref(false);
const passwordMessage = ref('');
const passwordMessageSeverity = ref('success');
const currentPasswordError = ref('');
const newPasswordError = ref('');
const confirmNewPasswordError = ref('');

// Estadísticas
const statistics = ref(null);

// Formatear fecha
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Cargar datos del perfil
const loadProfile = async () => {
  try {
    const data = await authStore.fetchProfile();
    profileForm.value = {
      name: data.user.name || '',
      email: data.user.email || '',
    };
    statistics.value = data.statistics || null;
  } catch (error) {
    console.error('Error al cargar perfil:', error);
  }
};

// Actualizar perfil
const handleUpdateProfile = async () => {
  profileMessage.value = '';
  nameError.value = '';
  emailError.value = '';

  // Validación
  if (!profileForm.value.name || profileForm.value.name.trim().length < 3) {
    nameError.value = 'El nombre debe tener al menos 3 caracteres';
    return;
  }

  if (!profileForm.value.email || !/\S+@\S+\.\S+/.test(profileForm.value.email)) {
    emailError.value = 'Email inválido';
    return;
  }

  profileLoading.value = true;

  try {
    await authStore.updateProfile(profileForm.value);
    
    profileMessage.value = 'Perfil actualizado correctamente';
    profileMessageSeverity.value = 'success';

    toast.add({
      severity: 'success',
      summary: 'Perfil Actualizado',
      detail: 'Tus cambios han sido guardados',
      life: 3000
    });
  } catch (error) {
    profileMessage.value = error.message || 'Error al actualizar perfil';
    profileMessageSeverity.value = 'error';

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: profileMessage.value,
      life: 5000
    });
  } finally {
    profileLoading.value = false;
  }
};

// Cambiar contraseña
const handleChangePassword = async () => {
  passwordMessage.value = '';
  currentPasswordError.value = '';
  newPasswordError.value = '';
  confirmNewPasswordError.value = '';

  // Validación
  if (!passwordForm.value.currentPassword) {
    currentPasswordError.value = 'La contraseña actual es requerida';
    return;
  }

  if (!passwordForm.value.newPassword || passwordForm.value.newPassword.length < 6) {
    newPasswordError.value = 'La contraseña debe tener al menos 6 caracteres';
    return;
  }

  if (passwordForm.value.newPassword !== passwordForm.value.confirmNewPassword) {
    confirmNewPasswordError.value = 'Las contraseñas no coinciden';
    return;
  }

  passwordLoading.value = true;

  try {
    await authStore.changePassword(
      passwordForm.value.currentPassword,
      passwordForm.value.newPassword
    );

    passwordMessage.value = 'Contraseña cambiada correctamente';
    passwordMessageSeverity.value = 'success';

    // Limpiar formulario
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    };

    toast.add({
      severity: 'success',
      summary: 'Contraseña Actualizada',
      detail: 'Tu contraseña ha sido cambiada exitosamente',
      life: 3000
    });
  } catch (error) {
    passwordMessage.value = error.message || 'Error al cambiar contraseña';
    passwordMessageSeverity.value = 'error';

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: passwordMessage.value,
      life: 5000
    });
  } finally {
    passwordLoading.value = false;
  }
};

// Cargar datos al montar el componente
onMounted(() => {
  loadProfile();
});
</script>
