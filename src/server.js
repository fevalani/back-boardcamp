import express from "express";
import cors from "cors";
import pg from "pg";
import validationGames from "./validationGames.js";
import validationCustomer from "./validationCustomer.js";
import validationRental from "./validationRental.js";
import dayjs from "dayjs";

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
            INSERT INTO customers (name,phone,cpf,birthday)
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

app.get("/rentals", async (req, res) => {
  try {
    if (!!req.query.customerId) {
      const request = await connection.query(
        `
        SELECT rentals.*, 
        jsonb_build_object('name', customers.name, 'id', customers.id) AS customer, 
        jsonb_build_object('id', games.id, 'name', games.name, 'categoryId', games."categoryId", 'categoryName', categories.name) AS game
        FROM rentals 
        JOIN customers ON rentals."customerId" = customers.id
        JOIN games ON rentals."gameId" = games.id
        JOIN categories ON categories.id = games."categoryId"
        WHERE "customerId" = $1
      `,
        [req.query.customerId]
      );
      res.send(request.rows);
    } else if (!!req.query.gameId) {
      const request = await connection.query(
        `
        SELECT rentals.*, 
        jsonb_build_object('name', customers.name, 'id', customers.id) AS customer, 
        jsonb_build_object('id', games.id, 'name', games.name, 'categoryId', games."categoryId", 'categoryName', categories.name) AS game
        FROM rentals 
        JOIN customers ON rentals."customerId" = customers.id
        JOIN games ON rentals."gameId" = games.id
        JOIN categories ON categories.id = games."categoryId"
        WHERE "gameId" = $1
      `,
        [req.query.gameId]
      );
      res.send(request.rows);
    }
    const request = await connection.query(`
      SELECT rentals.*, 
      jsonb_build_object('name', customers.name, 'id', customers.id) AS customer, 
      jsonb_build_object('id', games.id, 'name', games.name, 'categoryId', games."categoryId", 'categoryName', categories.name) AS game
      FROM rentals 
      JOIN customers ON rentals."customerId" = customers.id
      JOIN games ON rentals."gameId" = games.id
      JOIN categories ON categories.id = games."categoryId"
    `);
    res.send(request.rows);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.post("/rentals", async (req, res) => {
  try {
    if (validationRental(req.body, connection)) {
      const request = await connection.query(
        `
      SELECT * FROM games WHERE games.id = $1
    `,
        [req.body.gameId]
      );
      req.body.rentDate = dayjs().format("YYYY-MM-DD");
      req.body.originalPrice =
        request.rows[0].pricePerDay * req.body.daysRented;
      req.body.returnDate = null;
      req.body.delayFee = null;
      const {
        customerId,
        gameId,
        rentDate,
        daysRented,
        returnDate,
        originalPrice,
        delayFee,
      } = req.body;
      await connection.query(
        `
        INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee")
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
        [
          customerId,
          gameId,
          rentDate,
          daysRented,
          returnDate,
          originalPrice,
          delayFee,
        ]
      );
      res.sendStatus(201);
    } else {
      res.sendStatus(400);
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.post("/rentals/:id/return", async (req, res) => {
  try {
    const id = req.params.id;
    const idExists = await connection.query(
      `SELECT id FROM rentals WHERE id = $1 AND "returnDate" IS NULL`,
      [id]
    );
    if (!!idExists.rows[0]) {
      const rental = await connection.query(
        `
      SELECT * FROM rentals WHERE id = $1
      `,
        [id]
      );
      const returnDate = dayjs().format("YYYY-MM-DD");
      if (
        dayjs().diff(dayjs(rental.rows[0].rentDate), "day") -
          rental.rows[0].daysRented >
        0
      ) {
        const delayFee =
          ((dayjs().diff(dayjs(rental.rows[0].rentDate), "day") -
            rental.rows[0].daysRented) *
            rental.rows[0].originalPrice) /
          rental.rows[0].daysRented;
      } else {
        const delayFee = 0;
      }
      await connection.query(
        `
        UPDATE rentals 
        SET "returnDate" = $1
        AND "delayFee" = $2
        WHERE id = $3
      `,
        [returnDate, delayFee, id]
      );
    } else {
      res.sendStatus(400);
    }
  } catch {
    res.sendStatus(500);
  }
});

app.delete("/rentals/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const idExists = await connection.query(
      `SELECT id FROM rentals WHERE id = $1 AND "returnDate" IS NULL`,
      [id]
    );
    if (!!idExists.rows[0]) {
      await connection.query(`DELETE FROM rentals WHERE id = $1`, [id]);
      res.sendStatus(201);
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
