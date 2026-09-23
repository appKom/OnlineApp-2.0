import { Image } from "expo-image";
import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Text,
  Platform,
  useWindowDimensions,
} from "react-native";
import { TabScreenContainer } from "../../../components/TabScreenContainer";
import { CasinoFeltBackground, FELT_BASE_DARK, FELT_BASE_LIGHT } from "../../../components/GamesHub/CasinoFeltBackground";
import { useThemeMode } from "../../../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import Svg, {
  Defs,
  Path,
  Circle,
  Text as SvgText,
  Polygon,
  Line,
  LinearGradient,
  Rect,
  Stop,
} from "react-native-svg";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";

const TWO_PI = Math.PI * 2;
const centerLogo = require("assets/svg/online_hvit_o.svg");

const GOLD = "#D9BF6A";
const GOLD_LIGHT = "#F3DE9B";
const CREAM_DARK = "#F1E7D0";
const CREAM = "#F7F1DE";

const TABLE_GREEN_LIGHT = FELT_BASE_LIGHT;
const TABLE_GREEN_DARK = FELT_BASE_DARK;

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
  "Velg en person som må chugge",
  "Du må DRA HJEM (eller ta en shot)",
  "Alle tar 6 slurker hver",
  "Lag en ny regel som varer ut spillet",
  "Drikk en slurk for hver person som er tilstede",
];

// Rød = du får utfordringen selv
//Flere av disse burde endres på, typ legge inn
// flere kreative greier istedenfor bare slurker
const RED_SELF_ACTIONS = [
  "Ta 2 slurker",
  "Fortell en klein historie, eller ta 5 slurker", // endre?
  "Nevn et rødt flagg på date, eller ta 5 slurker", // endre?
  "Ta 2 slurker for hvert søsken du har", //endre denne
  "Drikk opp lil bro",
  "Snakk med dialekt til neste runde, ellers ta 5 slurker",
  "Drikk 3 slurker for hver gang du har spist pizza siste uka",
  "Ta 3 slurker",
  "Ta 3 slurker",
  "Ta 4 slurker",
  "Gjør en lapdance på personen til venstre for deg eller drikk 6 slurker",
  "Ta 4 slurker",
  "Ta 1 slurk for hver alarm du satte i dag",
  "Ta 2 slurker og velg neste som skal spinne",
  "Nevn 3 ting du har i nattbordskuffa, ellers ta 5 slurker",
];

