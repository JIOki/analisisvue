<template>
  <div class="p-6 space-y-4">
    <h1 class="text-2xl font-bold">Análisis de contexto (RAG)</h1>
    <input v-model="topic" class="border p-2 w-full" placeholder="Tema" />
    <textarea v-model="qs" class="border p-2 w-full h-40" placeholder="Una pregunta por línea"></textarea>
    <button @click="ask" class="border px-4 py-2">Consultar</button>
    <div v-if="answer" class="prose whitespace-pre-wrap border p-4 mt-4">{{ answer }}</div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { api } from "../api";

const topic = ref("");
const qs = ref("");
const answer = ref("");

async function ask(){
  const questionnaire = qs.value.split("\n").map(s => s.trim()).filter(Boolean);
  const { data } = await api.post("/ask", { topic: topic.value, questionnaire });
  answer.value = data.answer;
}
</script>
