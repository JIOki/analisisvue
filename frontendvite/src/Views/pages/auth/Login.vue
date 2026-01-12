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

const email = ref('');
const password = ref('');
const checked = ref(false);
const loading = ref(false);
const errorMessage = ref('');

const validateForm = () => {
  let isValid = true;
  errorMessage.value = '';

  if (!email.value) {
    errorMessage.value = 'El email es requerido';
    isValid = false;
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
    errorMessage.value = 'Email inválido';
    isValid = false;
  }

  if (!password.value) {
    if (!errorMessage.value) errorMessage.value = 'La contraseña es requerida';
    isValid = false;
  } else if (password.value.length < 6) {
    if (!errorMessage.value) errorMessage.value = 'La contraseña debe tener al menos 6 caracteres';
    isValid = false;
  }

  return isValid;
};

const handleLogin = async () => {
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

<template>
    <FloatingConfigurator />
    <div class="glass-container-minimal flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div class="glass-card-elevated">
                <div class="w-full glass-panel-auth py-20 px-8 sm:px-20">
                    <div class="text-center mb-8">
                        <div class="glass-icon-container mb-8">
                            <svg viewBox="0 0 54 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-16 shrink-0 mx-auto">
                                <path
                                    fill-rule="evenodd"
                                    clip-rule="evenodd"
                                    d="M17.1637 19.2467C17.1566 19.4033 17.1529 19.561 17.1529 19.7194C17.1529 25.3503 21.7203 29.915 27.3546 29.915C32.9887 29.915 37.5561 25.3503 37.5561 19.7194C37.5561 19.5572 37.5524 19.3959 37.5449 19.2355C38.5617 19.0801 39.5759 18.9013 40.5867 18.6994L40.6926 18.6782C40.7191 19.0218 40.7326 19.369 40.7326 19.7194C40.7326 27.1036 34.743 33.0896 27.3546 33.0896C19.966 33.0896 13.9765 27.1036 13.9765 19.7194C13.9765 19.374 13.9896 19.0316 14.0154 18.6927L14.0486 18.6994C15.0837 18.9062 16.1223 19.0886 17.1637 19.2467ZM33.3284 11.4538C31.6493 10.2396 29.5855 9.52381 27.3546 9.52381C25.1195 9.52381 23.0524 10.2421 21.3717 11.4603C20.0078 11.3232 18.6475 11.1387 17.2933 10.907C19.7453 8.11308 23.3438 6.34921 27.3546 6.34921C31.36 6.34921 34.9543 8.10844 37.4061 10.896C36.0521 11.1292 34.692 11.3152 33.3284 11.4538ZM43.826 18.0518C43.881 18.6003 43.9091 19.1566 43.9091 19.7194C43.9091 28.8568 36.4973 36.2642 27.3546 36.2642C18.2117 36.2642 10.8 28.8568 10.8 19.7194C10.8 19.1615 10.8276 18.61 10.8816 18.0663L7.75383 17.4411C7.66775 18.1886 7.62354 18.9488 7.62354 19.7194C7.62354 30.6102 16.4574 39.4388 27.3546 39.4388C38.2517 39.4388 47.0855 30.6102 47.0855 19.7194C47.0855 18.9439 47.0407 18.1789 46.9536 17.4267L43.826 18.0518ZM44.2613 9.54743L40.9084 10.2176C37.9134 5.95821 32.9593 3.1746 27.3546 3.1746C21.7442 3.1746 16.7856 5.96385 13.7915 10.2305L10.4399 9.56057C13.892 3.83178 20.1756 0 27.3546 0C34.5281 0 40.8075 3.82591 44.2613 9.54743Z"
                                    fill="var(--primary-color)"
                                />
                            </svg>
                        </div>
                        <div class="glass-text-primary text-3xl font-medium mb-4">¡Bienvenido!</div>
                        <span class="glass-text-secondary font-medium">Inicia sesión para continuar</span>
                    </div>

                    <div class="glass-form-auth">
                        <label for="email" class="glass-label block">Email</label>
                        <InputText id="email" type="email" placeholder="correo@ejemplo.com" class="glass-input-primary w-full md:w-[30rem] mb-8" v-model="email" />

                        <label for="password" class="glass-label block">Contraseña</label>
                        <Password id="password" v-model="password" placeholder="Contraseña" :toggleMask="true" class="glass-password-field mb-4" fluid :feedback="false"></Password>

                        <div class="glass-checkbox-container flex items-center justify-between mt-2 mb-8 gap-8">
                            <div class="flex items-center">
                                <Checkbox v-model="checked" id="rememberme" binary class="mr-2"></Checkbox>
                                <label for="rememberme" class="glass-text-secondary">Recordarme</label>
                            </div>
                        </div>

                        <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">
                          {{ errorMessage }}
                        </Message>

                        <Button 
                          label="Iniciar Sesión" 
                          class="glass-button-primary w-full" 
                          :loading="loading"
                          :disabled="loading"
                          @click="handleLogin"
                        />
                    </div>

                    <div class="text-center mt-6">
                      <span class="glass-text-secondary font-medium">¿No tienes una cuenta? </span>
                      <router-link to="/auth/register" class="glass-link-primary font-medium no-underline cursor-pointer register-btn-link">
                        Regístrate aquí
                      </router-link>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* === GLASSMORPHISM LOGIN PAGE === */

.glass-container-minimal {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.15) 0%,
    rgba(139, 92, 246, 0.1) 50%,
    rgba(59, 130, 246, 0.15) 100%
  );
  min-height: 100vh;
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
}

