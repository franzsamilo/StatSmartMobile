import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Link } from "expo-router";

type QuizItem = {
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
};

export default function QuizScreen() {
  const [items, setItems] = useState<QuizItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("statsmart:analysis");
        if (raw) {
          const parsed = JSON.parse(raw) as {
            analysis?: { quiz?: QuizItem[] };
          };
          if (parsed?.analysis?.quiz)
            setItems(parsed.analysis.quiz.slice(0, 5));
        }
      } catch {}
    })();
  }, []);

  const score = useMemo(() => {
    if (!submitted) return 0;
    return items.reduce(
      (acc, q, i) => (answers[i] === q.answer ? acc + 1 : acc),
      0
    );
  }, [submitted, items, answers]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={styles.header}>Quick Quiz</Text>
      {items.length === 0 ? (
        <Text style={{ color: "rgba(255,255,255,0.85)" }}>
          No quiz available. Return to results.
        </Text>
      ) : (
        <View style={{ gap: 12 }}>
          {items.map((q, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.question}>
                {i + 1}. {q.question}
              </Text>
              <View style={{ gap: 6 }}>
                {q.choices.map((c, idx) => (
                  <Pressable
                    key={idx}
                    disabled={submitted}
                    onPress={() => setAnswers((a) => ({ ...a, [i]: idx }))}
                    style={[
                      styles.choice,
                      answers[i] === idx && styles.choiceActive,
                    ]}
                  >
                    <Text style={styles.choiceText}>{c}</Text>
                  </Pressable>
                ))}
              </View>
              {submitted && (
                <Text
                  style={[
                    styles.expl,
                    answers[i] === q.answer
                      ? { color: "#86efac" }
                      : { color: "#fecaca" },
                  ]}
                >
                  {answers[i] === q.answer ? "Correct." : "Incorrect."}{" "}
                  {q.explanation}
                </Text>
              )}
            </View>
          ))}
          {!submitted ? (
            <Pressable onPress={() => setSubmitted(true)} style={styles.cta}>
              <Text style={styles.ctaText}>Submit</Text>
            </Pressable>
          ) : (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white" }}>
                Score: {score}/{items.length}
              </Text>
              <Link
                href="/"
                style={{ color: "#93c5fd", textDecorationLine: "underline" }}
              >
                Back to home
              </Link>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#061428",
  },
  header: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  question: {
    color: "white",
    fontWeight: "600",
  },
  choice: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  choiceActive: {
    backgroundColor: "#22d3ee",
  },
  choiceText: {
    color: "white",
  },
  expl: {
    marginTop: 6,
  },
  cta: {
    backgroundColor: "#22d3ee",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: "flex-end",
  },
  ctaText: {
    color: "#06203d",
    fontWeight: "600",
  },
});

