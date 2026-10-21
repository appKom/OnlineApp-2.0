import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LiveBannerControls } from "../components/LiveBannerControls";
import { RaisedButton, usePanelChromeColors } from "../components/Panel";
import { useTheme } from "../utils/theme";

export default function LiveBannerTest() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const chrome = usePanelChromeColors();
  const { showTicket } = useLocalSearchParams<{ showTicket?: string }>();
  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, gap: 16 }}>
      <RaisedButton icon="arrow-left" label="Tilbake" onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/(profile)")} />
      <Text style={{ color: chrome.text, fontSize: 24, fontWeight: "700" }}>{showTicket === "1" ? "Testbillett" : "Live-banner"}</Text>
      <LiveBannerControls />
    </ScrollView>
  );
}
