const { Schema, model } = require("mongoose");

const ingredientSchema = Schema({
  name: String,
  quantity: Number,
});

module.exports = model("Ingredient", ingredientSchema);
