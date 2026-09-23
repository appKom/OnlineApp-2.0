import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Platform,
  Dimensions,
  Image,
  Modal,
  useWindowDimensions,
  type ViewInstance,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TabScreenContainer } from "../../../components/TabScreenContainer";
import { CasinoFeltBackground, FELT_BASE_DARK, FELT_BASE_LIGHT } from "../../../components/GamesHub/CasinoFeltBackground";
import { useThemeMode } from "../../../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const TABLE_AREA_WIDTH = Math.min(SCREEN_WIDTH - 12, 460);
const TABLE_AREA_HEIGHT = Math.min(
  Math.max(SCREEN_HEIGHT * 0.61, 430),
  SCREEN_HEIGHT - 260,
);

const TABLE_SPAWN_INSET_X = 34;
const TABLE_SPAWN_INSET_Y = 40;
const TABLE_SPAWN_WIDTH = TABLE_AREA_WIDTH - TABLE_SPAWN_INSET_X * 2;
const TABLE_SPAWN_HEIGHT = TABLE_AREA_HEIGHT - TABLE_SPAWN_INSET_Y * 2;

const MINI_CARD_WIDTH = Math.min(Math.max(TABLE_AREA_WIDTH * 0.236, 72), 90);
const MINI_CARD_HEIGHT = MINI_CARD_WIDTH * 1.42;

const RESULT_PANEL_ESTIMATE = 220;

const GOLD = "#D9BF6A";
const GOLD_LIGHT = "#F3DE9B";
const CREAM = "#FBF7EE";
const CREAM_DARK = "#F1E7D0";
const RED = "#B3261E";
const BLACK = "#191919";

const TABLE_GREEN_LIGHT = FELT_BASE_LIGHT;
const TABLE_GREEN_DARK = FELT_BASE_DARK;

const NAVY = "#10294A";

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

type TableCard = {
  id: string;
  suit: Suit;
  rank: Rank;
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
};

type DrawResult = {
  card: TableCard;
  title: string;
  description: string;
  origin: { x: number; y: number; width: number; height: number };
};

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const RANKS: Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

function shuffleArray<T>(items: T[]): T[] {
  const shuffled = items.slice();

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function randomScatterPosition(max: number, spread = 0.9) {
  const center = max / 2;
  const offset = (Math.random() - 0.5) * max * spread;
  return clamp(center + offset, 0, max);
}

function buildScatterDeck(): TableCard[] {
  const baseDeck: Omit<TableCard, "x" | "y" | "rotation" | "zIndex">[] = [];

  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      baseDeck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
      });
    });
  });

  const shuffledDeck = shuffleArray(baseDeck);
  const maxX = TABLE_SPAWN_WIDTH - MINI_CARD_WIDTH;
  const maxY = TABLE_SPAWN_HEIGHT - MINI_CARD_HEIGHT;

  return shuffledDeck.map((card, index) => ({
    ...card,
    x: TABLE_SPAWN_INSET_X + randomScatterPosition(maxX, 0.72),
    y: TABLE_SPAWN_INSET_Y + randomScatterPosition(maxY, 0.74),
    rotation: -24 + Math.random() * 48,
    zIndex: index + 1,
  }));
}

function getSuitSymbol(suit: Suit) {
  switch (suit) {
    case "hearts":
      return "♥";
    case "diamonds":
      return "♦";
    case "clubs":
      return "♣";
    case "spades":
      return "♠";
  }
}

function getSuitColor(suit: Suit) {
  return suit === "hearts" || suit === "diamonds" ? RED : BLACK;
}

