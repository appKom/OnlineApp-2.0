import React, { useState } from "react"
import { Text, ScrollView, StyleSheet } from "react-native"
import { AnimatedModal } from "../../AnimatedModal"
import { PenaltyRules } from "../../../utils/penalty-rules"
import { Panel, PanelHeader, RaisedButton, usePanelChromeColors } from "../../Panel"

export const EventRules: React.FC = () => {
  const chrome = usePanelChromeColors()
  const [open, setOpen] = useState(false)

  return (
    <>
      <RaisedButton
        flex
        icon="book-open-outline"
        label="Regler"
        accessibilityLabel="Arrangementregler"
        onPress={() => setOpen(true)}
      />

      <AnimatedModal visible={open} onClose={() => setOpen(false)} modalWidth="92%" modalMaxWidth={400}>
        {(closeModal) => (
          <Panel style={styles.modal}>
            <PanelHeader title="Arrangementregler" />
            <Text style={[styles.intro, { color: chrome.textMuted }]}>
              Ved påmelding godtar du å følge Onlines arrangementregler.
            </Text>

            <ScrollView
              style={[
                styles.scroll,
                { backgroundColor: chrome.recessed, borderColor: chrome.edge, borderBottomColor: chrome.highlight },
              ]}
              contentContainerStyle={styles.scrollContent}
            >
              <PenaltyRules />
            </ScrollView>

            <RaisedButton icon="check" label="Jeg har forstått reglene" tone="accent" onPress={closeModal} />
          </Panel>
        )}
      </AnimatedModal>
    </>
  )
}

const styles = StyleSheet.create({
  modal: { padding: 14, gap: 12 },
  intro: { fontSize: 13, lineHeight: 18 },
  scroll: { maxHeight: 420, borderWidth: 1, borderRadius: 10 },
  scrollContent: { padding: 12 },
})

export default EventRules
