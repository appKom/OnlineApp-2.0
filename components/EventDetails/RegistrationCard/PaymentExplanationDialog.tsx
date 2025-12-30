import React, { useState } from "react"
import { View, Text, TouchableOpacity, ScrollView } from "react-native"
import { Octicons } from "@expo/vector-icons"
import { useTheme } from "../../../utils/theme"
import { AnimatedModal } from "../../AnimatedModal"

export const PaymentExplanationDialog: React.FC = () => {
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)}>
        <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
          <Octicons name="info" size={16} color={theme.onBackground} />
          <Text style={{ fontSize: 14, color: theme.onBackground }}>Hvordan fungerer betaling?</Text>
        </View>
      </TouchableOpacity>

      <AnimatedModal visible={open} onClose={() => setOpen(false)} modalWidth={340} modalMaxWidth={380}>
        {(closeModal) => (
          <View style={{ backgroundColor: theme.primaryContainer, padding: 20, borderRadius: 12 }}>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <Octicons name="info" size={20} color={theme.primary} />
              <Text style={{ fontSize: 18, fontWeight: "700", color: theme.onPrimaryContainer }}>
                Betalingsinformasjon
              </Text>
            </View>

            <ScrollView style={{ maxHeight: 400, marginBottom: 16 }}>
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 14, color: theme.onSurfaceVariant, lineHeight: 20 }}>
                  Når du melder deg på et arrangement med betaling, aktiveres betalingsknappen. Den viser så en nedtelling
                  som indikerer hvor lenge du har på deg til å reservere en betaling.
                </Text>

                <View style={{ borderLeftWidth: 2, borderLeftColor: theme.primary, paddingLeft: 12, gap: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: theme.onSurfaceVariant }}>
                    Reservert betaling:
                  </Text>
                  <Text style={{ fontSize: 14, color: theme.onSurfaceVariant, lineHeight: 20 }}>
                    Beløpet holdes av på kontoen din og trekkes senest på den femte dagen, eller før dersom
                    avmeldingsfristen inntrer tidligere.
                  </Text>
                </View>

                <Text style={{ fontSize: 14, color: theme.onSurfaceVariant, lineHeight: 20 }}>
                  Dersom ingen betaling er reservert innen nedtellingen er ferdig, vil du automatisk bli avmeldt
                  arrangementet.
                </Text>

                <Text style={{ fontSize: 14, color: theme.onSurfaceVariant, lineHeight: 20 }}>
                  Du kan selv melde deg av når som helst før avmeldingsfristen. Da blir betalingsreservasjonen automatisk
                  kansellert i banken din.
                </Text>
              </View>
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
              <Text style={{ color: theme.onPrimary, fontWeight: "600" }}>Jeg forstår</Text>
            </TouchableOpacity>
          </View>
        )}
      </AnimatedModal>
    </>
  )
}

export default PaymentExplanationDialog
