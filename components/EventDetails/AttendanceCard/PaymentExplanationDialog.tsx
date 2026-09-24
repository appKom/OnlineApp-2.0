import React, { useState } from "react"
import { View, Text, ScrollView, StyleSheet } from "react-native"
import { AnimatedModal } from "../../AnimatedModal"
import { Panel, PanelHeader, RaisedButton, usePanelChromeColors } from "../../Panel"

export const PaymentExplanationDialog: React.FC = () => {
  const chrome = usePanelChromeColors()
  const [open, setOpen] = useState(false)

  return (
    <>
      <RaisedButton
        flex
        icon="credit-card-outline"
        label="Betaling"
        accessibilityLabel="Hvordan fungerer betaling?"
        onPress={() => setOpen(true)}
      />

      <AnimatedModal visible={open} onClose={() => setOpen(false)} modalWidth="92%" modalMaxWidth={400}>
        {(closeModal) => (
          <Panel style={styles.modal}>
            <PanelHeader title="Betaling" />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              <Text style={[styles.text, { color: chrome.text }]}>
                Når du melder deg på et arrangement med betaling, aktiveres betalingsknappen. Den viser en nedtelling
                for hvor lenge du har på deg til å reservere betalingen.
              </Text>

              <View
                style={[
                  styles.callout,
                  { backgroundColor: chrome.recessed, borderColor: chrome.edge, borderBottomColor: chrome.highlight },
                ]}
              >
                <Text style={[styles.calloutTitle, { color: chrome.accent }]}>Reservert betaling</Text>
                <Text style={[styles.text, { color: chrome.text }]}>
                  Beløpet holdes av på kontoen din og trekkes senest på den femte dagen, eller tidligere dersom
                  avmeldingsfristen inntreffer før.
                </Text>
              </View>

              <Text style={[styles.text, { color: chrome.textMuted }]}>
                Reserverer du ikke betalingen før nedtellingen er ferdig, blir du automatisk meldt av.
              </Text>
              <Text style={[styles.text, { color: chrome.textMuted }]}>
                Du kan melde deg av når som helst før avmeldingsfristen. Da kanselleres reservasjonen automatisk i
                banken din.
              </Text>
            </ScrollView>

            <RaisedButton icon="check" label="Jeg forstår" tone="accent" onPress={closeModal} />
          </Panel>
        )}
      </AnimatedModal>
    </>
  )
}

const styles = StyleSheet.create({
  modal: { padding: 14, gap: 12 },
  scroll: { maxHeight: 420 },
  scrollContent: { gap: 12 },
  text: { fontSize: 14, lineHeight: 20 },
  callout: { padding: 12, borderWidth: 1, borderRadius: 10, gap: 4 },
  calloutTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
})

export default PaymentExplanationDialog
