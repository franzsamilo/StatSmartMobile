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
  files: Array<{ uri: string; name: string; type: string }>
): Promise<{ sessionId: string; analysis: unknown }> {
  const form = new FormData();
  for (const f of files) {
    form.append("files", {
      // @ts-expect-error React Native FormData file type
      uri: f.uri,
      name: f.name,
      type: f.type,
    });
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
