import React from "react"
import { View, Text, StyleSheet, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import type { Punishment } from "../../../types/punishment"
import { usePanelChromeColors } from "../../Panel"

interface Props {
  punishment: Punishment
  /** Why the user is suspended, when this event is the cause. */
  reason?: string
}

export const PunishmentBox: React.FC<Props> = ({ punishment, reason }) => {
  const chrome = usePanelChromeColors()
  const router = useRouter()

  return (
    <View accessibilityRole="alert" style={styles.container}>
      <View style={styles.titleRow}>
        <MaterialCommunityIcons name="alert-circle-outline" size={16} color={chrome.danger} />
        <Text style={[styles.title, { color: chrome.danger }]}>
          {punishment.suspended ? "Du er suspendert" : `${punishment.delay} timer utsatt påmelding`}
        </Text>
      </View>

      {reason && <Text style={[styles.body, { color: chrome.textMuted }]}>{reason}</Text>}

      {!punishment.suspended && (
        <Text style={[styles.body, { color: chrome.textMuted }]}>
          Du <Text style={[styles.bold, { color: chrome.text }]}>kan fortsatt melde deg på</Text> ved
          påmeldingsstart, men havner på ventelisten til utsettelsen er over.
        </Text>
      )}

      <Pressable
        accessibilityRole="link"
        hitSlop={8}
        onPress={() => router.navigate("/(tabs)/(profile)")}
        style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}
      >
        <Text style={[styles.linkText, { color: chrome.accent }]}>Se prikkene dine på profilen</Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color={chrome.accent} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  title: { fontSize: 13, fontWeight: "700" },
  body: { fontSize: 12, lineHeight: 17, marginLeft: 23 },
  bold: { fontWeight: "700" },
  link: { marginLeft: 23, marginTop: 2, flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 2 },
  linkText: { fontSize: 13, fontWeight: "600" },
})

export default PunishmentBox
