import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

// Number of chevrons and max drag for charging
const CHEVRON_COUNT = 3;
const MAX_DRAG = 400;

function Chevron({ fill }: { fill: string }) {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32">
      <Path
        d="M8 12l8 8 8-8"
        stroke={fill}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const ChevronIndicator: React.FC<{
  dragValue: SharedValue<number>;
  maxDrag: number;
  isSpinning: SharedValue<boolean>;
}> = ({ dragValue, maxDrag, isSpinning }) => {
  // Opacity for the whole indicator (hide during spinning)
  const containerStyle = useAnimatedStyle(() => ({
    opacity: isSpinning.value ? 0 : 1,
  }));

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 16,
        },
      ]}
    >
      <View style={{ flexDirection: "column" }}>
        {Array.from({ length: CHEVRON_COUNT }).map((_, i) => {
          const chargeStart = i * (maxDrag / CHEVRON_COUNT) * 0.7;
          const chargeEnd = (i + 1) * (maxDrag / CHEVRON_COUNT);

          const animatedStyle = useAnimatedStyle(() => {
            const progress = interpolate(
              dragValue.value,
              [chargeStart, chargeEnd],
              [0.3, 1],
              "clamp"
            );
            return {
              opacity: progress,
              marginTop: -10,
            };
          });

          return (
            <Animated.View key={i} style={animatedStyle}>
              <Chevron fill={"white"} />
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );
};

const InstructionText: React.FC<{ isSpinning: SharedValue<boolean> }> = ({
  isSpinning,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: isSpinning.value ? 0 : 1,
  }));
  return (
    <Animated.Text
      style={[
        {
          color: "#fff",
          fontSize: 18,
          textAlign: "center",
          marginTop: 10,
          fontWeight: "bold",
        },
        animatedStyle,
      ]}
    >
      Dra og slipp for å spinne
    </Animated.Text>
  );
};

const SpinLine: React.FC = () => {
  const insets = useSafeAreaInsets();

  // Animation values
  const rotation = useSharedValue(0);
  const dragRotation = useSharedValue(0);
  const dragY = useSharedValue(0); // Track actual vertical drag amount
  const isAnimating = useSharedValue(false);

  const curves = [Easing.out(Easing.cubic)];

  // Pan gesture for drag-to-spin
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      if (isAnimating.value) return;
    })
    .onUpdate((event) => {
      if (isAnimating.value) return;

      // Only respond to downward drags (positive translationY)
      const dragDistance = Math.max(0, event.translationY);

      // Wind-up effect
      const rotationPerPixel = Math.PI / 120;
      dragRotation.value = dragDistance * rotationPerPixel;

      // Track vertical drag amount for the chevrons
      dragY.value = dragDistance;
    })
    .onEnd((event) => {
      if (isAnimating.value) return;

      const dragDistance = Math.max(0, event.translationY);

      // Reset wind-up rotation with snappier spring
      dragRotation.value = withSpring(0, {
        damping: 12,
        stiffness: 200,
        mass: 0.8,
      });

      // Reset chevron charge
      dragY.value = 0;

      if (dragDistance > 30) {
        isAnimating.value = true;

        // 1. Transfer dragRotation to rotation for a seamless handoff
        rotation.value = rotation.value + dragRotation.value;
        // 2. Instantly reset wind-up to 0 (no visual snap!)
        dragRotation.value = 0;

        // Calculate spin as usual
        const normalizedDrag = Math.min(Math.abs(dragDistance) / MAX_DRAG, 1);
        const baseDuration = 1000;
        const maxDuration = 6000;
        const duration =
          baseDuration + normalizedDrag * (maxDuration - baseDuration);

        const baseSpins = Math.PI;
        const maxAdditionalSpins = 12 * Math.PI;
        const additionalRotation =
          baseSpins + normalizedDrag * maxAdditionalSpins;

        const randomCurveIndex = Math.floor(Math.random() * curves.length);
        const randomCurve = curves[randomCurveIndex];

        const startRotation = rotation.value;
        const endRotation = startRotation - additionalRotation;

        rotation.value = withTiming(
          endRotation,
          {
            duration: duration,
            easing: randomCurve,
          },
          (finished) => {
            if (finished) {
              isAnimating.value = false;
            }
          }
        );
      }
    })
    .onFinalize(() => {
      // Always reset drag
      dragY.value = 0;
      dragRotation.value = withSpring(0, {
        damping: 12,
        stiffness: 200,
        mass: 0.8,
      });
    });

  const animatedStyle = useAnimatedStyle(() => {
    const wrappedRotation =
      (rotation.value % (2 * Math.PI)) + dragRotation.value;
    const scale = interpolate(
      Math.abs(dragRotation.value),
      [0, Math.PI],
      [1, 1.08],
      "clamp"
    );
    return {
      transform: [
        { rotate: `${wrappedRotation}rad` },
        { scale: withSpring(scale, { damping: 15, stiffness: 200 }) },
      ],
    };
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.centerContainer}>
        <GestureDetector gesture={panGesture}>
          <View style={styles.spinButton}>
            <Animated.View style={animatedStyle}>
              <Image
                source={require("assets/svg/online_hvit_o.svg")}
                style={{ width: 300, height: 300 }}
                contentFit="contain"
              />
            </Animated.View>
          </View>
        </GestureDetector>
        <InstructionText isSpinning={isAnimating} />
        <ChevronIndicator
          dragValue={dragY}
          maxDrag={MAX_DRAG}
          isSpinning={isAnimating}
        />
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
  spinButton: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});

export default SpinLine;
