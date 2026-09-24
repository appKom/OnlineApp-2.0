import React, { useState } from "react"
import { View, Text, StyleSheet, useWindowDimensions } from "react-native"
import QRCode from "react-native-qrcode-svg"
import type { Attendee } from "../../../types/event"
import { AnimatedModal } from "../../AnimatedModal"
import { Panel, PanelHeader, RaisedButton, usePanelChromeColors } from "../../Panel"

interface TicketButtonProps {
  attendee: Attendee,
}

export const TicketButton: React.FC<TicketButtonProps> = ({ attendee }) => {
  const chrome = usePanelChromeColors()
  const { width } = useWindowDimensions()
  const qrSize = Math.min(240, width * 0.9 - 80)
  const [modalVisible, setModalVisible] = useState(false)

  return (
    <>
      <RaisedButton flex icon="qrcode" label="Billett" onPress={() => setModalVisible(true)} />

      <AnimatedModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        modalWidth="90%"
        modalMaxWidth={360}
      >
        {() => (
          <Panel style={styles.modal}>
            <PanelHeader title="Billett" />
            <View style={[styles.qr, { width: qrSize + 32, height: qrSize + 32, borderColor: chrome.edge }]}>
              <QRCode value={attendee.id} size={qrSize} />
            </View>
            <Text style={[styles.hint, { color: chrome.textMuted }]}>Vis koden ved innslipp</Text>
          </Panel>
        )}
      </AnimatedModal>
    </>
  )
}

const styles = StyleSheet.create({
  modal: { padding: 14, gap: 14, alignItems: "stretch" },
  qr: {
    alignSelf: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  hint: { fontSize: 13, textAlign: "center" },
})

export default TicketButton
