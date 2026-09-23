import React, { useState } from "react"
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native"
import { Octicons } from "@expo/vector-icons"
import { useTheme } from "../../../utils/theme"
import { AnimatedModal } from "../../AnimatedModal"
import { PenaltyRules } from "../../../utils/penalty-rules"
import { EventSurface, useEventChromeColors } from "../EventSurface"

interface EventRulesProps {
  className?: string
}

export const EventRules: React.FC<EventRulesProps> = () => {
  const theme = useTheme()
  const chrome = useEventChromeColors()
  const [open, setOpen] = useState(false)

  return (
    <>
      <TouchableOpacity accessibilityRole="button" onPress={() => setOpen(true)} style={{ minHeight: 32, justifyContent: "center" }}>
        <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
          <Octicons name="book" size={17} color={chrome.icon} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: theme.onSurface }}>Arrangementregler</Text>
        </View>
      </TouchableOpacity>

      <AnimatedModal visible={open} onClose={() => setOpen(false)} modalWidth={340} modalMaxWidth={380}>
        {(closeModal) => (
          <EventSurface style={{ padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: theme.onSurface, marginBottom: 8 }}>
              Arrangementregler
            </Text>
            <Text style={{ fontSize: 14, color: theme.onSurfaceVariant, marginBottom: 16 }}>
              Ved påmelding av dette arrangementet godtar du å følge Onlines arrangementregler beskrevet under.
            </Text>

            <ScrollView style={{ maxHeight: 400, marginBottom: 16 }}>
              <PenaltyRules />
            </ScrollView>

            <TouchableOpacity
              onPress={closeModal}
              style={{
                backgroundColor: theme.primary,
                padding: 12,
                borderRadius: 8,
                alignItems: "center",
                borderWidth: 1,
                borderColor: chrome.edge,
                borderTopColor: chrome.highlight,
              }}
            >
              <Text style={{ color: theme.onPrimary, fontWeight: "600" }}>
                Jeg er inneforstått med reglene
              </Text>
            </TouchableOpacity>
          </EventSurface>
        )}
      </AnimatedModal>
    </>
  )
}

export default EventRules
