<template>
  <div class="p-6 space-y-4">
    <h1 class="text-2xl font-bold">Subir material bibliográfico</h1>
    <form @submit.prevent="send">
      <input v-model="title" placeholder="Título" class="border p-2 mr-2" />
      <input v-model="author" placeholder="Autor" class="border p-2 mr-2" />
      <input v-model="tags" placeholder="tags (coma)" class="border p-2 mr-2" />
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
const title = ref("");
const author = ref("");
const tags = ref("");
const msg = ref("");

function onFile(e){ file.value = e.target.files[0]; }

async function send(){
  const fd = new FormData();
  fd.append("file", file.value);
  fd.append("title", title.value);
  fd.append("author", author.value);
  fd.append("tags", tags.value);
  const { data } = await api.post("/material", fd, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  msg.value = `OK: ${JSON.stringify(data)}`;
}
</script>
