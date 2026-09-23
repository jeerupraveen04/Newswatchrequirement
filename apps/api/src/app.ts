import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { env } from "./config/env";
import { requestContext } from "./middleware/requestContext";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { apiRouter } from "./routes";

export function createApp(): Express {
  const app = express();

  app.set("trust proxy", true);
  app.use(requestContext);
  app.use(helmet());
  app.use(
    cors({
      origin: env.SOCKET_CORS_ORIGIN === "*" ? true : env.SOCKET_CORS_ORIGIN.split(","),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(compression());

  app.use(env.API_BASE_PATH, apiRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
