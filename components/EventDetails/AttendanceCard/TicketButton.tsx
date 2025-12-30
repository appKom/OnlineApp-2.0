import React, { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import QRCode from "react-native-qrcode-svg"
import type { Attendee } from "../../../types/event"
import { useTheme } from "../../../utils/theme"
import { AnimatedModal } from "../../AnimatedModal"

interface TicketButtonProps {
  attendee: Attendee,
}

export const TicketButton: React.FC<TicketButtonProps> = ({ attendee }) => {
  const theme = useTheme()
  const [modalVisible, setModalVisible] = useState(false)

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
        style={[
          styles.button,
          { backgroundColor: theme.tertiaryContainer }
        ]}
      >
        <MaterialCommunityIcons name="qrcode" size={20} color={theme.onTertiaryContainer} />
        <Text style={[styles.buttonText, { color: theme.onTertiaryContainer }]}>Vis billett</Text>
      </TouchableOpacity>

      <AnimatedModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        modalWidth={340}
        modalMaxWidth={380}
      >
        {() => (
          <View
            style={{
              backgroundColor: theme.primaryContainer,
              padding: 20,
              borderRadius: 32,
              alignItems: "center"
            }}
          >
            <View style={{ width: 300, height: 300, backgroundColor: "white", borderRadius: 12, justifyContent: "center", alignItems: "center" }}>
              <QRCode value={attendee.id} size={250} />
            </View>
          </View>
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
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
})

export default TicketButton
