import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import type { Song } from "../../utils/songs";
import {
  CASINO_COLORS,
  getSongSuitColor,
  SongPlayingCard,
} from "./SongPlayingCard";

export type CardRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ScrollMetrics = {
  offset: number;
  viewport: number;
  content: number;
};

function ScrollFade({ bottom }: { bottom?: boolean }) {
  const id = bottom ? "songFadeBottom" : "songFadeTop";
  return (
    <Svg width="100%" height="100%">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop
            offset="0"
            stopColor={CASINO_COLORS.cream}
            stopOpacity={bottom ? 0 : 1}
          />
          <Stop
            offset="1"
            stopColor={CASINO_COLORS.cream}
            stopOpacity={bottom ? 1 : 0}
          />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

export function SongCardModal({
  songs,
  songIndex,
  origin,
  onClose,
}: {
  songs: Song[];
  songIndex: number | null;
  origin: CardRect | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(songIndex ?? 0);
  const [openedIndex, setOpenedIndex] = useState<number | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [scrollEdges, setScrollEdges] = useState({ top: false, bottom: false });
  const scrollMetrics = useRef<ScrollMetrics>({
    offset: 0,
    viewport: 0,
    content: 0,
  });
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const closing = useRef(false);

  const expansion = useSharedValue(0);
  const turn = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const controlsOpacity = useSharedValue(0);
  const pageOffset = useSharedValue(0);
  const topFadeOpacity = useSharedValue(0);
  const bottomFadeOpacity = useSharedValue(0);

  const targetWidth = Math.min(width - 28, 430);
  const targetHeight = Math.min(
    Math.max(height - insets.top - insets.bottom - 128, 300),
    720,
  );
  const targetLeft = (width - targetWidth) / 2;
  const targetTop = Math.max(
    insets.top + 12,
    (height - targetHeight - 100) / 2,
  );
  const sourceCenterX = origin ? origin.x + origin.width / 2 : width / 2;
  const sourceCenterY = origin ? origin.y + origin.height / 2 : height / 2;
  const targetCenterX = targetLeft + targetWidth / 2;
  const targetCenterY = targetTop + targetHeight / 2;
  const sourceWidth = Math.max(origin?.width ?? 1, 1);
  const sourceHeight = Math.max(origin?.height ?? 1, 1);
  const sourceRotation = (songIndex ?? 0) % 2 === 0 ? -1.2 : 1.2;

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useLayoutEffect(() => {
    if (songIndex === null) {
      closing.current = false;
      return;
    }
    if (!origin) return;
    if (closing.current) return;

    clearTimers();
    setOpenedIndex(songIndex);
    setActiveIndex(songIndex);
    setShowLyrics(false);
    scrollMetrics.current = { offset: 0, viewport: 0, content: 0 };
    setScrollEdges({ top: false, bottom: false });

    expansion.value = 0;
    turn.value = 0;
    backdropOpacity.value = 0;
    controlsOpacity.value = 0;

    expansion.value = withTiming(1, { duration: 320 });
    backdropOpacity.value = withTiming(1, { duration: 360 });
    turn.value = withDelay(130, withTiming(1, { duration: 190 }));
    controlsOpacity.value = withDelay(390, withTiming(1, { duration: 220 }));

    timers.current.push(
      setTimeout(() => {
        setShowLyrics(true);
        turn.value = -1;
        timers.current.push(
          setTimeout(() => {
            turn.value = withTiming(0, { duration: 210 });
          }, 32),
        );
        if (Platform.OS !== "web") {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
        }
      }, 320),
    );

    return clearTimers;
  }, [songIndex, origin]);

  useEffect(() => {
    topFadeOpacity.value = withTiming(scrollEdges.top ? 1 : 0, {
      duration: 180,
    });
    bottomFadeOpacity.value = withTiming(scrollEdges.bottom ? 1 : 0, {
      duration: 180,
    });
  }, [scrollEdges, topFadeOpacity, bottomFadeOpacity]);

  const frontStageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: expansion.value * (targetCenterX - sourceCenterX) },
      { translateY: expansion.value * (targetCenterY - sourceCenterY) },
      { rotateZ: `${(1 - expansion.value) * sourceRotation}deg` },
      { scaleX: 1 + expansion.value * (targetWidth / sourceWidth - 1) },
      { scaleY: 1 + expansion.value * (targetHeight / sourceHeight - 1) },
    ],
  }));
  const lyricStageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pageOffset.value }],
  }));
  const faceStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${turn.value * 90}deg` },
    ],
  }));
  const dimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));
  const footerStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
    transform: [{ translateY: (1 - controlsOpacity.value) * 12 }],
  }));
  const topFadeStyle = useAnimatedStyle(() => ({
    opacity: topFadeOpacity.value,
  }));
  const bottomFadeStyle = useAnimatedStyle(() => ({
    opacity: bottomFadeOpacity.value,
  }));

  const closeCard = () => {
    if (closing.current || !origin) return;
    closing.current = true;
    clearTimers();

    controlsOpacity.value = withTiming(0, { duration: 140 });
    backdropOpacity.value = withDelay(155, withTiming(0, { duration: 350 }));
    turn.value = withTiming(1, { duration: 130 });
    timers.current.push(
      setTimeout(() => {
        setShowLyrics(false);
        turn.value = -1;
        expansion.value = withTiming(0, { duration: 400 }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
        timers.current.push(
          setTimeout(() => {
            turn.value = withTiming(0, { duration: 190 });
          }, 30),
        );
      }, 130),
    );
  };

  const changeSong = (direction: number) => {
    if (closing.current) return;
    const nextIndex = activeIndex + direction;
    if (nextIndex < 0 || nextIndex >= songs.length) return;
    pageOffset.value = direction > 0 ? 22 : -22;
    pageOffset.value = withTiming(0, { duration: 230 });
    scrollMetrics.current = { offset: 0, viewport: 0, content: 0 };
    setScrollEdges({ top: false, bottom: false });
    setActiveIndex(nextIndex);
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync().catch(() => {});
    }
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-35, 35])
    .failOffsetY([-20, 20])
    .runOnJS(true)
    .onEnd((event) => {
      if (event.translationX < -65 || event.velocityX < -550) changeSong(1);
      if (event.translationX > 65 || event.velocityX > 550) changeSong(-1);
    });

  const updateScrollEdges = () => {
    const { offset, viewport, content } = scrollMetrics.current;
    const next = {
      top: offset > 4,
      bottom: offset > 4 && viewport > 0 && content > viewport + offset + 4,
    };
    setScrollEdges((current) =>
      current.top === next.top && current.bottom === next.bottom
        ? current
        : next,
    );
  };

  const currentIndex =
    openedIndex === songIndex ? activeIndex : (songIndex ?? activeIndex);
  const song = songs[currentIndex];
  const sourceSong = songs[songIndex ?? 0];
  const suitColor = song ? getSongSuitColor(song) : CASINO_COLORS.red;

  return (
    <Modal
      visible={songIndex !== null}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      presentationStyle="overFullScreen"
      hardwareAccelerated
      animationType="none"
      onRequestClose={closeCard}
    >
      {song ? (
        <View style={styles.overlay}>
          <Animated.View style={[styles.backdrop, dimStyle]}>
            <Pressable
              style={styles.fill}
              onPress={closeCard}
              accessibilityRole="button"
              accessibilityLabel="Lukk sangkort"
            />
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.frontStage,
              {
                left: origin?.x ?? 0,
                top: origin?.y ?? 0,
                width: sourceWidth,
                height: sourceHeight,
                opacity: showLyrics ? 0 : 1,
                transform: [{ rotateZ: `${sourceRotation}deg` }],
              },
              frontStageStyle,
            ]}
          >
            <Animated.View style={[styles.cardSide, faceStyle]}>
              <SongPlayingCard song={sourceSong ?? song} compact />
            </Animated.View>
          </Animated.View>

          <GestureDetector gesture={swipeGesture}>
            <Animated.View
              pointerEvents={showLyrics ? "auto" : "none"}
              style={[
                styles.lyricStage,
                {
                  left: targetLeft,
                  top: targetTop,
                  width: targetWidth,
                  height: targetHeight,
                  opacity: showLyrics ? 1 : 0,
                },
                lyricStageStyle,
              ]}
            >
              <Animated.View style={[styles.cardSide, faceStyle]}>
                  <View style={styles.lyricCard}>
                    <View pointerEvents="none" style={styles.innerBorder} />
                    <View style={styles.lyricHeader}>
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

                    <View style={styles.lyricsWindow}>
                      <ScrollView
                        key={song.id}
                        style={styles.lyricsScroll}
                        contentContainerStyle={styles.lyricsContent}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled
                        scrollEventThrottle={16}
                        onLayout={(event) => {
                          scrollMetrics.current.viewport =
                            event.nativeEvent.layout.height;
                          updateScrollEdges();
                        }}
                        onContentSizeChange={(_, contentHeight) => {
                          scrollMetrics.current.content = contentHeight;
                          updateScrollEdges();
                        }}
                        onScroll={(event) => {
                          scrollMetrics.current.offset =
                            event.nativeEvent.contentOffset.y;
                          updateScrollEdges();
                        }}
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
                                <Text style={styles.sectionTitle}>
                                  {section.title}
                                </Text>
                                {section.cue ? (
                                  <Text style={styles.cue}>{section.cue}</Text>
                                ) : null}
                              </View>
                            ) : null}
                            {section.lines.length === 0 ? (
                              <Text style={styles.repeatText}>
                                Gjenta refrenget
                              </Text>
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
                                <Text style={styles.noteText}>
                                  {section.note}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        ))}
                      </ScrollView>
                      <Animated.View
                        pointerEvents="none"
                        style={[styles.topFade, topFadeStyle]}
                      >
                        <ScrollFade />
                      </Animated.View>
                      <Animated.View
                        pointerEvents="none"
                        style={[styles.bottomFade, bottomFadeStyle]}
                      >
                        <ScrollFade bottom />
                      </Animated.View>
                    </View>
                  </View>
              </Animated.View>
            </Animated.View>
          </GestureDetector>

          <Animated.View
            style={[
              styles.footer,
              { bottom: Math.max(insets.bottom, 8) + 8 },
              footerStyle,
            ]}
          >
            <View style={styles.pager}>
              <Pressable
                onPress={() => changeSong(-1)}
                disabled={currentIndex === 0}
                accessibilityRole="button"
                accessibilityLabel="Forrige sang"
                style={[
                  styles.arrowButton,
                  currentIndex === 0 && styles.arrowDisabled,
                ]}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={26}
                  color={CASINO_COLORS.cream}
                />
              </Pressable>
              <Text style={styles.songNumber}>
                {currentIndex + 1} / {songs.length}
              </Text>
              <Pressable
                onPress={() => changeSong(1)}
                disabled={currentIndex === songs.length - 1}
                accessibilityRole="button"
                accessibilityLabel="Neste sang"
                style={[
                  styles.arrowButton,
                  currentIndex === songs.length - 1 &&
                    styles.arrowDisabled,
                ]}
              >
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={26}
                  color={CASINO_COLORS.cream}
                />
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Lukk sangkort"
              onPress={closeCard}
              hitSlop={8}
              style={styles.closeButton}
            >
              <MaterialCommunityIcons
                name="close"
                size={25}
                color={CASINO_COLORS.black}
              />
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(2, 18, 13, 0.76)",
  },
  fill: {
    flex: 1,
  },
  frontStage: {
    position: "absolute",
  },
  lyricStage: {
    position: "absolute",
  },
  cardSide: {
    flex: 1,
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
  innerBorder: {
    position: "absolute",
    top: 9,
    right: 9,
    bottom: 9,
    left: 9,
    borderRadius: 17,
    borderWidth: 1.4,
    borderColor: "rgba(217,191,106,0.48)",
  },
  lyricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 12,
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
  lyricsWindow: {
    flex: 1,
    overflow: "hidden",
    marginHorizontal: 11,
    marginBottom: 11,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  lyricsScroll: {
    flex: 1,
  },
  lyricsContent: {
    paddingHorizontal: 11,
    paddingBottom: 14,
  },
  topFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 30,
  },
  bottomFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 38,
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
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 4,
  },
  pager: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    height: 36,
  },
  arrowButton: {
    width: 38,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowDisabled: {
    opacity: 0.32,
  },
  songNumber: {
    minWidth: 70,
    color: CASINO_COLORS.cream,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  closeButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CASINO_COLORS.cream,
    borderWidth: 1.5,
    borderColor: CASINO_COLORS.gold,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 12,
  },
});
