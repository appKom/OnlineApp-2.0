import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeInRight, ReduceMotion, runOnJS } from "react-native-reanimated";
import { BITS_CATEGORY_LABELS, type BitsCard } from "../../utils/bits";
import { CASINO_COLORS as C } from "./SongPlayingCard";

export function BitsPlayingCard({ card, number, onNext }: {
  card: BitsCard;
  number: number;
  onNext?: () => void;
}) {
  const isRule = card.category === "rule";
  const ink = isRule ? C.cream : C.black;
  const suit = card.category === "back-to-back" ? "♠" : isRule ? "♣" : "♦";
  const accent = isRule ? C.goldLight : C.red;
  const pan = Gesture.Pan().enabled(Boolean(onNext))
    .activeOffsetX([-30, 30]).failOffsetY([-20, 20])
    .onEnd(event => {
      if (onNext && (Math.abs(event.translationX) > 65 || Math.abs(event.velocityX) > 800)) runOnJS(onNext)();
    });

  return (
    <Animated.View entering={FadeInRight.duration(180).reduceMotion(ReduceMotion.System)} style={styles.stack}>
      <View pointerEvents="none" style={[styles.backCard, styles.backTwo]} />
      <View pointerEvents="none" style={[styles.backCard, styles.backOne]} />
      <GestureDetector gesture={pan}>
        <Pressable
          onPress={onNext}
          accessible
          accessibilityRole={onNext ? "button" : "text"}
          accessibilityLabel={`${BITS_CATEGORY_LABELS[card.category]}. ${card.title}. ${card.body}`}
          accessibilityHint={onNext ? "Trykk eller sveip til neste kort. Du kan også bruke knappen under." : undefined}
          style={[styles.card, isRule && styles.ruleCard]}
        >
          <View pointerEvents="none" style={styles.innerBorder} />
          <View style={styles.cardTop}>
            <Text style={[styles.corner, { color: accent }]}>{String(number).padStart(2, "0")}</Text>
            <Text style={[styles.brand, isRule && { color: C.goldLight }]}>BITS · {BITS_CATEGORY_LABELS[card.category].toLocaleUpperCase("nb-NO")}</Text>
            <Text style={[styles.suit, { color: accent }]}>{suit}</Text>
          </View>
          <View style={styles.body}>
            <View style={styles.seal}>
              <MaterialCommunityIcons name={isRule ? "script-text-outline" : card.category === "back-to-back" ? "account-switch-outline" : "lightning-bolt"} size={30} color={isRule ? C.goldLight : C.gold} />
            </View>
            {card.pair && <Text style={[styles.pair, { color: accent }]}>{card.pair.join(" & ")}</Text>}
            <Text style={[styles.title, { color: ink }]}>{card.title}</Text>
            <Text style={[styles.description, { color: ink }]}>{card.body}</Text>
          </View>
          <View style={styles.cardBottom}>
            <Text style={[styles.cardNote, isRule && { color: C.creamDark }]}>
              {isRule ? "GJELDER DE NESTE 5 KORTENE" : card.stage === "question" ? "SVAR MED KNAPPENE UNDER" : "RUNDT BORDET"}
            </Text>
            <Text style={[styles.suit, { color: accent }, styles.flipped]}>{suit}</Text>
          </View>
        </Pressable>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stack: { width: "100%", paddingHorizontal: 7, paddingBottom: 8, marginVertical: 12 },
  backCard: { position: "absolute", top: 8, bottom: 8, left: 12, right: 12, borderRadius: 24, backgroundColor: C.navy, borderWidth: 1.5, borderColor: C.gold },
  backOne: { transform: [{ rotate: "2deg" }] },
  backTwo: { transform: [{ rotate: "-3deg" }], opacity: 0.7 },
  card: { minHeight: 420, borderRadius: 24, borderWidth: 2, borderColor: C.gold, backgroundColor: C.cream, padding: 18, shadowColor: "#051A12", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 7 }, elevation: 8 },
  ruleCard: { backgroundColor: C.navy },
  innerBorder: { position: "absolute", inset: 7, borderRadius: 17, borderWidth: 1, borderColor: "rgba(217,191,106,0.45)" },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  corner: { fontSize: 20, fontWeight: "800" },
  suit: { fontSize: 24, fontWeight: "700" },
  brand: { flex: 1, textAlign: "center", fontSize: 10, letterSpacing: 1.1, fontWeight: "800", color: "#75602C" },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 22, paddingHorizontal: 10, gap: 15 },
  seal: { height: 50, width: 50, borderWidth: 1, borderColor: "rgba(217,191,106,0.5)", borderRadius: 25, alignItems: "center", justifyContent: "center" },
  pair: { fontSize: 14, fontWeight: "800", textAlign: "center" },
  title: { fontSize: 27, lineHeight: 33, fontWeight: "800", textAlign: "center" },
  description: { fontSize: 19, lineHeight: 28, fontWeight: "500", textAlign: "center" },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardNote: { flex: 1, color: "#75602C", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  flipped: { transform: [{ rotate: "180deg" }] },
});
