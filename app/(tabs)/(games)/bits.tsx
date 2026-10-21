import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, usePreventRemove } from "expo-router/react-navigation";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useReducer, useRef, useState } from "react";
import {
  Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View, type ScrollViewInstance,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BitsPlayingCard } from "../../../components/GamesHub/BitsPlayingCard";
import { CasinoFeltBackground, FELT_BASE_DARK, FELT_BASE_LIGHT } from "../../../components/GamesHub/CasinoFeltBackground";
import { CASINO_COLORS as C } from "../../../components/GamesHub/SongPlayingCard";
import { TabScreenContainer } from "../../../components/TabScreenContainer";
import {
  BITS_ROUND_LENGTHS, bitsReducer, createBitsSession, getBitsActiveRules,
  getBitsScore, validateBitsPlayers, type BitsOutcome, type BitsRoundLength,
} from "../../../utils/bits";
import { useThemeMode } from "../../../utils/theme";

async function haptic() {
  if (Platform.OS === "web") return;
  try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
}

function Action({ label, onPress, secondary = false, disabled = false }: {
  label: string; onPress: () => void; secondary?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.action, secondary && styles.actionSecondary, (pressed || disabled) && styles.dimmed]}>
    <Text style={[styles.actionText, secondary && styles.actionSecondaryText]}>{label}</Text>
  </Pressable>;
}

const ROUND_LABELS: Record<BitsRoundLength, string> = { 20: "En kjapp runde", 35: "Et helt vors", 50: "God tid" };

