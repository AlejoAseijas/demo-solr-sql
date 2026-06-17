const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function main() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "root",
      database: "demo",
      multipleStatements: true,
    });

    console.log("📦 Conectado a MySQL");

    // 1. Crear tabla
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS movies (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,

        film_name VARCHAR(255) NOT NULL,
        gender VARCHAR(255),

        film_avg_rate FLOAT,
        review_rate FLOAT,

        review_title VARCHAR(255),
        review_text TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        INDEX idx_film_name (film_name),
        INDEX idx_gender (gender)
      );
    `;

    await connection.execute(createTableSQL);
    console.log("🧱 Tabla creada o ya existente");

    // 2. Leer JSON
    const filePath = path.join(__dirname, "../../data/movies.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    const movies = JSON.parse(rawData);

    console.log(`📄 Registros encontrados: ${movies.length}`);

    // 3. Insertar datos
    const insertSQL = `
      INSERT INTO movies 
      (film_name, gender, film_avg_rate, review_rate, review_title, review_text)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    for (const m of movies) {
      await connection.execute(insertSQL, [
        m.film_name,
        m.gender,
        m.film_avg_rate,
        m.review_rate,
        m.review_title,
        m.review_text,
      ]);
    }

    console.log("🚀 Inserción completada");

  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    if (connection) await connection.end();
  }
}

main();