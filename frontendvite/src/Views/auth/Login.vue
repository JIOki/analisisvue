<template>
  <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
    <div class="flex flex-column align-items-center justify-content-center">
      <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
        <div class="w-full surface-card py-8 px-5 sm:px-8" style="border-radius: 53px">
          <div class="text-center mb-5">
            <div class="text-900 text-3xl font-medium mb-3">¡Bienvenido!</div>
            <span class="text-600 font-medium">Inicia sesión para continuar</span>
          </div>

          <form @submit.prevent="handleLogin">
            <div>
              <label for="email" class="block text-900 text-xl font-medium mb-2">Email</label>
              <InputText 
                id="email" 
                v-model="email" 
                type="email" 
                placeholder="correo@ejemplo.com" 
                class="w-full mb-5" 
                style="padding: 1rem"
                :class="{ 'p-invalid': emailError }"
                required
                autocomplete="email"
              />
              <small v-if="emailError" class="p-error block -mt-4 mb-3">{{ emailError }}</small>

              <label for="password" class="block text-900 font-medium text-xl mb-2">Contraseña</label>
              <Password 
                id="password" 
                v-model="password" 
                placeholder="Contraseña" 
                :toggleMask="true" 
                class="w-full mb-5" 
                inputClass="w-full" 
                :inputStyle="{ padding: '1rem' }"
                :feedback="false"
                :class="{ 'p-invalid': passwordError }"
                required
                autocomplete="current-password"
              />
              <small v-if="passwordError" class="p-error block -mt-4 mb-3">{{ passwordError }}</small>

              <div class="flex align-items-center justify-content-between mb-5">
                <div class="flex align-items-center">
                  <Checkbox v-model="rememberMe" :binary="true" id="rememberme" class="mr-2" />
                  <label for="rememberme">Recordarme</label>
                </div>
              </div>

              <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">
                {{ errorMessage }}
              </Message>

              <Button 
                label="Iniciar Sesión" 
                type="submit"
                class="w-full p-3 text-xl login-btn" 
                :loading="loading"
                :disabled="loading"
                style="color: black !important;"
              />
            </div>
          </form>

          <div class="text-center mt-5">
            <span class="text-600 font-medium">¿No tienes una cuenta? </span>
            <router-link to="/auth/register" class="font-medium no-underline text-primary cursor-pointer register-link">
              Regístrate aquí
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToast } from 'primevue/usetoast';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Message from 'primevue/message';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

// Estado del formulario
const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const emailError = ref('');
const passwordError = ref('');

// Validación simple
const validateForm = () => {
  let isValid = true;
  emailError.value = '';
  passwordError.value = '';

  if (!email.value) {
    emailError.value = 'El email es requerido';
    isValid = false;
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
    emailError.value = 'Email inválido';
    isValid = false;
  }

  if (!password.value) {
    passwordError.value = 'La contraseña es requerida';
    isValid = false;
  } else if (password.value.length < 6) {
    passwordError.value = 'La contraseña debe tener al menos 6 caracteres';
    isValid = false;
  }

  return isValid;
};

// Manejar login
const handleLogin = async () => {
  errorMessage.value = '';

  if (!validateForm()) {
    return;
  }

  loading.value = true;

  try {
    await authStore.login(email.value, password.value);
    
    toast.add({
      severity: 'success',
      summary: 'Login Exitoso',
      detail: `Bienvenido ${authStore.userName}`,
      life: 3000
    });

    // Redirigir al dashboard o página principal
    router.push('/');
  } catch (error) {
    errorMessage.value = error.message || 'Error al iniciar sesión. Verifica tus credenciales.';
    
    toast.add({
      severity: 'error',
      summary: 'Error de Login',
      detail: errorMessage.value,
      life: 5000
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}

.min-w-screen {
  min-width: 100vw;
}

/* Estilos de respaldo para el botón */
:deep(.p-button) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

:deep(.p-button-label) {
  font-weight: 600;
  color: var(--primary-color-text, #ffffff);
}

.login-btn {
  min-height: 3.5rem;
}

.login-btn::before {
  content: "Iniciar Sesión";
  display: inline-block;
}

.login-btn:has(.p-button-label)::before {
  display: none;
}

.register-link {
  font-weight: 600;
}

.register-link:hover {
  text-decoration: underline;
}
</style>
