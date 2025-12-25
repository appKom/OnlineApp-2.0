import React, { useState, useCallback } from "react"
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal } from "react-native"
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

  const [modalVisible, setModalVisible] = useState(false)
  const [activeSelectionIndex, setActiveSelectionIndex] = useState<number | null>(null)

  const handleSelectionChange = useCallback(
    (selectionIndex: number, optionId: string) => {
      const selection = attendance.selections[selectionIndex]
      const option = selection.options.find((opt) => opt.id === optionId)

      if (!option) return

      const updatedSelections = [...selections]
      updatedSelections[selectionIndex] = {
        selectionId: selection.id,
        selectionName: selection.name,
        optionId: option.id,
        optionName: option.name,
      }

      setSelections(updatedSelections)
      setModalVisible(false)
      onSubmit(updatedSelections)
    },
    [attendance, onSubmit]
  )

  return (
    <>
      {attendance.selections.map((selection, index) => (
        <View key={selection.id} style={styles.selectionRow}>
          <View style={styles.selectionInfo}>
            <Text style={[styles.selectionTitle, { color: theme.onBackground }]}>{selection.name}</Text>
            {selections[index]?.optionName ? (
              <Text style={[styles.selectedOption, { color: theme.onSurfaceVariant }]}>
                Ditt valg: {selections[index].optionName}
              </Text>
            ) : (
              <Text style={styles.errorMessage}>Du må velge et alternativ</Text>
            )}
          </View>

          <TouchableOpacity
            disabled={disabled}
            onPress={() => {
              setActiveSelectionIndex(index)
              setModalVisible(true)
            }}
            style={[
              styles.selectButton,
              { backgroundColor: theme.primary, opacity: disabled ? 0.5 : 1 }
            ]}
          >
            <MaterialCommunityIcons name="chevron-down" size={20} color={theme.onPrimary} />
          </TouchableOpacity>
        </View>
      ))}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={[styles.overlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[styles.optionsContainer, { backgroundColor: theme.surface, borderColor: theme.outline }]}
          >
            {activeSelectionIndex !== null && (
              <FlatList
                data={attendance.selections[activeSelectionIndex].options}
                keyExtractor={(item) => item.id}
                scrollEnabled={attendance.selections[activeSelectionIndex].options.length > 4}
                renderItem={({ item, index: optionIndex }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectionChange(activeSelectionIndex, item.id)}
                    style={[
                      styles.optionItem,
                      {
                        borderBottomColor: theme.outlineVariant,
                        borderBottomWidth: optionIndex < attendance.selections[activeSelectionIndex].options.length - 1 ? 1 : 0,
                        backgroundColor:
                          selections[activeSelectionIndex]?.optionId === item.id
                            ? theme.surfaceContainer
                            : "transparent",
                      },
                    ]}
                  >
                    <Text style={[styles.optionText, { color: theme.onBackground }]}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  selectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  selectionInfo: {
    flex: 1,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  selectedOption: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorMessage: {
    fontSize: 14,
    fontWeight: "500",
    color: "#d32f2f",
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  optionsContainer: {
    width: "80%",
    maxHeight: 280,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },
})

export default SelectionsForm
