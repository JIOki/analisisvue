// Store de autenticación con Pinia
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref(null);
  const token = ref(localStorage.getItem('token') || null);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const userName = computed(() => user.value?.name || user.value?.email || 'Usuario');
  const userEmail = computed(() => user.value?.email || '');
  const userId = computed(() => user.value?.id || null);

  // Helper para hacer peticiones con autenticación
  const fetchWithAuth = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Manejar token expirado
    if (response.status === 401 || response.status === 403) {
      await logout();
      throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }

    return response;
  };

  // Actions

  // Registrar nuevo usuario
  const register = async (userData) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }

      // Auto-login después del registro
      token.value = data.token;
      user.value = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      return { success: true, user: data.user };
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Iniciar sesión
  const login = async (email, password) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      token.value = data.token;
      user.value = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      return { success: true, user: data.user };
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Cerrar sesión
  const logout = async () => {
    try {
      if (token.value) {
        // Notificar al backend
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.value}`,
          },
        }).catch(() => {
          // Ignorar errores en logout
        });
      }
    } finally {
      // Limpiar estado local
      user.value = null;
      token.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  // Obtener perfil del usuario
  const fetchProfile = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetchWithAuth(`${API_URL}/auth/profile`);

      if (!response.ok) {
        throw new Error('Error al obtener perfil');
      }

      const data = await response.json();
      user.value = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Actualizar perfil
  const updateProfile = async (profileData) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetchWithAuth(`${API_URL}/auth/profile`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar perfil');
      }

      user.value = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));

      return { success: true, user: data.user };
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Cambiar contraseña
  const changePassword = async (currentPassword, newPassword) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetchWithAuth(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar contraseña');
      }

      return { success: true, message: data.message };
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Verificar token al cargar la app
  const verifyToken = async () => {
    if (!token.value) {
      return false;
    }

    try {
      const response = await fetchWithAuth(`${API_URL}/auth/verify`);

      if (!response.ok) {
        await logout();
        return false;
      }

      const data = await response.json();
      user.value = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));

      return true;
    } catch (err) {
      await logout();
      return false;
    }
  };

  // Inicializar desde localStorage
  const initFromStorage = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token.value) {
      try {
        user.value = JSON.parse(savedUser);
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  };

  // Inicializar al crear el store
  initFromStorage();

  return {
    // Estado
    user,
    token,
    loading,
    error,
    // Getters
    isAuthenticated,
    userName,
    userEmail,
    userId,
    // Actions
    register,
    login,
    logout,
    fetchProfile,
    updateProfile,
    changePassword,
    verifyToken,
    fetchWithAuth,
  };
});
