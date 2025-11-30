import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

export type SpriteProps = {
  source: ImageSourcePropType;
  frames: number;
  fps?: number;
  loop?: boolean;
  playKey?: number; // change to restart one-shot animations
  onComplete?: () => void;
  style?: StyleProp<ViewStyle>;
  scale?: number; // Scale multiplier for sprite size
};

export default function Sprite({
  source,
  frames,
  fps = 10,
  loop = true,
  playKey,
  onComplete,
  style,
  scale = 1,
}: SpriteProps) {
  const [imgW, setImgW] = useState<number>(0);
  const [imgH, setImgH] = useState<number>(0);
  const [frame, setFrame] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resolve packed asset size (local require) or fetch size for remote URIs
  useEffect(() => {
    let active = true;
    try {
      const resolved = Image.resolveAssetSource(source as any);
      if (active && resolved?.width && resolved?.height) {
        setImgW(resolved.width);
        setImgH(resolved.height);
      }
    } catch {}
    return () => {
      active = false;
    };
  }, [source]);

  // Reset on playKey changes (for one-shots)
  useEffect(() => {
    setFrame(0);
  }, [playKey, source]);

  // Animate frames
  useEffect(() => {
    if (imgW === 0 || frames <= 0 || fps <= 0) return;
    const stepMs = Math.max(16, Math.floor(1000 / fps));
    function start() {
      cancel();
      timerRef.current = setInterval(() => {
        setFrame((f) => {
          const next = f + 1;
          if (next >= frames) {
            if (loop) return 0;
            if (onComplete) onComplete();
            cancel();
            return frames - 1;
          }
          return next;
        });
      }, stepMs);
    }
    function cancel() {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
    start();
    return cancel;
  }, [imgW, frames, fps, loop, onComplete]);

  const frameWidth = useMemo(
    () => (imgW > 0 && frames > 0 ? (imgW / frames) * scale : 0),
    [imgW, frames, scale]
  );
  const frameHeight = imgH * scale;
  const scaledImgW = imgW * scale;
  const scaledImgH = imgH * scale;
  const offsetX = -(frameWidth * frame);

  if (!frameWidth || !frameHeight) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        {
          width: frameWidth,
          height: frameHeight,
          overflow: "hidden",
        },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image
        source={source}
        style={{
          width: scaledImgW,
          height: scaledImgH,
          transform: [{ translateX: offsetX }],
        }}
        resizeMode="cover"
      />
    </View>
  );
}
