const express = require("express");
const cors = require("cors");
const router = require("./routes/index");
const mongoose = require("mongoose");
require("dotenv").config();

const port = process.env.PORT || 3001;

// Server init
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api", router);

// Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Database connected"))
  .catch((e) => console.error(e));

// Listening
app.listen(port, () => console.log(`Server listening on port ${port}`));
