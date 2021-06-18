import Joi from "joi";
import dayjs from "dayjs";

export default async function validationCustomer({
  name,
  phone,
  cpf,
  birthday,
}) {
  let check = false;

  const schema = Joi.object({
    name: Joi.string().required().trim(),
    phone: Joi.string().pattern(/^\d{10,11}$/),
    cpf: Joi.string().pattern(/^\d{11}$/),
  });

  check = !schema.validate({ name, phone, cpf }).error;

  if (dayjs(birthday).format("YYYY-MM-DD") !== birthday) {
    return false;
  }

  return check;
}
