import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";

// Minimal inline Lottie JSON burst (same shape as web)
const burst = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 20,
  w: 64,
  h: 64,
  nm: "burst",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "ring",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: 100 },
            { t: 20, s: 0 },
          ],
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [32, 32, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [20, 20, 100] },
            { t: 20, s: [110, 110, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [40, 40] },
          nm: "ellipse",
          d: 1,
        },
        {
          ty: "st",
          c: { a: 0, k: [0.8, 1, 1, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 3 },
          lc: 2,
          lj: 2,
          nm: "stroke",
        },
        {
          ty: "tr",
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
          sk: { a: 0, k: 0 },
          sa: { a: 0, k: 0 },
        },
      ],
      ip: 0,
      op: 20,
      st: 0,
      bm: 0,
    },
  ],
} as const;

export default function HitEffect({ visible }: { visible: boolean }) {
  const LottieView: any = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require("lottie-react-native").default;
    } catch {
      return null;
    }
  }, []);

  if (!visible || !LottieView) return null;
  return (
    <View pointerEvents="none" style={styles.container}>
      <LottieView
        source={burst as any}
        autoPlay
        loop={false}
        style={{ width: 64, height: 64 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 32,
    right: 24,
  },
});


