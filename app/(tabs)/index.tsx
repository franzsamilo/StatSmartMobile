import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, Text, Pressable, Image, ScrollView } from "react-native";
import React from "react";
import { MotiView } from "moti";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  return (
    <LinearGradient
      colors={["#061428", "#0a1e3b", "#061428"]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.center}>
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 600 }}
        >
          <View style={styles.brandRow}>
            <Image
              source={require("@/assets/images/icon_copy.png")}
              style={{ width: 64, height: 64, marginRight: 8 }}
            />
            <Text style={styles.brand}>StatSmart</Text>
          </View>
        </MotiView>
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 150, duration: 500 }}
        >
          <Text style={styles.tagline}>Upload. Analyze. Learn.</Text>
        </MotiView>
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 300, duration: 500 }}
        >
          <Pressable
            style={styles.cta}
            onPress={() => router.push("/upload")}
            accessibilityLabel="Get started"
          >
            <Text style={styles.ctaText}>Get Started</Text>
          </Pressable>
        </MotiView>
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 450, duration: 500 }}
        >
          <Pressable
            style={[
              styles.cta,
              {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.25)",
                marginTop: 10,
              },
            ]}
            onPress={async () => {
              const raw = await AsyncStorage.getItem("statsmart:analysis");
              if (!raw) return;
              try {
                JSON.parse(raw);
                router.push("/results");
              } catch {}
            }}
            accessibilityLabel="View last analysis"
          >
            <Text style={[styles.ctaText, { color: "white" }]}>
              View last analysis
            </Text>
          </Pressable>
        </MotiView>
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 600, duration: 500 }}
        >
          <RecentList />
        </MotiView>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function RecentList() {
  const router = useRouter();
  const [items, setItems] = React.useState<
    Array<{
      id: string;
      at: number;
      recommendedTest?: string;
      variablesCount?: number;
    }>
  >([]);
  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      }),
    []
  );
  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("statsmart:recent");
        const list = raw ? (JSON.parse(raw) as any[]) : [];
        setItems(list);
      } catch {}
    })();
  }, []);
  if (!items.length) return null;
  return (
    <View style={{ marginTop: 18, width: "100%", maxWidth: 520 }}>
      <Text style={{ color: "white", fontWeight: "700", marginBottom: 8 }}>
        Recent analyses
      </Text>
      {items.map((it) => (
        <Pressable
          key={it.id}
          onPress={() => router.push("/results")}
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            borderColor: "rgba(255,255,255,0.12)",
            borderWidth: 1,
            borderRadius: 10,
            padding: 10,
            marginBottom: 6,
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.9)" }} numberOfLines={1}>
            {it.recommendedTest || "Analysis"}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <Text
              style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, flexShrink: 1 }}
              numberOfLines={1}
            >
              {(it.variablesCount || 0) + " variables"}
            </Text>
            <Text
              style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}
              numberOfLines={1}
            >
              {dateFormatter.format(new Date(it.at))}
          </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 48, fontWeight: "700", color: "white" },
  tagline: { marginTop: 8, color: "rgba(255,255,255,0.85)", fontSize: 16 },
  cta: {
    marginTop: 18,
    backgroundColor: "#22d3ee",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  ctaText: { color: "#06203d", fontWeight: "600" },
});
