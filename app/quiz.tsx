import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  ImageBackground,
  Image,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Link } from "expo-router";
import HitEffect from "@/components/HitEffect";
import Sprite from "@/components/Sprite";
import { SPRITES } from "./quizSprites";
import { usePreloadAssets } from "./hooks/usePreloadAssets";

type QuizItem = {
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
};

export default function QuizScreen() {
  usePreloadAssets();
  const [items, setItems] = useState<QuizItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showHit, setShowHit] = useState(false);
  // Battle state
  const STAGES_HP = [1, 1, 3, 2, 2, 3, 5];
  const TOTAL_HP = STAGES_HP.reduce((a, b) => a + b, 0);
  const [lives, setLives] = useState<number>(5);
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [stageHp, setStageHp] = useState<number>(STAGES_HP[0]);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [disabledChoices, setDisabledChoices] = useState<Record<number, true>>(
    {}
  );
  const [shieldRemaining, setShieldRemaining] = useState<number>(0);
  const [rageArmed, setRageArmed] = useState<boolean>(false);
  const [showRageTimer, setShowRageTimer] = useState<boolean>(false);
  const RAGE_MS = 15000; // 15 seconds
  const [rageProgress, setRageProgress] = useState<number>(1);
  const [outcome, setOutcome] = useState<"victory" | "defeat" | null>(null);
  const [lastResult, setLastResult] = useState<"hit" | "miss" | null>(null);
  const [stageBanner, setStageBanner] = useState<string | null>(null);
  const [dmgKey, setDmgKey] = useState<number | null>(null);
  const [soldierDmgKey, setSoldierDmgKey] = useState<number | null>(null);
  const [dmgAmount, setDmgAmount] = useState<number>(1);
  const [soldierDmgAmount, setSoldierDmgAmount] = useState<number>(1);
  const [chipPopIdx, setChipPopIdx] = useState<number | null>(null);
  const [inputLocked, setInputLocked] = useState<boolean>(false);
  const rageIntervalRef = useRef<number | null>(null);
  const rageTimeoutRef = useRef<number | null>(null);
  const bossIntroIntervalRef = useRef<number | null>(null);
  const [bossIntroActive, setBossIntroActive] = useState<boolean>(false);
  const [bossIntroCount, setBossIntroCount] = useState<number>(5);
  const [ragePerformed, setRagePerformed] = useState<boolean>(false);

  // Sprite animation state
  const [soldierAnim, setSoldierAnim] = useState<
    "idle" | "attack1" | "attack2" | "hurt" | "death"
  >("idle");
  const [orcAnim, setOrcAnim] = useState<
    "idle" | "attack1" | "attack2" | "hurt" | "death"
  >("idle");
  const [soldierKey, setSoldierKey] = useState<number>(0);
  const [orcKey, setOrcKey] = useState<number>(0);

  // Responsive scaling
  const [uiScale, setUiScale] = useState(1);
  const [screenWidth, setScreenWidth] = useState(412);
  const [screenHeight, setScreenHeight] = useState(915);

  useEffect(() => {
    const update = () => {
      const { width: w, height: h } = Dimensions.get("window");
      setScreenWidth(w);
      setScreenHeight(h);
      const s = Math.min(w / 412, h / 915);
      setUiScale(s > 0 ? s : 1);
    };
    update();
    const sub = Dimensions.addEventListener("change", update);
    return () => {
      if (sub?.remove) sub.remove();
    };
  }, []);

  // Responsive text sizing
  const clamp = (min: number, val: number, max: number) =>
    Math.min(max, Math.max(min, val));
  const getResponsiveFontSize = (base: number) =>
    Math.round(clamp(12, base * uiScale, 24));

  const arenaWRef = useRef<number>(0);
  const [arenaW, setArenaW] = useState<number>(0);
  const BASE_LUNGE = Math.round(80 * uiScale);
  const BUFFER = Math.round(12 * uiScale);
  const TEMP_SLOT_MARGIN_X = Math.round(16 * uiScale);
  const TEMP_SLOT_SIZE = Math.round(128 * uiScale);
  const gapBetweenCenters = Math.max(
    0,
    arenaW - 2 * TEMP_SLOT_MARGIN_X - TEMP_SLOT_SIZE
  );
  const LUNGE_FACTOR = 0.9;
  const COMPUTED_LUNGE = Math.max(
    BASE_LUNGE,
    Math.round(gapBetweenCenters * LUNGE_FACTOR - BUFFER)
  );
  const LUNGE_SPEED_FACTOR = Math.min(
    2.0,
    Math.max(1, COMPUTED_LUNGE / BASE_LUNGE)
  );
  const SOLDIER_LUNGE_PX = COMPUTED_LUNGE;
  const ORC_LUNGE_PX = COMPUTED_LUNGE;
  const SLOT_MARGIN_X = Math.round(16 * uiScale);
  const ARENA_H = Math.round(220 * uiScale) + 64;
  const soldierTranslateX = useRef(new Animated.Value(0)).current;
  const orcTranslateX = useRef(new Animated.Value(0)).current;

  function randAttack(): "attack1" | "attack2" {
    return Math.random() < 0.5 ? "attack1" : "attack2";
  }

  function animMs(
    kind: keyof typeof SPRITES,
    anim: "idle" | "attack1" | "attack2" | "hurt" | "death"
  ): number {
    const conf = (SPRITES as any)[kind][anim] as {
      frames: number;
      fps: number;
    };
    return (conf.frames / conf.fps) * 1000;
  }

  function scheduleDefenderReaction(
    defender: "soldier" | "orc",
    lethal: boolean,
    attackMs: number,
    onAfterDeath?: () => void,
    onAfterNonLethal?: () => void
  ) {
    const midMs = Math.max(0, Math.floor(attackMs * 0.5));
    if (defender === "orc") {
      setTimeout(() => {
        setOrcAnim("hurt");
        setOrcKey(Date.now());
        if (lethal) {
          const hurtMs = animMs("orc", "hurt");
          setTimeout(() => {
            setOrcAnim("death");
            setOrcKey(Date.now());
          }, hurtMs + 200); // Wait for full hurt animation + small buffer
        } else {
          setTimeout(() => setOrcAnim("idle"), animMs("orc", "hurt"));
        }
      }, midMs);
      if (lethal) {
        const hurtMs = animMs("orc", "hurt");
        const deathStartMs = midMs + hurtMs + 200;
        const deathAnimMs = animMs("orc", "death");
        if (onAfterDeath)
          setTimeout(onAfterDeath, deathStartMs + deathAnimMs + 1000); // Extra 1000ms buffer to see full death animation
      } else {
        if (onAfterNonLethal) setTimeout(onAfterNonLethal, attackMs);
      }
    } else {
      setTimeout(() => {
        setSoldierAnim("hurt");
        setSoldierKey(Date.now());
        if (lethal) {
          const hurtMs = animMs("soldier", "hurt");
          setTimeout(() => {
            setSoldierAnim("death");
            setSoldierKey(Date.now());
          }, hurtMs + 200); // Wait for full hurt animation + small buffer
        } else {
          setTimeout(() => setSoldierAnim("idle"), animMs("soldier", "hurt"));
        }
      }, midMs);
      if (lethal) {
        const hurtMs = animMs("soldier", "hurt");
        const deathStartMs = midMs + hurtMs + 200;
        const deathAnimMs = animMs("soldier", "death");
        if (onAfterDeath)
          setTimeout(onAfterDeath, deathStartMs + deathAnimMs + 1000); // Extra 1000ms buffer to see full death animation
      } else {
        if (onAfterNonLethal) setTimeout(onAfterNonLethal, attackMs);
      }
    }
  }

  function showDamageBubble(
    target: "soldier" | "orc",
    afterMs: number,
    amount: number = 1
  ) {
    setTimeout(() => {
      if (target === "orc") {
        setDmgAmount(amount);
        setDmgKey(Date.now());
        setTimeout(() => setDmgKey(null), 420);
      } else {
        setSoldierDmgAmount(amount);
        setSoldierDmgKey(Date.now());
        setTimeout(() => setSoldierDmgKey(null), 420);
      }
    }, afterMs);
  }

  function enemyKindForStage(
    stage: number
  ):
    | "orc"
    | "skeleton"
    | "elite_orc"
    | "armored_orc"
    | "armored_skeleton"
    | "greatsword_skeleton"
    | "orc_rider" {
    if (stage === 6) return "orc_rider";
    if (stage === 5) return "greatsword_skeleton";
    if (stage === 4) return "armored_skeleton";
    if (stage === 3) return "armored_orc";
    if (stage === 2) return "elite_orc";
    if (stage === 1) return "skeleton";
    return "orc";
  }
  const ENEMY_KIND = enemyKindForStage(stageIndex);

  function enemyDisplayName(
    kind: ReturnType<typeof enemyKindForStage>
  ): string {
    switch (kind) {
      case "orc":
        return "Orc";
      case "elite_orc":
        return "Elite Orc";
      case "skeleton":
        return "Skeleton";
      case "armored_orc":
        return "Armored Orc";
      case "armored_skeleton":
        return "Armored Skeleton";
      case "greatsword_skeleton":
        return "Greatsword Skeleton";
      case "orc_rider":
        return "Orc Rider";
    }
  }

  function enemyBadges(kind: ReturnType<typeof enemyKindForStage>): string[] {
    const badges: string[] = [];
    if (kind === "elite_orc" || kind === "orc_rider") badges.push("Boss");
    if (kind === "elite_orc" || kind === "armored_skeleton")
      badges.push("Special attack");
    if (kind === "greatsword_skeleton") badges.push("Heavy Attacker");
    if (kind === "orc_rider") badges.push("Rage");
    return badges;
  }

  const questions = useMemo<QuizItem[]>(() => {
    if (items.length === 0) return [];
    if (items.length >= TOTAL_HP) return items.slice(0, TOTAL_HP);
    const out: QuizItem[] = [];
    for (let i = 0; i < TOTAL_HP; i++) {
      const src =
        i < items.length ? i : Math.floor(Math.random() * items.length);
      const cand = items[src];
      if (i > 0 && cand === out[i - 1] && items.length > 1) {
        out.push(items[(src + 1) % items.length]);
      } else {
        out.push(cand);
      }
    }
    return out;
  }, [items, TOTAL_HP]);

  const current = questions[questionIndex];

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("statsmart:analysis");
        if (raw) {
          const parsed = JSON.parse(raw) as {
            analysis?: { quiz?: QuizItem[] };
          };
          if (parsed?.analysis?.quiz) setItems(parsed.analysis.quiz);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    setStageHp(STAGES_HP[stageIndex] ?? 0);
    setDisabledChoices({});
    // Remove shield gimmick to match web parity
    setShieldRemaining(0);
    // Reset enemy animation when stage changes
    setOrcAnim("idle");
    setOrcKey(Date.now());
    if (stageIndex === 6) {
      // Final boss intro modal and rage setup
      setBossIntroActive(true);
      setBossIntroCount(5);
      setInputLocked(true);
      const interval = setInterval(() => {
        setBossIntroCount((c) => Math.max(0, c - 1));
      }, 1000);
      bossIntroIntervalRef.current = interval as unknown as number;
      const timeout = setTimeout(() => {
        setBossIntroActive(false);
        setInputLocked(false);
        if (bossIntroIntervalRef.current) {
          clearInterval(bossIntroIntervalRef.current);
          bossIntroIntervalRef.current = null;
        }
        // Start rage timer now
        setRageArmed(false);
        setShowRageTimer(true);
        setRageProgress(1);
        setOrcAnim("idle");
        setOrcKey(Date.now());
        const startedAt = Date.now();
        const rInterval = setInterval(() => {
          const elapsed = Date.now() - startedAt;
          const p = Math.max(0, 1 - elapsed / RAGE_MS);
          setRageProgress(p);
        }, 100);
        const rTimeout = setTimeout(() => {
          setRageArmed(true);
          setShowRageTimer(false);
          clearInterval(rInterval);
        }, RAGE_MS);
        rageIntervalRef.current = rInterval as unknown as number;
        rageTimeoutRef.current = rTimeout as unknown as number;
      }, 5000);
      return () => {
        clearTimeout(timeout);
        if (bossIntroIntervalRef.current) {
          clearInterval(bossIntroIntervalRef.current);
          bossIntroIntervalRef.current = null;
        }
      };
    } else {
      setShowRageTimer(false);
      setRageArmed(false);
    }
  }, [stageIndex]);

  // Scenario 1: Rage timer runs out - automatic special attack
  useEffect(() => {
    if (enemyKindForStage(stageIndex) !== "orc_rider") return;
    if (!rageArmed || ragePerformed || outcome) return;
    setRagePerformed(true);
    setLastResult("miss");
    setInputLocked(true);

    // Clear timers
    setShowRageTimer(false);
    if (rageIntervalRef.current) {
      clearInterval(rageIntervalRef.current);
      rageIntervalRef.current = null;
    }
    if (rageTimeoutRef.current) {
      clearTimeout(rageTimeoutRef.current);
      rageTimeoutRef.current = null;
    }

    setOrcAnim("attack2");
    setOrcKey(Date.now());
    const atkMs = animMs("orc", "attack2");
    const lungeMs = Math.round(220 * LUNGE_SPEED_FACTOR);
    Animated.sequence([
      Animated.timing(orcTranslateX, {
        toValue: -ORC_LUNGE_PX,
        duration: lungeMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(orcTranslateX, {
        toValue: 0,
        duration: lungeMs,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => setOrcAnim("idle"));
    const willDie = lives - 4 <= 0;
    scheduleDefenderReaction("soldier", willDie, atkMs, () => {
      setOutcome("defeat");
      setInputLocked(true); // Keep locked during defeat
    });
    showDamageBubble("soldier", atkMs, 4);
    setTimeout(() => {
      setLives((l) => Math.max(0, l - 4));
      setOrcAnim("idle");
      if (!willDie) setInputLocked(false); // Only unlock if not dead
    }, atkMs);
  }, [stageIndex, rageArmed, ragePerformed, outcome, lives]);

  function onPick(idx: number) {
    if (!current || outcome) return;
    if (disabledChoices[idx] || inputLocked) return;
    const isCorrect = idx === (current?.answer ?? -1);
    if (isCorrect) {
      setInputLocked(true);
      setLastResult("hit");
      setShowHit(true);
      setTimeout(() => setShowHit(false), 320);
      try {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      // Scenario 3: Rage timer active and correct answer - clear timer and attack
      if (stageIndex === 6 && showRageTimer) {
        setShowRageTimer(false);
        setRageArmed(false);
        if (rageIntervalRef.current) {
          clearInterval(rageIntervalRef.current);
          rageIntervalRef.current = null;
        }
        if (rageTimeoutRef.current) {
          clearTimeout(rageTimeoutRef.current);
          rageTimeoutRef.current = null;
        }
      }

      const atk = Math.random() < 0.5 ? "attack1" : "attack2";
      setSoldierAnim(atk);
      setSoldierKey(Date.now());
      const atkMs = animMs("soldier", atk);
      const lungeMs = Math.round(220 * LUNGE_SPEED_FACTOR);
      Animated.sequence([
        Animated.timing(soldierTranslateX, {
          toValue: SOLDIER_LUNGE_PX,
          duration: lungeMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(soldierTranslateX, {
          toValue: 0,
          duration: lungeMs,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setSoldierAnim("idle"));

      const nextHp = Math.max(0, stageHp - 1);
      const lethal = nextHp === 0;
      scheduleDefenderReaction(
        "orc",
        lethal,
        atkMs,
        () => {
          // Animation timing is already handled in scheduleDefenderReaction
          if (stageIndex === STAGES_HP.length - 1) {
            setOutcome("victory");
          } else {
            // Show stage cleared popup
            setStageBanner(`Stage ${stageIndex + 1} Cleared!`);
            setInputLocked(true);

            // Wait 1.5s then proceed to next stage
            setTimeout(() => {
              setStageBanner(null);
              setStageHp(nextHp);
              setDisabledChoices({});
              setQuestionIndex((q) => Math.min(q + 1, questions.length - 1));
              setStageIndex((s) => s + 1);
              setInputLocked(false);
              // Reset enemy animation to idle for new stage
              setOrcAnim("idle");
              setOrcKey(Date.now());
            }, 1500);
          }
        },
        () => {
          setStageHp(nextHp);
          setDisabledChoices({});
          setQuestionIndex((q) => Math.min(q + 1, questions.length - 1));
        }
      );
      showDamageBubble("orc", atkMs, 1);
      setChipPopIdx(Math.max(0, stageHp - 1));
      setTimeout(() => setChipPopIdx(null), 250);
      setTimeout(() => setLastResult(null), 250);
      setTimeout(() => setInputLocked(false), atkMs);
      return;
    }
    // shield boss
    if (stageIndex === 2 && shieldRemaining > 0) {
      setShieldRemaining(0);
      setDisabledChoices((d) => ({ ...d, [idx]: true }));
      setLastResult("miss");
      try {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      setTimeout(() => setLastResult(null), 250);
      return;
    }
    // Scenario 2: Rage timer active and wrong answer - special attack and clear timer
    if (stageIndex === 6 && (showRageTimer || rageArmed)) {
      setInputLocked(true);
      setShowRageTimer(false);
      setRageArmed(false);

      // Clear timers
      if (rageIntervalRef.current) {
        clearInterval(rageIntervalRef.current);
        rageIntervalRef.current = null;
      }
      if (rageTimeoutRef.current) {
        clearTimeout(rageTimeoutRef.current);
        rageTimeoutRef.current = null;
      }

      setDisabledChoices((d) => ({ ...d, [idx]: true }));
      setLastResult("miss");
      try {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        );
      } catch {}

      // Boss special attack (4 damage)
      setOrcAnim("attack2");
      setOrcKey(Date.now());
      const atkMs = animMs("orc", "attack2");
      const lungeMs = Math.round(220 * LUNGE_SPEED_FACTOR);
      Animated.sequence([
        Animated.timing(orcTranslateX, {
          toValue: -ORC_LUNGE_PX,
          duration: lungeMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(orcTranslateX, {
          toValue: 0,
          duration: lungeMs,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setOrcAnim("idle"));

      const willDie = lives - 4 <= 0;
      scheduleDefenderReaction("soldier", willDie, atkMs, () => {
        setOutcome("defeat");
        setInputLocked(true);
      });
      showDamageBubble("soldier", atkMs, 4);
      setTimeout(() => {
        setLives((l) => Math.max(0, l - 4));
        setLastResult(null);
        if (!willDie) setInputLocked(false);
      }, atkMs);
      return;
    }
    // normal wrong → enemy lunges
    setInputLocked(true);
    setDisabledChoices((d) => ({ ...d, [idx]: true }));
    setLastResult("miss");
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const enemyAtk = Math.random() < 0.5 ? "attack1" : "attack2";
    setOrcAnim(enemyAtk);
    setOrcKey(Date.now());
    const enemyAtkMs = animMs("orc", enemyAtk);
    const lungeMs = Math.round(220 * LUNGE_SPEED_FACTOR);
    Animated.sequence([
      Animated.timing(orcTranslateX, {
        toValue: -ORC_LUNGE_PX,
        duration: lungeMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(orcTranslateX, {
        toValue: 0,
        duration: lungeMs,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => setOrcAnim("idle"));

    const willDie = lives - 1 <= 0;
    scheduleDefenderReaction("soldier", willDie, enemyAtkMs, () => {
      setOutcome("defeat");
      setInputLocked(true); // Keep locked during defeat
    });
    showDamageBubble("soldier", enemyAtkMs, 1);
    setTimeout(() => {
      setLives((l) => {
        const next = l - 1;
        if (next <= 0) return 0;
        return next;
      });
      setLastResult(null);
      if (!willDie) setInputLocked(false); // Only unlock if not dead
    }, enemyAtkMs);
  }

  function retry() {
    setLives(5);
    setStageIndex(0);
    setStageHp(STAGES_HP[0]);
    setQuestionIndex(0);
    setDisabledChoices({});
    setShieldRemaining(0);
    setRageArmed(false);
    setShowRageTimer(false);
    setRageProgress(1);
    setOutcome(null);
    // Reset both sprite animations
    setSoldierAnim("idle");
    setSoldierKey(Date.now());
    setOrcAnim("idle");
    setOrcKey(Date.now());
  }

  function restartStage() {
    // Reset current stage only
    setStageHp(STAGES_HP[stageIndex]);
    setLives(1); // Set to 1 HP (not 0)
    setDisabledChoices({});
    setInputLocked(false);
    setOutcome(null);

    // Reset question index to start of current stage
    // Calculate how many questions were used in previous stages
    let prevQuestionsUsed = 0;
    for (let i = 0; i < stageIndex; i++) {
      prevQuestionsUsed += STAGES_HP[i];
    }
    setQuestionIndex(prevQuestionsUsed);

    // Reset sprite animations
    setSoldierAnim("idle");
    setSoldierKey(Date.now());
    setOrcAnim("idle");
    setOrcKey(Date.now());

    // Clear any active timers
    if (rageIntervalRef.current) {
      clearInterval(rageIntervalRef.current);
      rageIntervalRef.current = null;
    }
    if (rageTimeoutRef.current) {
      clearTimeout(rageTimeoutRef.current);
      rageTimeoutRef.current = null;
    }
    if (bossIntroIntervalRef.current) {
      clearInterval(bossIntroIntervalRef.current);
      bossIntroIntervalRef.current = null;
    }

    // Reset rage state completely
    setRageArmed(false);
    setShowRageTimer(false);
    setRageProgress(1);
    setRagePerformed(false);

    // For Stage 7 boss, manually restart the boss intro and rage timer
    if (stageIndex === 6) {
      setBossIntroActive(true);
      setBossIntroCount(5);
      setInputLocked(true);

      const interval = setInterval(() => {
        setBossIntroCount((c) => Math.max(0, c - 1));
      }, 1000);
      bossIntroIntervalRef.current = interval as unknown as number;

      setTimeout(() => {
        setBossIntroActive(false);
        setInputLocked(false);
        if (bossIntroIntervalRef.current) {
          clearInterval(bossIntroIntervalRef.current);
          bossIntroIntervalRef.current = null;
        }
        // Start rage timer
        setRageArmed(false);
        setShowRageTimer(true);
        setRageProgress(1);
        setOrcAnim("idle");
        setOrcKey(Date.now());
        const startedAt = Date.now();
        const rInterval = setInterval(() => {
          const elapsed = Date.now() - startedAt;
          const p = Math.max(0, 1 - elapsed / RAGE_MS);
          setRageProgress(p);
        }, 100);
        const rTimeout = setTimeout(() => {
          setRageArmed(true);
          setShowRageTimer(false);
          clearInterval(rInterval);
        }, RAGE_MS);
        rageIntervalRef.current = rInterval as unknown as number;
        rageTimeoutRef.current = rTimeout as unknown as number;
      }, 5000);
    }
  }

  return (
    <ImageBackground
      source={require("@/assets/images/background.png")}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Stage indicator */}
      <View style={styles.stageIndicator}>
        <Text
          style={[styles.stageText, { fontSize: getResponsiveFontSize(14) }]}
        >
          Stage {stageIndex + 1}/7
        </Text>
      </View>
      {questions.length === 0 ? (
        <Text style={{ color: "rgba(255,255,255,0.85)" }}>
          No quiz available. Return to results.
        </Text>
      ) : (
        <>
          {/* Boss intro overlay */}
          {bossIntroActive && (
            <View style={styles.bossIntroOverlay}>
              <View style={styles.bossIntroModal}>
                <Text
                  style={[
                    styles.bossIntroTitle,
                    { fontSize: getResponsiveFontSize(24) },
                  ]}
                >
                  ⚠️ WARNING! ⚠️
                </Text>
                <Text
                  style={[
                    styles.bossIntroSubtitle,
                    { fontSize: getResponsiveFontSize(32) },
                  ]}
                >
                  FINAL BOSS
                </Text>
                <View style={styles.bossCountdownCircle}>
                  <Text
                    style={[
                      styles.bossCountdownText,
                      { fontSize: getResponsiveFontSize(48) },
                    ]}
                  >
                    {bossIntroCount}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.bossIntroMessage,
                    { fontSize: getResponsiveFontSize(14) },
                  ]}
                >
                  Answer fast or face defeat!
                </Text>
              </View>
            </View>
          )}
          {/* Arena with platform background */}
          <View
            style={styles.arenaContainer}
            onLayout={(e) => setArenaW(e.nativeEvent.layout.width)}
          >
            <ImageBackground
              source={require("@/assets/images/platform.png")}
              style={styles.arena}
              resizeMode="cover"
            >
              {/* In-arena status bars */}
              <View style={styles.arenaStatusContainer}>
                {/* Player status */}
                <View style={[styles.arenaStatusBar, styles.playerStatusBar]}>
                  <Text
                    style={[
                      styles.arenaStatusName,
                      { fontSize: getResponsiveFontSize(12) },
                    ]}
                  >
                    Curious Researcher
                  </Text>
                  <Text
                    style={[
                      styles.arenaStatusHp,
                      { fontSize: getResponsiveFontSize(10) },
                    ]}
                  >
                    {lives}/5
                  </Text>
                  <View style={styles.arenaHpBars}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.arenaHpBar,
                          {
                            backgroundColor:
                              lives > i ? "#10b981" : "#ffffff26",
                          },
                        ]}
                      />
                    ))}
                  </View>
                </View>

                {/* Enemy status */}
                <View style={[styles.arenaStatusBar, styles.enemyStatusBar]}>
                  <Text
                    style={[
                      styles.arenaStatusName,
                      { fontSize: getResponsiveFontSize(12) },
                    ]}
                  >
                    {enemyDisplayName(ENEMY_KIND)}
                  </Text>
                  {enemyBadges(ENEMY_KIND).map((badge, idx) => (
                    <Text
                      key={idx}
                      style={[
                        styles.arenaBadge,
                        { fontSize: getResponsiveFontSize(9) },
                      ]}
                    >
                      {badge}
                    </Text>
                  ))}
                  <Text
                    style={[
                      styles.arenaStatusHp,
                      { fontSize: getResponsiveFontSize(10) },
                    ]}
                  >
                    {stageHp}/{STAGES_HP[stageIndex] ?? 0}
                  </Text>
                  <View style={styles.arenaHpBars}>
                    {Array.from({ length: STAGES_HP[stageIndex] ?? 0 }).map(
                      (_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.arenaHpBar,
                            {
                              backgroundColor:
                                i < stageHp ? "#10b981" : "#ffffff26",
                            },
                          ]}
                        />
                      )
                    )}
                  </View>
                </View>
              </View>

              {/* Rage Timer - full width below status bars */}
              {showRageTimer && (
                <View style={styles.rageTimerContainer}>
                  <View style={styles.rageTimerBar}>
                    <View
                      style={[
                        styles.rageTimerFill,
                        { width: `${Math.round(rageProgress * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.rageTimerText}>
                    ⚠️ RAGE TIMER: {Math.ceil(rageProgress * 15)}s
                  </Text>
                </View>
              )}

              {/* Sprites */}
              <View style={styles.spritesContainer}>
                {/* Player sprite */}
                <Animated.View
                  style={[
                    styles.spriteSlot,
                    styles.playerSlot,
                    { transform: [{ translateX: soldierTranslateX }] },
                  ]}
                >
                  <Sprite
                    key={`sold-${soldierKey}`}
                    source={(SPRITES as any).soldier[soldierAnim].src}
                    frames={(SPRITES as any).soldier[soldierAnim].frames}
                    fps={(SPRITES as any).soldier[soldierAnim].fps}
                    scale={3}
                    loop={soldierAnim !== "death"}
                  />
                </Animated.View>

                {/* Enemy sprite */}
                <Animated.View
                  style={[
                    styles.spriteSlot,
                    styles.enemySlot,
                    { transform: [{ translateX: orcTranslateX }] },
                  ]}
                >
                  <Sprite
                    key={`orc-${orcKey}`}
                    source={(SPRITES as any)[ENEMY_KIND][orcAnim].src}
                    frames={(SPRITES as any)[ENEMY_KIND][orcAnim].frames}
                    fps={(SPRITES as any)[ENEMY_KIND][orcAnim].fps}
                    scale={3}
                    loop={orcAnim !== "death"}
                    style={{
                      transform: [{ scaleX: -1 }],
                    }}
                  />
                  <HitEffect visible={showHit} />
                </Animated.View>
              </View>

              {/* Damage popups */}
              {dmgKey && (
                <Text style={[styles.damagePopup, styles.enemyDamagePopup]}>
                  -{dmgAmount}
                </Text>
              )}
              {soldierDmgKey && (
                <Text style={[styles.damagePopup, styles.playerDamagePopup]}>
                  -{soldierDmgAmount}
                </Text>
              )}
            </ImageBackground>
          </View>

          {/* Stage Cleared popup */}
          {stageBanner && (
            <View style={styles.stageClearedOverlay}>
              <View style={styles.stageClearedModal}>
                <Text
                  style={[
                    styles.stageClearedTitle,
                    { fontSize: getResponsiveFontSize(28) },
                  ]}
                >
                  ⭐ {stageBanner} ⭐
                </Text>
                <Text
                  style={[
                    styles.stageClearedSubtitle,
                    { fontSize: getResponsiveFontSize(14) },
                  ]}
                >
                  Get ready for the next challenge!
                </Text>
              </View>
            </View>
          )}

          {/* Question and choices */}
          {current && (
            <View style={styles.questionContainer}>
              <View style={styles.questionCard}>
                <Text
                  style={[
                    styles.questionText,
                    { fontSize: getResponsiveFontSize(16) },
                  ]}
                >
                  {current.question}
                </Text>
              </View>

              <View style={styles.choicesGrid}>
                {current.choices.map((choice, idx) => {
                  const isDisabled =
                    !!outcome || inputLocked || !!disabledChoices[idx];
                  const isWrong =
                    disabledChoices[idx] && idx !== current.answer;
                  return (
                    <Pressable
                      key={idx}
                      disabled={isDisabled}
                      onPress={() => onPick(idx)}
                      style={[
                        styles.choiceButton,
                        {
                          opacity: isDisabled ? 0.6 : 1,
                        },
                        isWrong && styles.wrongChoice,
                      ]}
                    >
                      <Text
                        style={[
                          styles.choiceText,
                          { fontSize: getResponsiveFontSize(14) },
                          isWrong && styles.wrongChoiceText,
                        ]}
                      >
                        {choice}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Outcome overlay */}
          {outcome && (
            <View style={styles.outcomeOverlay}>
              <View style={styles.outcomeModal}>
                <Text
                  style={[
                    styles.outcomeTitle,
                    {
                      fontSize: getResponsiveFontSize(24),
                      color: outcome === "victory" ? "#10b981" : "#ef4444",
                    },
                  ]}
                >
                  {outcome === "victory" ? "Victory!" : "Defeat"}
                </Text>
                <View style={styles.outcomeButtons}>
                  {outcome === "defeat" && (
                    <Pressable
                      onPress={() => restartStage()}
                      style={[styles.outcomeButton, styles.restartStageButton]}
                    >
                      <Text
                        style={[
                          styles.outcomeButtonText,
                          { fontSize: getResponsiveFontSize(14) },
                        ]}
                      >
                        Restart Stage
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => retry()}
                    style={[styles.outcomeButton, styles.retryButton]}
                  >
                    <Text
                      style={[
                        styles.outcomeButtonText,
                        { fontSize: getResponsiveFontSize(14) },
                      ]}
                    >
                      Restart Quiz
                    </Text>
                  </Pressable>
                  <Link href="/upload" asChild>
                    <Pressable
                      style={[styles.outcomeButton, styles.homeButton]}
                    >
                      <Text
                        style={[
                          styles.outcomeButtonText,
                          { fontSize: getResponsiveFontSize(14) },
                        ]}
                      >
                        Return Home
                      </Text>
                    </Pressable>
                  </Link>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#064e3b", // Dark forest green background
  },
  stageIndicator: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  stageText: {
    color: "#d1fae5", // Light green text
    fontWeight: "700",
    backgroundColor: "rgba(16, 185, 129, 0.2)", // emerald with transparency
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  arenaContainer: {
    marginTop: 100,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  arena: {
    height: 280,
    borderRadius: 16,
    borderColor: "rgba(16, 185, 129, 0.2)", // emerald border
    borderWidth: 2,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    overflow: "hidden",
  },
  arenaStatusContainer: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start", // Align to top for consistent height
    zIndex: 5,
  },
  arenaStatusBar: {
    backgroundColor: "rgba(6, 78, 59, 0.8)", // Dark emerald background
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    minWidth: 140, // Minimum width to ensure consistency
    minHeight: 60, // Minimum height for proper spacing
    maxWidth: "45%",
  },
  playerStatusBar: {
    alignItems: "flex-start",
  },
  enemyStatusBar: {
    alignItems: "flex-end",
  },
  arenaStatusName: {
    color: "#d1fae5",
    fontWeight: "600",
  },
  arenaStatusHp: {
    color: "#a7f3d0",
    marginTop: 2,
  },
  arenaHpBars: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
  },
  arenaHpBar: {
    width: 12,
    height: 4,
    borderRadius: 2,
  },
  arenaBadge: {
    color: "#d1fae5",
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  rageTimerContainer: {
    position: "absolute",
    top: 80, // Below status bars
    left: 12,
    right: 12,
    zIndex: 6,
    backgroundColor: "rgba(127, 29, 29, 0.85)",
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#ef4444",
    padding: 6,
  },
  rageTimerBar: {
    height: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(239, 68, 68, 0.6)",
    marginBottom: 3,
  },
  rageTimerFill: {
    height: 8,
    backgroundColor: "#ef4444",
    borderRadius: 3.5,
  },
  rageTimerText: {
    color: "#fef08a",
    fontWeight: "700",
    fontSize: 10,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  spritesContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
    height: 180, // Fixed height for sprite area
    zIndex: 3,
  },
  spriteSlot: {
    width: 128,
    height: 128,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  playerSlot: {
    position: "absolute",
    left: 16,
    bottom: -100,
  },
  enemySlot: {
    position: "absolute",
    right: 16,
    bottom: -100,
  },
  damagePopup: {
    position: "absolute",
    color: "#fde047", // Bright yellow
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontWeight: "700",
    fontSize: 16,
  },
  enemyDamagePopup: {
    right: 32,
    bottom: 140,
  },
  playerDamagePopup: {
    left: 32,
    bottom: 140,
  },
  questionContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  questionCard: {
    backgroundColor: "rgba(6, 78, 59, 0.75)", // Dark emerald with blur effect
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  questionText: {
    color: "#d1fae5", // Light green text
    fontWeight: "600",
    textAlign: "center",
  },
  choicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  choiceButton: {
    backgroundColor: "rgba(6, 78, 59, 0.8)",
    borderColor: "rgba(16, 185, 129, 0.4)",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    width: "48%",
    minHeight: 60,
    justifyContent: "center",
  },
  choiceText: {
    color: "#d1fae5",
    fontWeight: "500",
    textAlign: "center",
  },
  wrongChoice: {
    borderColor: "rgba(239, 68, 68, 0.6)",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  wrongChoiceText: {
    color: "#fca5a5",
    textDecorationLine: "line-through",
  },
  outcomeOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  outcomeModal: {
    backgroundColor: "rgba(5, 46, 22, 0.98)", // Darker emerald
    borderColor: "#10b981",
    borderWidth: 3,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    maxWidth: 340,
    width: "100%",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  outcomeTitle: {
    fontWeight: "800",
    marginBottom: 20,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  outcomeButtons: {
    flexDirection: "column",
    gap: 12,
    width: "100%",
  },
  outcomeButton: {
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    borderWidth: 2,
  },
  restartStageButton: {
    backgroundColor: "#f59e0b", // Amber/gold for restart stage
    borderColor: "#fbbf24",
  },
  retryButton: {
    backgroundColor: "#10b981", // Emerald green for restart quiz
    borderColor: "#34d399",
  },
  homeButton: {
    backgroundColor: "#475569", // Slate gray for return home
    borderColor: "#64748b",
  },
  outcomeButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  stageClearedOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  stageClearedModal: {
    backgroundColor: "rgba(16, 185, 129, 0.95)",
    borderColor: "#d1fae5",
    borderWidth: 3,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    maxWidth: 320,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 15,
  },
  stageClearedTitle: {
    color: "#ffffff",
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  stageClearedSubtitle: {
    color: "#d1fae5",
    fontWeight: "600",
    textAlign: "center",
  },
  bossIntroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  bossIntroModal: {
    backgroundColor: "rgba(127, 29, 29, 0.95)", // Dark red
    borderColor: "#ef4444",
    borderWidth: 4,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    maxWidth: 340,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 20,
  },
  bossIntroTitle: {
    color: "#fef08a", // Yellow warning
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bossIntroSubtitle: {
    color: "#ef4444", // Red
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 2,
  },
  bossCountdownCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(239, 68, 68, 0.3)",
    borderWidth: 4,
    borderColor: "#fbbf24",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  bossCountdownText: {
    color: "#ffffff",
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  bossIntroMessage: {
    color: "#fecaca",
    fontWeight: "700",
    textAlign: "center",
    fontStyle: "italic",
  },
});
