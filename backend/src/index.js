const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs-extra');
const uploadMaterial = require('./routes/uploadMaterial');
const uploadRecords = require('./routes/uploadRecords');
const ask = require('./routes/ask');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Remover el "type": "module" del package.json si lo tienes

// Función async para inicializar
async function initializeApp() {
    try {
        await fs.ensureDir(process.env.UPLOAD_DIR || "./uploads");
        
        app.get("/health", (_req, res) => res.json({ ok: true }));
        app.use("/api/material", uploadMaterial);
        app.use("/api/records", uploadRecords);
        app.use("/api/ask", ask);

        const port = process.env.PORT || 4000;
        app.listen(port, () => console.log(`Backend listo en http://localhost:${port}`));
    } catch (error) {
        console.error("Error inicializando la app:", error);
        process.exit(1);
    }
}

// Inicializar la aplicación
initializeApp();