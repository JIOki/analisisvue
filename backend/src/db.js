import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

// Debug antes de instanciar Pool
console.log("📄 process.env.DATABASE_URL:", JSON.stringify(process.env.DATABASE_URL));
console.log("📄 Variables separadas:", {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password:  process.env.DB_PASS,
  port: process.env.DB_PORT,
});

let pool;

if (process.env.DATABASE_URL?.trim()) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL.trim(),
  });
  console.log("🔑 Usando DATABASE_URL");
} else {
  

  pool = new Pool({
    user: process.env.DB_USER?.trim(),
    host: process.env.DB_HOST?.trim(),
    database: process.env.DB_NAME?.trim(),
    password: process.env.DB_PASS?.trim(),
    port: Number(process.env.DB_PORT) || 5433,
  });
  console.log("🔑 Usando variables separadas");
}

export default pool;
    