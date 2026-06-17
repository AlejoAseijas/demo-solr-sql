# demo-solr-sql

Proyecto de demostración que muestra cómo integrar **MySQL** y **Apache Solr** para cargar y buscar reseñas de películas. El flujo completo transforma un CSV en documentos indexados y consultables en Solr.

## Arquitectura del flujo

```
film_reviews_result.csv
         │
         ▼
   parser.js  ──────►  data/movies.json
                               │
                               ▼
                        load-mysql.js ──────►  MySQL (tabla movies)
                                                       │
                                                       ▼
                                              load-solr.js ──────►  Solr (core movies)
```

## Estructura del proyecto

```
demo-solr-sql/
├── data/
│   ├── film_reviews_result.csv   # Dataset original de reseñas
│   └── movies.json               # JSON generado desde el CSV
├── src/
│   ├── json-parser/
│   │   └── parser.js             # Convierte el CSV a JSON
│   ├── mysql/
│   │   └── load-mysql.js         # Crea la tabla e inserta datos en MySQL
│   └── solr/
│       └── load-solr.js          # Lee de MySQL e indexa en Solr
├── solr/                         # Volumen persistido del core Solr
└── docker-compose.yml            # Servicios MySQL y Solr
```

## Requisitos

| Herramienta | Versión mínima |
|---|---|
| Docker + Docker Compose | Docker 24+ |
| Node.js | 18+ |
| npm | 9+ |

## Inicio rápido

### 1. Levantar los servicios

```bash
docker compose up -d
```

Servicios disponibles una vez iniciados:

| Servicio | URL / Conexión |
|---|---|
| Apache Solr Admin | http://localhost:8983/solr |
| MySQL | `localhost:3306` · user: `root` · pass: `root` · db: `demo` |

### 2. Instalar dependencias de Node

```bash
cd src/json-parser && npm install
cd ../mysql && npm install
cd ../solr && npm install
cd ../../
```

### 3. Parsear el CSV a JSON

Lee `data/film_reviews_result.csv` (delimitado por `|`) y genera `data/movies.json`.

```bash
node src/json-parser/parser.js
```

### 4. Cargar datos en MySQL

Crea la tabla `movies` en la base de datos `demo` e inserta todos los registros del JSON.

```bash
node src/mysql/load-mysql.js
```

<details>
<summary>Esquema de la tabla <code>movies</code></summary>

```sql
CREATE TABLE movies (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  film_name       VARCHAR(255) NOT NULL,
  gender          VARCHAR(100),
  film_avg_rate   DECIMAL(3,2),
  review_rate     DECIMAL(3,2),
  review_title    VARCHAR(255),
  review_text     TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_film_name (film_name),
  INDEX idx_gender    (gender)
);
```

</details>

### 5. Indexar en Solr

Lee los registros de MySQL e indexa los documentos en el core `movies` de Solr.

```bash
node src/solr/load-solr.js
```

> **Nota:** MySQL debe estar cargado antes de ejecutar este paso.

---

## Troubleshooting

### Solr no levanta correctamente

El core `movies` se crea automáticamente gracias a `solr-precreate` en el `docker-compose.yml`. Si Solr muestra errores al iniciar (por ejemplo, `Error opening new searcher` o un `write.lock` persistido), limpiá el índice y reiniciá:

```bash
docker compose down
rm -rf solr/movies/data/index
rm -rf solr/movies/data/snapshot_metadata
docker compose up -d
```

> Como es una demo, regenerar el índice con `load-solr.js` es la solución más simple.

### Ver logs de los servicios

```bash
# Logs de Solr
docker compose logs solr

# Logs de MySQL
docker compose logs mysql
```

---

## Consejos

- Si actualizás el CSV, volvé a ejecutar el flujo completo: `parser.js` → `load-mysql.js` → `load-solr.js`.
- Podés explorar los documentos indexados en el panel de Solr: http://localhost:8983/solr/#/movies/query
