import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, G, Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { SongCardModal } from "../../../components/GamesHub/SongCardModal";
import {
  CASINO_COLORS,
  SongPlayingCard,
} from "../../../components/GamesHub/SongPlayingCard";
import { TabScreenContainer } from "../../../components/TabScreenContainer";
import { songs, type Song } from "../../../utils/songs";
import { useThemeMode } from "../../../utils/theme";

const TABLE_GREEN_LIGHT = "#0F6B47";
const TABLE_GREEN_DARK = "#0A4E34";
const TABLE_PATCH_LIGHT = "#167A52";
const TABLE_PATCH_DARK = "#0D5A3C";
const TABLE_SHADOW_LIGHT = "#0A4B32";
const TABLE_SHADOW_DARK = "#062D1E";
const TABLE_RAIL = "rgba(217,191,106,0.24)";

type GamePieceType = "chip" | "dice" | "roulette" | "questions" | "deck";

type Game = {
  id: string;
  title: string;
  description: string;
  route: string;
  piece: GamePieceType;
};

const games: Game[] = [
  {
    id: "spinline",
    title: "SpinLine",
    description: "Send flasken rundt",
    route: "/spinline",
    piece: "chip",
  },
  {
    id: "dice",
    title: "Terning",
    description: "Trykk og kast",
    route: "/dice",
    piece: "dice",
  },
  {
    id: "roulette",
    title: "Roulette",
    description: "Prøv lykken",
    route: "/roulette",
    piece: "roulette",
  },
  {
    id: "questions_100",
    title: "100 spørsmål",
    description: "For hele gjengen",
    route: "/questions_100",
    piece: "questions",
  },
  {
    id: "bunken",
    title: "Bunken",
    description: "Ring of fire",
    route: "/bunken",
    piece: "deck",
  },
];

async function triggerHaptic() {
  if (Platform.OS === "web") return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

function CasinoFeltBackground({ darkMode }: { darkMode: boolean }) {
  const patch = darkMode ? TABLE_PATCH_DARK : TABLE_PATCH_LIGHT;
  const shadow = darkMode ? TABLE_SHADOW_DARK : TABLE_SHADOW_LIGHT;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.feltPatch, styles.feltPatchTop, { backgroundColor: patch, opacity: 0.42 }]} />
      <View style={[styles.feltPatch, styles.feltPatchBottom, { backgroundColor: shadow, opacity: 0.36 }]} />
      <View style={[styles.feltPatch, styles.feltPatchLeft, { backgroundColor: shadow, opacity: 0.22 }]} />
      <View style={[styles.feltPatch, styles.feltPatchRight, { backgroundColor: patch, opacity: 0.18 }]} />
      <View style={styles.tableRail} />
      <View style={styles.tableRailInner} />
    </View>
  );
}

function PokerChip() {
  return (
    <View style={[styles.pieceShadow, styles.chipOuter]}>
      <View style={styles.chipDashes}>
        <View style={styles.chipInner}>
          <MaterialCommunityIcons
            name="bottle-soda-classic-outline"
            size={29}
            color={CASINO_COLORS.cream}
          />
        </View>
      </View>
    </View>
  );
}

function DicePiece() {
  return (
    <View style={[styles.pieceShadow, styles.dicePiece]}>
      <MaterialCommunityIcons
        name="dice-5"
        size={50}
        color={CASINO_COLORS.black}
      />
      <View style={styles.diceHighlight} />
    </View>
  );
}

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function wedgePath(index: number) {
  const start = polarPoint(50, 50, 43, index * 30);
  const end = polarPoint(50, 50, 43, (index + 1) * 30);
  return `M 50 50 L ${start.x} ${start.y} A 43 43 0 0 1 ${end.x} ${end.y} Z`;
}

function RoulettePiece() {
  return (
    <View style={[styles.pieceShadow, styles.wheelWrap]}>
      <Svg width={82} height={82} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="48" fill={CASINO_COLORS.gold} />
        <G>
          {Array.from({ length: 12 }, (_, index) => (
            <Path
              key={index}
              d={wedgePath(index)}
              fill={index % 2 === 0 ? "#B3261E" : "#191919"}
            />
          ))}
        </G>
        <Circle cx="50" cy="50" r="15" fill={CASINO_COLORS.gold} />
        <Circle cx="50" cy="50" r="7" fill={CASINO_COLORS.cream} />
        <Circle cx="50" cy="50" r="3" fill={CASINO_COLORS.black} />
      </Svg>
    </View>
  );
}

