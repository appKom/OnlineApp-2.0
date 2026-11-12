import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeInUp, ReduceMotion, runOnJS } from "react-native-reanimated";
import { BITS_CATEGORY_LABELS, type BitsCard } from "../../utils/bits";
import { CASINO_COLORS as C } from "./SongPlayingCard";

export function BitsPrompt({ task, onNext }: {
  task: BitsCard;
  onNext?: () => void;
}) {
  const pan = Gesture.Pan().enabled(Boolean(onNext))
    .activeOffsetX([-30, 30]).failOffsetY([-20, 20])
    .onEnd(event => {
      if (onNext && (Math.abs(event.translationX) > 65 || Math.abs(event.velocityX) > 800)) runOnJS(onNext)();
    });
  const participants = task.participants;
  const namePrefix = participants.length === 1 ? `${participants[0]}, ` : "";
  const text = namePrefix && task.body.startsWith(namePrefix) ? task.body.slice(namePrefix.length) : task.body;
  const body = text.charAt(0).toLocaleUpperCase("nb-NO") + text.slice(1);

  return (
    <Animated.View entering={FadeInUp.duration(180).reduceMotion(ReduceMotion.System)}>
      <GestureDetector gesture={pan}>
        <View style={styles.prompt} accessibilityLiveRegion="polite">
          <Text style={styles.category}>
            {`${BITS_CATEGORY_LABELS[task.category]} · ${participants.length ? participants.join(" & ") : "Alle"}`.toLocaleUpperCase("nb-NO")}
          </Text>
          <Text style={styles.title} accessibilityRole="header">{task.title}</Text>
          <View style={styles.divider} accessible={false}>
            <View style={styles.dividerLine} /><Text style={styles.diamond}>{"♦\uFE0E"}</Text><View style={styles.dividerLine} />
          </View>
          <Text style={styles.description}>{body}</Text>
          {task.category === "rule" && <Text style={styles.note}>Gjelder de neste 5 oppgavene</Text>}
          {task.stage === "question" && <Text style={styles.note}>Registrer svaret med knappene under</Text>}
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  prompt: { minHeight: 340, alignItems: "center", justifyContent: "center", paddingVertical: 28, paddingHorizontal: 6 },
  category: { color: C.gold, fontSize: 12, lineHeight: 19, letterSpacing: 1.2, fontWeight: "700", textAlign: "center", marginBottom: 14 },
  title: { color: C.cream, fontSize: 34, lineHeight: 42, fontWeight: "800", textAlign: "center" },
  divider: { width: 130, flexDirection: "row", alignItems: "center", gap: 14, marginVertical: 23 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(217,191,106,0.45)" },
  diamond: { color: C.gold, fontSize: 13 },
  description: { color: C.cream, fontSize: 22, lineHeight: 33, fontWeight: "500", textAlign: "center" },
  note: { color: C.goldLight, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 20 },
});