export default function BitsScreen() {
  const { mode } = useThemeMode();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const [players, setPlayers] = useState([{ id: 0, name: "" }, { id: 1, name: "" }]);
  const nextPlayerId = useRef(2);
  const lastAdvance = useRef(0);
  const scroll = useRef<ScrollViewInstance>(null);
  const [length, setLength] = useState<BitsRoundLength>(35);
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [session, dispatch] = useReducer(bitsReducer, null);
  const finished = session !== null && session.index >= session.deck.length;
  const current = session?.deck[session.index];
  const score = session ? getBitsScore(session) : { pair: 0, audience: 0 };
  const opponent = session?.players.length === 2 ? "Spillet" : "Publikum";
  const displayCard = current?.stage === "result" ? {
    ...current,
    title: score.pair + score.audience === 0 ? "Ingen poeng denne gangen" : score.pair === score.audience ? "Helt likt!" : score.pair > score.audience ? "Paret vinner!" : `${opponent} vinner!`,
    body: score.pair + score.audience === 0 ? "Alle spørsmålene ble hoppet over. Vi fortsetter rundt bordet." : current.body,
  } : current;
  const rules = session && !finished ? getBitsActiveRules(session) : [];
  const backgroundColor = mode === "dark" ? FELT_BASE_DARK : FELT_BASE_LIGHT;

  usePreventRemove(session !== null && !finished, ({ data }) => {
    Alert.alert("Forlate BITS?", "Denne runden blir avsluttet hvis du går tilbake til spillbordet.", [
      { text: "Fortsett å spille", style: "cancel" },
      { text: "Forlat spillet", style: "destructive", onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  const start = () => {
    const names = players.map(player => player.name);
    const validation = validateBitsPlayers(names);
    setError(validation);
    if (validation) return;
    Keyboard.dismiss();
    lastAdvance.current = Date.now();
    dispatch({ type: "start", session: createBitsSession(names, length) });
    scroll.current?.scrollTo({ y: 0, animated: false });
    void haptic();
  };
  const advance = (outcome: BitsOutcome = "done") => {
    if (!current || Date.now() - lastAdvance.current < 300) return;
    lastAdvance.current = Date.now();
    dispatch({ type: "advance", cardId: current.id, outcome });
    scroll.current?.scrollTo({ y: 0, animated: true });
    void haptic();
  };
  const reset = () => {
    dispatch({ type: "setup" });
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const completed = session ? Object.values(session.outcomes).filter(outcome => outcome !== "skipped").length : 0;
  const skipped = session ? Object.values(session.outcomes).filter(outcome => outcome === "skipped").length : 0;
  const miniPlayed = session?.deck.some(card => card.stage === "question" && ["pair", "audience"].includes(session.outcomes[card.id]));

  return (
    <TabScreenContainer backgroundColor={backgroundColor}>
      <StatusBar style="light" />
      <CasinoFeltBackground darkMode={mode === "dark"} />
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Tilbake til spillbordet" hitSlop={4} onPress={() => router.back()} style={styles.iconButton}>
            <MaterialCommunityIcons name="chevron-left" size={30} color={C.goldLight} />
          </Pressable>
          <View style={styles.headerTitle}>
            <Text style={styles.brand}>BITS</Text>
            <Text style={styles.headerSubtitle}>ET HELT VORS I ÉN BUNKE</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Slik spiller dere BITS" onPress={() => setHelpOpen(true)} style={styles.iconButton}>
            <MaterialCommunityIcons name="help-circle-outline" size={25} color={C.goldLight} />
          </Pressable>
        </View>
        <ScrollView ref={scroll} style={styles.screen} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
          contentInsetAdjustmentBehavior="never" showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 110 }]}>
          <View style={styles.content}>
            {!session ? (
              <>
                <View style={styles.intro}>
                  <View style={styles.chip}><MaterialCommunityIcons name="cards-playing-outline" size={34} color={C.goldLight} /></View>
                  <Text style={styles.heading}>Samle gjengen.</Text>
                  <Text style={styles.subtitle}>Pekelek, dilemmaer og utfordringer med en dose Online. Én mobil, hele bordet.</Text>
                </View>
                <View style={styles.panel}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.eyebrow}>RUNDT BORDET</Text>
                    <Text style={styles.muted}>{players.length} / 11 spillere</Text>
                  </View>
                  {players.map((player, index) => (
                    <View style={styles.playerRow} key={player.id}>
                      <Text style={styles.playerNumber}>{String(index + 1).padStart(2, "0")}</Text>
                      <TextInput value={player.name} placeholder={`Spiller ${index + 1}`} placeholderTextColor="#B9B7A5"
                        accessibilityLabel={`Navn på spiller ${index + 1}`} maxLength={24} autoCorrect={false} autoCapitalize="words"
                        returnKeyType="done" onSubmitEditing={Keyboard.dismiss} style={styles.playerInput}
                        onChangeText={name => {setPlayers(previous => previous.map(p => p.id === player.id ? { ...p, name } : p)); setError(null);}} />
                      {players.length > 2 && <Pressable accessibilityRole="button" accessibilityLabel={`Fjern ${player.name || `spiller ${index + 1}`}`}
                        style={styles.iconButton} onPress={() => {setPlayers(previous => previous.filter(p => p.id !== player.id)); setError(null);}}>
                        <MaterialCommunityIcons name="close" color={C.creamDark} size={20} />
                      </Pressable>}
                    </View>
                  ))}
                  {players.length < 11 && <Pressable accessibilityRole="button" onPress={() => {
                    const id = nextPlayerId.current++;
                    setPlayers(previous => previous.length < 11 ? [...previous, { id, name: "" }] : previous);
                    setError(null);
                  }} style={styles.addPlayer}>
                    <MaterialCommunityIcons name="plus-circle-outline" size={20} color={C.goldLight} />
                    <Text style={styles.link}>Legg til spiller</Text>
                  </Pressable>}
                </View>
                <Text style={[styles.eyebrow, styles.sectionLabel]}>HVOR LANG ER KVELDEN?</Text>
                <View style={styles.lengthOptions}>
                  {BITS_ROUND_LENGTHS.map(option => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: option === length }}
                    accessibilityLabel={`${option} kort. ${ROUND_LABELS[option]}`} onPress={() => setLength(option)}
                    style={[styles.lengthOption, option === length && styles.lengthSelected]}>
                    <Text style={[styles.lengthNumber, option === length && styles.selectedText]}>{option}</Text>
                    <Text style={[styles.lengthLabel, option === length && styles.selectedText]}>{ROUND_LABELS[option]}</Text>
                  </Pressable>)}
                </View>
                {error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
                <Action label="Del ut kortene" onPress={start} />
                <Text style={styles.footnote}>2–11 spillere · Spill uten nett · Hopp over når dere vil</Text>
              </>
            ) : finished ? (
              <View style={styles.finish}>
                <View style={styles.chip}><MaterialCommunityIcons name="cards-playing-outline" size={34} color={C.goldLight} /></View>
                <Text style={styles.eyebrow}>SISTE KORT ER SPILT</Text>
                <Text style={styles.heading}>Takk for runden!</Text>
                <Text style={styles.subtitle}>{session.players.length} rundt bordet. {completed} kort spilt, {skipped} hoppet over.</Text>
                {miniPlayed && <View style={[styles.panel, styles.summary]}>
                  <Text style={styles.eyebrow}>RYGG TIL RYGG</Text>
                  <Text style={styles.summaryScore}>{score.pair} – {score.audience}</Text>
                  <Text style={styles.subtitle}>Paret mot {opponent.toLocaleLowerCase("nb-NO")}</Text>
                </View>}
                <Action label="En runde til med samme gjeng" onPress={start} />
                <Action label="Endre spillere og rundelengde" onPress={reset} secondary />
                <Action label="Til spillbordet" onPress={() => router.back()} secondary />
              </View>
            ) : current ? (
              <>
                <View style={[styles.rowBetween, styles.progressHeader]} accessibilityLiveRegion="polite">
                  <Text style={styles.eyebrow}>{current.category === "back-to-back" ? "MINIRUNDE" : "NESTE TREKK"}</Text>
                  <Text style={styles.progressText}>{session.index + 1} / {session.deck.length}</Text>
                </View>
                <View accessibilityRole="progressbar" accessibilityLabel="Fremdrift i runden"
                  accessibilityValue={{ min: 0, max: session.deck.length, now: session.index }} style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${session.index / session.deck.length * 100}%` }]} />
                </View>
                <BitsPlayingCard key={current.id} card={displayCard ?? current} number={session.index + 1}
                  onNext={current.stage === "question" ? undefined : () => advance()} />
                {current.category === "back-to-back" && current.stage !== "intro" && (
                  <View style={styles.scoreboard} accessibilityLiveRegion="polite">
                    <Text style={styles.muted}>Paret <Text style={styles.scoreValue}>{score.pair}</Text></Text>
                    <Text style={styles.scoreSeparator}>♦</Text>
                    <Text style={styles.muted}>{opponent} <Text style={styles.scoreValue}>{score.audience}</Text></Text>
                  </View>
                )}
                {current.stage === "question" ? (
                  <View style={styles.answerButtons}>
                    <Action label="Kun én hånd oppe" onPress={() => advance("pair")} />
                    <Action label="Begge eller ingen" onPress={() => advance("audience")} secondary />
                  </View>
                ) : (
                  <Action label={current.stage === "intro" ? "Vi er klare!" : current.stage === "result" ? "Fortsett rundt bordet" : session.index === session.deck.length - 1 ? "Avslutt runden" : current.category === "rule" ? "Regelen gjelder!" : "Neste kort"} onPress={() => advance()} />
                )}
                <View style={styles.navigationRow}>
                  <Pressable accessibilityRole="button" accessibilityState={{ disabled: session.index === 0 }} disabled={session.index === 0}
                    onPress={() => {dispatch({ type: "previous" }); scroll.current?.scrollTo({ y: 0, animated: true });}}
                    style={[styles.textButton, session.index === 0 && styles.dimmed]}>
                    <MaterialCommunityIcons name="arrow-left" size={17} color={C.creamDark} /><Text style={styles.textButtonLabel}>Forrige</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => advance("skipped")} style={styles.textButton}>
                    <Text style={styles.textButtonLabel}>{current.stage === "intro" ? "Hopp over minirunden" : "Hopp over"}</Text>
                    <MaterialCommunityIcons name="skip-next-outline" size={20} color={C.creamDark} />
                  </Pressable>
                </View>
                {rules.length > 0 && <View style={styles.panel} accessibilityLiveRegion="polite">
                  <Text style={styles.eyebrow}>REGLER SOM GJELDER NÅ</Text>
                  {rules.map(rule => <View key={rule.id} style={styles.rule}>
                    <View style={styles.rowBetween}><Text style={styles.ruleTitle}>{rule.title}</Text><Text style={styles.muted}>{rule.remaining} kort igjen</Text></View>
                    <Text style={styles.ruleBody}>{rule.body}</Text>
                  </View>)}
                </View>}
              </>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal visible={helpOpen} transparent animationType="fade" onRequestClose={() => setHelpOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.helpSheet, { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 24) }]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Lukk spillereglene" style={[styles.iconButton, { alignSelf: "flex-end", marginRight: 16 }]} onPress={() => setHelpOpen(false)}>
              <MaterialCommunityIcons name="close" color={C.goldLight} size={24} />
            </Pressable>
            <ScrollView contentContainerStyle={styles.helpContent}>
              <Text style={styles.eyebrow}>BITS · SPILLEREGLER</Text>
              <Text style={styles.heading}>Slik spiller dere</Text>
              <Text style={styles.helpText}>Legg inn navn, velg antall kort og samle dere rundt én mobil. Les kortet høyt, gjør oppgaven og trykk eller sveip videre.</Text>
              <Text style={styles.ruleTitle}>Litt av alt</Text>
              <Text style={styles.helpText}>Dere møter Online-oppgaver, pekelek, «jeg har aldri», dilemmaer, kategorier og utfordringer. Instruksjonene står på hvert kort.</Text>
              <Text style={styles.ruleTitle}>Regler som varer litt</Text>
              <Text style={styles.helpText}>Nye regler gjelder i de neste fem kortene. Dere ser regelen og hvor lenge den varer under kortet. Hoppede kort teller også ned.</Text>
              <Text style={styles.ruleTitle}>Rygg til rygg</Text>
              <Text style={styles.helpText}>Samme par spiller fire spørsmål mot publikum. Paret står rygg mot rygg og rekker opp hånda når en påstand passer best på dem selv. Kun én hånd gir paret poeng; begge eller ingen gir publikum poeng. Er dere bare to, spiller dere mot spillet. Registrer svaret med knappene.</Text>
              <Text style={styles.ruleTitle}>Dere bestemmer</Text>
              <Text style={styles.helpText}>Hopp over et kort uten straff. Slurker kan være med valgfri drikke. «Forrige» lar dere lese et kort igjen eller endre et svar. Det gir aldri doble poeng.</Text>
              <Action label="Skjønner, vi er klare" onPress={() => setHelpOpen(false)} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </TabScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 14, gap: 8 },
  headerTitle: { flex: 1, alignItems: "center" },
  brand: { color: C.goldLight, fontSize: 26, fontWeight: "900", letterSpacing: 4 },
  headerSubtitle: { color: C.creamDark, fontSize: 9, fontWeight: "700", letterSpacing: 1.6, marginTop: 2 },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  content: { width: "100%", maxWidth: 460, alignSelf: "center" },
  intro: { alignItems: "center", paddingTop: 12, paddingBottom: 24, gap: 10 },
  chip: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderStyle: "dashed", borderColor: C.gold, backgroundColor: C.navy, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 10 },
  heading: { color: C.goldLight, fontSize: 30, lineHeight: 37, fontWeight: "800", textAlign: "center" },
  subtitle: { color: C.creamDark, fontSize: 15, lineHeight: 23, textAlign: "center" },
  panel: { borderWidth: 1, borderColor: "rgba(217,191,106,0.4)", backgroundColor: "rgba(1,24,18,0.45)", padding: 16, borderRadius: 20 },
  rowBetween: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 },
  eyebrow: { color: C.gold, fontSize: 10, lineHeight: 16, fontWeight: "800", letterSpacing: 1.6 },
  muted: { color: C.creamDark, fontSize: 13, lineHeight: 20 },
  playerRow: { flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(243,222,155,0.3)", marginTop: 9 },
  playerNumber: { color: C.gold, fontSize: 13, fontWeight: "700" },
  playerInput: { flex: 1, minHeight: 50, color: C.cream, fontSize: 17, paddingVertical: 10 },
  addPlayer: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", minHeight: 48, marginTop: 10 },
  link: { color: C.goldLight, fontSize: 14, fontWeight: "700" },
  sectionLabel: { marginTop: 24, marginBottom: 10 },
  lengthOptions: { flexDirection: "row", gap: 8, marginBottom: 18 },
  lengthOption: { flex: 1, minHeight: 85, justifyContent: "center", alignItems: "center", gap: 3, borderRadius: 14, borderWidth: 1, borderColor: "rgba(217,191,106,0.45)", backgroundColor: "rgba(1,24,18,0.4)", padding: 8 },
  lengthSelected: { backgroundColor: C.goldLight, borderColor: C.goldLight },
  lengthNumber: { color: C.goldLight, fontSize: 25, fontWeight: "800" },
  lengthLabel: { color: C.creamDark, fontSize: 11, textAlign: "center" },
  selectedText: { color: C.navyDeep },
  action: { backgroundColor: C.goldLight, borderWidth: 1, borderColor: C.goldLight, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15, minHeight: 52, justifyContent: "center", alignItems: "center", marginTop: 8 },
  actionSecondary: { backgroundColor: "rgba(1,24,18,0.4)", borderColor: "rgba(217,191,106,0.6)" },
  actionText: { color: C.navyDeep, fontSize: 16, lineHeight: 22, fontWeight: "800", textAlign: "center" },
  actionSecondaryText: { color: C.goldLight },
  dimmed: { opacity: 0.4 },
  footnote: { color: C.creamDark, textAlign: "center", fontSize: 11, lineHeight: 18, marginTop: 15 },
  error: { color: "#FFE3CB", backgroundColor: "#782B21", padding: 12, borderRadius: 10, marginBottom: 10, fontSize: 14 },
  progressHeader: { marginBottom: 9, paddingHorizontal: 4 },
  progressText: { color: C.goldLight, fontSize: 14, fontWeight: "800" },
  progressTrack: { height: 3, backgroundColor: "rgba(243,222,155,0.16)", borderRadius: 2, marginHorizontal: 5, marginBottom: 8 },
  progressFill: { height: "100%", backgroundColor: C.goldLight, borderRadius: 2 },
  navigationRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8, marginVertical: 10 },
  textButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 5 },
  textButtonLabel: { color: C.creamDark, fontSize: 13 },
  rule: { marginTop: 10, gap: 5 },
  ruleTitle: { color: C.goldLight, fontSize: 16, fontWeight: "800", flexShrink: 1 },
  ruleBody: { color: C.creamDark, fontSize: 14, lineHeight: 21 },
  scoreboard: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 18, paddingVertical: 7 },
  scoreValue: { color: C.goldLight, fontSize: 21, fontWeight: "800" },
  scoreSeparator: { color: C.gold, fontSize: 15 },
  answerButtons: { gap: 2 },
  finish: { paddingTop: 36, gap: 15, alignItems: "stretch" },
  summary: { alignItems: "center", gap: 8, marginVertical: 8 },
  summaryScore: { color: C.goldLight, fontSize: 40, fontWeight: "800" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center" },
  helpSheet: { backgroundColor: C.navyDeep, width: "100%", maxWidth: 520, maxHeight: "100%" },
  helpContent: { paddingHorizontal: 26, gap: 18 },
  helpText: { color: C.creamDark, fontSize: 16, lineHeight: 25 },
});

export { DetailErrorBoundary as ErrorBoundary } from "../../../components/ScreenErrorBoundary";