function QuestionsPiece() {
  return (
    <View style={styles.stackPiece}>
      <View style={[styles.stackCard, styles.stackCardBack]} />
      <View style={[styles.stackCard, styles.stackCardMiddle]} />
      <View style={[styles.stackCard, styles.stackCardFront]}>
        <Text style={styles.stackNumber}>100</Text>
        <MaterialCommunityIcons
          name="message-question-outline"
          size={24}
          color={CASINO_COLORS.gold}
        />
      </View>
    </View>
  );
}

function DeckPiece() {
  return (
    <View style={styles.deckPiece}>
      <View style={[styles.deckCard, styles.deckCardBackTwo]} />
      <View style={[styles.deckCard, styles.deckCardBackOne]} />
      <View style={[styles.deckCard, styles.deckCardFront]}>
        <View style={styles.deckInnerBorder} />
        <View style={styles.deckDiamond} />
        <View style={styles.deckLogo}>
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={30}
            color={CASINO_COLORS.goldLight}
          />
        </View>
      </View>
    </View>
  );
}

function GamePiece({ type }: { type: GamePieceType }) {
  switch (type) {
    case "chip":
      return <PokerChip />;
    case "dice":
      return <DicePiece />;
    case "roulette":
      return <RoulettePiece />;
    case "questions":
      return <QuestionsPiece />;
    case "deck":
      return <DeckPiece />;
  }
}

