import * as ImagePicker from "expo-image-picker";
import { api } from "./api";

export interface UploadedMedia {
  assetId: string;
  kind: "image" | "video";
  url: string | null;
  localUri: string;
}

interface SignResponse {
  assetId: string;
  key: string;
  uploadUrl: string;
  expiresInSec: number;
  uploadType: "single";
}

interface CompleteResponse {
  id: string;
  processingStatus: string;
  url: string | null;
}

function guessContentType(uri: string, kind: "image" | "video"): string {
  const ext = uri.split(".").pop()?.toLowerCase() ?? "";
  if (kind === "video") {
    if (ext === "webm") return "video/webm";
    if (ext === "mov") return "video/quicktime";
    return "video/mp4";
  }
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

/**
 * Pick an image or video, then run the signed-upload lifecycle:
 *   POST /media/sign -> PUT bytes to R2 -> POST /media/:id/complete
 * Videos are transcoded asynchronously; the caller can poll `getMedia`.
 */
export async function pickAndUpload(kind: "image" | "video", purpose: "hero" | "gallery" = "hero"): Promise<UploadedMedia | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error("Photo library permission is required");

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: kind === "video" ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
    quality: 0.9,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const contentType = asset.mimeType ?? guessContentType(asset.uri, kind);
  const sizeBytes = asset.fileSize ?? 1;

  const sign = await api<SignResponse>("/media/sign", {
    method: "POST",
    body: { kind, contentType, sizeBytes, purpose },
  });

  const fileRes = await fetch(asset.uri);
  const blob = await fileRes.blob();
  const put = await fetch(sign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!put.ok) throw new Error("Upload failed. Check your connection and try again.");

  const complete = await api<CompleteResponse>(`/media/${sign.assetId}/complete`, {
    method: "POST",
    body: asset.duration ? { durationSeconds: Math.round(asset.duration / 1000) } : {},
  });

  return { assetId: sign.assetId, kind, url: complete.url, localUri: asset.uri };
}

export function getMedia(id: string) {
  return api<{ id: string; processingStatus: string; url: string | null }>(`/media/${id}`);
}
