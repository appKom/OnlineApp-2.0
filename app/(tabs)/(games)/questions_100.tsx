import React, { useRef, useState } from "react";
import { View, StyleSheet, Text, Platform, Dimensions } from "react-native";
import { TabScreenContainer } from "../../../components/TabScreenContainer";
import { useThemeMode } from "../../../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G, Path } from "react-native-svg";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 360);
const CARD_HEIGHT = CARD_WIDTH * 1.42;
const SWIPE_THRESHOLD = 90;
const SWIPE_OUT_DISTANCE = SCREEN_WIDTH * 1.15;

const GOLD = "#D9BF6A";
const GOLD_LIGHT = "#F5E7B4";
const CREAM = "#FBF7EE";
const CREAM_DARK = "#F1E7D0";
const RED = "#B3261E";
const BLACK = "#191919";

const TABLE_GREEN_LIGHT = "#0F6B47";
const TABLE_GREEN_DARK = "#0A4E34";
const TABLE_PATCH_LIGHT = "#167A52";
const TABLE_PATCH_DARK = "#0D5A3C";
const TABLE_SHADOW_LIGHT = "#0A4B32";
const TABLE_SHADOW_DARK = "#062D1E";
const TABLE_RAIL = "rgba(217,191,106,0.26)";

const QUESTIONS = [
  "Hvem er den største kokken?",
  "Hvem sin kode fungerer alltid uansett hvor dårlig den ser ut?",
  "Hvem er best venn med GPT?",
  "Hvem er det som alltid møter opp på forelesning?",
  "Hvem stikker alltid hjem etter forelesning?",
  "Hvem har størst sannsynlighet til å sovne på vors?",
  "Hvem spør alltid om å queue på vors?",
  "Hvem trenger ikke vise medlemskortet på Samf?",
  "Hvem er med på alt?",
  "Hvem stjeler mest fra kiosken?",
  "Største boomer?",
  "Største Gen Z?",
  "Hvem har bedreppene rundt lillefingeren?",
  "Hvem får alltid tak i ekstra bonger?",
  "Hvem konter mest?",
  "Hvem er mest syk?",
  "Hvem hoster flest vors? Ta en slurk for hosten som må deale med dere!",
  "Hvem er den største bodega-krigeren?",
  "Hvem hadde brukt JavaFX uironisk?",
  "Hvem er mest kansellerbar? Pass på litt ekstra etter drikkinga du...",
  "Hvem ser mest ut som de snuser?",
  "Hvem er på Debug's top 10 most wanted?",
  "Hvem kommer alltid en time etter de sa de var på vei?",
  "Hvem ligger alltid bakpå øvinger?",
  "Hvem ville du helst hatt med på en øde øy?",
  "Hvem er den største karaokestjerna?",
  "Hvem er kronisk hang? På 2-dagers allerede, eller?",
  "Hvem gir deg høyest blodtrykk?",
  "Hvem insjer mest (realfags)kjeller?",
  "Hvem ville du helst ikke vert fanga i en heis med?",
  "Hvem er medlem av kontorsofaklubben?",
  "Hvem er best i Smash?",
  "Hvem er best i Mario Kart?",
  "Hvem ignorerer smashpausen?",
  "Hvem tar de lengste 'pausene'?",
  "Hvem ender alltid opp på Heidi's?",
  "Hvem drar alltid på Cavasøndag?",
  "Hvem er mest keen på å være fadder?",
  "Hvem er din partner-in-crime for øvinger og gruppearbeid?",
  "Hvem tilbringer mest tid på kontoret?",
  "Hvem forsvinner først på Samf?",
  "Hvem har en uforklarlig evne til å alltid finne veien hjem, uansett hvor borte de er?",
  "Hvem får ikke kjøpe drikke i baren?",
  "Hvem detter først i bakken i Åre?",
  "Hvem skal 'stå på ski' i Åre?",
  "Hvem blir kastet ut først fra Immball?",
  "Hvem må fortsatt vise leg på Vinmonopolet?",
  "Hvem kommer senest på vors?",
  "Hvem er dårligst i beerpong?",
  "Hvem har fått flest prikker?",
  "Hvem skir på isen på vei til Bygget?",
  "Hvem er mest sannsynlig til å ende opp på Red Wines Wall of Shame?",
  "Hvem brenner flest Hiroshima-shots på Circus?",
  "Hvem spør mest 'for en venn' i Online Slacken?",
  "Hvem er på største A4-bonna?",
  "Hvem er den sterkeste A4-krigeren?",
  "Hvem finner du alltid i Realfagkantina?",
  "Hvem er litt for vennlig med abakuler?",
  "Hvem har de mest kreative rostene?",
  "Hvem har de dårligste comebacksa?",
  "Hvem sitt storstipend forsvinner på mystisk vis hver semesterstart?",
  "Hvem starter en OnlyFans hvis de stryker Algdat en gang til!",
  "Hvem kunne startet den neste store crypto scammen?",
  "Hvem hadde brukt «Passord123» som passord?",
  "Hvem sitt rom ser ut som et diskotek på grunn av alt i RGB?",
  "Hvem ser Wolf of Wallstreet hver dag som 'Pensum' i sigma grindset?",
  "Hvem er et academic weapon?",
  "Hvem er et academic victim?",
  "Hvem syns fortsatt at dette tallet er morsomt? Voks opp... Ta 3 straffeslurker",
  "Hvem er flinkest til å diskutere? Diskuter deg til en shot!!",
  "Hvem kunne kysset noen for en drink på byen? Hva med noen i rommet? 😉",
  "Hvem starter den neste store interessegruppen?",
  "Hvem spammer emojis som en 14 år gammel jente?",
  "Hvem er en gud i tetris battle fra videregående?",
  "Hvem kunne vært en jock i en American High School film?",
  "Hvem kunne vært lead Cheerleader i en American High School film?",
  "Hvem bruker fortsatt kalkulatoren sin til å skrive 5318008?",
  "Hvem preacher fargene til NTNUI?",
  "Hvem planlegger hybelen sin i Sims?",
  "Hvem bruker alt i light mode?",
  "Hvem har lengst streak på Duolingo?",
  "Hvem har mest hvit monster i blodet?",
  "Hvem får grønnsakene sine fra Mama Nudler?",
  "Hvem lager best memes under genfors?",
  "Hvem gjør alltid noe meme-verdig under genfors?",
  "Hvem klager på at eksamen gikk dritt, men alltid får bra karakter?",
  "Hvem svarer på spørsmål på StackOverflow?",
  "Hvem bruker Reddit AITA til å stille spørsmål om livet sitt?",
  "Hvem har Samfundets BESTE sjekkereplikk? Sjekk opp personen til venstre da vel 😉",
  "Hvem har den VERSTE? Kanskje du kan få noen tips fra gruppa?",
  "Hvem er mest flat-earther?",
  "Hvem legger alltid ut for drikke på Samf når du har for lite på brukskonto?",
  "Hvem har alltid en (ikke nødvendigvis god) plan på byen?",
  "Hvem spiller mest League of Legends?",
  "Hvem burde virkelig få seg litt frisk luft og røre gress?",
  "Hvem sitter mer på Netflix enn?",
  "Hvem er den største romantikeren? #rizz",
  "Hvem sover aldri i sin egen seng etter en kveld på byen?",
  "Hvem er ditt A4 gang-crush?",
  "Hvem løper vekk fra purken? (Hvis de blir tatt)",
]
  .slice()
  .reverse();

