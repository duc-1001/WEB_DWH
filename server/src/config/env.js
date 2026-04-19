const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const DEFAULT_MEASURES = [
  "[Measures].[Quantity Ordered]",
  "[Measures].[Total Amount]",
];

function parseMeasures(rawValue) {
  if (!rawValue) {
    return DEFAULT_MEASURES;
  }

  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeConnectionValue(value) {
  return String(value || "").trim().replace(/\\\\/g, "\\");
}

const config = {
  port: Number(process.env.PORT || 4000),
  cubeServerName: normalizeConnectionValue(process.env.CUBE_SERVER_NAME),
  cubeDatabaseName: normalizeConnectionValue(process.env.CUBE_DATABASE_NAME),
  cubeName: normalizeConnectionValue(process.env.CUBE_NAME),
  cubeSalesName: normalizeConnectionValue(process.env.CUBE_SALES_NAME) || "CUBE_SALES",
  cubeInventoryName: normalizeConnectionValue(process.env.CUBE_INVENTORY_NAME) || "CUBE_INVENTORY",
  dbUser: process.env.DB_USER || "sa",
  dbPass: process.env.DB_PASS || "",
};

module.exports = { config };
