import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { Song } from "../../utils/songs";

export const CASINO_COLORS = {
  gold: "#D9BF6A",
  goldLight: "#F3DE9B",
  cream: "#FBF7EE",
  creamDark: "#F1E7D0",
  red: "#B3261E",
  black: "#191919",
  navy: "#10294A",
  navyDeep: "#08192D",
  navyMid: "#183B63",
};

export function getSongSuitColor(song: Song) {
  return song.suit === "♥" || song.suit === "♦"
    ? CASINO_COLORS.red
    : CASINO_COLORS.black;
}

function CardCorner({ song, flipped = false }: { song: Song; flipped?: boolean }) {
  const color = getSongSuitColor(song);

  return (
    <View style={[styles.corner, flipped && styles.cornerFlipped]}>
      <Text style={[styles.cornerRank, { color }]}>{song.rank}</Text>
      <Text style={[styles.cornerSuit, { color }]}>{song.suit}</Text>
    </View>
  );
}

export function OnlineCardMark({ size = 38 }: { size?: number }) {
  return (
    <View
      style={[
        styles.onlineMark,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <MaterialCommunityIcons
        name="lightning-bolt"
        size={size * 0.58}
        color={CASINO_COLORS.goldLight}
      />
    </View>
  );
}

export function SongPlayingCard({
  song,
  compact = false,
}: {
  song: Song;
  compact?: boolean;
}) {
  const color = getSongSuitColor(song);

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.cardFace} />
      <View style={styles.cardHighlight} />
      <View style={styles.cardShade} />
      <View style={styles.cardInnerBorder} />

      <View style={styles.cornerTopLeft}>
        <CardCorner song={song} />
      </View>
      <View style={styles.cornerBottomRight}>
        <CardCorner song={song} flipped />
      </View>

      <Text style={styles.cardHeader}>SANGKORT</Text>

      <View style={styles.centerContent}>
        <View style={[styles.suitWatermark, { borderColor: color }]}>
          <Text style={[styles.watermarkSuit, { color }]}>{song.suit}</Text>
        </View>
        <Text
          style={[styles.songTitle, compact && styles.songTitleCompact]}
          numberOfLines={compact ? 3 : 4}
        >
          {song.shortTitle}
        </Text>
        <OnlineCardMark size={compact ? 28 : 42} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: CASINO_COLORS.gold,
    backgroundColor: CASINO_COLORS.cream,
    shadowColor: "#1D120A",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 9,
  },
  cardCompact: {
    borderRadius: 18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  cardFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CASINO_COLORS.cream,
  },
  cardHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "22%",
    backgroundColor: "#FFFDF8",
    opacity: 0.7,
  },
  cardShade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "24%",
    backgroundColor: "#E7DCC0",
    opacity: 0.25,
  },
  cardInnerBorder: {
    position: "absolute",
    inset: 8,
    borderRadius: 14,
    borderWidth: 1.4,
    borderColor: "rgba(217,191,106,0.52)",
  },
  cornerTopLeft: {
    position: "absolute",
    top: 13,
    left: 14,
    zIndex: 2,
  },
  cornerBottomRight: {
    position: "absolute",
    right: 14,
    bottom: 13,
    zIndex: 2,
  },
  corner: {
    alignItems: "center",
  },
  cornerFlipped: {
    transform: [{ rotate: "180deg" }],
  },
  cornerRank: {
    fontSize: 21,
    fontWeight: "800",
    lineHeight: 22,
  },
  cornerSuit: {
    fontSize: 19,
    lineHeight: 20,
  },
  cardHeader: {
    position: "absolute",
    top: 14,
    alignSelf: "center",
    color: CASINO_COLORS.gold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 27,
    paddingVertical: 38,
  },
  suitWatermark: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.4,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.15,
    position: "absolute",
  },
  watermarkSuit: {
    fontSize: 43,
  },
  songTitle: {
    color: CASINO_COLORS.black,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
    zIndex: 2,
  },
  songTitleCompact: {
    fontSize: 18,
    lineHeight: 21,
    marginBottom: 11,
  },
  onlineMark: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CASINO_COLORS.navy,
    borderWidth: 1.2,
    borderColor: CASINO_COLORS.gold,
    zIndex: 2,
  },
});