async function triggerHaptic() {
  if (Platform.OS === "web") return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

function OnlineSuitIcon({
  size = 26,
  primaryColor,
  secondaryColor = GOLD_LIGHT,
  opacity = 1,
}: {
  size?: number;
  primaryColor: string;
  secondaryColor?: string;
  opacity?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 167 167" opacity={opacity}>
      <G transform="translate(-1065.04 -424.313)">
        <G transform="matrix(0.470077 0 0 1 531.77 355.303)">
          <G transform="matrix(2.83642 0 0 1.33333 914.268 -277.944)">
            <G>
              <G transform="matrix(1 0 0 1 171.299 370.231)">
                <Path
                  d="M0,-101.72L-28.406,-59.668L-0.497,-59.312L-54.946,10.118L-33.175,-45.879L-60.813,-45.95L-29.288,-110.015C-29.288,-110.015 -21.027,-109.785 -13.921,-107.785C-6.834,-105.79 0,-101.72 0,-101.72Z"
                  fill={secondaryColor}
                />
              </G>
              <G transform="matrix(0.75 0 0 0.75 0 186.709)">
                <Path
                  d="M236.622,114.629C239.737,116.969 242.712,119.544 245.548,122.352C253.395,130.276 259.416,139.289 263.611,149.388C267.807,159.488 269.904,170.093 269.904,181.203C269.904,192.313 267.807,202.898 263.611,212.959C259.416,223.02 253.395,232.013 245.548,239.937C237.624,247.862 228.612,253.922 218.512,258.117C208.412,262.312 197.807,264.41 186.697,264.41C179.342,264.41 172.217,263.491 165.322,261.652L185.836,235.386C186.123,235.39 186.41,235.392 186.697,235.392C196.719,235.392 205.829,232.945 214.025,228.051C222.222,223.156 228.767,216.611 233.662,208.414C238.556,200.218 241.003,191.147 241.003,181.203C241.003,171.181 238.556,162.071 233.662,153.875C230.11,147.928 225.69,142.85 220.401,138.642L236.622,114.629ZM178.079,98.428L160.843,133.456C160.388,133.709 159.936,133.97 159.486,134.239C151.29,139.133 144.744,145.679 139.85,153.875C134.955,162.071 132.508,171.181 132.508,181.203C132.508,191.147 134.955,200.218 139.85,208.414C144.337,215.929 150.213,222.057 157.477,226.796L147.204,254.408C140.211,250.596 133.797,245.772 127.963,239.937C120.038,232.013 113.979,223.02 109.783,212.959C105.588,202.898 103.49,192.313 103.49,181.203C103.49,170.093 105.588,159.488 109.783,149.388C113.979,139.289 120.038,130.276 127.963,122.352C135.887,114.505 144.88,108.484 154.941,104.289C162.368,101.192 170.081,99.238 178.079,98.428Z"
                  fill={primaryColor}
                />
              </G>
            </G>
          </G>
        </G>
      </G>
    </Svg>
  );
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

function getCardPalette(index: number) {
  const isRedCard = index % 2 === 0;

  return {
    pip: isRedCard ? RED : BLACK,
    accent: GOLD,
    question: BLACK,
    corner: isRedCard ? RED : BLACK,
    watermark: isRedCard ? RED : BLACK,
  };
}

function CardCorner({
  label,
  color,
  flipped = false,
}: {
  label: string;
  color: string;
  flipped?: boolean;
}) {
  return (
    <View style={[styles.cornerBlock, flipped && styles.cornerBlockFlipped]}>
      <Text style={[styles.cornerLabel, { color }]}>{label}</Text>
      <OnlineSuitIcon size={32} primaryColor={color} secondaryColor={GOLD} />
    </View>
  );
}

function CasinoQuestionCard({
  question,
  index,
}: {
  question: string;
  index: number;
}) {
  const palette = getCardPalette(index);
  const label = String(index + 1).padStart(2, "0");

  return (
    <View style={styles.card}>
      <View style={styles.cardFace} />
      <View style={styles.cardHighlight} />
      <View style={styles.cardShade} />
      <View style={styles.cardInnerBorder} />

      <View style={styles.cornerTopLeft}>
        <CardCorner label={label} color={palette.corner} />
      </View>

      <View style={styles.cornerBottomRight}>
        <CardCorner label={label} color={palette.corner} flipped />
      </View>

      <View style={styles.centerWatermark} pointerEvents="none">
        <OnlineSuitIcon
          size={120}
          primaryColor={palette.watermark}
          secondaryColor={GOLD}
          opacity={0.09}
        />
      </View>

      <View style={styles.cardHeader}>
        <Text style={styles.cardHeaderText}>100 SPØRSMÅL</Text>
      </View>

      <View style={styles.questionWrap}>
        <Text style={styles.questionText}>{question}</Text>
      </View>
    </View>
  );
}

export default function CasinoQuestionsDeckScreen() {
  const { mode } = useThemeMode();
  const darkMode = mode === "dark";
  const backgroundColor = darkMode ? TABLE_GREEN_DARK : TABLE_GREEN_LIGHT;
  const insets = useSafeAreaInsets();

  const [cardIndex, setCardIndex] = useState(0);

  const translateX = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const scale = useSharedValue(1);
  const isAnimating = useSharedValue(false);

  const canGoBack = cardIndex > 0;
  const canGoNext = cardIndex < QUESTIONS.length - 1;

  const resetCardPosition = () => {
    translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
    rotateZ.value = withSpring(0, { damping: 18, stiffness: 180 });
    scale.value = withSpring(1, { damping: 18, stiffness: 180 });
  };

  const completeSwipe = async (direction: 1 | -1) => {
    if (isAnimating.value) return;

    const nextIndex = direction === -1 ? cardIndex + 1 : cardIndex - 1;
    if (nextIndex < 0 || nextIndex >= QUESTIONS.length) {
      resetCardPosition();
      return;
    }

    isAnimating.value = true;
    await triggerHaptic();

    translateX.value = withTiming(direction * SWIPE_OUT_DISTANCE, {
      duration: 220,
    });
    rotateZ.value = withTiming(direction * 12, { duration: 220 });
    scale.value = withTiming(0.98, { duration: 220 });

    setTimeout(() => {
      setCardIndex(nextIndex);

      translateX.value = -direction * 90;
      rotateZ.value = -direction * 5;
      scale.value = 0.98;

      translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
      rotateZ.value = withSpring(0, { damping: 18, stiffness: 180 });
      scale.value = withSpring(1, { damping: 18, stiffness: 180 });

      isAnimating.value = false;
    }, 220);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (isAnimating.value) return;

      translateX.value = event.translationX;
      rotateZ.value = event.translationX / 16;
      scale.value = 0.995;
    })
    .onEnd((event) => {
      if (isAnimating.value) return;

      const shouldSwipe =
        Math.abs(event.translationX) > SWIPE_THRESHOLD ||
        Math.abs(event.velocityX) > 900;

      if (!shouldSwipe) {
        translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
        rotateZ.value = withSpring(0, { damping: 18, stiffness: 180 });
        scale.value = withSpring(1, { damping: 18, stiffness: 180 });
        return;
      }

      const direction: 1 | -1 = event.translationX > 0 ? 1 : -1;
      runOnJS(completeSwipe)(direction);
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotateZ: `${rotateZ.value}deg` },
      { scale: scale.value },
    ],
  }));

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

        <View style={styles.content}>
          <View style={styles.deckHeader}>
            <Text style={styles.deckTitle}>100 SPØRSMÅL</Text>
            <Text style={styles.deckSubtitle}>
              Sveip venstre for neste kort · høyre for forrige
            </Text>
          </View>

          <View style={styles.stackArea}>
            <View style={[styles.stackCard, styles.stackCardBackFar]} />
            <View style={[styles.stackCard, styles.stackCardBackNear]} />

            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.frontCardWrap, cardAnimatedStyle]}>
                <CasinoQuestionCard
                  question={QUESTIONS[cardIndex]}
                  index={cardIndex}
                />
              </Animated.View>
            </GestureDetector>
          </View>

          <View style={styles.footer}>
            <Text style={styles.progressText}>
              {cardIndex + 1} / {QUESTIONS.length}
            </Text>
            <Text style={styles.edgeHint}>
              {!canGoBack && !canGoNext
                ? "Bare ett kort i bunken"
                : !canGoBack
                  ? "Du er på første kort"
                  : !canGoNext
                    ? "Du er på siste kort"
                    : "Bla frem og tilbake i bunken"}
            </Text>
          </View>
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
    borderColor: TABLE_RAIL,
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

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
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

  stackArea: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + 16,
    justifyContent: "center",
    alignItems: "center",
  },
  stackCard: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 26,
    backgroundColor: "rgba(251,247,238,0.92)",
    borderWidth: 2,
    borderColor: "rgba(217,191,106,0.52)",
  },
  stackCardBackFar: {
    transform: [{ translateY: 14 }, { scale: 0.95 }],
    opacity: 0.24,
  },
  stackCardBackNear: {
    transform: [{ translateY: 8 }, { scale: 0.975 }],
    opacity: 0.38,
  },
  frontCardWrap: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },

  card: {
    flex: 1,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: GOLD,
    backgroundColor: CREAM,
    shadowColor: "#1D120A",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  cardFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CREAM,
  },
  cardHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: "#FFFDF8",
    opacity: 0.65,
  },
  cardShade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "#E7DCC0",
    opacity: 0.22,
  },
  cardInnerBorder: {
    position: "absolute",
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(217,191,106,0.5)",
  },
  cornerTopLeft: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 3,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 3,
  },
  cornerBlock: {
    alignItems: "center",
    justifyContent: "center",
  },
  cornerBlockFlipped: {
    transform: [{ rotate: "180deg" }],
  },
  cornerLabel: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 22,
    marginBottom: 5,
  },
  cardHeader: {
    marginTop: 22,
    alignItems: "center",
    zIndex: 2,
  },
  cardHeaderText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.2,
  },
  centerWatermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -60,
    marginTop: -60,
    zIndex: 1,
  },
  questionWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 34,
    paddingVertical: 56,
    zIndex: 2,
  },
  questionText: {
    color: BLACK,
    fontSize: 25,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 34,
  },

  footer: {
    alignItems: "center",
    marginTop: 18,
  },
  progressText: {
    color: GOLD_LIGHT,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  edgeHint: {
    marginTop: 6,
    color: CREAM_DARK,
    fontSize: 14,
    textAlign: "center",
  },
});
