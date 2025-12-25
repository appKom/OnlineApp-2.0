import React, { useState, useCallback } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import type { Attendance, Attendee, AttendanceSelectionResponse } from "../../../types/event"
import { useTheme } from "../../../utils/theme"

interface Props {
  attendance: Attendance
  attendee: Attendee
  onSubmit: (selections: AttendanceSelectionResponse[]) => void
  disabled?: boolean
}


export const SelectionsForm: React.FC<Props> = ({ attendance, attendee, onSubmit, disabled }) => {
  const theme = useTheme()

  const [selections, setSelections] = useState<AttendanceSelectionResponse[]>(
    attendance.selections.map(({ id: selectionId, name: selectionName }) => {
      const savedResponse = attendee.selections.find((selection) => selection.selectionId === selectionId)
      return {
        selectionId,
        selectionName,
        optionId: savedResponse?.optionId ?? "",
        optionName: savedResponse?.optionName ?? "",
      }
    })
  )

  const [errors, setErrors] = useState<Record<number, boolean>>({})
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)

  const handleSelectionChange = useCallback(
    (index: number, optionId: string) => {
      const selection = attendance.selections[index]
      const option = selection.options.find((opt) => opt.id === optionId)

      if (!option) return

      const updatedSelections = [...selections]
      updatedSelections[index] = {
        selectionId: selection.id,
        selectionName: selection.name,
        optionId: option.id,
        optionName: option.name,
      }

      setSelections(updatedSelections)

      if (optionId) {
        setErrors((prev) => ({ ...prev, [index]: false }))
      }

      setOpenDropdown(null)
      onSubmit(updatedSelections)
    },
    [attendance, onSubmit]
  )

  React.useEffect(() => {
    const newErrors: Record<number, boolean> = {}
    selections.forEach((sel, idx) => {
      if (!sel.optionId) {
        newErrors[idx] = true
      }
    })
    setErrors(newErrors)
  }, [selections])

  return (
    <ScrollView style={styles.container}>
      {attendance.selections.map((selection, index) => (
        <View key={selection.id} style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.onBackground }]}>{selection.name}</Text>

          <TouchableOpacity
            disabled={disabled}
            onPress={() => setOpenDropdown(openDropdown === index ? null : index)}
            style={[
              styles.selectButton,
              {
                backgroundColor: theme.surfaceContainer,
                borderColor: errors[index] ? "#d32f2f" : theme.outline,
              },
            ]}
          >
            <Text
              style={[
                styles.selectButtonText,
                {
                  color: selections[index]?.optionName ? theme.onBackground : theme.onSurfaceVariant,
                },
              ]}
            >
              {selections[index]?.optionName || `Velg ${selection.name}`}
            </Text>
            <MaterialCommunityIcons
              name={openDropdown === index ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.onBackground}
            />
          </TouchableOpacity>

          {openDropdown === index && (
            <View style={[styles.dropdownMenu, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
              <FlatList
                data={selection.options}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item, index: optionIndex }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectionChange(index, item.id)}
                    style={[
                      styles.optionItem,
                      {
                        backgroundColor:
                          selections[index]?.optionId === item.id ? theme.surfaceContainer : "transparent",
                        borderBottomColor: theme.outlineVariant,
                        borderBottomWidth: optionIndex < selection.options.length - 1 ? 1 : 0,
                      },
                    ]}
                  >
                    <Text style={[styles.optionText, { color: theme.onBackground }]}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {errors[index] && <Text style={styles.errorText}>Du må velge et alternativ</Text>}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  fieldContainer: {
    marginBottom: 16,
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectButtonText: {
    fontSize: 14,
    flex: 1,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 300,
    marginTop: 4,
  },
  optionItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    color: "#d32f2f",
    marginTop: 4,
  },
})

export default SelectionsForm
