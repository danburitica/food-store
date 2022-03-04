const axios = require("axios");
require("dotenv").config();
const ingredientSchema = require("../models/ingredient");
const buyHistorySchema = require("../models/buyHistory");

const buy_base_url =
  process.env.BUY_BASE_URL ||
  "https://recruitment.alegra.com/api/farmers-market/buy?ingredient=";

/**
 * Éste método es invocado por la cocina, al solicitar un nuevo plato con sus ingredientes.
 * Verifica la base de datos donde está el stock de alimentos, si tiene la cantidad suficiente, despacha.
 * Si no tiene stock, compra en la plaza, hasta que tenga la cantidad mínima o más.
 */

const getIngredients = async (req, res) => {
  const { ingredients } = req.body;
  const stock = await ingredientSchema.find();

  let ingredientsToKitchen = false;
  let buyHistory = {
    ingredients: [],
    date: new Date().toLocaleString(),
  };

  for (const ingredient of ingredients) {
    let reqQuantity = ingredient.quantity;
    let { quantity: storeQuantity, _id } = stock.find(
      (ingredientDB) => ingredientDB.name === ingredient.name
    );
    if (storeQuantity - reqQuantity >= 0) {
      ingredientsToKitchen = true;
      await ingredientSchema.findByIdAndUpdate(_id, {
        quantity: storeQuantity - reqQuantity,
      });
    } else {
      try {
        const newQuantity = await buyIngredients(
          ingredient.name,
          reqQuantity - storeQuantity
        );
        buyHistory.ingredients.push({
          name: ingredient.name,
          quantity: newQuantity,
        });
        ingredientsToKitchen = true;
        await ingredientSchema.findByIdAndUpdate(_id, {
          quantity: newQuantity + storeQuantity - reqQuantity,
        });
      } catch (error) {
        res.json({ message: error });
      }
    }
  }
  if (buyHistory.ingredients.length) {
    const newBuyHistory = new buyHistorySchema(buyHistory);
    await newBuyHistory.save();
  }
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

const getStore = async (req, res) => {
  const key = req.query.key;
  if (key === "stock") {
    const stock = await ingredientSchema.find();
    res.json(stock);
  } else if (key === "history") {
    const history = await buyHistorySchema.find();
    res.json(history);
  } else {
    res.json({ message: "No matches" });
  }
};

module.exports = {
  getIngredients,
  getStore,
};
