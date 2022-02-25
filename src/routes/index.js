const { Router } = require("express");
const { getIngredients, getStore } = require("../controllers/index");
const router = Router();

router.post("/store", getIngredients);
router.get("/info", getStore);

module.exports = router;
