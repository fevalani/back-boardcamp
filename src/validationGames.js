import isImageUrl from "is-image-url";

export default async function validationGame(
  { name, image, stockTotal, categoryId, pricePerDay },
  connection
) {
  let check = false;
  check = !name.trim().length ? false : true;
  if (check === false) {
    return check;
  }

  check = isImageUrl(image);
  if (check === false) {
    return check;
  }

  check = stockTotal > 0 ? true : false;
  if (check === false) {
    return check;
  }

  check = pricePerDay > 0 ? true : false;
  if (check === false) {
    return check;
  }

  const ids = await connection.query("SELECT id FROM categories");
  check = ids.rows.map((item) => item.id).includes(categoryId);
  return check;
}
