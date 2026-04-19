const { app } = require("./app");
const { config } = require("./config/env");
const net = require("net");

function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        tester.close(() => resolve(true));
      })
      .listen(port);
  });
}

async function startServer() {
  let port = config.port;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const available = await checkPortAvailable(port);
    if (available) {
      app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
      return;
    }

    port += 1;
  }

  throw new Error(`No free port found starting from ${config.port}`);
}

startServer().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
