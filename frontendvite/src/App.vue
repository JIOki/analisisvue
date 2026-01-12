<script setup>
import { onMounted, ref } from 'vue'
import router from './router';
import './assets/glassmorphism.css';

// Dark mode detection and management
const isDarkMode = ref(false);

onMounted(() => {
  // Check for saved theme preference or default to system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme) {
    isDarkMode.value = savedTheme === 'dark';
  } else {
    isDarkMode.value = systemPrefersDark;
  }
  
  applyTheme();
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      isDarkMode.value = e.matches;
      applyTheme();
    }
  });
});

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
  applyTheme();
};

const applyTheme = () => {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.add('app-dark');
    document.body.classList.add('bg-glass-gradient-dark');
    document.body.classList.remove('bg-glass-gradient-light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.remove('app-dark');
    document.body.classList.add('bg-glass-gradient-light');
    document.body.classList.remove('bg-glass-gradient-dark');
  }
};
</script>

<template>
  <div class="min-h-screen" :class="isDarkMode ? 'bg-glass-gradient-dark' : 'bg-glass-gradient-light'">
    <!-- Global Theme Toggle -->
    <div class="fixed top-4 right-4 z-50">
      <button
        @click="toggleTheme"
        class="glass-card p-3 rounded-full hover:shadow-glass-card-hover transition-all duration-300 animate-glass-fade"
        :aria-label="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <!-- Sun Icon for Dark Mode -->
        <svg 
          v-if="isDarkMode" 
          class="w-6 h-6 text-yellow-400" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M12 4.5a1 1 0 0 1 1-1h1a1 1 0 0 1 0 2h-1a1 1 0 0 1-1-1Zm7.07-1.93a1 1 0 0 1 0 1.41l-.71.71a1 1 0 1 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0ZM21 13a1 1 0 1 1 0-2h1a1 1 0 0 1 0 2h-1Zm-5.5 8a1 1 0 0 1-1-1V12a1 1 0 1 1 2 0v6.5a1 1 0 0 1-1 1Zm8.07-1.93a1 1 0 0 1-1.41 0l-.71-.71a1 1 0 0 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41ZM12 18a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1ZM7.64 17.36a1 1 0 0 1-1.41 0l-.71-.71a1 1 0 1 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41Z"/>
          <circle cx="12" cy="12" r="3.5"/>
        </svg>
        
        <!-- Moon Icon for Light Mode -->
        <svg 
          v-else 
          class="w-6 h-6 text-blue-600" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>
    </div>

    <!-- Main Application Content -->
    <div class="relative">
      <router-view />
    </div>
  </div>
</template>

<style>
/* Ensure smooth transitions between themes */
* {
  transition: background-color 0.4s ease, color 0.4s ease, border-color 0.4s ease;
}

/* Base styling for the app */
#app {
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Global scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.3);
  border-radius: 4px;
  transition: background 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.5);
}

/* Dark mode scrollbar */
.dark ::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.dark ::-webkit-scrollbar-thumb {
  background: rgba(147, 197, 253, 0.3);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(147, 197, 253, 0.5);
}

/* Selection styling */
::selection {
  background: rgba(59, 130, 246, 0.3);
  color: inherit;
}

::-moz-selection {
  background: rgba(59, 130, 246, 0.3);
  color: inherit;
}
</style>