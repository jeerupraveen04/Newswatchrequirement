import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";
import {
  forgotSchema,
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  refreshSchema,
  registerSchema,
  resetSchema,
} from "../validators/auth.schema";

export const authRouter: Router = Router();

const authIpLimit = rateLimit({ keyPrefix: "auth", windowSeconds: 900, max: 10 });
const otpLimit = rateLimit({
  keyPrefix: "otp",
  windowSeconds: 900,
  max: 5,
  keyFn: (req) => String(req.body?.identifier ?? req.ip),
});

authRouter.post("/register", authIpLimit, validate({ body: registerSchema }), authController.register);
authRouter.post("/login", authIpLimit, validate({ body: loginSchema }), authController.login);
authRouter.post("/otp/request", otpLimit, validate({ body: otpRequestSchema }), authController.otpRequest);
authRouter.post("/otp/verify", authIpLimit, validate({ body: otpVerifySchema }), authController.otpVerify);
authRouter.post("/refresh", validate({ body: refreshSchema }), authController.refresh);
authRouter.post("/logout", validate({ body: refreshSchema }), authController.logout);
authRouter.post("/password/forgot", authIpLimit, validate({ body: forgotSchema }), authController.forgot);
authRouter.post("/password/reset", authIpLimit, validate({ body: resetSchema }), authController.reset);
authRouter.get("/me", authenticate, authController.me);
