import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { closeDb } from "./db/client";
import { initRealtime } from "./realtime/io";

async function main() {
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`NewsWatch API listening on http://localhost:${env.PORT}${env.API_BASE_PATH}`);
  });
  initRealtime(server);
  logger.info(`Socket.IO ready on path ${env.SOCKET_PATH}`);

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down...`);
    server.close();
    await closeDb();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((e) => {
  logger.error(e, "Fatal startup error");
  process.exit(1);
});
