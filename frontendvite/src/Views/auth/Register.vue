<template>
  <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
    <div class="flex flex-column align-items-center justify-content-center">
      <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
        <div class="w-full surface-card py-8 px-5 sm:px-8" style="border-radius: 53px">
          <div class="text-center mb-5">
            <div class="text-900 text-3xl font-medium mb-3">Crear Cuenta</div>
            <span class="text-600 font-medium">Regístrate para acceder al sistema</span>
          </div>

          <form @submit.prevent="handleRegister">
            <div>
              <label for="name" class="block text-900 text-xl font-medium mb-2">Nombre completo</label>
              <InputText 
                id="name" 
                v-model="name" 
                type="text" 
                placeholder="Tu nombre" 
                class="w-full mb-5" 
                style="padding: 1rem"
                :class="{ 'p-invalid': nameError }"
                required
                autocomplete="name"
              />
              <small v-if="nameError" class="p-error block -mt-4 mb-3">{{ nameError }}</small>

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
                :class="{ 'p-invalid': passwordError }"
                required
                autocomplete="new-password"
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
              <small v-if="passwordError" class="p-error block -mt-4 mb-3">{{ passwordError }}</small>

              <label for="confirmPassword" class="block text-900 font-medium text-xl mb-2">Confirmar Contraseña</label>
              <Password 
                id="confirmPassword" 
                v-model="confirmPassword" 
                placeholder="Confirmar contraseña" 
                :toggleMask="true" 
                class="w-full mb-5" 
                inputClass="w-full" 
                :inputStyle="{ padding: '1rem' }"
                :feedback="false"
                :class="{ 'p-invalid': confirmPasswordError }"
                required
                autocomplete="new-password"
              />
              <small v-if="confirmPasswordError" class="p-error block -mt-4 mb-3">{{ confirmPasswordError }}</small>

              <div class="flex align-items-center mb-5">
                <Checkbox v-model="acceptTerms" :binary="true" id="acceptterms" class="mr-2" />
                <label for="acceptterms">Acepto los términos y condiciones</label>
              </div>

              <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">
                {{ errorMessage }}
              </Message>

              <Message v-if="successMessage" severity="success" :closable="false" class="mb-4">
                {{ successMessage }}
              </Message>

              <Button 
                label="Registrarse" 
                type="submit"
                class="w-full p-3 text-xl" 
                :loading="loading"
                :disabled="loading || !acceptTerms"
              />
            </div>
          </form>

          <div class="text-center mt-5">
            <span class="text-600 font-medium">¿Ya tienes una cuenta? </span>
            <router-link to="/auth/login" class="font-medium no-underline text-primary cursor-pointer">
              Inicia sesión aquí
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
const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const acceptTerms = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const nameError = ref('');
const emailError = ref('');
const passwordError = ref('');
const confirmPasswordError = ref('');

// Validación
const validateForm = () => {
  let isValid = true;
  nameError.value = '';
  emailError.value = '';
  passwordError.value = '';
  confirmPasswordError.value = '';

  if (!name.value || name.value.trim().length < 3) {
    nameError.value = 'El nombre debe tener al menos 3 caracteres';
    isValid = false;
  }

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

  if (!confirmPassword.value) {
    confirmPasswordError.value = 'Debes confirmar la contraseña';
    isValid = false;
  } else if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Las contraseñas no coinciden';
    isValid = false;
  }

  if (!acceptTerms.value) {
    errorMessage.value = 'Debes aceptar los términos y condiciones';
    isValid = false;
  }

  return isValid;
};

// Manejar registro
const handleRegister = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!validateForm()) {
    return;
  }

  loading.value = true;

  try {
    await authStore.register({
      name: name.value,
      email: email.value,
      password: password.value,
    });

    successMessage.value = 'Cuenta creada exitosamente. Redirigiendo...';
    
    toast.add({
      severity: 'success',
      summary: 'Registro Exitoso',
      detail: `¡Bienvenido ${name.value}! Tu cuenta ha sido creada.`,
      life: 3000
    });

    // Redirigir al dashboard después de un breve delay
    setTimeout(() => {
      router.push('/');
    }, 1500);
  } catch (error) {
    errorMessage.value = error.message || 'Error al crear la cuenta. Intenta nuevamente.';
    
    toast.add({
      severity: 'error',
      summary: 'Error de Registro',
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
</style>
