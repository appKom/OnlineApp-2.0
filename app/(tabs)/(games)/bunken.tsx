import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { TabScreenContainer } from "../../../components/TabScreenContainer";
import { useThemeMode } from "../../../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, { G, Path as SvgPath } from "react-native-svg";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const TABLE_AREA_WIDTH = Math.min(SCREEN_WIDTH - 12, 460);
const TABLE_AREA_HEIGHT = Math.min(
  Math.max(SCREEN_HEIGHT * 0.68, 470),
  SCREEN_HEIGHT - 180,
);

const TABLE_SPAWN_INSET_X = 34;
const TABLE_SPAWN_INSET_Y = 40;
const TABLE_SPAWN_WIDTH = TABLE_AREA_WIDTH - TABLE_SPAWN_INSET_X * 2;
const TABLE_SPAWN_HEIGHT = TABLE_AREA_HEIGHT - TABLE_SPAWN_INSET_Y * 2;

const MINI_CARD_WIDTH = Math.min(Math.max(TABLE_AREA_WIDTH * 0.236, 72), 90);
const MINI_CARD_HEIGHT = MINI_CARD_WIDTH * 1.42;

const PREVIEW_CARD_WIDTH = Math.min(Math.max(SCREEN_WIDTH * 0.74, 290), 390);
const PREVIEW_CARD_HEIGHT = PREVIEW_CARD_WIDTH * 1.42;
const RESULT_PANEL_WIDTH = Math.min(SCREEN_WIDTH - 28, 430);

const GOLD = "#D9BF6A";
const GOLD_LIGHT = "#F3DE9B";
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
const TABLE_RAIL = "rgba(217,191,106,0.24)";

const WOOD_BASE = "#7A4A2A";
const WOOD_DARK = "#5C371F";
const WOOD_LIGHT = "#9A643C";
const WOOD_LINE = "#B67A4E";
const WOOD_SHADOW = "#3B2415";

const NAVY = "#10294A";
const NAVY_DEEP = "#08192D";
const NAVY_MID = "#183B63";
const NAVY_GLOW = "rgba(243,222,155,0.12)";

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

function WoodPanel({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.woodPanelBox}>
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
      <View style={styles.woodPanelContent}>{children}</View>
    </View>
  );
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
                <SvgPath
                  d="M0,-101.72L-28.406,-59.668L-0.497,-59.312L-54.946,10.118L-33.175,-45.879L-60.813,-45.95L-29.288,-110.015C-29.288,-110.015 -21.027,-109.785 -13.921,-107.785C-6.834,-105.79 0,-101.72 0,-101.72Z"
                  fill={secondaryColor}
                />
              </G>
              <G transform="matrix(0.75 0 0 0.75 0 186.709)">
                <SvgPath
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

