export default async function validationRental(
  { customerId, gameId, daysRented },
  connection
) {
  if (daysRented > 0) {
    const gamesRented = await connection.query(
      `SELECT COUNT(id) FROM rentals WHERE "returnDate" IS NULL AND "gameId" = $1`,
      [gameId]
    );
    const stock = await connection.query(
      `
        SELECT "stockTotal" FROM games WHERE id = $1
    `,
      [gameId]
    );
    if (gamesRented.rows[0].count === stock.rows[0].stockTotal) {
      try {
        const request = await connection.query(
          `
        SELECT 1 FROM customers, games WHERE customers.id = $1 AND games.id = $2
        `,
          [customerId, gameId]
        );
        if (!!rowCount) {
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }
  }
  return false;
}