// Svart = du gir utfordringen til noen andre
const BLACK_GIVE_ACTIONS = [
  "Del ut 2 slurker",
  "Alle tar 1 slurk",
  "Bytt drikke med personen til venstre i én runde", // nasty?
  "Velg en person som må drikke 3 slurker",
  "Alle som har vært på Samf siste måneden tar 4 slurker", // kanskje?
  "Velg en person som skal shotte", // ?
  "Den første som fullfører drikka si kan dele ut 8 slurker",
  "Del ut 3 slurker ",
  "Alle med hvite sko tar 1 slurk",
  "Velg en drikkepartner. For den neste halvtimen skal de drikke hver gang du drikker",
  "Alle gutter tar 1 slurk",
  "Alle jenter tar 1 slurk",
  "Drikk valgfritt antall slurker og del ut dobbelt av det du drakk",
  "Pek på noen. De må ta 3 slurker",
  "Alle som bruker iPhone tar 2 slurker",
  "Finn på en regel som varer i 10 minutter",
  "Alle som sitter i sofaen tar 2 slurker", // hvis ingen sofa?
  "De som har vært på byen denne uka tar 3 slurker", // endre?
  "Velg noen som må mime et dyr. Feiler de, tar de 5 slurker", // endre?
  "Alle skal peke på hvem de mener er fullest, alle skal drikke antall pek de har fått ",
  "Alle tar en fellesslurk", // Endre
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

function ResultFelt({ width }: { width: number }) {
  return (
    <Svg pointerEvents="none" width={width} height={226} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="roulettePlacemat" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#9B292D" />
          <Stop offset="0.52" stopColor="#7E1E25" />
          <Stop offset="1" stopColor="#5E1720" />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#roulettePlacemat)" />
      {Array.from({ length: 20 }, (_, index) => (
        <Line key={index} x1={index * 28 - 180} y1="0" x2={index * 28 + 90} y2="100%" stroke="#F4D897" strokeOpacity="0.055" strokeWidth="1" />
      ))}
    </Svg>
  );
}

export default function RouletteScreen() {
  const { mode } = useThemeMode();
  const darkMode = mode === "dark";
  const backgroundColor = darkMode ? TABLE_GREEN_DARK : TABLE_GREEN_LIGHT;
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const wheelSize = Math.min(width - 64, height * 0.43, 340);

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

    void triggerSpinHaptic();

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

  const resultColor = selectedNumber === 0
    ? "#0C7847"
    : selectedNumber !== null && RED_NUMBERS.has(selectedNumber)
      ? "#A7262A"
      : "#1B1B1B";
  const resultType =
    selectedNumber === 0
      ? "GRØNN · SPESIAL"
      : selectedNumber !== null && RED_NUMBERS.has(selectedNumber)
        ? "RØD · DU GJØR DET"
        : "SVART · ANDRE GJØR DET";

  return (
    <TabScreenContainer backgroundColor={backgroundColor}>
      <StatusBar style="light" />
      <View style={[styles.container, { backgroundColor }]}>
        <CasinoFeltBackground darkMode={darkMode} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop:
                Math.max(insets.top, Platform.OS === "ios" ? 54 : 24) + 18,
              paddingBottom: Math.max(insets.bottom, 20) + 96,
            },
          ]}
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.deckHeader}>
            <Text style={styles.deckTitle}>ROULETTE</Text>
            <Text style={styles.deckSubtitle}>
              Trykk på hjulet for å spinne
            </Text>
          </View>

          <View
            style={[
              styles.wheelArea,
              { width: wheelSize + 24, height: wheelSize + 36 },
            ]}
          >
            <Pointer />

            <Pressable
              onPress={spinWheel}
              disabled={isSpinning}
              accessibilityRole="button"
              accessibilityLabel="Spinn roulettehjulet"
              style={styles.pressable}
            >
              <View
                style={[
                  styles.wheelWrapper,
                  { width: wheelSize, height: wheelSize },
                ]}
              >
                <RouletteWheel
                  size={wheelSize}
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

          <View style={styles.resultPanel}>
            <ResultFelt width={Math.min(width - 48, 410)} />
            <View pointerEvents="none" style={styles.placematBorder} />
            <View pointerEvents="none" style={styles.placematDiamond} />
            <Text style={styles.resultEyebrow}>
              {selectedNumber === null
                ? isSpinning
                  ? "SPINNER"
                  : "KLAR FOR EN RUNDE"
                : resultType}
            </Text>
              <View
                style={[
                  styles.numberBadge,
                  {
                    backgroundColor: selectedNumber === null ? "#381B1D" : resultColor,
                  },
                ]}
              >
                <Text style={styles.resultNumber}>{selectedNumber ?? "?"}</Text>
              </View>
            <ScrollView style={styles.actionSlot} contentContainerStyle={styles.actionSlotContent} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              <Text style={styles.actionText}>
                {selectedAction ?? (isSpinning ? "Venter på resultatet..." : "Resultat og utfordring vises her")}
              </Text>
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </TabScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },


  wheelWrapper: {
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
  wheelArea: {
    justifyContent: "flex-start",
    alignItems: "center",
  },
  pressable: {
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    marginTop: 16,
  },
  pointerContainer: {
    position: "absolute",
    top: -2,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  actionText: {
    marginTop: 10,
    color: CREAM,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 24,
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
  resultPanel: {
    width: "100%",
    maxWidth: 410,
    height: 226,
    marginTop: 4,
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 21,
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: GOLD,
    backgroundColor: "#7E1E25",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  placematBorder: {
    position: "absolute",
    top: 9,
    bottom: 9,
    left: 9,
    right: 9,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(244, 216, 151, 0.68)",
  },
  placematDiamond: {
    position: "absolute",
    top: 13,
    width: 7,
    height: 7,
    backgroundColor: GOLD,
    transform: [{ rotate: "45deg" }],
  },
  resultEyebrow: {
    color: GOLD_LIGHT,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.3,
    textAlign: "center",
  },
  numberBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    borderWidth: 2,
    borderColor: GOLD_LIGHT,
  },
  resultNumber: {
    fontSize: 37,
    lineHeight: 43,
    fontWeight: "900",
    color: CREAM,
  },
  actionSlot: {
    flex: 1,
    width: "100%",
    marginTop: 10,
  },
  actionSlotContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
