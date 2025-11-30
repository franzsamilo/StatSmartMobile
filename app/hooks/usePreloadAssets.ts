import { useEffect } from "react";
import { Image } from "react-native";
import { SPRITES } from "../quizSprites";

const BG = require("../../assets/images/background.png");
const PLATFORM = require("../../assets/images/platform.png");

export function usePreloadAssets() {
  useEffect(() => {
    const imgs: number[] = [BG as number, PLATFORM as number];
    // Collect all sprite sources
    Object.values(SPRITES).forEach((defs: any) => {
      Object.values(defs as Record<string, { src: number }>).forEach((d) => {
        if (d?.src) imgs.push(d.src as number);
      });
    });
    imgs.forEach((src) => {
      try {
        const { uri } = Image.resolveAssetSource(src as any);
        if (uri) void Image.prefetch(uri);
      } catch {}
    });
  }, []);
}