.glass-card-elevated {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 4px;
  box-shadow: 
    0 25px 50px -12px rgba(59, 130, 246, 0.25),
    0 8px 16px rgba(0, 0, 0, 0.1);
}

.glass-panel-auth {
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.9) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.glass-icon-container {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.2) 0%,
    rgba(139, 92, 246, 0.15) 100%
  );
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-icon-container:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 
    0 12px 25px rgba(59, 130, 246, 0.25),
    0 4px 12px rgba(0, 0, 0, 0.15);
}

.glass-text-primary {
  color: var(--primary-600);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.glass-text-secondary {
  color: var(--text-secondary);
  opacity: 0.8;
}

.glass-form-auth {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.glass-label {
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 8px;
  font-size: 20px;
}

.glass-input-primary {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0.1) 100%
  ) !important;
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 12px !important;
  color: var(--text-primary) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.2) inset !important;
}

.glass-input-primary:focus {
  border-color: rgba(59, 130, 246, 0.4) !important;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.25) 0%,
    rgba(255, 255, 255, 0.15) 100%
  ) !important;
  box-shadow: 
    0 8px 25px rgba(59, 130, 246, 0.15),
    0 1px 0 rgba(255, 255, 255, 0.3) inset !important;
  transform: translateY(-1px);
}

.glass-password-field {
  backdrop-filter: blur(15px);
}

.glass-checkbox-container {
  background: rgba(255, 255, 255, 0.05);
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-link-primary {
  color: var(--primary-500);
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
}

.glass-link-primary:hover {
  color: var(--primary-600);
  text-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
}

.glass-link-primary::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
  transition: width 0.3s ease;
}

.glass-link-primary:hover::after {
  width: 100%;
}

.glass-button-primary {
  background: linear-gradient(135deg, 
    var(--primary-500) 0%,
    var(--primary-600) 100%
  ) !important;
  border: 1px solid rgba(59, 130, 246, 0.3) !important;
  border-radius: 14px !important;
  color: white !important;
  font-weight: 600 !important;
  padding: 16px 24px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 
    0 8px 25px rgba(59, 130, 246, 0.3),
    0 4px 12px rgba(0, 0, 0, 0.15) !important;
  position: relative;
  overflow: hidden;
}

.glass-button-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.2), 
    transparent
  );
  transition: left 0.5s;
}

.glass-button-primary:hover::before {
  left: 100%;
}

.glass-button-primary:hover {
  background: linear-gradient(135deg, 
    var(--primary-400) 0%,
    var(--primary-500) 100%
  ) !important;
  box-shadow: 
    0 12px 35px rgba(59, 130, 246, 0.4),
    0 6px 16px rgba(0, 0, 0, 0.2) !important;
  transform: translateY(-2px);
}

.glass-button-primary:active {
  transform: translateY(0);
  box-shadow: 
    0 4px 12px rgba(59, 130, 246, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

/* Estilos para el enlace de registro */
.register-btn-link {
  color: var(--primary-500);
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
}

.register-btn-link:hover {
  color: var(--primary-600);
  text-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
}

.register-btn-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
  transition: width 0.3s ease;
}

.register-btn-link:hover::after {
  width: 100%;
}

/* Estilos de respaldo para el botón */
:deep(.p-button-label) {
  font-weight: 600;
  color: white;
}

/* Mantener estilos del ícono de ojo */
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .glass-container-minimal {
    padding: 16px;
  }
  
  .glass-panel-auth {
    padding: 16px 20px;
  }
  
  .glass-icon-container {
    width: 60px;
    height: 60px;
  }
}
</style>
