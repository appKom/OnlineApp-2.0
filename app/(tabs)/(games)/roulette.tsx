import { Image } from "expo-image";
import React, { useRef, useState } from "react";
import { View, StyleSheet, Pressable, Text, Platform } from "react-native";
import { TabScreenContainer } from "../../../components/TabScreenContainer";
import { useTheme, useThemeMode } from "../../../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import Svg, {
  Path,
  Circle,
  Text as SvgText,
  Polygon,
  Line,
} from "react-native-svg";
import * as Haptics from "expo-haptics";

const WHEEL_SIZE = 340;
const TWO_PI = Math.PI * 2;
const centerLogo = require("assets/svg/online_hvit_o.svg");

const GOLD = "#D9BF6A";
const GOLD_LIGHT = "#F3DE9B";
const CREAM = "#F7F1DE";

const TABLE_GREEN_LIGHT = "#0F6B47";
const TABLE_GREEN_DARK = "#0A4E34";
const TABLE_PATCH_LIGHT = "#167A52";
const TABLE_PATCH_DARK = "#0D5A3C";
const TABLE_SHADOW_LIGHT = "#0A4B32";
const TABLE_SHADOW_DARK = "#062D1E";

const WOOD_BASE = "#7A4A2A";
const WOOD_DARK = "#5C371F";
const WOOD_LIGHT = "#9A643C";
const WOOD_LINE = "#B67A4E";
const WOOD_SHADOW = "#3B2415";

// Europeisk roulette-rekkefølge
const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

const SEGMENT_COUNT = ROULETTE_NUMBERS.length;
const SEGMENT_ANGLE = TWO_PI / SEGMENT_COUNT;

// Sjeldne grønne utfall for 0
const GREEN_ACTIONS = [
  "Del ut 3 shots",
  "Velg 3 personer som tar 2 slurker hver",
  "Alle andre tar 1 slurk, du slipper",
  "Lag en ny regel som varer til neste spin",
  "Velg én person som må fullføre utfordringen du peker ut",
];

// Rød = du får utfordringen selv
const RED_SELF_ACTIONS = [
  "Ta 2 slurker",
  "Fortell en klein historie, eller ta 2 slurker",
  "Nevn et rødt flagg på date på 3 sekunder, ellers ta 2 slurker",
  "Ta 1 slurk for hvert søsken du har, maks 3",
  "Si tre norske byer på 3 sekunder, ellers ta 2 slurker",
  "Snakk med dialekt til neste runde, ellers ta 2 slurker",
  "Ta 2 slurker hvis du har vært våken etter kl. 03 denne uka",
  "Nevn 3 fag du hatet på skolen, ellers ta 2 slurker",
  "Du slipper unna denne runden",
  "Ta 2 slurker hvis du har ghostet noen",
  "Fortell hva førsteinntrykket ditt av noen i rommet var",
  "Hold øyekontakt med en valgfri person mens du tar 2 slurker",
  "Ta 1 slurk for hver alarm du satte i dag, maks 3",
  "Ta 2 slurker og velg neste som skal spinne",
  "Nevn 3 ting du alltid har i sekken eller veska, ellers ta 2 slurker",
];

// Svart = du gir utfordringen til noen andre
const BLACK_GIVE_ACTIONS = [
  "Gi 2 slurker til valgfri person",
  "Alle tar 1 slurk",
  "Bytt drikke med personen til venstre i én runde",
  "Du velger noen som må ta 2 slurker",
  "Alle som har vært på Samfundet denne måneden tar 1 slurk",
  "Personen til høyre bestemmer hvem som tar 2 slurker",
  "Lag en skål. De som ikke skåler tar 1 slurk",
  "Gi ut 3 slurker fordelt som du vil",
  "Alle med hvite sko tar 1 slurk",
  "Velg en drikkepartner. Hver gang du drikker neste 10 min, må den personen også drikke",
  "Alle gutter tar 1 slurk",
  "Alle jenter tar 1 slurk",
  "Ta 1 slurk og gi 1 slurk videre",
  "Pek på noen. De må ta 2 slurker",
  "Alle som bruker iPhone tar 1 slurk",
  "Finn på en regel som varer i 5 minutter",
  "Alle som sitter i sofaen tar 1 slurk",
  "De som har vært på byen denne uka tar 1 slurk",
  "Velg noen som må mime et dyr. Feiler de, tar de 2 slurker",
  "Alle som har vært forelsket i noen i dette rommet tar 1 slurk",
  "Alle tar en fellesslurk",
];

