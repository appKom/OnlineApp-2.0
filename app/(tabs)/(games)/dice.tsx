import React, { useEffect, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect, Circle, G } from "react-native-svg";
import * as Haptics from "expo-haptics";
import * as Device from "expo-device";

// Dice dot patterns for each face (1-6)
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

const DiceComponent: React.FC<{
  diceValue: number;
  size?: number;
}> = ({ diceValue, size = 200 }) => {
  const validValue = Math.max(1, Math.min(6, diceValue));

  return (
    <View>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Rect
          x="10"
          y="10"
          width="180"
          height="180"
          rx="20"
          ry="20"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="3"
        />
        <G>
          {DICE_PATTERNS[validValue as keyof typeof DICE_PATTERNS]?.map(
            (dot, index) => (
              <Circle
                key={index}
                cx={10 + dot.x * 180}
                cy={10 + dot.y * 180}
                r="15"
                fill="#000000"
              />
            )
          )}
        </G>
      </Svg>
    </View>
  );
};

const InstructionText: React.FC<{ isRolling: SharedValue<boolean> }> = ({
  isRolling,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: isRolling.value ? 0.3 : 1,
  }));

  return (
    <Animated.Text
      style={[
        {
          color: "#fff",
          fontSize: 18,
          textAlign: "center",
          marginTop: 20,
          fontWeight: "bold",
        },
        animatedStyle,
      ]}
    >
      Trykk på terningen for å kaste
    </Animated.Text>
  );
};

const DiceRoll: React.FC = () => {
  const insets = useSafeAreaInsets();

  // Animation values - exactly like spin-the-bottle
  const rotation = useSharedValue(0);
  const isRolling = useSharedValue(false);

  // Use regular React state for dice value
  const [diceValue, setDiceValue] = useState(1);
  const [isPhysicalDevice, setIsPhysicalDevice] = useState(true);

  // Check if running on physical device
  useEffect(() => {
    setIsPhysicalDevice(Device.isDevice);
  }, []);

  // Generate random dice value
  const rollDice = () => {
    return Math.floor(Math.random() * 6) + 1;
  };

  // Safe haptic feedback
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

  // Tap gesture - simplified like spin-the-bottle
  const tapGesture = Gesture.Tap()
    .runOnJS(true) // Ensure onEnd runs on JS thread
    .onEnd(() => {
      if (isRolling.value) return;

      // Trigger light haptic on tap
      triggerLightHaptic();

      isRolling.value = true;

      // Pre-calculate everything before starting animation
      const direction = Math.random() > 0.5 ? 1 : -1;
      const duration = 500 + Math.random() * 1500;
      const rotations = 2 + Math.random() * 3;

      // Calculate spin amount for visual effect
      const spinAmount = direction * rotations * Math.PI * 2;

      // Always end at the next multiple of 2π (which displays as 0 rotation)
      const targetRotation =
        Math.ceil((rotation.value + spinAmount) / (Math.PI * 2)) *
        (Math.PI * 2);

      const finalDiceValue = rollDice();

      // Start the dice flipping animation with React state
      let rollInterval = setInterval(() => {
        setDiceValue(rollDice());
      }, 250);

      // Stop the number changing at 75% of the duration for visual stability
      const numberStopTime = duration * 0.75;
      setTimeout(() => {
        clearInterval(rollInterval);
        setDiceValue(finalDiceValue);
      }, numberStopTime);

      // Simple rotation animation - no callback complications
      rotation.value = withTiming(targetRotation, {
        duration: duration,
        easing: Easing.out(Easing.cubic),
      });

      // Use setTimeout to handle completion - runs on JS thread naturally
      setTimeout(() => {
        isRolling.value = false;

        // Heavy haptic for 6
        if (finalDiceValue === 6) {
          triggerHeavyHaptic();
        }
      }, duration);
    });

  const animatedStyle = useAnimatedStyle(() => {
    const scale = withSpring(isRolling.value ? 1.1 : 1, {
      damping: 15,
      stiffness: 300,
    });

    return {
      transform: [{ rotate: `${rotation.value}rad` }, { scale: scale }],
    };
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.centerContainer}>
        <GestureDetector gesture={tapGesture}>
          <View style={styles.diceButton}>
            <Animated.View style={animatedStyle}>
              <DiceComponent diceValue={diceValue} size={250} />
            </Animated.View>
          </View>
        </GestureDetector>
        <InstructionText isRolling={isRolling} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    position: "relative",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  diceButton: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});

export default DiceRoll;
