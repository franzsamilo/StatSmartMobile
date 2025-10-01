import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { analyzeFiles } from "@/app/lib/api";

const ACCEPTED = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const MAX_FILES = 3;
const MAX_SIZE_BYTES = 4 * 1024 * 1024;

export default function UploadScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<
    Array<{ uri: string; name: string; type: string; size?: number }>
  >([]);

  async function pickFiles() {
    try {
      setError(null);
      const res = await DocumentPicker.getDocumentAsync({ multiple: true });
      if (res.canceled) return;
      const assets = res.assets.slice(0, MAX_FILES);
      if (assets.length === 0) return;
      const files = [] as Array<{
        uri: string;
        name: string;
        type: string;
        size?: number;
      }>;
      for (const a of assets) {
        const name = a.name ?? "file";
        const type = inferMime(name, a.mimeType);
        if (!ACCEPTED.has(type)) {
          setError("Only .pdf, .docx, or .xlsx files are allowed.");
          return;
        }
        if (a.size && a.size > MAX_SIZE_BYTES) {
          setError("Each file must be ≤ 4 MB.");
          return;
        }
        files.push({ uri: a.uri, name, type, size: a.size });
      }
      setSelected(files);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setError(msg);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    } finally {
      // no-op
    }
  }

  async function upload() {
    if (selected.length === 0) return;
    setBusy(true);
    try {
      const result = await analyzeFiles(
        selected.map(({ uri, name, type }) => ({ uri, name, type }))
      );
      await AsyncStorage.setItem(
        "statsmart:analysis",
        JSON.stringify({
          sessionId: result.sessionId,
          analysis: result.analysis,
        })
      );
      // Save to recent (keep last 3)
      try {
        const a: any = result.analysis as any;
        const rec = {
          id: result.sessionId,
          at: Date.now(),
          recommendedTest: a?.recommendedTest ?? "",
          variablesCount: Array.isArray(a?.variables) ? a.variables.length : 0,
          analysis: a,
        };
        const rawRecent = await AsyncStorage.getItem("statsmart:recent");
        const recent = rawRecent ? (JSON.parse(rawRecent) as any[]) : [];
        const next = [rec, ...recent.filter((r) => r?.id !== rec.id)].slice(
          0,
          3
        );
        await AsyncStorage.setItem("statsmart:recent", JSON.stringify(next));
      } catch {}
      router.replace({
        pathname: "/processing",
        params: { sid: result.sessionId },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setError(msg);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload your file</Text>
      <Text style={styles.subtitle}>
        PDF, DOCX, or XLSX • Up to 3 files • 4 MB each
      </Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.actionsRow}>
        <Pressable
          disabled={busy}
          onPress={pickFiles}
          style={[styles.button, busy && { opacity: 0.6 }]}
          accessibilityLabel="Choose files"
          onPressIn={async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
          }}
        >
          <Text style={styles.buttonText}>Choose files</Text>
        </Pressable>
        <View style={{ width: 10 }} />
        <Pressable
          disabled={busy || selected.length === 0}
          onPress={upload}
          style={[
            styles.buttonPrimary,
            (busy || selected.length === 0) && { opacity: 0.6 },
          ]}
          accessibilityLabel="Upload files"
          onPressIn={async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch {}
          }}
        >
          {busy ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <ActivityIndicator color="#fff" />
              <Text style={styles.buttonPrimaryText}>Uploading…</Text>
            </View>
          ) : (
            <Text style={styles.buttonPrimaryText}>Upload</Text>
          )}
        </Pressable>
      </View>

      {selected.length > 0 && (
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>
              Selected files ({selected.length})
            </Text>
            <Pressable
              onPress={() => setSelected([])}
              style={styles.clearBtnOutline}
            >
              <Text style={styles.clearBtnOutlineText}>Clear</Text>
            </Pressable>
          </View>
          <View style={{ gap: 6 }}>
            {selected.map((f, i) => (
              <View key={i} style={styles.previewChipRow}>
                <View style={styles.previewChip}>
                  <Text style={styles.previewChipText} numberOfLines={1}>
                    {f.name}
                    {typeof f.size === "number"
                      ? `  ·  ${(f.size / (1024 * 1024)).toFixed(2)} MB`
                      : ""}
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    setSelected((s) => s.filter((_, idx) => idx !== i))
                  }
                  style={styles.removeBtn}
                  accessibilityLabel={`Remove ${f.name}`}
                >
                  <Text style={styles.removeBtnText}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      )}
      <Text style={styles.privacyNote}>
        We don’t store your files. Temporary analysis only.
      </Text>
    </View>
  );
}

function inferMime(name: string, fallback?: string | null): string {
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (name.endsWith(".xlsx"))
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  return fallback || "application/octet-stream";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#061428",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "white",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  button: {
    marginTop: 18,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#22d3ee",
  },
  buttonText: {
    color: "#06203d",
    fontWeight: "600",
  },
  buttonPrimary: {
    marginTop: 18,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#0ea5e9",
  },
  buttonPrimaryText: {
    color: "white",
    fontWeight: "600",
  },
  error: {
    marginTop: 10,
    color: "#fecaca",
  },
  errorBox: {
    marginTop: 12,
    backgroundColor: "rgba(239,68,68,0.15)",
    borderColor: "rgba(239,68,68,0.35)",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    color: "#fecaca",
  },
  preview: {
    marginTop: 14,
    width: "100%",
    maxWidth: 520,
  },
  previewCard: {
    marginTop: 16,
    width: "100%",
    maxWidth: 520,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  previewTitle: {
    color: "white",
    fontWeight: "600",
  },
  previewChip: {
    backgroundColor: "rgba(34,211,238,0.15)",
    borderColor: "rgba(34,211,238,0.35)",
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  previewChipText: {
    color: "rgba(255,255,255,0.9)",
  },
  previewChipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  removeBtnText: {
    color: "white",
    fontSize: 18,
    marginTop: -2,
  },
  clearBtnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  clearBtnOutlineText: {
    color: "white",
    fontWeight: "600",
  },
  previewItem: {
    color: "rgba(255,255,255,0.85)",
    marginBottom: 4,
  },
  clearBtn: {
    alignSelf: "flex-start",
    marginTop: 6,
  },
  clearBtnText: {
    color: "#93c5fd",
    textDecorationLine: "underline",
  },
  privacyNote: {
    marginTop: 10,
    color: "rgba(255,255,255,0.6)",
  },
});