function normalizeAngle(angle: number) {
  return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angle: number,
) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function toDegrees(angle: number) {
  return (angle * 180) / Math.PI;
}

function describeRingSlicePath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function getPocketColor(value: number) {
  if (value === 0) return "#1E8E3E";
  return RED_NUMBERS.has(value) ? "#C62828" : "#1A1A1A";
}

function getTargetRotation(currentRotation: number, winnerIndex: number) {
  const currentNormalized = normalizeAngle(currentRotation);
  const targetNormalized = normalizeAngle(-winnerIndex * SEGMENT_ANGLE);

  const deltaToTarget = normalizeAngle(currentNormalized - targetNormalized);

  const fullTurns = 6 + Math.floor(Math.random() * 4);
  return currentRotation - fullTurns * TWO_PI - deltaToTarget;
}

function getActionForNumber(value: number) {
  if (value === 0) {
    const greenIndex = Math.floor(Math.random() * GREEN_ACTIONS.length);
    return GREEN_ACTIONS[greenIndex];
  }

  if (RED_NUMBERS.has(value)) {
    const redIndex = Math.floor(Math.random() * RED_SELF_ACTIONS.length);
    return RED_SELF_ACTIONS[redIndex];
  }

  const blackIndex = Math.floor(Math.random() * BLACK_GIVE_ACTIONS.length);
  return BLACK_GIVE_ACTIONS[blackIndex];
}

