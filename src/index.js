const express = require("express");
const cors = require("cors");
const router = require("./routes/index");
require("dotenv").config();

const { PORT } = process.env;

// Server init
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api", router);

// Listening
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
