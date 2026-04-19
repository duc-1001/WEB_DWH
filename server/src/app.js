const express = require("express");
const cors = require("cors");
const { cubeRoutes } = require("./routes/cubeRoutes");
const { catalogRoutes } = require("./routes/catalogRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/cube", cubeRoutes);
app.use("/api/catalog", catalogRoutes);

module.exports = { app };
