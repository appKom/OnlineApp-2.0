import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import type { Song } from "../../utils/songs";
import {
  CASINO_COLORS,
  getSongSuitColor,
  OnlineCardMark,
  SongPlayingCard,
} from "./SongPlayingCard";

const TABLE_GREEN = "#073D2A";

export function SongCardModal({
  song,
  onClose,
}: {
  song: Song | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const flip = useSharedValue(0);
  const scale = useSharedValue(0.86);

  useEffect(() => {
    if (!song) return;

    flip.value = 0;
    scale.value = 0.86;
    scale.value = withSpring(1, { damping: 18, stiffness: 170 });

    const timer = setTimeout(() => {
      flip.value = withTiming(180, { duration: 680 });
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
    }, 260);

    return () => clearTimeout(timer);
  }, [flip, scale, song]);

  const frontStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flip.value, [88, 92], [1, 0]),
    transform: [{ perspective: 1200 }, { rotateY: `${flip.value}deg` }],
  }));

  const backStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flip.value, [88, 92], [0, 1]),
    transform: [
      { perspective: 1200 },
      { rotateY: `${flip.value + 180}deg` },
    ],
  }));

  const stageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardWidth = Math.min(width - 28, 430);
  const cardHeight = Math.min(height - insets.top - insets.bottom - 76, 720);
  const suitColor = song ? getSongSuitColor(song) : CASINO_COLORS.red;

  return (
    <Modal
      visible={Boolean(song)}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      {song ? (
        <View style={styles.overlay}>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={[styles.feltPatch, styles.feltPatchTop]} />
            <View style={[styles.feltPatch, styles.feltPatchBottom]} />
            <View style={styles.tableRail} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lukk sangkort"
            onPress={onClose}
            hitSlop={8}
            style={[
              styles.closeButton,
              { top: insets.top + 10, right: Math.max(insets.right + 14, 14) },
            ]}
          >
            <MaterialCommunityIcons
              name="close"
              size={26}
              color={CASINO_COLORS.black}
            />
          </Pressable>

          <Animated.View
            style={[
              styles.cardStage,
              { width: cardWidth, height: cardHeight },
              stageStyle,
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[styles.cardSide, frontStyle]}
            >
              <SongPlayingCard song={song} />
            </Animated.View>

            <Animated.View style={[styles.cardSide, backStyle]}>
              <View style={styles.lyricCard}>
                <View style={styles.lyricCardHighlight} />
                <View style={styles.lyricCardInnerBorder} />
                <View style={styles.lyricHeader}>
                  <OnlineCardMark size={38} />
                  <View style={styles.lyricHeaderText}>
                    <Text style={styles.lyricEyebrow}>SANGKORT</Text>
                    <Text style={styles.lyricTitle}>{song.title}</Text>
                  </View>
                  <View style={styles.lyricSuitBlock}>
                    <Text style={[styles.lyricRank, { color: suitColor }]}>
                      {song.rank}
                    </Text>
                    <Text style={[styles.lyricSuit, { color: suitColor }]}>
                      {song.suit}
                    </Text>
                  </View>
                </View>

                <ScrollView
                  style={styles.lyricsScroll}
                  contentContainerStyle={styles.lyricsContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {song.sections.map((section, sectionIndex) => (
                    <View
                      key={`${song.id}-${sectionIndex}`}
                      style={[
                        styles.lyricSection,
                        sectionIndex < song.sections.length - 1 &&
                          styles.lyricSectionBorder,
                      ]}
                    >
                      {section.title ? (
                        <View style={styles.sectionHeadingRow}>
                          <Text style={styles.sectionTitle}>{section.title}</Text>
                          {section.cue ? (
                            <Text style={styles.cue}>{section.cue}</Text>
                          ) : null}
                        </View>
                      ) : null}

                      {section.lines.length === 0 ? (
                        <Text style={styles.repeatText}>Gjenta refrenget</Text>
                      ) : (
                        section.lines.map((line, lineIndex) => (
                          <Text key={lineIndex} style={styles.lyricLine}>
                            {line}
                          </Text>
                        ))
                      )}

                      {section.note ? (
                        <View style={styles.noteBox}>
                          <MaterialCommunityIcons
                            name="information-outline"
                            size={18}
                            color="#5A4930"
                          />
                          <Text style={styles.noteText}>{section.note}</Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </Animated.View>
          </Animated.View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TABLE_GREEN,
  },
  feltPatch: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#0D5A3C",
    opacity: 0.4,
  },
  feltPatchTop: {
    width: 440,
    height: 440,
    top: -160,
    left: -110,
  },
  feltPatchBottom: {
    width: 540,
    height: 540,
    right: -180,
    bottom: -220,
    opacity: 0.24,
  },
  tableRail: {
    position: "absolute",
    inset: 12,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "rgba(217,191,106,0.28)",
  },
  closeButton: {
    position: "absolute",
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CASINO_COLORS.cream,
    borderWidth: 1.5,
    borderColor: CASINO_COLORS.gold,
    elevation: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.26,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
  },
  cardStage: {
    position: "relative",
  },
  cardSide: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: "hidden",
  },
  lyricCard: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: CASINO_COLORS.gold,
    backgroundColor: CASINO_COLORS.cream,
    shadowColor: "#1D120A",
    shadowOpacity: 0.34,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  lyricCardHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: "#FFFDF8",
    opacity: 0.68,
  },
  lyricCardInnerBorder: {
    position: "absolute",
    inset: 9,
    borderRadius: 17,
    borderWidth: 1.4,
    borderColor: "rgba(217,191,106,0.48)",
  },
  lyricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingTop: 20,
    paddingHorizontal: 22,
    paddingBottom: 15,
    zIndex: 2,
  },
  lyricHeaderText: {
    flex: 1,
  },
  lyricEyebrow: {
    color: CASINO_COLORS.gold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  lyricTitle: {
    color: CASINO_COLORS.black,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    marginTop: 2,
  },
  lyricSuitBlock: {
    alignItems: "center",
  },
  lyricRank: {
    fontSize: 21,
    lineHeight: 21,
    fontWeight: "800",
  },
  lyricSuit: {
    fontSize: 19,
  },
  lyricsScroll: {
    flex: 1,
    zIndex: 2,
  },
  lyricsContent: {
    paddingHorizontal: 22,
    paddingBottom: 34,
  },
  lyricSection: {
    paddingVertical: 17,
  },
  lyricSectionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(89,72,48,0.28)",
  },
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#206487",
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "800",
  },
  cue: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    color: "#633F00",
    backgroundColor: "#FFDDB4",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  lyricLine: {
    color: CASINO_COLORS.black,
    fontSize: 17,
    lineHeight: 25,
    marginBottom: 4,
  },
  repeatText: {
    color: "#5A4930",
    fontSize: 16,
    lineHeight: 23,
    fontStyle: "italic",
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 11,
    marginTop: 10,
    borderRadius: 11,
    backgroundColor: "#E9DDBF",
  },
  noteText: {
    flex: 1,
    color: "#5A4930",
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
  },
});
