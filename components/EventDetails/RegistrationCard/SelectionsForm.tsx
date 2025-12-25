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
        <View style={{ flex: 1, justifyContent: "center", padding: "10%", backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{ backgroundColor: theme.primaryContainer, padding: 10, borderRadius: 20, height: 250 }}
            >
              {activeSelectionIndex !== null && (
                <FlatList
                  data={attendance.selections[activeSelectionIndex].options}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={attendance.selections[activeSelectionIndex].options.length > 4}
                  contentContainerStyle={{ gap: 3 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleSelectionChange(activeSelectionIndex, item.id)}
                      style={
                        {
                          backgroundColor:
                            selections[activeSelectionIndex]?.optionId === item.id
                              ? theme.tertiaryContainer
                              : theme.secondaryContainer,
                          height: 50, justifyContent: "center", alignItems: "center", borderRadius: 12
                        }
                      }
                    >
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color:
                              selections[activeSelectionIndex]?.optionId === item.id
                                ? theme.onTertiaryContainer
                                : theme.onSecondaryContainer,
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
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
  pillText: {
    fontSize: 16,
    fontWeight: "600",
  },
})

export default SelectionsForm
