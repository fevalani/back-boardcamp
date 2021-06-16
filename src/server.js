import express from "express";
import cors from "cors";
import pg from "pg";
import Joi from "joi";

const app = express();

app.use(express.json());
app.use(cors());

const { Pool } = pg;

const connection = new Pool({
  user: "postgres",
  password: "123456",
  host: "localhost",
  port: 5432,
  database: "boardcamp",
});

app.get("/categories", async (req, res) => {
  try {
    const result = await connection.query("SELECT * FROM categories");
    res.send(result.rows);
  } catch (err) {
    res.send(err);
  }
});

app.post("/categories", async (req, res) => {});

app.listen(4000, () => {
  console.log("Server listening on port 4000!!");
});
