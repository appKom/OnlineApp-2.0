import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTheme, elevate } from "../../utils/theme"
import { AnimatedModal } from "../AnimatedModal"
import type { Attendee, Event } from "../../types/event"

export const DeregisterReasonTypes = {
  SCHOOL: "SCHOOL",
  WORK: "WORK",
  ECONOMY: "ECONOMY",
  TIME: "TIME",
  SICK: "SICK",
  NO_FAMILIAR_FACES: "NO_FAMILIAR_FACES",
  OTHER: "OTHER",
} as const

export type DeregisterReasonType = (typeof DeregisterReasonTypes)[keyof typeof DeregisterReasonTypes]

const mapDeregisterReasonTypeToLabel = (type: DeregisterReasonType): string => {
  const labels: Record<DeregisterReasonType, string> = {
    SCHOOL: "Skole",
    WORK: "Jobb",
    ECONOMY: "Økonomi",
    TIME: "Tidsklemma",
    SICK: "Sykdom",
    NO_FAMILIAR_FACES: "Ingen bekjentskap",
    OTHER: "Annet",
  }
  return labels[type] || "Velg grunn"
}

const DEREGISTER_REASON_TYPE_OPTIONS = Object.entries(DeregisterReasonTypes).map(([_, value]) => ({
  value: value as DeregisterReasonType,
  label: mapDeregisterReasonTypeToLabel(value as DeregisterReasonType),
}))

export interface DeregisterReasonFormResult {
  type: DeregisterReasonType
  details: string | null
}

interface DeregisterModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  event: Event
  attendee: Attendee
  unregisterForAttendance: (deregisterReason: DeregisterReasonFormResult) => void
}

export const DeregisterModal: React.FC<DeregisterModalProps> = ({
  open,
  setOpen,
  event,
  attendee,
  unregisterForAttendance,
}) => {
  const theme = useTheme()
  const [selectedReason, setSelectedReason] = useState<DeregisterReasonType | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [begrunnelse, setBegrunnelse] = useState("")

  useEffect(() => {
    if (!open) {
      setSelectedReason(null)
      setShowDropdown(false)
    }
  }, [open])

  const handleSelectReason = (reason: DeregisterReasonType) => {
    setSelectedReason(reason)
    setShowDropdown(false)
  }

  return (
    <AnimatedModal visible={open} onClose={() => setOpen(false)} modalWidth={300} modalMaxWidth={350}>
      {() => (
        <View style={{ backgroundColor: theme.primaryContainer, padding: 15, borderRadius: 12, gap: 5 }}>
          <Text style={{ color: theme.onPrimaryContainer, fontSize: 17 }}>Er du sikker?</Text>

          <TouchableOpacity
            style={ { backgroundColor: theme.tertiaryContainer, padding: 7, borderRadius: 15 }}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <View style={{ backgroundColor: selectedReason ? elevate(theme.tertiaryContainer, 25) : elevate(theme.tertiaryContainer, 10), flexDirection: "row", alignItems: "center", padding: 5, paddingHorizontal: 10, borderRadius: 8 }}>
              <Text style={{ color: selectedReason ? elevate(theme.onTertiaryContainer, 25) : elevate(theme.onTertiaryContainer, 10) }} >
                {selectedReason ? mapDeregisterReasonTypeToLabel(selectedReason) : "Velg avmeldingsgrunn"}
              </Text>
              <MaterialCommunityIcons
                name={showDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color={selectedReason ? elevate(theme.onTertiaryContainer, 25) : elevate(theme.onTertiaryContainer, 10)}
              />
            </View>
          </TouchableOpacity>

          {showDropdown && (
            <View style={{ position: "absolute", top: 90, left: 15, right: 15, backgroundColor: theme.tertiaryContainer, padding: 7, borderRadius: 15, zIndex: 1000 }} >
              <FlatList
                data={DEREGISTER_REASON_TYPE_OPTIONS}
                scrollEnabled={false}
                nestedScrollEnabled={false}
                contentContainerStyle={{ gap: 4 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{ backgroundColor: selectedReason === item.value ? elevate(theme.tertiaryContainer, 25) : elevate(theme.tertiaryContainer, 10), flexDirection: "row", alignItems: "center", padding: 5, paddingHorizontal: 10, borderRadius: 8 }}
                    onPress={() => handleSelectReason(item.value)}
                  >
                    <Text
                      style={{ color: selectedReason === item.value ? elevate(theme.onTertiaryContainer, 25) : elevate(theme.onTertiaryContainer, 10),  height: 20, }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.value}
              />
            </View>
          )}

          <View style={{ marginTop: 10 }}>
            <Text style={{ color: theme.onPrimaryContainer, fontSize: 14, marginBottom: 8 }}>Begrunnelse</Text>
            <TextInput
              placeholder="Skriv inn begrunnelse..."
              placeholderTextColor={elevate(theme.onPrimaryContainer, 30)}
              multiline
              numberOfLines={4}
              value={begrunnelse}
              onChangeText={setBegrunnelse}
              style={{
                backgroundColor: elevate(theme.primaryContainer, 10),
                color: theme.onPrimaryContainer,
                padding: 10,
                borderRadius: 8,
                fontFamily: 'System',
                fontSize: 14,
              }}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 5 }}>
            <TouchableOpacity
              style={{ backgroundColor: theme.tertiaryContainer, flex: 1, borderRadius: 5, padding: 5, alignItems: "center" }}
              onPress={() => setOpen(false)}
            >
              <Text style={[styles.buttonText, { color: theme.onTertiaryContainer }]}>Avbryt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ backgroundColor: selectedReason ? theme.deregisterButton : theme.surfaceVariant, flex: 1, borderRadius: 5, padding: 5, alignItems: "center" }}
              disabled={!selectedReason}
              onPress={() => {
                if (selectedReason) {
                  unregisterForAttendance({
                    type: selectedReason,
                    details: begrunnelse || null,
                  })
                  setOpen(false)
                }
              }}
            >
              <Text style={[styles.buttonText, { color: selectedReason ? theme.onDeregisterButton : theme.onSurfaceVariant }]}>Meld meg av</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </AnimatedModal>
  )
}

export default DeregisterModal

const styles = StyleSheet.create({
  modalContent: {},
  title: {},
  selectTrigger: {},
  selectValue: {},
  dropdown: {},
  dropdownItem: {},
  dropdownItemText: {},
  buttonContainer: {},
  button: {},
  buttonText: {},
})
