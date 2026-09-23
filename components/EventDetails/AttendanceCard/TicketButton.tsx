import React, { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import QRCode from "react-native-qrcode-svg"
import type { Attendee } from "../../../types/event"
import { useTheme } from "../../../utils/theme"
import { AnimatedModal } from "../../AnimatedModal"
import { useEventChromeColors } from "../EventSurface"
import { EventSurface } from "../EventSurface"

interface TicketButtonProps {
  attendee: Attendee,
}

export const TicketButton: React.FC<TicketButtonProps> = ({ attendee }) => {
  const theme = useTheme()
  const chrome = useEventChromeColors()
  const { width } = useWindowDimensions()
  const qrSize = Math.min(250, width * 0.9 - 72)
  const [modalVisible, setModalVisible] = useState(false)

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
        style={[
          styles.button,
          {
            backgroundColor: chrome.raised,
            borderColor: chrome.edge,
            borderTopColor: chrome.highlight,
            shadowColor: theme.shadow,
            shadowOpacity: chrome.shadowOpacity * 0.65,
          }
        ]}
      >
        <MaterialCommunityIcons name="qrcode" size={20} color={chrome.icon} />
        <Text style={[styles.buttonText, { color: theme.onSurface }]}>Vis billett</Text>
      </TouchableOpacity>

      <AnimatedModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        modalWidth="90%"
        modalMaxWidth={380}
      >
        {() => (
          <EventSurface style={{ padding: 20, alignItems: "center" }}>
            <View style={{ width: qrSize + 32, height: qrSize + 32, backgroundColor: "white", borderRadius: 12, justifyContent: "center", alignItems: "center" }}>
              <QRCode value={attendee.id} size={qrSize} />
            </View>
          </EventSurface>
        )}
      </AnimatedModal>
    </>
  )
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
})

export default TicketButton