function getRuleForDraw(rank: Rank, kingsDrawn: number) {
  switch (rank) {
    case "A":
      return {
        title: "A · Waterfall",
        description:
          "Alle begynner å drikke samtidig. Du kan stoppe når personen til høyre for deg stopper.",
        nextKingsDrawn: kingsDrawn,
      };
    case "2":
      return {
        title: "2 · You",
        description: "Velg en person som må ta 2 slurker.",
        nextKingsDrawn: kingsDrawn,
      };
    case "3":
      return {
        title: "3 · Me",
        description: "Du tar 2 slurker selv, champ.",
        nextKingsDrawn: kingsDrawn,
      };
    case "4":
      return {
        title: "4 · Whore",
        description: "ALLE jenter drikker.",
        nextKingsDrawn: kingsDrawn,
      };
    case "5":
      return {
        title: "5 · Gris",
        description: "Alle tar tommelen på bordet, sistemann drikker.",
        nextKingsDrawn: kingsDrawn,
      };
    case "6":
      return {
        title: "6 · Dicks",
        description: "Alle gutter drikker.",
        nextKingsDrawn: kingsDrawn,
      };
    case "7":
      return {
        title: "7 · Heaven",
        description: "Siste person som rekker hånda i været må drikke.",
        nextKingsDrawn: kingsDrawn,
      };
    case "8":
      return {
        title: "8 · Mate",
        description:
          "Velg en drikkepartner. Hver gang du drikker, må hen også drikke resten av spillet.",
        nextKingsDrawn: kingsDrawn,
      };
    case "9":
      return {
        title: "9 · Rhyme",
        description:
          "Si et ord. Gå rundt og rim. Første som feiler eller bruker et ord som allerede er sagt, drikker.",
        nextKingsDrawn: kingsDrawn,
      };
    case "10":
      return {
        title: "10 · Kategori",
        description:
          "Velg en kategori, for eksempel land, ølmerker eller ting på hybelen. Gå rundt,  første som ikke kommer på noe drikker.",
        nextKingsDrawn: kingsDrawn,
      };
    case "J":
      return {
        title: "J · Jeg har aldri",
        description: "Si en 'jeg har aldri'. Alle som har gjort det drikker.",
        nextKingsDrawn: kingsDrawn,
      };
    case "Q":
      return {
        title: "Q · Question Master",
        description:
          "Du er Question Master til neste dronning blir trukket. Svarer noen på et spørsmål du stiller, må de drikke.",
        nextKingsDrawn: kingsDrawn,
      };
    case "K": {
      const nextKing = kingsDrawn + 1;

      if (nextKing < 4) {
        return {
          title: `K · Konge ${nextKing}/4`,
          description:
            "Lag en ny regel som varer resten av spillet. Alle som bryter regelen drikker.",
          nextKingsDrawn: nextKing,
        };
      }

      return {
        title: "K · Siste konge",
        description:
          "Du trakk den siste kongen i bunken! Chug drikka di eller ta 8 slurker.",
        nextKingsDrawn: nextKing,
      };
    }
  }
}

