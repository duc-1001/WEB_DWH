const ADODB = require("node-adodb");
const { config } = require("../config/env");

function validateConnectionConfig() {
  if (!config.cubeServerName || !config.cubeDatabaseName) {
    throw new Error("Missing CUBE_SERVER_NAME or CUBE_DATABASE_NAME in .env");
  }
}

function createConnection() {
  validateConnectionConfig();
  const connectionString = `Provider=MSOLAP;Data Source=${config.cubeServerName};Initial Catalog=${config.cubeDatabaseName};`;
  const use64BitCscript = process.arch === "x64";
  return ADODB.open(connectionString, use64BitCscript);
}

let cachedConnection = null;

function getConnection() {
  if (!cachedConnection) {
    cachedConnection = createConnection();
  }

  return cachedConnection;
}

module.exports = { getConnection };
