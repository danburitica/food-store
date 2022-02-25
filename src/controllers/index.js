const JSONdb = require("simple-json-db");
const db = new JSONdb("./database.json");
const axios = require("axios");
require("dotenv").config();

const { BUY_BASE_URL } = process.env;

/**
 * Éste método es invocado por la cocina, al solicitar un nuevo plato con sus ingredientes.
 * Verifica la base de datos local donde está el stock de alimentos, si tiene la cantidad suficiente, despacha.
 * Si no tiene stock, compra en la plaza, hasta que tenga la cantidad mínima o más.
 */

const getIngredients = async (req, res) => {
  const { ingredients } = req.body;
  const database = db.JSON();

  let ingredientsToKitchen = {};

  for (const ingredient in ingredients) {
    let reqQuantity = ingredients[ingredient];
    let storeQuantity = database[ingredient];
    if (ingredient in database) {
      if (storeQuantity - reqQuantity >= 0) {
        ingredientsToKitchen[ingredient] = reqQuantity;
        database[ingredient] = storeQuantity - reqQuantity;
      } else {
        try {
          const newQuantity = await buyIngredients(
            ingredient,
            reqQuantity - storeQuantity
          );
          ingredientsToKitchen[ingredient] = reqQuantity;
          database[ingredient] = newQuantity + storeQuantity - reqQuantity;
        } catch (error) {
          console.error(error);
        }
      }
    }
  }
  db.JSON(database);
  db.sync();
  res.json(ingredientsToKitchen);
};

/**
 * Método auxiliar que es invocado desde getIngredients.
 * Se encarga de pedir datos al endpoint donde se encuentra la plaza de mercado.
 * Se realiza la petición, mientras la compra no sea exitosa (quantitySold = 0) o la compra sea menor a la cantidad mínima requerida.
 */

const buyIngredients = async (ingredient, minQuantity) => {
  let quantityBuy = 0;
  while (quantityBuy < minQuantity) {
    try {
      const {
        data: { quantitySold },
      } = await axios.get(BUY_BASE_URL + ingredient);
      quantityBuy += quantitySold;
    } catch (error) {
      console.error(error);
    }
  }

  return quantityBuy;
};

module.exports = {
  getIngredients,
};
