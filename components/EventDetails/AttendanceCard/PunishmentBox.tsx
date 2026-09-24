import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import type { Punishment } from "../../../types/punishment"
import { usePanelChromeColors } from "../../Panel"

interface Props {
  punishment: Punishment
}

export const PunishmentBox: React.FC<Props> = ({ punishment }) => {
  const chrome = usePanelChromeColors()

  return (
    <View accessibilityRole="alert" style={styles.container}>
      <View style={styles.titleRow}>
        <MaterialCommunityIcons name="alert-circle-outline" size={16} color={chrome.danger} />
        <Text style={[styles.title, { color: chrome.danger }]}>
          {punishment.suspended ? "Du er suspendert" : `${punishment.delay} timer utsatt påmelding`}
        </Text>
      </View>

      {!punishment.suspended && (
        <Text style={[styles.body, { color: chrome.textMuted }]}>
          Du <Text style={[styles.bold, { color: chrome.text }]}>kan fortsatt melde deg på</Text> ved
          påmeldingsstart, men havner på ventelisten til utsettelsen er over.
        </Text>
      )}

      <Text style={[styles.body, { color: chrome.textMuted }]}>Se detaljer på profilen din på online.ntnu.no.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  title: { fontSize: 13, fontWeight: "700" },
  body: { fontSize: 12, lineHeight: 17, marginLeft: 23 },
  bold: { fontWeight: "700" },
})

export default PunishmentBox