async function triggerDrawHaptic() {
  if (Platform.OS === "web") return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

async function triggerBigHaptic() {
  if (Platform.OS === "web") return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}


const CardBack = memo(function CardBack({ large = false }: { large?: boolean }) {
  return (
    <View style={[styles.backCard, large && styles.backCardLarge]}>
      <View pointerEvents="none" style={[styles.backCardInnerBorder, large && styles.backCardInnerBorderLarge]} />
      <Image
        source={require("../../../assets/Online_Logokit/png/Online_hvit_o.png")}
        style={large ? styles.backLogoLarge : styles.backLogo}
        resizeMode="contain"
      />
    </View>
  );
});

function CardCorner({
  rank,
  suit,
  color,
  flipped = false,
}: {
  rank: string;
  suit: string;
  color: string;
  flipped?: boolean;
}) {
  return (
    <View style={[styles.cornerBlock, flipped && styles.cornerBlockFlipped]}>
      <Text style={[styles.cornerLabel, { color }]}>{rank}</Text>
      <Text style={[styles.cornerSuit, { color }]}>{suit}</Text>
    </View>
  );
}

function RevealedCard({ card }: { card: TableCard }) {
  const suitSymbol = getSuitSymbol(card.suit);
  const suitColor = getSuitColor(card.suit);

  return (
    <View style={styles.previewCard}>
      <View style={styles.previewCardFace} />
      <View style={styles.previewCardHighlight} />
      <View style={styles.previewCardShade} />
      <View style={styles.previewCardInnerBorder} />

      <View style={styles.previewCornerTopLeft}>
        <CardCorner rank={card.rank} suit={suitSymbol} color={suitColor} />
      </View>

      <View style={styles.previewCornerBottomRight}>
        <CardCorner
          rank={card.rank}
          suit={suitSymbol}
          color={suitColor}
          flipped
        />
      </View>

      <View style={styles.previewHeader}>
        <Text style={styles.previewHeaderText}>BUNKEN</Text>
      </View>

      <View style={styles.previewCenter}>
        <Text style={[styles.previewCenterRank, { color: suitColor }]}>
          {card.rank}
        </Text>
        <Text style={[styles.previewCenterSuit, { color: suitColor }]}>
          {suitSymbol}
        </Text>
      </View>
    </View>
  );
}

function BunkenResultModal({
  result,
  visible,
  onClose,
}: {
  result: DrawResult | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [faceUp, setFaceUp] = useState(false);
  const [panelHeight, setPanelHeight] = useState(RESULT_PANEL_ESTIMATE);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const closing = useRef(false);
  const progress = useSharedValue(0);
  const turn = useSharedValue(0);
  const dim = useSharedValue(0);
  const info = useSharedValue(0);
  const exit = useSharedValue(0);

  const cardWidth = Math.min(
    width * 0.54,
    216,
    Math.max(170, (height - insets.top - insets.bottom - 280) / 1.42),
  );
  const cardHeight = cardWidth * 1.42;
  const cardLeft = (width - cardWidth) / 2;
  const cardTop = Math.max(
    insets.top + 18,
    (height - cardHeight - RESULT_PANEL_ESTIMATE - 16) / 2,
  );
  const panelWidth = Math.min(width - 36, 380);
  const source = result?.origin;
  const sourceX = source ? source.x + source.width / 2 : width / 2;
  const sourceY = source ? source.y + source.height / 2 : height / 2;
  const sourceScaleX = source ? source.width / cardWidth : 1;
  const sourceScaleY = source ? source.height / cardHeight : 1;
  const sourceRotation = result?.card.rotation ?? 0;

  useEffect(() => {
    if (!visible || !result) return;
    closing.current = false;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setFaceUp(false);
    progress.value = 0;
    turn.value = 0;
    dim.value = 0;
    info.value = 0;
    exit.value = 0;
    progress.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
    dim.value = withTiming(0.7, { duration: 260 });
    turn.value = withDelay(240, withTiming(1, { duration: 130 }));
    timers.current.push(setTimeout(() => {
      setFaceUp(true);
      turn.value = -1;
      timers.current.push(setTimeout(() => {
        turn.value = withTiming(0, { duration: 170 });
        info.value = withTiming(1, { duration: 220 });
      }, 30));
    }, 370));
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [visible, result?.card.id]);

  const stageStyle = useAnimatedStyle(() => ({
    left: cardLeft,
    top: cardTop,
    width: cardWidth,
    height: cardHeight,
    transform: [
      { translateX: (1 - progress.value) * (sourceX - cardLeft - cardWidth / 2) },
      { translateY: (1 - progress.value) * (sourceY - cardTop - cardHeight / 2) - exit.value * 90 },
      { rotateZ: `${(1 - progress.value) * sourceRotation}deg` },
      { scaleX: sourceScaleX + progress.value * (1 - sourceScaleX) },
      { scaleY: sourceScaleY + progress.value * (1 - sourceScaleY) },
    ],
    opacity: 1 - exit.value,
  }));
  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1100 }, { rotateY: `${turn.value * 90}deg` }],
  }));
  const dimStyle = useAnimatedStyle(() => ({ opacity: dim.value }));
  const infoStyle = useAnimatedStyle(() => ({
    opacity: info.value * (1 - exit.value),
    transform: [{ translateY: (1 - info.value) * 12 + exit.value * 70 }],
  }));

  const dismiss = () => {
    if (closing.current || !result) return;
    closing.current = true;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    exit.value = withTiming(1, { duration: 260, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
    dim.value = withTiming(0, { duration: 260 });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={dismiss}
    >
      {result ? (
        <View style={styles.resultModalRoot}>
          <Animated.View style={[styles.resultDim, dimStyle]}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={dismiss}
              accessibilityRole="button"
              accessibilityLabel="Lukk trukket kort"
            />
          </Animated.View>
          <Animated.View style={[styles.revealCardStage, stageStyle]}>
            <Animated.View style={[styles.revealCardSide, faceStyle]}>
              {faceUp ? <RevealedCard card={result.card} /> : <CardBack large />}
            </Animated.View>
          </Animated.View>
          <Animated.View
            style={[
              styles.resultInfoPanel,
              {
                top: cardTop + cardHeight + 16,
                width: panelWidth,
              },
              infoStyle,
            ]}
            onLayout={(event) => {
              const nextHeight = event.nativeEvent.layout.height;
              setPanelHeight((current) => Math.abs(current - nextHeight) > 1 ? nextHeight : current);
            }}
          >
            <Text style={styles.resultTitle} numberOfLines={2}>{result.title}</Text>
            <Text style={styles.actionText}>{result.description}</Text>
          </Animated.View>
          <Animated.View style={[styles.resultCloseFooter, { top: Math.min(height - insets.bottom - 58, cardTop + cardHeight + panelHeight + 28) }, infoStyle]}>
            <Pressable style={styles.resultCloseButton} onPress={dismiss} accessibilityRole="button" accessibilityLabel="Lukk trukket kort">
              <MaterialCommunityIcons name="close" size={24} color={BLACK} />
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
    </Modal>
  );
}

export default function BunkenScatterScreen() {
  const { mode } = useThemeMode();
  const darkMode = mode === "dark";
  const backgroundColor = darkMode ? TABLE_GREEN_DARK : TABLE_GREEN_LIGHT;
  const insets = useSafeAreaInsets();

  const [deck, setDeck] = useState<TableCard[]>(() => buildScatterDeck());
  const [drawnCardIds, setDrawnCardIds] = useState<string[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<DrawResult | null>(null);
  const [resultVisible, setResultVisible] = useState(false);
  const [kingsDrawn, setKingsDrawn] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const tableRef = useRef<ViewInstance | null>(null);
  const drawing = useRef(false);

  const closeResultPopup = useCallback(() => {
    setResultVisible(false);
    drawing.current = false;
  }, []);

  const resetDeck = useCallback(() => {
    setDeck(buildScatterDeck());
    setDrawnCardIds([]);
    setSelectedDraw(null);
    setResultVisible(false);
    setKingsDrawn(0);
    drawing.current = false;
  }, []);

  const drawnCardIdSet = useMemo(() => new Set(drawnCardIds), [drawnCardIds]);

  const remainingCards = useMemo(
    () => deck.filter((card) => !drawnCardIdSet.has(card.id)),
    [deck, drawnCardIdSet],
  );

  const drawCard = async (card: TableCard) => {
    if (drawing.current || drawnCardIdSet.has(card.id)) return;
    drawing.current = true;

    const rule = getRuleForDraw(card.rank, kingsDrawn);
    const present = (boardX: number, boardY: number) => {
      setDrawnCardIds((prev) => [...prev, card.id]);
      setKingsDrawn(rule.nextKingsDrawn);
      setSelectedDraw({
        card,
        title: `${card.rank}${getSuitSymbol(card.suit)} · ${rule.title.replace(/^.\s·\s/, "")}`,
        description: rule.description,
        origin: {
          x: boardX + card.x,
          y: boardY + card.y,
          width: MINI_CARD_WIDTH,
          height: MINI_CARD_HEIGHT,
        },
      });
      setResultVisible(true);
    };
    if (tableRef.current) {
      tableRef.current.measureInWindow((x, y) => present(x, y));
    } else {
      present((SCREEN_WIDTH - TABLE_AREA_WIDTH) / 2, SCREEN_HEIGHT * 0.2);
    }

    await triggerDrawHaptic();

    if (rule.nextKingsDrawn === 4 && card.rank === "K") {
      await triggerBigHaptic();
    }
  };

  return (
    <TabScreenContainer backgroundColor={backgroundColor}>
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
        <Pressable
          style={[styles.helpButton, { top: insets.top + 12 }]}
          onPress={() => setShowHint(true)}
          accessibilityRole="button"
          accessibilityLabel="Slik spiller du Bunken"
          hitSlop={8}
        >
          <MaterialCommunityIcons name="help" size={19} color={GOLD_LIGHT} />
        </Pressable>

        <View style={styles.content}>
          <View style={styles.deckHeader}>
            <Text style={styles.deckTitle}>BUNKEN</Text>
            <Text style={styles.deckSubtitle}>
              Trykk på et tilfeldig kort for å trekke det
            </Text>
            <Text style={styles.deckCount}>
              {remainingCards.length} / {deck.length} kort igjen
            </Text>
          </View>

          <View style={styles.boardWrap}>
            <View style={styles.boardGlow} />

            <View ref={tableRef} style={styles.tableArea}>
              {remainingCards.map((card) => (
                <Pressable
                  key={card.id}
                  onPress={() => drawCard(card)}
                  style={[
                    styles.tableCardPressable,
                    {
                      left: card.x,
                      top: card.y,
                      zIndex: card.zIndex,
                      transform: [{ rotate: `${card.rotation}deg` }],
                    },
                  ]}
                >
                  <CardBack />
                </Pressable>
              ))}

              {remainingCards.length === 0 && (
                <View style={styles.emptyTableBadge}>
                  <Text style={styles.emptyTableTitle}>Tomt bord</Text>
                  <Text style={styles.emptyTableText}>
                    Alle 52 kort er trukket
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Pressable style={styles.resetButton} onPress={resetDeck}>
            <Text style={styles.resetButtonText}>
              {remainingCards.length === 0 ? "Spill igjen" : "Bland på nytt"}
            </Text>
          </Pressable>
        </View>

      </View>
      {resultVisible && selectedDraw ? (
        <BunkenResultModal
          result={selectedDraw}
          visible
          onClose={closeResultPopup}
        />
      ) : null}
      <Modal
        visible={showHint}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowHint(false)}
      >
        <View style={styles.hintOverlay}>
            <Pressable
              style={styles.hintBackdrop}
              onPress={() => setShowHint(false)}
              accessibilityRole="button"
              accessibilityLabel="Lukk forklaring"
            />

            <View style={styles.hintPopup}>
              <Text style={styles.hintTitle}>Slik funker bunken</Text>

              <Text style={styles.hintText}>
                Kortene ligger spredt på bordet.
                {"\n\n"}
                Trykk på et kort for å trekke det.
                {"\n\n"}
                Kortet forsvinner fra bunken og du blir fortalt hva du skal
                gjøre.
              </Text>

              <Pressable
                style={styles.hintCloseButton}
                onPress={() => setShowHint(false)}
                accessibilityRole="button"
                accessibilityLabel="Skjul forklaring"
                hitSlop={8}
              >
                <Text style={styles.hintCloseText}>Skjønner</Text>
              </Pressable>
            </View>
        </View>
      </Modal>
    </TabScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 34,
  },
  helpButton: {
    position: "absolute",
    right: 20,
    zIndex: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(3, 32, 23, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(243, 222, 155, 0.75)",
  },

  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 6,
  },

  deckHeader: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 12,
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
  deckCount: {
    color: GOLD_LIGHT,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 10,
  },

  boardWrap: {
    width: TABLE_AREA_WIDTH,
    height: TABLE_AREA_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
    marginTop: 8,
  },
  boardGlow: {
    position: "absolute",
    width: TABLE_AREA_WIDTH * 0.97,
    height: TABLE_AREA_HEIGHT * 0.84,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  tableArea: {
    width: "100%",
    height: TABLE_AREA_HEIGHT,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "rgba(7, 39, 27, 0.1)",
  },

  tableCardPressable: {
    position: "absolute",
    width: MINI_CARD_WIDTH,
    height: MINI_CARD_HEIGHT,
  },

  backCard: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: GOLD,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
  },
  backCardLarge: {
    borderRadius: 34,
    borderWidth: 4.5,
  },
  backCardInnerBorder: {
    position: "absolute",
    top: 5,
    bottom: 5,
    left: 5,
    right: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(243,222,155,0.68)",
  },
  backCardInnerBorderLarge: {
    top: 12,
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 20,
    borderWidth: 2.5,
  },
  backLogo: {
    width: 36,
    height: 36,
  },
  backLogoLarge: {
    width: 88,
    height: 88,
  },

  emptyTableBadge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 180,
    marginLeft: -90,
    marginTop: -40,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "rgba(14, 50, 35, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(243, 222, 155, 0.6)",
  },
  emptyTableTitle: {
    color: GOLD_LIGHT,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  emptyTableText: {
    color: CREAM,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  resetButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: "rgba(217, 191, 106, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(243, 222, 155, 0.28)",
  },
  resetButtonText: {
    color: GOLD_LIGHT,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  previewCard: {
    flex: 1,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1.7,
    borderColor: GOLD,
    backgroundColor: CREAM,
    shadowColor: "#1D120A",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  previewCardFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CREAM,
  },
  previewCardHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 88,
    backgroundColor: "#FFFDF8",
    opacity: 0.6,
  },
  previewCardShade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 84,
    backgroundColor: "#E7DCC0",
    opacity: 0.2,
  },
  previewCardInnerBorder: {
    position: "absolute",
    top: 14,
    bottom: 14,
    left: 14,
    right: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(217,191,106,0.45)",
  },
  previewCornerTopLeft: {
    position: "absolute",
    top: 18,
    left: 18,
    zIndex: 3,
  },
  previewCornerBottomRight: {
    position: "absolute",
    bottom: 18,
    right: 18,
    zIndex: 3,
  },
  previewHeader: {
    marginTop: 20,
    alignItems: "center",
    zIndex: 2,
  },
  previewHeaderText: {
    color: GOLD,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 3,
  },
  previewCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
  },
  previewCenterRank: {
    fontSize: 108,
    fontWeight: "800",
    lineHeight: 112,
  },
  previewCenterSuit: {
    fontSize: 82,
    fontWeight: "700",
    marginTop: 8,
  },

  cornerBlock: {
    alignItems: "center",
    justifyContent: "center",
  },
  cornerBlockFlipped: {
    transform: [{ rotate: "180deg" }],
  },
  cornerLabel: {
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 34,
  },
  cornerSuit: {
    fontSize: 31,
    fontWeight: "700",
    lineHeight: 33,
  },

  resultModalRoot: {
    flex: 1,
  },
  resultDim: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#02120D",
  },
  revealCardStage: {
    position: "absolute",
  },
  revealCardSide: {
    flex: 1,
  },
  resultInfoPanel: {
    position: "absolute",
    alignSelf: "center",
    paddingHorizontal: 23,
    paddingTop: 20,
    paddingBottom: 22,
    minHeight: 144,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: "#123D2F",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 10,
  },
  resultCloseFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  resultCloseButton: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: CREAM,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.2,
    color: GOLD_LIGHT,
  },
  actionText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
    color: CREAM,
  },

  hintOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2, 12, 9, 0.76)",
  },
  hintBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  hintPopup: {
    width: "86%",
    maxWidth: 360,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 22,
    alignItems: "center",
    backgroundColor: "#123D2F",
    borderWidth: 2,
    borderColor: "rgba(243, 222, 155, 0.64)",
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  hintTitle: {
    color: GOLD_LIGHT,
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  hintText: {
    color: CREAM,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    fontWeight: "600",
  },
  hintCloseButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(217, 191, 106, 0.22)",
  },
  hintCloseText: {
    color: GOLD_LIGHT,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
