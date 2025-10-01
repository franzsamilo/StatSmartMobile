import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FeatureDialog } from "@/components/ui/feature-dialog";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";

type Variable = { name: string; type: string; role?: string };
type ResultsData = {
  variables?: Variable[];
  recommendedTest?: string;
  topAnalyses?: Array<{ name: string; rationale: string }>;
  flowchartSteps?: string[];
  insights?: string[];
  quiz?: Array<{
    question: string;
    choices: string[];
    answer: number;
    explanation: string;
  }>;
};

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [data, setData] = useState<ResultsData | null>(null);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(true);

  async function copyProcedure() {
    if (!data?.flowchartSteps) return;
    const text = data.flowchartSteps.map((s, i) => `${i + 1}. ${s}`).join("\n");
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Clipboard.setStringAsync(text);
    } catch {}
  }

  async function copyVariables() {
    if (!data?.variables) return;
    const text = data.variables
      .map(
        (v, i) =>
          `${i + 1}. ${v.name} — ${v.type}${v.role ? ` (${v.role})` : ""}`
      )
      .join("\n");
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Clipboard.setStringAsync(text);
    } catch {}
  }

  async function shareSummary() {
    const summary = [
      data?.recommendedTest ? `Recommended test: ${data.recommendedTest}` : "",
      data?.variables?.length ? `Variables: ${data.variables.length}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Share.share({ message: summary || "StatSmart analysis" });
    } catch {}
  }

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("statsmart:analysis");
        if (raw) {
          const { analysis } = JSON.parse(raw) as {
            sessionId: string;
            analysis: ResultsData;
          };
          setData(analysis);
        }
      } catch {}
    })();
  }, [id]);

  if (!data) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: "white" }}>
          Session expired. Please upload again.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.header}>StatSmart</Text>

        {data.topAnalyses && data.topAnalyses.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Top suggestions</Text>
            {data.topAnalyses.slice(0, 3).map((a, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemBadge}>#{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{a.name}</Text>
                  <Text style={styles.itemText}>{a.rationale}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Recommended Test</Text>
            <Pressable
              onPress={copyProcedure}
              accessibilityLabel="Copy procedure"
              style={styles.smallBtn}
            >
              <Text style={styles.smallBtnText}>Copy procedure</Text>
            </Pressable>
          </View>
          <Text style={styles.itemText}>{data.recommendedTest || ""}</Text>
          {data.flowchartSteps && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.itemTitle}>Procedure</Text>
              {data.flowchartSteps.map((s, i) => (
                <Text key={i} style={styles.itemText}>
                  • {s}
                </Text>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Variables</Text>
            <Pressable
              onPress={copyVariables}
              accessibilityLabel="Copy variables"
              style={styles.smallBtn}
            >
              <Text style={styles.smallBtnText}>Copy variables</Text>
            </Pressable>
          </View>
          {data.variables?.map((v, i) => (
            <Text key={i} style={styles.itemText}>
              {i + 1}. {v.name} — {v.type}
              {v.role ? ` (${v.role})` : ""}
            </Text>
          ))}
        </View>

        {data.insights && data.insights.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionTitle}>Other insights</Text>
              <Pressable
                onPress={() => setInsightsOpen((o) => !o)}
                accessibilityLabel="Toggle insights"
                style={styles.smallBtn}
              >
                <Text style={styles.smallBtnText}>
                  {insightsOpen ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>
            {insightsOpen &&
              data.insights.map((s, i) => (
                <Text key={i} style={styles.itemText}>
                  • {s}
                </Text>
              ))}
          </View>
        )}

        <View style={{ height: 12 }} />
        <View style={styles.bottomBar}>
          <Pressable
            onPress={() => router.replace("/upload")}
            style={[styles.cta, styles.ctaGhost]}
            accessibilityLabel="Start over"
            onPressIn={async () => {
              try {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
            }}
          >
            <Text style={[styles.ctaText, { color: "white" }]}>Start over</Text>
          </Pressable>
          <Pressable
            onPress={shareSummary}
            style={styles.cta}
            accessibilityLabel="Share summary"
          >
            <Text style={styles.ctaText}>Share</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowQuizDialog(true)}
            style={styles.cta}
            accessibilityLabel="Proceed to quiz"
          >
            <Text style={styles.ctaText}>Proceed to quiz</Text>
          </Pressable>
        </View>
        <FeatureDialog
          visible={showQuizDialog}
          title="Feature to be implemented"
          message="The quiz experience is coming soon. For now, explore the analysis above."
          onClose={() => setShowQuizDialog(false)}
        />
        <View style={{ height: 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#061428",
  },
  empty: {
    flex: 1,
    backgroundColor: "#061428",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
    alignSelf: "center",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  itemBadge: {
    color: "#06203d",
    backgroundColor: "#22d3ee",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "700",
    alignSelf: "flex-start",
    marginRight: 6,
  },
  itemTitle: {
    color: "white",
    fontWeight: "600",
    marginBottom: 4,
  },
  itemText: {
    color: "rgba(255,255,255,0.85)",
  },
  cta: {
    backgroundColor: "#22d3ee",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ctaGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  ctaText: {
    color: "#06203d",
    fontWeight: "600",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
  },
  smallBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallBtnText: {
    color: "white",
    fontWeight: "600",
  },
});
