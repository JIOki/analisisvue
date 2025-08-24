<template>
  <div class="p-6 space-y-4">
    <h1 class="text-2xl font-bold">Subir registros (CSV/XLSX)</h1>
    <form @submit.prevent="send">
      <input type="file" @change="onFile" class="block my-2" />
      <button class="border px-4 py-2">Subir</button>
    </form>
    <p v-if="msg">{{ msg }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { api } from "../api";

const file = ref(null);
const msg = ref("");

function onFile(e){ file.value = e.target.files[0]; }

async function send(){
  const fd = new FormData();
  fd.append("file", file.value);
  const { data } = await api.post("/records", fd, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  msg.value = `OK: ${JSON.stringify(data)}`;
}
</script>
