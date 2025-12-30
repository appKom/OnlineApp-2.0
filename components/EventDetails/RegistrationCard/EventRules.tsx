import React, { useState } from "react"
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native"
import { Octicons } from "@expo/vector-icons"
import { useTheme } from "../../../utils/theme"
import { AnimatedModal } from "../../AnimatedModal"
import { PenaltyRules } from "../../../utils/penalty-rules"

interface EventRulesProps {
  className?: string
}

export const EventRules: React.FC<EventRulesProps> = () => {
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)}>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Octicons name="book" size={16} color={theme.onBackground} />
          <Text style={{ fontSize: 14, color: theme.onBackground }}>Arrangementregler</Text>
        </View>
      </TouchableOpacity>

      <AnimatedModal visible={open} onClose={() => setOpen(false)} modalWidth={340} modalMaxWidth={380}>
        {(closeModal) => (
          <View style={{ backgroundColor: theme.primaryContainer, padding: 20, borderRadius: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: theme.onPrimaryContainer, marginBottom: 8 }}>
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
              }}
            >
              <Text style={{ color: theme.onPrimary, fontWeight: "600" }}>
                Jeg er inneforstått med reglene
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </AnimatedModal>
    </>
  )
}

export default EventRules
