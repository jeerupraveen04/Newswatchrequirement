import { Router } from "express";
import { authRouter } from "./auth.routes";
import { healthRouter } from "./health.routes";
import { articleRouter } from "./articles.routes";
import { categoryRouter, regionRouter } from "./taxonomy.routes";
import {
  bookmarkRouter,
  commentRouter,
  followRouter,
  notificationRouter,
  reactionRouter,
} from "./engagement.routes";
import { appSettingsRouter, deviceRouter, userRouter } from "./users.routes";
import { reporterRouter } from "./reporter.routes";
import { adminRouter } from "./admin.routes";
import { mediaRouter } from "./media.routes";

export const apiRouter: Router = Router();

apiRouter.use(healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/regions", regionRouter);
apiRouter.use("/articles", articleRouter);
apiRouter.use("/media", mediaRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/reporter", reporterRouter);
apiRouter.use(appSettingsRouter);
apiRouter.use(deviceRouter);
apiRouter.use(userRouter);
apiRouter.use(commentRouter);
apiRouter.use(reactionRouter);
apiRouter.use(bookmarkRouter);
apiRouter.use(followRouter);
apiRouter.use(notificationRouter);
