const { Router } = require("express");
const { getIngredients } = require("../controllers/index");
const router = Router();

router.post("/store", getIngredients);

module.exports = router;
