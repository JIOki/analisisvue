// index.js (ES Module compatible)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs-extra';

import ask from './routes/ask.js';
import uploadMaterial from './routes/uploadMaterial.js';
import uploadRecords from './routes/uploadRecords.js';
import materialRoutes from './routes/material.js';
import conversationRoutes from './routes/conversationRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import authRoutes from './routes/authRoutes.js';
import privacyRoutes from './routes/privacyRoutes.js';
import knowledgeRoutes from './routes/knowledgeRoutes.js';
import conversationHistoryRoutes from './routes/conversationHistoryRoutes.js';



dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/api/auth", authRoutes);
app.use("/api", conversationRoutes); 
app.use("/api", chatRoutes);
app.use("/api", conversationHistoryRoutes); // Fase 5: Historial de conversaciones
app.use("/api/material", materialRoutes);
app.use("/api/material", uploadMaterial);
app.use("/api/records", uploadRecords);
app.use("/api/ask", ask);
app.use("/api/privacy", privacyRoutes);
app.use("/api/knowledge", knowledgeRoutes);

app.get("/health", (_req, res) => res.json({ ok: true }));

async function initializeApp() {
  try {
    await fs.ensureDir(process.env.UPLOAD_DIR || "./uploads");

    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log(`Backend listo en http://localhost:${port}`));
  } catch (error) {
    console.error("Error inicializando la app:", error);
    process.exit(1);
  }
}

initializeApp();