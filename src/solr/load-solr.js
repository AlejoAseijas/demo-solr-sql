const axios = require("axios");
const mysql = require("mysql2/promise");

const SOLR_URL = "http://localhost:8983/solr/movies";
const BATCH_SIZE = 500;

const DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "root",
  database: "demo",
};

async function fetchBatch(connection, offset, limit) {
  const [rows] = await connection.query(
    `SELECT id, film_name, gender, film_avg_rate, review_rate, review_title, review_text
     FROM movies
     ORDER BY id
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`
  );
  return rows;
}

function toSolrDoc(row) {
  return {
    id: row.id,
    film_name: row.film_name || "",
    gender: row.gender || "",
    film_avg_rate: toFloat(row.film_avg_rate),
    review_rate: toFloat(row.review_rate),
    review_title: row.review_title || "",
    review_text: row.review_text || "",
  };
}

function toFloat(v) {
  const n = Number(v);
  return isNaN(n) ? null : n;
}

async function main() {
  let connection;

  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log("📦 Conectado a MySQL");

    const [[{ total: rawTotal }]] = await connection.execute(
      "SELECT COUNT(*) AS total FROM movies"
    );
    const total = Number(rawTotal);
    console.log(`📄 Registros en MySQL: ${total}`);

    if (total === 0) {
      console.log("⚠️ No hay datos. Ejecuta primero load-mysql.js");
      return;
    }

    let offset = 0;

    while (offset < total) {
      const rows = await fetchBatch(connection, offset, BATCH_SIZE);
      if (rows.length === 0) break;

      const batch = rows.map(toSolrDoc);

      await axios.post(
        `${SOLR_URL}/update/json/docs?commitWithin=5000`,
        batch,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log(`🚀 Batch ${offset} - ${offset + batch.length} enviado`);
      offset += rows.length;
    }

    await axios.get(`${SOLR_URL}/update?commit=true`);

    console.log("✅ Indexación en Solr completada");
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  } finally {
    if (connection) await connection.end();
  }
}

main();
