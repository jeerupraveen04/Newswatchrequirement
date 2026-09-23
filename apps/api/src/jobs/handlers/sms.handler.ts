import { env } from "../../config/env";
import { logger } from "../../config/logger";

/**
 * SMS OTP worker. Provider adapter stub: logs when SMS_PROVIDER_KEY is absent.
 */
export async function smsWorker(data: { to: string; text: string }): Promise<void> {
  if (!env.SMS_PROVIDER_KEY) {
    logger.info({ to: data.to }, "sms provider not configured; logging OTP sms");
    return;
  }
  // TODO: integrate provider (Twilio/MSG91) using SMS_PROVIDER_KEY.
  logger.info({ to: data.to }, "sms sent (stub)");
}
