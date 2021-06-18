import express, { response } from "express";
import cors from "cors";
import pg from "pg";
import validationGames from "./validationGames.js";
import validationCustomer from "./validationCustomer.js";

//pg.types.setTypeParser(1082, (str) => str);

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
  } catch {
    res.sendStatus(500);
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
      if (!!contain.rows.length) {
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

app.get("/customers", async (req, res) => {
  try {
    if (!req.query.cpf) {
      const customers = await connection.query(`
        SELECT * 
        FROM customers`);
      res.send(customers.rows);
    } else {
      const customers = await connection.query(
        `
        SELECT * 
        FROM customers
        WHERE cpf ILIKE ($1 || '%')`,
        [req.query.cpf]
      );
      res.send(
        customers.rows.length === 0
          ? `Não possui cpf iniciado com ${req.query.cpf}`
          : customers.rows
      );
    }
  } catch {
    res.sendStatus(500);
  }
});

app.get("/customers/:id", async (req, res) => {
  try {
    const customer = await connection.query(
      `SELECT * FROM customers WHERE id = $1`,
      [req.params.id]
    );
    if (!customer.rows.length) {
      res.sendStatus(404);
    }
    res.send(customer.rows[0]);
  } catch {
    res.sendStatus(500);
  }
});

app.post("/customers", async (req, res) => {
  try {
    if (validationCustomer(req.body)) {
      const existCpf = await connection.query(`SELECT cpf FROM customers`);
      if (existCpf.rows.map((item) => item.cpf).includes(req.body.cpf)) {
        res.sendStatus(409);
      } else {
        const { name, phone, cpf, birthday } = req.body;
        await connection.query(
          `
            INSERT INTO customer (name,phone,cpf,birthday)
            VALUES ($1,$2,$3,$4)
        `,
          [name, phone, cpf, birthday]
        );
        res.sendStatus(201);
      }
    } else {
      res.sendStatus(400);
    }
  } catch {
    res.sendStatus(500);
  }
});

app.put("/customers/:id", async (req, res) => {
  try {
    if (validationCustomer(req.body)) {
      const existCpf = await connection.query(
        `SELECT cpf FROM customers WHERE id <> $1`,
        [req.params.id]
      );
      if (existCpf.rows.map((item) => item.cpf).includes(re.body.cpf)) {
        res.sendStatus(409);
      } else {
        const { name, phone, cpf, birthday } = req.body;
        await connection.query(
          `UPDATE customers SET name=$1, phone=$2, cpf=$3, birthday=$4 WHERE id = $5`,
          [name, phone, cpf, birthday, req.params.id]
        );
        res.sendStatus(200);
      }
    } else {
      res.sendStatus(400);
    }
  } catch {
    res.sendStatus(500);
  }
});

app.listen(4000, () => {
  console.log("Server listening on port 4000!!");
});
