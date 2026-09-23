import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";

/**
 * Cloudflare R2 client (S3-compatible API).
 * Dev uses MinIO; prod uses R2 with a public bucket behind Cloudflare CDN.
 */
export const r2 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT || undefined,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID || "minioadmin",
    secretAccessKey: env.R2_SECRET_ACCESS_KEY || "minioadmin",
  },
  forcePathStyle: true,
});

export function publicUrl(key: string): string {
  const base = env.R2_PUBLIC_BASE_URL.replace(/\/$/, "");
  return base ? `${base}/${key}` : key;
}

export async function presignPut(key: string, contentType: string): Promise<string> {
  return getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: Math.min(env.R2_SIGNED_URL_TTL, 600) },
  );
}

export async function deleteObject(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  await r2.send(
    new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, Body: body, ContentType: contentType }),
  );
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const res = await r2.send(new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
  const stream = res.Body as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk as Buffer));
  return Buffer.concat(chunks);
}

/** Download an object to a local file path (streams). */
export async function downloadToFile(key: string, destPath: string): Promise<void> {
  const { createWriteStream } = await import("node:fs");
  const { pipeline } = await import("node:stream/promises");
  const res = await r2.send(new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
  await pipeline(res.Body as NodeJS.ReadableStream, createWriteStream(destPath));
}

/** Upload a local file to an object key. */
export async function uploadFile(key: string, filePath: string, contentType: string): Promise<void> {
  const { createReadStream } = await import("node:fs");
  await r2.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: createReadStream(filePath),
      ContentType: contentType,
    }),
  );
}
