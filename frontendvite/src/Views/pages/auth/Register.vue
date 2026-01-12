<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
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

const validateForm = () => {
  let isValid = true;
  nameError.value = '';
  emailError.value = '';
  passwordError.value = '';
  confirmPasswordError.value = '';
  errorMessage.value = '';

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

<template>
    <FloatingConfigurator />
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <svg viewBox="0 0 54 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="mb-8 w-16 shrink-0 mx-auto">
                            <path
                                d="M53.5 21C53.5 30.6627 45.5725 38.5 36.2 38.5C26.8275 38.5 18.9 30.6627 18.9 21C18.9 11.3373 26.8275 3.5 36.2 3.5C45.5725 3.5 53.5 11.3373 53.5 21Z"
                                fill="url(#paint0_linear)" stroke="url(#paint1_linear)" stroke-width="0.9"
                                stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M2.25 19.5L19.35 1.5C20.9134 -0.0635463 24.0866 -0.0635463 25.65 1.5L42.75 19.5C44.3134 21.0635 44.3134 24.2365 42.75 25.8L25.65 43.8C24.0866 45.3635 20.9134 45.3635 19.35 43.8L2.25 25.8C0.686522 24.2365 0.686522 21.0635 2.25 19.5Z" fill="url(#paint2_linear)" stroke="url(#paint3_linear)" stroke-width="0.7"/>
                            <defs>
                                <linearGradient id="paint0_linear" x1="18.9" y1="1.5" x2="53.5" y2="38.5" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="var(--primary-color)"/>
                                    <stop offset="1" stop-color="var(--primary-color)"/>
                                </linearGradient>
                                <linearGradient id="paint1_linear" x1="2.25" y1="1.5" x2="53.5" y2="38.5" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="var(--primary-color)"/>
                                    <stop offset="1" stop-color="var(--primary-color)"/>
                                </linearGradient>
                                <linearGradient id="paint2_linear" x1="2.25" y1="1.5" x2="53.5" y2="38.5" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="var(--primary-color)"/>
                                    <stop offset="1" stop-color="var(--primary-color)"/>
                                </linearGradient>
                                <linearGradient id="paint3_linear" x1="2.25" y1="1.5" x2="53.5" y2="38.5" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="var(--primary-color)"/>
                                    <stop offset="1" stop-color="var(--primary-color)"/>
                                </linearGradient>
                            </defs>
                        </svg>
                        <div class="text-2xl font-medium mb-2">
                            Crear Cuenta
                        </div>
                        <span class="text-muted-color font-medium">Regístrate para acceder al sistema</span>
                    </div>

                    <div class="flex flex-col">
                        <label for="name" class="block text-surface-900 dark:text-surface-0 text-sm font-medium mb-2">Nombre completo</label>
                        <InputText id="name" v-model="name" type="text" placeholder="Tu nombre" class="w-full md:w-[30rem] mb-2" :class="{ 'p-invalid': nameError }" />
                        <small v-if="nameError" class="p-error block -mt-2 mb-3">{{ nameError }}</small>

                        <label for="email" class="block text-surface-900 dark:text-surface-0 text-sm font-medium mb-2">Email</label>
                        <InputText id="email" v-model="email" type="email" placeholder="correo@ejemplo.com" class="w-full md:w-[30rem] mb-2" :class="{ 'p-invalid': emailError }" />
                        <small v-if="emailError" class="p-error block -mt-2 mb-3">{{ emailError }}</small>

                        <label for="password" class="block text-surface-900 dark:text-surface-0 text-sm font-medium mb-2">Contraseña</label>
                        <Password id="password" v-model="password" placeholder="Contraseña" :toggleMask="true" class="mb-2 w-full md:w-[30rem]" inputClass="w-full" inputStyle="padding:1rem" :feedback="false" :class="{ 'p-invalid': passwordError }" />
                        <small v-if="passwordError" class="p-error block -mt-2 mb-3">{{ passwordError }}</small>

                        <label for="confirmPassword" class="block text-surface-900 dark:text-surface-0 text-sm font-medium mb-2">Confirmar Contraseña</label>
                        <Password id="confirmPassword" v-model="confirmPassword" placeholder="Confirmar contraseña" :toggleMask="true" class="mb-2 w-full md:w-[30rem]" inputClass="w-full" inputStyle="padding:1rem" :feedback="false" :class="{ 'p-invalid': confirmPasswordError }" />
                        <small v-if="confirmPasswordError" class="p-error block -mt-2 mb-3">{{ confirmPasswordError }}</small>

                        <div class="flex items-center mt-5 mb-6">
                            <Checkbox v-model="acceptTerms" :binary="true" id="acceptterms" class="mr-2"></Checkbox>
                            <label for="acceptterms" class="text-sm">Acepto los términos y condiciones</label>
                        </div>

                        <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">
                          {{ errorMessage }}
                        </Message>

                        <Message v-if="successMessage" severity="success" :closable="false" class="mb-4">
                          {{ successMessage }}
                        </Message>

                        <Button 
                          label="Registrarse" 
                          class="w-full" 
                          icon="pi pi-user-plus"
                          :loading="loading"
                          :disabled="loading || !acceptTerms"
                          @click="handleRegister"
                        />
                    </div>

                    <div class="text-center mt-6">
                      <span class="text-muted-color font-medium">¿Ya tienes una cuenta? </span>
                      <router-link to="/auth/login" class="font-medium no-underline text-primary cursor-pointer hover:underline">
                        Inicia sesión aquí
                      </router-link>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
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

/* Estilos personalizados para el registro */
.p-error {
  color: #ef4444;
  font-size: 0.875rem;
}
</style>