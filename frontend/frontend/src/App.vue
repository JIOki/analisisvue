<script setup>
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <HelloWorld msg="Vite + Vue" />

    <div>
    <h1>Sistema de Análisis con Ollama</h1>
    <nav>
      <router-link to="/">🏠 Home</router-link> |
      <router-link to="/upload-docs">📄 Cargar Material</router-link> |
      <router-link to="/upload-data">📊 Cargar Datos</router-link> |
      <router-link to="/questions">❓ Preguntas</router-link>
    </nav>

    <!-- Aquí Vue Router renderiza la vista actual -->
    <router-view />
  </div>
</template>
<script setup>
</script>
<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

nav {
  margin-bottom: 20px;
}
</style>