export default function GamesAndSongsScreen() {
  const { mode } = useThemeMode();
  const darkMode = mode === "dark";
  const backgroundColor = darkMode ? TABLE_GREEN_DARK : TABLE_GREEN_LIGHT;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const openGame = async (game: Game) => {
    await triggerHaptic();
    router.push(game.route as never);
  };

  const openSong = async (song: Song) => {
    await triggerHaptic();
    setSelectedSong(song);
  };

  return (
    <TabScreenContainer>
      <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
        <CasinoFeltBackground darkMode={darkMode} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroMark}>
              <MaterialCommunityIcons
                name="cards-playing-outline"
                size={25}
                color={CASINO_COLORS.goldLight}
              />
            </View>
            <Text style={styles.heroTitle}>SPILL OG SANGER</Text>
            <Text style={styles.heroSubtitle}>
              Alt dere trenger rundt bordet
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>PÅ BORDET</Text>
              <Text style={styles.sectionTitle}>Velg et spill</Text>
            </View>
            <Text style={styles.sectionCount}>{games.length} spill</Text>
          </View>

          <View style={styles.gameGrid}>
            {games.map((game) => (
              <Pressable
                key={game.id}
                accessibilityRole="button"
                accessibilityLabel={`Åpne ${game.title}`}
                onPress={() => openGame(game)}
                style={({ pressed }) => [
                  styles.gameButton,
                  { opacity: pressed ? 0.65 : 1 },
                ]}
              >
                <View style={styles.gamePieceArea}>
                  <GamePiece type={game.piece} />
                </View>
                <Text style={styles.gameTitle}>{game.title}</Text>
                <Text style={styles.gameDescription}>{game.description}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.sectionHeader, styles.songSectionHeader]}>
            <View>
              <Text style={styles.sectionEyebrow}>SANGSTOKKEN</Text>
              <Text style={styles.sectionTitle}>Trekk en sang</Text>
            </View>
            <Text style={styles.sectionCount}>{songs.length} kort</Text>
          </View>

          <Text style={styles.songHint}>
            Trykk på et kort for å snu det og åpne sangteksten
          </Text>

          <View style={styles.songGrid}>
            {songs.map((song, index) => (
              <Pressable
                key={song.id}
                accessibilityRole="button"
                accessibilityLabel={`Åpne sangkortet ${song.title}`}
                onPress={() => openSong(song)}
                style={({ pressed }) => [
                  styles.songCardButton,
                  index % 2 === 0 ? styles.songCardLeft : styles.songCardRight,
                  pressed && styles.songCardPressed,
                ]}
              >
                <SongPlayingCard song={song} compact />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <SongCardModal song={selectedSong} onClose={() => setSelectedSong(null)} />
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
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 140,
  },
  hero: {
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 22,
  },
  heroMark: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
    borderWidth: 1.5,
    borderColor: "rgba(243,222,155,0.48)",
    backgroundColor: "rgba(8,25,45,0.62)",
  },
  heroTitle: {
    color: CASINO_COLORS.goldLight,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  heroSubtitle: {
    color: CASINO_COLORS.creamDark,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  sectionEyebrow: {
    color: CASINO_COLORS.gold,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.7,
    marginBottom: 2,
  },
  sectionTitle: {
    color: CASINO_COLORS.goldLight,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "800",
  },
  sectionCount: {
    color: CASINO_COLORS.creamDark,
    fontSize: 13,
    paddingBottom: 3,
  },
  gameGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    rowGap: 18,
  },
  gameButton: {
    width: "31%",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  gamePieceArea: {
    height: 92,
    alignItems: "center",
    justifyContent: "center",
  },
  gameTitle: {
    color: CASINO_COLORS.cream,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  gameDescription: {
    color: CASINO_COLORS.creamDark,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 2,
    opacity: 0.82,
  },
  pieceShadow: {
    shadowColor: "#051A12",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  chipOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    padding: 5,
    backgroundColor: "#206487",
    borderWidth: 2,
    borderColor: CASINO_COLORS.gold,
  },
  chipDashes: {
    flex: 1,
    padding: 6,
    borderRadius: 32,
    borderWidth: 5,
    borderStyle: "dashed",
    borderColor: CASINO_COLORS.cream,
  },
  chipInner: {
    flex: 1,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#184F70",
    borderWidth: 1,
    borderColor: "rgba(243,222,155,0.54)",
  },
  dicePiece: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: CASINO_COLORS.cream,
    borderWidth: 2,
    borderColor: CASINO_COLORS.gold,
  },
  diceHighlight: {
    position: "absolute",
    top: -8,
    left: -6,
    right: -6,
    height: 28,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  wheelWrap: {
    width: 82,
    height: 82,
    borderRadius: 41,
    overflow: "hidden",
  },
  stackPiece: {
    width: 76,
    height: 80,
  },
  stackCard: {
    position: "absolute",
    width: 66,
    height: 76,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: CASINO_COLORS.gold,
    backgroundColor: CASINO_COLORS.cream,
  },
  stackCardBack: {
    left: 8,
    top: 4,
    transform: [{ rotate: "7deg" }],
    opacity: 0.72,
  },
  stackCardMiddle: {
    left: 4,
    top: 2,
    transform: [{ rotate: "3deg" }],
  },
  stackCardFront: {
    left: 0,
    top: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CASINO_COLORS.navy,
    shadowColor: "#051A12",
    shadowOpacity: 0.34,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  stackNumber: {
    color: CASINO_COLORS.goldLight,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "900",
  },
  deckPiece: {
    width: 78,
    height: 82,
  },
  deckCard: {
    position: "absolute",
    width: 61,
    height: 78,
    borderRadius: 12,
    borderWidth: 1.6,
    borderColor: CASINO_COLORS.gold,
    backgroundColor: CASINO_COLORS.navy,
  },
  deckCardBackTwo: {
    left: 12,
    top: 3,
    transform: [{ rotate: "7deg" }],
    opacity: 0.65,
  },
  deckCardBackOne: {
    left: 6,
    top: 1,
    transform: [{ rotate: "3deg" }],
    opacity: 0.82,
  },
  deckCardFront: {
    left: 0,
    top: 0,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#051A12",
    shadowOpacity: 0.34,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  deckInnerBorder: {
    position: "absolute",
    top: 5,
    right: 5,
    bottom: 5,
    left: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(243,222,155,0.54)",
  },
  deckDiamond: {
    position: "absolute",
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: "rgba(243,222,155,0.5)",
    transform: [{ rotate: "45deg" }],
  },
  deckLogo: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CASINO_COLORS.navyDeep,
  },
  songSectionHeader: {
    marginTop: 34,
    marginBottom: 6,
  },
  songHint: {
    color: CASINO_COLORS.creamDark,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 15,
    opacity: 0.86,
  },
  songGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 15,
  },
  songCardButton: {
    width: "47.7%",
    aspectRatio: 0.704,
  },
  songCardLeft: {
    transform: [{ rotate: "-1.2deg" }],
  },
  songCardRight: {
    transform: [{ rotate: "1.2deg" }],
  },
  songCardPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
});