function CardBack() {
  return (
    <View style={styles.backCard}>
      <View style={styles.backCardFace} />
      <View style={styles.backCardInnerGlow} />
      <View style={styles.backCardInnerBorder} />
      <View style={styles.backPatternFrame} />
      <View style={styles.backPatternDiamondOuter} />
      <View style={styles.backPatternDiamondInner} />
      <View style={styles.backPatternCircle} />
      <View style={styles.backPatternLineHorizontal} />
      <View style={styles.backPatternLineVertical} />

      <View style={styles.backLogoWrap} pointerEvents="none">
        <View style={styles.backLogoTopLeft}>
          <OnlineSuitIcon
            size={18}
            primaryColor={GOLD}
            secondaryColor={GOLD_LIGHT}
            opacity={0.48}
          />
        </View>
        <View style={styles.backLogoTopRight}>
          <OnlineSuitIcon
            size={18}
            primaryColor={GOLD}
            secondaryColor={GOLD_LIGHT}
            opacity={0.48}
          />
        </View>
        <View style={styles.backLogoBottomLeft}>
          <OnlineSuitIcon
            size={18}
            primaryColor={GOLD}
            secondaryColor={GOLD_LIGHT}
            opacity={0.48}
          />
        </View>
        <View style={styles.backLogoBottomRight}>
          <OnlineSuitIcon
            size={18}
            primaryColor={GOLD}
            secondaryColor={GOLD_LIGHT}
            opacity={0.48}
          />
        </View>
        <View style={styles.backLogoCenter}>
          <OnlineSuitIcon
            size={52}
            primaryColor={GOLD}
            secondaryColor={GOLD_LIGHT}
            opacity={0.94}
          />
        </View>
      </View>
    </View>
  );
}

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

      <View style={styles.previewWatermarkWrap} pointerEvents="none">
        <Text
          style={[
            styles.previewWatermark,
            styles.previewWatermarkTop,
            { color: suitColor },
          ]}
        >
          {suitSymbol}
        </Text>
        <Text style={[styles.previewWatermark, { color: suitColor }]}>
          {suitSymbol}
        </Text>
        <Text
          style={[
            styles.previewWatermark,
            styles.previewWatermarkBottom,
            { color: suitColor },
          ]}
        >
          {suitSymbol}
        </Text>
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
  const [showHint, setShowHint] = useState(true);

  const previewScale = useSharedValue(1);

  const previewAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: previewScale.value }],
  }));

  const closeResultPopup = useCallback(() => {
    setResultVisible(false);
  }, []);

  const resetDeck = useCallback(() => {
    setDeck(buildScatterDeck());
    setDrawnCardIds([]);
    setSelectedDraw(null);
    setResultVisible(false);
    setKingsDrawn(0);
    setShowHint(true);

    previewScale.value = 1;
  }, [previewScale]);

  useFocusEffect(
    useCallback(() => {
      resetDeck();
    }, [resetDeck]),
  );

  const drawnCardIdSet = useMemo(() => new Set(drawnCardIds), [drawnCardIds]);

  const remainingCards = useMemo(
    () => deck.filter((card) => !drawnCardIdSet.has(card.id)),
    [deck, drawnCardIdSet],
  );

  const drawCard = async (card: TableCard) => {
    if (drawnCardIdSet.has(card.id)) return;

    const rule = getRuleForDraw(card.rank, kingsDrawn);

    setDrawnCardIds((prev) => [...prev, card.id]);
    setKingsDrawn(rule.nextKingsDrawn);
    setSelectedDraw({
      card,
      title: `${card.rank}${getSuitSymbol(card.suit)} · ${rule.title.replace(/^.\s·\s/, "")}`,
      description: rule.description,
    });
    setResultVisible(true);

    previewScale.value = 0.82;
    previewScale.value = withSpring(1, { damping: 13, stiffness: 230 });

    await triggerDrawHaptic();

    if (rule.nextKingsDrawn === 4 && card.rank === "K") {
      await triggerBigHaptic();
    }
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

        <View style={styles.content}>
          <View style={styles.deckHeader}>
            <Text style={styles.deckTitle}>BUNKEN</Text>
            <Text style={styles.deckSubtitle}>
              Trykk på et tilfeldig kort for å trekke det
            </Text>
          </View>

          <View style={styles.boardWrap}>
            <View style={styles.boardGlow} />

            <View style={styles.tableArea}>
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

        {resultVisible && selectedDraw && (
          <Pressable
            style={styles.resultOverlay}
            onPress={closeResultPopup}
            accessibilityRole="button"
            accessibilityLabel="Lukk trukket kort"
          >
            <Pressable
              style={styles.resultPopupStack}
              onPress={closeResultPopup}
              accessibilityRole="button"
              accessibilityLabel="Lukk popup for trukket kort"
            >
              <Animated.View
                style={[styles.previewCardWrap, previewAnimatedStyle]}
              >
                <RevealedCard card={selectedDraw.card} />
              </Animated.View>

              <WoodPanel>
                <Text style={styles.resultTitle}>{selectedDraw.title}</Text>
                <Text style={styles.actionText}>
                  {selectedDraw.description}
                </Text>
              </WoodPanel>
            </Pressable>
          </Pressable>
        )}

        {showHint && (
          <View style={styles.hintOverlay}>
            <Pressable
              style={styles.hintBackdrop}
              onPress={() => setShowHint(false)}
              accessibilityRole="button"
              accessibilityLabel="Lukk forklaring"
            />

            <Pressable
              style={styles.hintPopup}
              onPress={() => {}}
              accessibilityRole="summary"
              accessibilityLabel="Forklaring av Bunken"
            >
              <Text style={styles.hintTitle}>Slik funker bunken</Text>

              <Text style={styles.hintText}>
                Kortene ligger i en bunke på bordet.
                {"\n\n"}
                Trykk på et kort for å trekke det.
                {"\n\n"}
                Kortet forsvinner fra bunken og du blir fortalt hva du skal
                gjøre.
              </Text>

              <Text style={styles.hintHintText}>
                Trykk hvor som helst for å lukke.
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
            </Pressable>
          </View>
        )}
      </View>
    </TabScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 34,
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
    width: 560,
    height: 560,
    bottom: -220,
    right: -150,
  },
  feltPatchLeft: {
    width: 260,
    height: 260,
    top: "42%",
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
    borderWidth: 1.8,
    borderColor: GOLD,
    backgroundColor: NAVY,
    shadowColor: "#09111D",
    shadowOpacity: 0.3,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  backCardFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: NAVY,
  },
  backCardInnerGlow: {
    position: "absolute",
    top: -8,
    left: -6,
    right: -6,
    height: "42%",
    backgroundColor: NAVY_MID,
    opacity: 0.35,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backCardInnerBorder: {
    position: "absolute",
    top: 5,
    bottom: 5,
    left: 5,
    right: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(243,222,155,0.56)",
  },
  backPatternFrame: {
    position: "absolute",
    top: 11,
    bottom: 11,
    left: 11,
    right: 11,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(243,222,155,0.18)",
  },
  backPatternDiamondOuter: {
    position: "absolute",
    width: "58%",
    height: "58%",
    top: "21%",
    left: "21%",
    borderWidth: 1.2,
    borderColor: "rgba(243,222,155,0.46)",
    transform: [{ rotate: "45deg" }],
  },
  backPatternDiamondInner: {
    position: "absolute",
    width: "32%",
    height: "32%",
    top: "34%",
    left: "34%",
    borderWidth: 1,
    borderColor: "rgba(243,222,155,0.64)",
    transform: [{ rotate: "45deg" }],
  },
  backPatternCircle: {
    position: "absolute",
    width: "24%",
    aspectRatio: 1,
    borderRadius: 999,
    top: "38%",
    left: "38%",
    borderWidth: 1,
    borderColor: NAVY_GLOW,
  },
  backPatternLineHorizontal: {
    position: "absolute",
    left: "16%",
    right: "16%",
    top: "50%",
    height: 1,
    backgroundColor: "rgba(243,222,155,0.38)",
  },
  backPatternLineVertical: {
    position: "absolute",
    top: "16%",
    bottom: "16%",
    left: "50%",
    width: 1,
    backgroundColor: "rgba(243,222,155,0.38)",
  },
  backLogoWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  backLogoCenter: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -26,
    marginTop: -26,
  },
  backLogoTopLeft: {
    position: "absolute",
    top: 13,
    left: 13,
  },
  backLogoTopRight: {
    position: "absolute",
    top: 13,
    right: 13,
  },
  backLogoBottomLeft: {
    position: "absolute",
    bottom: 13,
    left: 13,
  },
  backLogoBottomRight: {
    position: "absolute",
    bottom: 13,
    right: 13,
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

  previewCardWrap: {
    width: PREVIEW_CARD_WIDTH,
    height: PREVIEW_CARD_HEIGHT,
    alignSelf: "center",
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
  previewWatermarkWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -92,
    marginTop: -128,
    width: 184,
    height: 256,
    alignItems: "center",
    justifyContent: "center",
  },
  previewWatermark: {
    position: "absolute",
    fontSize: 164,
    fontWeight: "700",
    opacity: 0.08,
  },
  previewWatermarkTop: {
    transform: [{ translateX: -36 }, { translateY: -72 }],
  },
  previewWatermarkBottom: {
    transform: [{ translateX: 36 }, { translateY: 72 }],
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

  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 55,
    paddingHorizontal: 18,
    backgroundColor: "rgba(5, 14, 23, 0.74)",
  },
  resultPopupStack: {
    width: RESULT_PANEL_WIDTH,
    alignItems: "center",
    gap: 18,
  },
  woodPanelBox: {
    width: "100%",
    minHeight: 188,
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(243,222,155,0.34)",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
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
  woodPanelContent: {
    minHeight: 188,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.2,
    color: GOLD_LIGHT,
  },
  actionText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 23,
    color: CREAM,
  },

  hintOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 60,
  },
  hintBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6, 22, 15, 0.58)",
  },
  hintPopup: {
    width: "86%",
    maxWidth: 360,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    backgroundColor: "rgba(14, 50, 35, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(243, 222, 155, 0.64)",
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  hintTitle: {
    color: GOLD_LIGHT,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  hintText: {
    color: CREAM,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    fontWeight: "600",
  },
  hintHintText: {
    marginTop: 8,
    color: CREAM_DARK,
    fontSize: 12,
    textAlign: "center",
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