async function triggerSpinHaptic() {
  if (Platform.OS === "web") return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

async function triggerResultHaptic() {
  if (Platform.OS === "web") return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}

function CasinoFeltBackground({ darkMode }: { darkMode: boolean }) {
  const patch = darkMode ? TABLE_PATCH_DARK : TABLE_PATCH_LIGHT;
  const shadow = darkMode ? TABLE_SHADOW_DARK : TABLE_SHADOW_LIGHT;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.feltPatch,
          styles.feltPatchTop,
          { backgroundColor: patch, opacity: 0.45 },
        ]}
      />
      <View
        style={[
          styles.feltPatch,
          styles.feltPatchBottom,
          { backgroundColor: shadow, opacity: 0.38 },
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

function WoodPanel({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.resultBox}>
      <View style={styles.woodFill} />
      <View style={[styles.woodGrainLine, styles.woodGrain1]} />
      <View style={[styles.woodGrainLine, styles.woodGrain2]} />
      <View style={[styles.woodGrainLine, styles.woodGrain3]} />
      <View style={[styles.woodGrainLine, styles.woodGrain4]} />
      <View style={[styles.woodKnots, styles.woodKnot1]} />
      <View style={[styles.woodKnots, styles.woodKnot2]} />
      <View style={styles.woodHighlightTop} />
      <View style={styles.woodShadeBottom} />
      <View style={styles.resultInnerBorder} />
      <View style={styles.resultContent}>{children}</View>
    </View>
  );
}

function RouletteWheel({
  size,
  rotationStyle,
}: {
  size: number;
  rotationStyle: any;
}) {
  const center = size / 2;
  const outerRadius = size * 0.47;
  const pocketInnerRadius = size * 0.33;
  const numberRadius = size * 0.4;

  return (
    <Animated.View style={rotationStyle}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={center}
          cy={center}
          r={outerRadius + 8}
          fill="#C9A64A"
          stroke="#8B6B1F"
          strokeWidth={4}
        />
        <Circle
          cx={center}
          cy={center}
          r={outerRadius + 1}
          fill="#2B2B2B"
          stroke="#D9BF6A"
          strokeWidth={2}
        />

        {ROULETTE_NUMBERS.map((value, index) => {
          const centerAngle = -Math.PI / 2 + index * SEGMENT_ANGLE;
          const startAngle = centerAngle - SEGMENT_ANGLE / 2;
          const endAngle = centerAngle + SEGMENT_ANGLE / 2;

          const path = describeRingSlicePath(
            center,
            center,
            pocketInnerRadius,
            outerRadius,
            startAngle,
            endAngle,
          );

          const labelPoint = polarToCartesian(
            center,
            center,
            numberRadius,
            centerAngle,
          );

          const dividerStart = polarToCartesian(
            center,
            center,
            pocketInnerRadius,
            startAngle,
          );
          const dividerEnd = polarToCartesian(
            center,
            center,
            outerRadius,
            startAngle,
          );

          return (
            <React.Fragment key={`${value}-${index}`}>
              <Path
                d={path}
                fill={getPocketColor(value)}
                stroke="#E7D39A"
                strokeWidth={1.2}
              />

              <Line
                x1={dividerStart.x}
                y1={dividerStart.y}
                x2={dividerEnd.x}
                y2={dividerEnd.y}
                stroke="#F4E6B0"
                strokeWidth={0.8}
              />

              <SvgText
                x={labelPoint.x}
                y={labelPoint.y}
                fill="#F7F3E8"
                fontSize="12"
                fontWeight="700"
                textAnchor="middle"
                alignmentBaseline="middle"
                transform={`rotate(${toDegrees(centerAngle) + 90} ${labelPoint.x} ${labelPoint.y})`}
              >
                {value}
              </SvgText>
            </React.Fragment>
          );
        })}

        <Circle
          cx={center}
          cy={center}
          r={pocketInnerRadius - 4}
          fill="#164B2D"
          stroke="#D9BF6A"
          strokeWidth={3}
        />
        <Circle
          cx={center}
          cy={center}
          r={size * 0.23}
          fill="#6B3E1F"
          stroke="#D9BF6A"
          strokeWidth={3}
        />
        <Circle
          cx={center}
          cy={center}
          r={size * 0.12}
          fill="#0F1417"
          stroke="#F0D88C"
          strokeWidth={2}
        />
      </Svg>
    </Animated.View>
  );
}

function Pointer() {
  return (
    <View style={styles.pointerContainer} pointerEvents="none">
      <Svg width={44} height={52} viewBox="0 0 44 52">
        <Polygon
          points="22,50 6,14 38,14"
          fill="#F5D36B"
          stroke="#5C4310"
          strokeWidth={2}
        />
        <Circle cx="22" cy="12" r="7" fill="#5C4310" />
      </Svg>
    </View>
  );
}

export default function RouletteScreen() {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const darkMode = mode === "dark";
  const backgroundColor = darkMode ? TABLE_GREEN_DARK : TABLE_GREEN_LIGHT;
  const insets = useSafeAreaInsets();

  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const spinningRef = useRef(false);

  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const wheelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}rad` }, { scale: scale.value }],
  }));

  const spinWheel = async () => {
    if (spinningRef.current) return;

    spinningRef.current = true;
    setIsSpinning(true);
    setSelectedNumber(null);
    setSelectedAction(null);

    await triggerSpinHaptic();

    const winnerIndex = Math.floor(Math.random() * SEGMENT_COUNT);
    const winnerNumber = ROULETTE_NUMBERS[winnerIndex];
    const winnerAction = getActionForNumber(winnerNumber);

    const targetRotation = getTargetRotation(rotation.value, winnerIndex);
    const duration = 4600 + Math.floor(Math.random() * 1400);

    scale.value = withSpring(1.02, {
      damping: 16,
      stiffness: 220,
    });

    rotation.value = withTiming(targetRotation, {
      duration,
      easing: Easing.bezier(0.08, 0.88, 0.16, 1),
    });

    setTimeout(async () => {
      scale.value = withSpring(1, {
        damping: 14,
        stiffness: 180,
      });

      setSelectedNumber(winnerNumber);
      setSelectedAction(winnerAction);
      setIsSpinning(false);
      spinningRef.current = false;

      await triggerResultHaptic();
    }, duration);
  };

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
          <View style={styles.wheelArea}>
            <Pointer />

            <Pressable onPress={spinWheel} style={styles.pressable}>
              <View style={styles.wheelWrapper}>
                <RouletteWheel
                  size={WHEEL_SIZE}
                  rotationStyle={wheelAnimatedStyle}
                />

                <View pointerEvents="none" style={styles.centerLogoContainer}>
                  <Image
                    source={centerLogo}
                    style={styles.centerLogo}
                    contentFit="contain"
                  />
                </View>
              </View>
            </Pressable>
          </View>

          <Text style={[styles.instruction, { color: CREAM }]}>
            {isSpinning ? "Spinner..." : "Trykk på hjulet for å spinne"}
          </Text>

          <WoodPanel>
            <Text style={styles.resultLabel}>RESULTAT</Text>

            <Text style={[styles.result, { color: GOLD_LIGHT }]}>
              {selectedNumber === null
                ? "Ingen vinner enda"
                : `Vinner: ${selectedNumber}`}
            </Text>

            {selectedAction && (
              <Text style={[styles.actionText, { color: CREAM }]}>
                {selectedAction}
              </Text>
            )}
          </WoodPanel>
        </View>
      </View>
    </TabScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    bottom: 18,
    left: 12,
    right: 12,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "rgba(217,191,106,0.24)",
  },
  tableRailInner: {
    position: "absolute",
    top: 28,
    bottom: 28,
    left: 22,
    right: 22,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(247,241,222,0.08)",
  },

  wheelWrapper: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  centerLogoContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  centerLogo: {
    width: 42,
    height: 42,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  wheelArea: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE + 52,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  pressable: {
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  pointerContainer: {
    position: "absolute",
    top: -2,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  instruction: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },

  resultBox: {
    marginTop: 18,
    minHeight: 128,
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: GOLD,
    shadowColor: WOOD_SHADOW,
    shadowOpacity: 0.42,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 9,
  },
  woodFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: WOOD_BASE,
  },
  woodGrainLine: {
    position: "absolute",
    left: -20,
    right: -20,
    height: 10,
    borderRadius: 999,
    backgroundColor: WOOD_LINE,
    opacity: 0.18,
  },
  woodGrain1: {
    top: 18,
    transform: [{ rotate: "1.5deg" }],
  },
  woodGrain2: {
    top: 44,
    transform: [{ rotate: "-1.2deg" }],
  },
  woodGrain3: {
    top: 76,
    transform: [{ rotate: "0.8deg" }],
  },
  woodGrain4: {
    bottom: 18,
    transform: [{ rotate: "-1deg" }],
  },
  woodKnots: {
    position: "absolute",
    width: 68,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(59,36,21,0.24)",
    backgroundColor: "rgba(247,241,222,0.04)",
  },
  woodKnot1: {
    top: 38,
    right: 26,
    transform: [{ rotate: "8deg" }],
  },
  woodKnot2: {
    bottom: 22,
    left: 20,
    transform: [{ rotate: "-12deg" }],
  },
  woodHighlightTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: WOOD_LIGHT,
    opacity: 0.18,
  },
  woodShadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: WOOD_DARK,
    opacity: 0.34,
  },
  resultInnerBorder: {
    position: "absolute",
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(243,222,155,0.22)",
  },
  resultContent: {
    minHeight: 128,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.2,
    color: GOLD,
    marginBottom: 8,
  },
  result: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.35,
  },
  actionText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 25,
  },
});
