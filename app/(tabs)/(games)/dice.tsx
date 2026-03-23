import React, { useEffect, useState } from "react";
import { View, StyleSheet, Platform, Text } from "react-native";
import { TabScreenContainer } from "../../../components/TabScreenContainer";
import { useThemeMode } from "../../../utils/theme";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect, Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import * as Device from "expo-device";

const GOLD = "#D9BF6A";
const GOLD_LIGHT = "#F5E7B4";
const CREAM = "#FBF7EE";
const CREAM_DARK = "#F1E7D0";
const PIP_COLOR = "#1A1A1A";

const TABLE_GREEN_LIGHT = "#0F6B47";
const TABLE_GREEN_DARK = "#0A4E34";
const TABLE_PATCH_LIGHT = "#167A52";
const TABLE_PATCH_DARK = "#0D5A3C";
const TABLE_SHADOW_LIGHT = "#0A4B32";
const TABLE_SHADOW_DARK = "#062D1E";
const TABLE_RAIL = "rgba(217,191,106,0.26)";

const DICE_PATTERNS = {
  1: [{ x: 0.5, y: 0.5 }],
  2: [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.75 },
  ],
  3: [
    { x: 0.25, y: 0.25 },
    { x: 0.5, y: 0.5 },
    { x: 0.75, y: 0.75 },
  ],
  4: [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 },
  ],
  5: [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.5, y: 0.5 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 },
  ],
  6: [
    { x: 0.25, y: 0.25 },
    { x: 0.25, y: 0.5 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.25 },
    { x: 0.75, y: 0.5 },
    { x: 0.75, y: 0.75 },
  ],
};

function CasinoFeltBackground({ darkMode }: { darkMode: boolean }) {
  const patch = darkMode ? TABLE_PATCH_DARK : TABLE_PATCH_LIGHT;
  const shadow = darkMode ? TABLE_SHADOW_DARK : TABLE_SHADOW_LIGHT;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.feltPatch,
          styles.feltPatchTop,
          { backgroundColor: patch, opacity: 0.42 },
        ]}
      />
      <View
        style={[
          styles.feltPatch,
          styles.feltPatchBottom,
          { backgroundColor: shadow, opacity: 0.36 },
        ]}
      />
      <View
        style={[
          styles.feltPatch,
          styles.feltPatchLeft,
          { backgroundColor: shadow, opacity: 0.22 },
        ]}
      />
      <View
        style={[
          styles.feltPatch,
          styles.feltPatchRight,
          { backgroundColor: patch, opacity: 0.18 },
        ]}
      />
      <View style={styles.tableRail} />
      <View style={styles.tableRailInner} />
    </View>
  );
}

function DicePip({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      <Circle
        cx={cx + 2.5}
        cy={cy + 2.5}
        r="15.5"
        fill="#000000"
        opacity="0.14"
      />
      <Circle cx={cx} cy={cy} r="15.5" fill="#2A2A2A" />
      <Circle cx={cx} cy={cy} r="12.5" fill={PIP_COLOR} />
      <Circle
        cx={cx - 3.5}
        cy={cy - 3.5}
        r="4.5"
        fill="#FFFFFF"
        opacity="0.1"
      />
      <Circle cx={cx + 3.5} cy={cy + 3.5} r="8" fill="#000000" opacity="0.12" />
    </>
  );
}

const DiceComponent: React.FC<{
  diceValue: number;
  size?: number;
}> = ({ diceValue, size = 240 }) => {
  const validValue = Math.max(1, Math.min(6, diceValue));

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Rect x="6" y="6" width="188" height="188" rx="28" ry="28" fill={CREAM} />
      <Rect
        x="6"
        y="6"
        width="188"
        height="188"
        rx="28"
        ry="28"
        fill="#FFFDF8"
        opacity="0.35"
      />
      <Rect
        x="16"
        y="16"
        width="168"
        height="168"
        rx="22"
        ry="22"
        fill="none"
        stroke="rgba(217,191,106,0.5)"
        strokeWidth="1.5"
      />
      <Rect
        x="6"
        y="6"
        width="188"
        height="46"
        rx="24"
        ry="24"
        fill="#FFFDF8"
        opacity="0.55"
      />
      <Rect
        x="6"
        y="146"
        width="188"
        height="48"
        rx="24"
        ry="24"
        fill="#E7DCC0"
        opacity="0.16"
      />
      <Rect
        x="6"
        y="6"
        width="188"
        height="188"
        rx="28"
        ry="28"
        fill="none"
        stroke={GOLD}
        strokeWidth="1.5"
        opacity="0.65"
      />
      {DICE_PATTERNS[validValue as keyof typeof DICE_PATTERNS]?.map(
        (dot, index) => (
          <DicePip key={index} cx={10 + dot.x * 180} cy={10 + dot.y * 180} />
        ),
      )}
    </Svg>
  );
};

