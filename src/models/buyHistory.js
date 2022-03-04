const { Schema, model } = require("mongoose");

const buyHistorySchema = Schema({
  ingredients: [
    {
      name: String,
      quantity: Number,
    },
  ],
  date: String,
});

module.exports = model("BuyHistory", buyHistorySchema);
