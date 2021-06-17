import express, { response } from "express";
import cors from "cors";
import pg from "pg";
import validationGames from "./validationGames.js";

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

app.post("/categories", async (req, res) => {
  try {
    if (!req.body.name.trim()) {
      res.status(400).send("Nome vazio!!");
    } else {
      const contain = await connection.query(
        "SELECT name FROM categories WHERE name = $1",
        [req.body.name]
      );
      if (!contain.rows.length === 0) {
        res.sendStatus(409);
      } else {
        await connection.query("INSERT INTO categories (name) VALUES ($1)", [
          req.body.name,
        ]);
        res.sendStatus(201);
      }
    }
  } catch (err) {
    res.sendStatus(500);
  }
});

app.get("/games", async (req, res) => {
  try {
    if (!req.query.name) {
      const list = await connection.query(`
        SELECT games.*, categories.name AS "categoryName"
        FROM games JOIN categories
        ON games."categoryId" = categories.id
      `);
      res.send(list.rows);
    } else {
      const list = await connection.query(
        `
        SELECT games.*, categories.name AS "categoryName"
        FROM games JOIN categories
        ON games."categoryId" = categories.id
        WHERE games.name ILIKE ($1 || '%')
      `,
        [req.query.name]
      );
      res.send(list.rows);
    }
  } catch (err) {
    res.sendStatus(500);
  }
});

app.post("/games", async (req, res) => {
  try {
    const game = req.body;
    if (validationGames(game, connection)) {
      const contain = await connection.query(
        "SELECT * FROM games WHERE name = $1",
        [req.body.name]
      );
      if (contain.rowCount === 0) {
        const { name, image, stockTotal, categoryId, pricePerDay } = game;
        await connection.query(
          'INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1,$2,$3,$4,$5)',
          [name, image, stockTotal, categoryId, pricePerDay]
        );
        res.sendStatus(201);
      } else {
        res.sendStatus(409);
      }
    } else {
      res.sendStatus(400);
    }
  } catch (err) {
    res.sendStatus(500);
  }
});

app.listen(4000, () => {
  console.log("Server listening on port 4000!!");
});
