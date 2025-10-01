import { View, Text, Pressable, StyleSheet } from "react-native";
import { MotiView } from "moti";

type FeatureDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export function FeatureDialog({
  visible,
  title,
  message,
  onClose,
}: FeatureDialogProps) {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <MotiView
        from={{ opacity: 0, scale: 0.98, translateY: 10 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 250 }}
        style={styles.card}
      >
        <View style={styles.badge} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.msg}>{message}</Text>
        <Pressable onPress={onClose} style={styles.btn}>
          <Text style={styles.btnText}>Got it</Text>
        </Pressable>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#0a1e3b",
    borderColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  badge: {
    alignSelf: "center",
    width: 56,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#22d3ee",
    marginBottom: 10,
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  msg: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  btn: {
    marginTop: 14,
    alignSelf: "center",
    backgroundColor: "#22d3ee",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnText: {
    color: "#06203d",
    fontWeight: "700",
  },
});
