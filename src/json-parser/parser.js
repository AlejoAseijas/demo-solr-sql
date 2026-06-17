const fs = require("fs");

const input = fs.readFileSync("data/film_reviews_result.csv", "utf-8");

// separa líneas reales (más seguro)
const lines = input.split(/\r?\n/).filter(Boolean);

const headers = lines[0].split("|");

const data = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];

  const cols = line.split("|");

  // evita filas rotas
  if (cols.length < headers.length) continue;

  const obj = {};

  headers.forEach((h, idx) => {
    let value = cols[idx];

    if (value === undefined) value = null;

    if (h === "film_avg_rate" && value) {
      value = parseFloat(value.replace(",", "."));
    }

    if (h === "review_rate" && value) {
      value = Number(value);
    }

    obj[h] = value;
  });

  // validación mínima (IMPORTANTE para MySQL)
  if (!obj.film_name) return;

  data.push(obj);
}

fs.writeFileSync(
  "data/movies.json",
  JSON.stringify(data, null, 2)
);

console.log(`✔ Parsed: ${data.length} records`);