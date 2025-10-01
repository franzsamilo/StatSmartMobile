import { useEffect, useRef, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function ProcessingScreen() {
  const { sid } = useLocalSearchParams<{ sid?: string }>();
  const router = useRouter();
  const startedAtRef = useRef<number>(Date.now());
  const MIN_DISPLAY_MS = 12000;
  const [showFinalBrand, setShowFinalBrand] = useState(false);
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
    const remaining = Math.max(
      0,
      MIN_DISPLAY_MS - (Date.now() - startedAtRef.current)
    );
    const stepTimer = setInterval(() => {
      setActiveStep((s) => (s + 1) % steps.length);
    }, 1500);
    const progTimer = setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      const p = Math.min(elapsed / MIN_DISPLAY_MS, 1);
      setProgress(p);
    }, 100);
    const t = setTimeout(() => {
      setShowFinalBrand(true);
      setTimeout(() => {
        router.replace({ pathname: "/results", params: { id: sid ?? "" } });
      }, 4000);
    }, remaining);
    return () => {
      clearTimeout(t);
      clearInterval(stepTimer);
      clearInterval(progTimer);
    };
  }, [router, sid]);

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
        {!showFinalBrand && (
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
        )}
        {showFinalBrand && (
          <>
            <Image
              source={require("@/assets/images/icon_copy.png")}
              style={{ width: 260, height: 260 }}
            />
            <Text style={styles.brand}>StatSmart</Text>
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
  brand: {
    marginTop: 16,
    fontSize: 48,
    fontWeight: "700",
    color: "white",
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
});
