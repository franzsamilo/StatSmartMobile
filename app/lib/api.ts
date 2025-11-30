// Centralized API client for StatSmart Mobile
// Uses Expo config extra.backendUrl for base URL

import Constants from "expo-constants";

const ENV_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const BASE_URL: string =
  ENV_URL ||
  (Constants.expoConfig?.extra as { backendUrl?: string } | undefined)
    ?.backendUrl ||
  "http://localhost:3000";

export async function analyzeFiles(
  files: { uri: string; name: string; type: string }[]
): Promise<{ sessionId: string; analysis: unknown }> {
  const form = new FormData();
  for (const f of files) {
    form.append("files", {
      uri: f.uri,
      name: f.name,
      type: f.type,
    } as any);
  }
  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    let msg = "Upload failed";
    try {
      const j = await res.json();
      if (j?.error) msg = j.error as string;
    } catch {}
    throw new Error(msg);
  }
  return (await res.json()) as { sessionId: string; analysis: unknown };
}

export async function uploadToBlob(file: {
  uri: string;
  name: string;
  type: string;
}): Promise<string> {
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);
  formData.append("filename", file.name);
  formData.append("mimeType", file.type);

  const res = await fetch(`${BASE_URL}/api/blob/upload`, {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  if (!res.ok) {
    let msg = "Upload failed";
    try {
      const j = await res.json();
      if (j?.code && j?.error) {
        msg = `${j.code}: ${j.error}`;
      } else if (j?.error) {
        msg = j.error;
      }
    } catch {}
    throw new Error(msg);
  }

  const { url } = (await res.json()) as { url: string };
  return url;
}

export async function analyzeFromUrls(
  urls: string[]
): Promise<{ sessionId: string; analysis: unknown }> {
  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
  });
  if (!res.ok) {
    let msg = "Analyze failed";
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  return (await res.json()) as { sessionId: string; analysis: unknown };
}
