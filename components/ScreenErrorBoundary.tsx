import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, type ErrorBoundaryProps } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../utils/theme";
import { RaisedButton, usePanelChromeColors } from "./Panel";

// Shown in place of a route that threw while rendering, so one broken screen doesn't take down the app.
// The tab bar stays usable because each tab's routes have their own boundary.
// Route files re-export one of these as `ErrorBoundary`; expo-router wraps the route with it.

type Variant = {
  /** The route sits under the tab's big title header, which already handles the top inset. */
  belowHeader?: boolean;
  /** Show a back button, for screens pushed onto a stack. */
  back?: boolean;
};

/** Field-access errors on API data almost always mean the server's response changed shape. */
const looksLikeApiMismatch = (error: Error) => error instanceof TypeError;

function ScreenError({ error, retry, belowHeader = false, back = false }: ErrorBoundaryProps & Variant) {
  const theme = useTheme();
  const chrome = usePanelChromeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    console.error("Screen crashed while rendering:", error);
  }, [error]);

  const mismatch = looksLikeApiMismatch(error);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {back && (
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tilbake"
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            style={[
              styles.backButton,
              { backgroundColor: chrome.raised, borderColor: chrome.edge, borderTopColor: chrome.highlight },
            ]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={chrome.icon} />
          </Pressable>
        </View>
      )}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: back || belowHeader ? 0 : insets.top, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <MaterialCommunityIcons name="alert-circle-outline" size={36} color={chrome.textMuted} />
        <Text style={[styles.title, { color: chrome.text }]}>Siden kunne ikke vises</Text>
        <Text style={[styles.text, { color: chrome.textMuted }]}>
          {mismatch
            ? "Appen fikk data fra Online som den ikke forstår. Det skjer gjerne når Online har endret noe og appen ikke er oppdatert ennå."
            : "Noe gikk galt da denne siden skulle vises."}{" "}
          Resten av appen fungerer som vanlig.
        </Text>
        <Text selectable numberOfLines={4} style={[styles.details, { color: chrome.textMuted }]}>
          {error.message || String(error)}
        </Text>
        <RaisedButton
          icon="refresh"
          label={retrying ? "Laster…" : "Prøv igjen"}
          disabled={retrying}
          onPress={() => {
            setRetrying(true);
            void retry().finally(() => setRetrying(false));
          }}
        />
      </ScrollView>
    </View>
  );
}

/** For a tab's root screen, below its title header. */
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ScreenError {...props} belowHeader />;
}

/** For screens pushed onto a stack, which draw their own back button. */
export function DetailErrorBoundary(props: ErrorBoundaryProps) {
  return <ScreenError {...props} back />;
}

/** For layouts and screens without a header above them. */
export function FullScreenErrorBoundary(props: ErrorBoundaryProps) {
  return <ScreenError {...props} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingBottom: 8 },
  backButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flexGrow: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 32 },
  title: { marginTop: 4, fontSize: 17, fontWeight: "700", textAlign: "center" },
  text: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  details: {
    marginBottom: 8,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});
