import { useEffect, useRef, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { analyzeFromUrls } from "@/app/lib/api";

export default function ProcessingScreen() {
  const router = useRouter();
  const startedAtRef = useRef<number>(Date.now());
  const MIN_DISPLAY_MS = 12000;
  const [showFinalBrand, setShowFinalBrand] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const BRAND_ICON_MS = 2000;
  const BRAND_POWERED_MS = 2000;
  const BRAND_FINAL_MS = 4000;
  const BRAND_TOTAL_MS = BRAND_ICON_MS + BRAND_POWERED_MS + BRAND_FINAL_MS; // 8000ms
  const steps = [
    "Preparing files for secure analysis",
    "Validating types and sizes",
    "Extracting text and tables",
    "Identifying variables and scales",
    "Choosing the best statistical methods",
    "Assembling results and a quick quiz",
  ];
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let stepTimer: ReturnType<typeof setInterval>;
    let progTimer: ReturnType<typeof setInterval>;
    let timeout: ReturnType<typeof setTimeout>;

    const processAnalysis = async () => {
      try {
        // Read URLs from AsyncStorage
        const urlsJson = await AsyncStorage.getItem("statsmart:pendingUrls");
        if (!urlsJson) {
          setError("No files to analyze");
          return;
        }

        const urls: string[] = JSON.parse(urlsJson);

        // Call analyze API
        const result = await analyzeFromUrls(urls);

        // Store result
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
            variablesCount: Array.isArray(a?.variables)
              ? a.variables.length
              : 0,
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

        // Clear pending URLs
        await AsyncStorage.removeItem("statsmart:pendingUrls");

        // Show final brand and navigate
        setShowFinalBrand(true);
        timeout = setTimeout(() => {
          router.replace({
            pathname: "/results",
            params: { id: result.sessionId },
          });
        }, BRAND_TOTAL_MS);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Analysis failed";
        setError(msg);
        await AsyncStorage.removeItem("statsmart:pendingUrls");
      }
    };

    processAnalysis();

    // Start UI animations
    stepTimer = setInterval(() => {
      setActiveStep((s) => (s + 1) % steps.length);
    }, 1500);
    progTimer = setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      const p = Math.min(elapsed / MIN_DISPLAY_MS, 1);
      setProgress(p);
    }, 100);

    return () => {
      if (timeout) clearTimeout(timeout);
      clearInterval(stepTimer);
      clearInterval(progTimer);
    };
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Animated background */}
      <View style={styles.bg} pointerEvents="none">
        <MotiView
          from={{ opacity: 0.3, translateY: 0, scale: 1 }}
          animate={{ opacity: 0.6, translateY: -12, scale: 1.05 }}
          transition={{ loop: true, duration: 4000, type: "timing" }}
          style={[
            styles.blob,
            { backgroundColor: "#22d3ee33", top: 100, left: 40 },
          ]}
        />
        <MotiView
          from={{ opacity: 0.2, translateY: 0, scale: 1 }}
          animate={{ opacity: 0.45, translateY: 10, scale: 1.08 }}
          transition={{
            loop: true,
            duration: 4500,
            delay: 200,
            type: "timing",
          }}
          style={[
            styles.blob,
            { backgroundColor: "#3b82f633", bottom: 120, right: 60 },
          ]}
        />
        <MotiView
          from={{ opacity: 0.25, translateY: 0, scale: 1 }}
          animate={{ opacity: 0.5, translateY: -8, scale: 1.06 }}
          transition={{
            loop: true,
            duration: 5000,
            delay: 400,
            type: "timing",
          }}
          style={[
            styles.blobSmall,
            { backgroundColor: "#06b6d433", top: 220, right: 120 },
          ]}
        />
      </View>
      <View style={{ alignItems: "center" }}>
        {error ? (
          <>
            <Image
              source={require("@/assets/images/icon_copy.png")}
              style={{ width: 144, height: 144 }}
            />
            <Text style={styles.title}>Analysis Failed</Text>
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </>
        ) : !showFinalBrand ? (
          <>
            <Image
              source={require("@/assets/images/icon_copy.png")}
              style={{ width: 144, height: 144 }}
            />
            <Text style={styles.title}>Powered by StatSmart</Text>
            <View style={{ height: 16 }} />
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ loop: true, type: "timing", duration: 1200 }}
              style={{ flexDirection: "row", gap: 6 }}
            >
              <View style={styles.dot} />
              <View style={[styles.dot, { opacity: 0.7 }]} />
              <View style={[styles.dot, { opacity: 0.5 }]} />
            </MotiView>
            <Text style={styles.subtitle}>{steps[activeStep]}…</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(progress * 100)}%` },
                ]}
              />
            </View>
          </>
        ) : (
          <>
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "timing", duration: 800 }}
            >
              <Image
                source={require("@/assets/images/icon_copy.png")}
                style={{ width: 260, height: 260 }}
              />
            </MotiView>
            <MotiView
              from={{ opacity: 0, translateY: 6 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: "timing",
                delay: BRAND_ICON_MS,
                duration: 800,
              }}
            >
              <Text style={styles.poweredBy}>Powered by</Text>
            </MotiView>
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: "timing",
                delay: BRAND_ICON_MS + BRAND_POWERED_MS,
                duration: 900,
              }}
            >
              <Text style={styles.brand}>StatSmart</Text>
            </MotiView>
          </>
        )}
      </View>
    </View>
  );
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
    marginTop: -16,
    fontSize: 28,
    fontWeight: "600",
    color: "white",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  bg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blob: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 200,
  },
  blobSmall: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 200,
  },
  poweredBy: {
    marginTop: 24,
    fontSize: 18,
    fontStyle: "italic",
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  brand: {
    marginTop: 8,
    fontSize: 56,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#22d3ee",
  },
  progressTrack: {
    marginTop: 12,
    width: 240,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  progressFill: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#22d3ee",
  },
  errorBox: {
    marginTop: 16,
    backgroundColor: "rgba(239,68,68,0.15)",
    borderColor: "rgba(239,68,68,0.35)",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 300,
  },
  errorText: {
    color: "#fecaca",
    textAlign: "center",
  },
});