const DiceRoll: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { mode } = useThemeMode();
  const darkMode = mode === "dark";
  const backgroundColor = darkMode ? TABLE_GREEN_DARK : TABLE_GREEN_LIGHT;

  const rotation = useSharedValue(0);
  const isRolling = useSharedValue(false);

  const [diceValue, setDiceValue] = useState(1);
  const [isPhysicalDevice, setIsPhysicalDevice] = useState(true);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    setIsPhysicalDevice(Device.isDevice);
  }, []);

  const rollDice = () => Math.floor(Math.random() * 6) + 1;

  const triggerLightHaptic = () => {
    if (isPhysicalDevice && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const triggerHeavyHaptic = () => {
    if (isPhysicalDevice && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onEnd(() => {
      if (isRolling.value) return;

      triggerLightHaptic();
      isRolling.value = true;
      setRolling(true);

      const direction = Math.random() > 0.5 ? 1 : -1;
      const duration = 700 + Math.random() * 1400;
      const rotations = 2.5 + Math.random() * 2.5;
      const spinAmount = direction * rotations * Math.PI * 2;

      const targetRotation =
        Math.ceil((rotation.value + spinAmount) / (Math.PI * 2)) *
        (Math.PI * 2);

      const finalDiceValue = rollDice();

      const rollInterval = setInterval(() => {
        setDiceValue(rollDice());
      }, 180);

      setTimeout(() => {
        clearInterval(rollInterval);
        setDiceValue(finalDiceValue);
      }, duration * 0.75);

      rotation.value = withTiming(targetRotation, {
        duration,
        easing: Easing.out(Easing.cubic),
      });

      setTimeout(() => {
        isRolling.value = false;
        setRolling(false);

        if (finalDiceValue === 6) {
          triggerHeavyHaptic();
        }
      }, duration);
    });

  const animatedStyle = useAnimatedStyle(() => {
    const scale = withSpring(isRolling.value ? 1.08 : 1, {
      damping: 15,
      stiffness: 260,
    });

    return {
      transform: [{ rotate: `${rotation.value}rad` }, { scale }],
    };
  });

  return (
    <TabScreenContainer>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            backgroundColor,
          },
        ]}
      >
        <CasinoFeltBackground darkMode={darkMode} />

        <View style={styles.centerContainer}>
          <View style={styles.deckHeader}>
            <Text style={styles.deckTitle}>TERNING</Text>
            <Text style={styles.deckSubtitle}>
              {rolling ? "Kaster..." : "Trykk på terningen for å kaste"}
            </Text>
          </View>

          <GestureDetector gesture={tapGesture}>
            <View style={styles.diceButton}>
              <Animated.View style={animatedStyle}>
                <DiceComponent diceValue={diceValue} size={250} />
              </Animated.View>
            </View>
          </GestureDetector>
        </View>
      </View>
    </TabScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    paddingBottom: 120,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  deckHeader: {
    alignItems: "center",
    marginBottom: 18,
  },
  deckTitle: {
    color: GOLD_LIGHT,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  deckSubtitle: {
    color: CREAM_DARK,
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },

  diceButton: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  feltPatch: {
    position: "absolute",
    borderRadius: 999,
  },
  feltPatchTop: {
    width: 420,
    height: 420,
    top: -130,
    left: -70,
  },
  feltPatchBottom: {
    width: 520,
    height: 520,
    bottom: -220,
    right: -140,
  },
  feltPatchLeft: {
    width: 260,
    height: 260,
    top: "38%",
    left: -110,
  },
  feltPatchRight: {
    width: 220,
    height: 220,
    top: 90,
    right: -70,
  },
  tableRail: {
    position: "absolute",
    top: 18,
    bottom: 18 + 80,
    left: 12,
    right: 12,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: TABLE_RAIL,
  },
  tableRailInner: {
    position: "absolute",
    top: 28,
    bottom: 28 + 80,
    left: 22,
    right: 22,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(247,241,222,0.08)",
  },
});

export default DiceRoll;
