const JSONdb = require("simple-json-db");
const db = new JSONdb("./database.json");
const axios = require("axios");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");

const buy_base_url =
  process.env.BUY_BASE_URL ||
  "https://recruitment.alegra.com/api/farmers-market/buy?ingredient=";

/**
 * Éste método es invocado por la cocina, al solicitar un nuevo plato con sus ingredientes.
 * Verifica la base de datos local donde está el stock de alimentos, si tiene la cantidad suficiente, despacha.
 * Si no tiene stock, compra en la plaza, hasta que tenga la cantidad mínima o más.
 */

const getIngredients = async (req, res) => {
  const { ingredients } = req.body;
  const { store: database } = db.JSON();

  let ingredientsToKitchen = {};
  let buyHistory = {
    id: uuidv4(),
    buyIngredients: {},
    date: new Date().toLocaleString(),
  };

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
          buyHistory.buyIngredients[ingredient] = newQuantity;
          ingredientsToKitchen[ingredient] = reqQuantity;
          database[ingredient] = newQuantity + storeQuantity - reqQuantity;
        } catch (error) {
          res.json({ message: error });
        }
      }
    }
  }
  db.set("store", database);
  Object.keys(buyHistory.buyIngredients).length &&
    db.set("buyHistory", [...db.get("buyHistory"), buyHistory]);
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
      } = await axios.get(buy_base_url + ingredient);
      quantityBuy += quantitySold;
    } catch (error) {
      res.json({ message: error });
    }
  }

  return quantityBuy;
};

/**
 * Método encargado de retornar el stock o el historial de la base de datos.
 */

const getStore = (req, res) => {
  const key = req.query.key;

  res.json(
    key === "stock"
      ? db.get("store")
      : key === "history"
      ? db.get("buyHistory")
      : { message: "No matches" }
  );
};

module.exports = {
  getIngredients,
  getStore,
};
