const express = require("express");
const cors = require("cors");
const router = require("./routes/index");
require("dotenv").config();

const port = process.env.PORT || 3001;

// Server init
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api", router);

// Listening
app.listen(port, () => console.log(`Server listening on port ${port}`));
