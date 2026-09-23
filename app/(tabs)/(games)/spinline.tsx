import React from "react";
import {
  View,
  StyleSheet,
  Text,
  Platform,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { TabScreenContainer } from "../../../components/TabScreenContainer";
import { CasinoFeltBackground } from "../../../components/GamesHub/CasinoFeltBackground";
import { useThemeMode } from "../../../utils/theme";
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
import Svg, {
  Line,
  Path,
} from "react-native-svg";

const logoDark = require("../../../assets/Online_Logokit/svg/Online_hvit_o.svg");
const GOLD = "#D9BF6A";
const CREAM = "#F1E7D0";

// Number of chevrons and max drag for charging
const CHEVRON_COUNT = 3;
const MAX_DRAG = 400;


function PokerChip({
  size,
  children,
}: {
  size: number;
  children: React.ReactNode;
}) {
  const center = size / 2;
  return (
    <View
      style={[
        styles.chip,
        { width: size, height: size, borderRadius: center },
      ]}
    >
      <Svg
        pointerEvents="none"
        width={size}
        height={size}
        style={styles.chipMarks}
      >
        {Array.from({ length: 24 }, (_, index) => (
          <Line
            key={index}
            x1={center}
            y1={12}
            x2={center}
            y2={30}
            transform={`rotate(${index * 15} ${center} ${center})`}
            stroke="#FBF7EE"
            strokeWidth="6"
            strokeLinecap="round"
          />
        ))}
      </Svg>
      <View
        style={[
          styles.chipInner,
          {
            width: size - 72,
            height: size - 72,
            borderRadius: (size - 72) / 2,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

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
  chevronColor: string;
}> = ({ dragValue, maxDrag, isSpinning, chevronColor }) => {
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
              <Chevron fill={chevronColor} />
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );
};

const InstructionText: React.FC<{ isSpinning: SharedValue<boolean>; textColor: string }> = ({
  isSpinning,
  textColor,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: isSpinning.value ? 0 : 1,
  }));
  return (
    <Animated.Text
      style={[
        {
          color: textColor,
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
  const { mode } = useThemeMode();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const chipSize = Math.min(width - 56, 330);
  const backgroundColor = mode === "dark" ? "#043728" : "#07523A";

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
    <TabScreenContainer backgroundColor={backgroundColor}>
      <StatusBar style="light" />
      <View style={[styles.container, { backgroundColor }]}>
        <CasinoFeltBackground darkMode={mode === "dark"} />
        <View
          style={[
            styles.centerContainer,
            {
              paddingTop:
                Math.max(insets.top, Platform.OS === "ios" ? 54 : 24) + 18,
            },
          ]}
        >
          <Text style={styles.title}>SPINLINE</Text>
          <Text style={styles.subtitle}>Flasketuten peker på</Text>
          <GestureDetector gesture={panGesture}>
            <View style={styles.spinButton}>
              <PokerChip size={chipSize}>
                <Animated.View style={animatedStyle}>
                  <Image
                    source={logoDark}
                    style={{ width: chipSize * 0.54, height: chipSize * 0.54 }}
                    contentFit="contain"
                  />
                </Animated.View>
              </PokerChip>
            </View>
          </GestureDetector>
          <InstructionText isSpinning={isAnimating} textColor={CREAM} />
          <ChevronIndicator
            dragValue={dragY}
            maxDrag={MAX_DRAG}
            isSpinning={isAnimating}
            chevronColor={CREAM}
          />
        </View>
      </View>
    </TabScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  title: {
    color: "#F3DE9B",
    fontSize: 29,
    fontWeight: "800",
    letterSpacing: 1,
  },
  subtitle: {
    color: CREAM,
    fontSize: 14,
    marginTop: 5,
    marginBottom: 26,
  },
  chip: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: GOLD,
    backgroundColor: "#11191B",
    shadowColor: "#001810",
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  chipMarks: {
    position: "absolute",
    top: -4,
    left: -4,
  },
  chipInner: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#637471",
    backgroundColor: "#111E25",
  },
  spinButton: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SpinLine;
