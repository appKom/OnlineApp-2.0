import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTheme } from "../../utils/theme"
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
    WORK: "Arbeid",
    ECONOMY: "Økonomi",
    TIME: "Tid",
    SICK: "Sykdom",
    NO_FAMILIAR_FACES: "Kjenner ingen",
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

  useEffect(() => {
    if (!open) {
      setSelectedReason(null)
      setShowDropdown(false)
    }
  }, [open])

  const handleSelectReason = (reason: DeregisterReasonType) => {
    setSelectedReason(reason)
    setShowDropdown(false)
    unregisterForAttendance({
      type: reason,
      details: null,
    })
    setOpen(false)
  }

  return (
    <AnimatedModal visible={open} onClose={() => setOpen(false)} modalWidth={300} modalMaxWidth={350}>
      {() => (
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={[
              styles.selectTrigger,
              {
                backgroundColor: theme.surfaceVariant,
              },
            ]}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text
              style={[
                styles.selectValue,
                {
                  color: selectedReason ? theme.onSurface : theme.onSurfaceVariant,
                },
              ]}
            >
              {selectedReason ? mapDeregisterReasonTypeToLabel(selectedReason) : "Velg avmeldingsgrunn"}
            </Text>
            <MaterialCommunityIcons
              name={showDropdown ? "chevron-up" : "chevron-down"}
              size={24}
              color={theme.onSurfaceVariant}
            />
          </TouchableOpacity>

          {showDropdown && (
            <View
              style={[
                styles.dropdown,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.outline,
                },
              ]}
            >
              <FlatList
                data={DEREGISTER_REASON_TYPE_OPTIONS}
                scrollEnabled={false}
                nestedScrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      {
                        backgroundColor:
                          selectedReason === item.value ? theme.primaryContainer : theme.surface,
                        borderBottomColor: theme.outline,
                      },
                    ]}
                    onPress={() => handleSelectReason(item.value)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        {
                          color:
                            selectedReason === item.value ? theme.onPrimaryContainer : theme.onSurface,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.value}
              />
            </View>
          )}
        </View>
      )}
    </AnimatedModal>
  )
}

export default DeregisterModal

const styles = StyleSheet.create({
  modalContent: {
    borderRadius: 12,
    overflow: "hidden",
  },
  selectTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectValue: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  dropdown: {
    borderTopWidth: 1,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 15,
  },
})
