import { env } from "../../config/env";
import { logger } from "../../config/logger";

/**
 * Transactional email worker (OTP, password reset).
 * Provider adapter stub: logs when EMAIL_PROVIDER_KEY is absent.
 */
export async function emailWorker(data: { to: string; subject: string; html: string }): Promise<void> {
  if (!env.EMAIL_PROVIDER_KEY) {
    logger.info({ to: data.to, subject: data.subject }, "email provider not configured; logging email");
    return;
  }
  // TODO: integrate provider (SES/SendGrid) using EMAIL_PROVIDER_KEY + EMAIL_FROM.
  logger.info({ to: data.to, subject: data.subject }, "email sent (stub)");
}
