import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import UploadDocs from "../views/UploadDocs.vue";
import UploadData from "../views/UploadData.vue";
import Questions from "../views/Questions.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/upload-docs",
    name: "UploadDocs",
    component: UploadDocs,
  },
  {
    path: "/upload-data",
    name: "UploadData",
    component: UploadData,
  },
  {
    path: "/questions",
    name: "Questions",
    component: Questions,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
