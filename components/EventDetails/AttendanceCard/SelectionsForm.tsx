import React, { useState, useCallback } from "react"
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native"
import { Octicons } from "@expo/vector-icons"
import type { Attendance, Attendee, AttendanceSelectionResponse } from "../../../types/event"
import { useTheme, elevate } from "../../../utils/theme"
import { AnimatedModal } from "../../AnimatedModal"

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

  const [openModalId, setOpenModalId] = useState<string | null>(null)

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
      onSubmit(updatedSelections)
    },
    [attendance, selections, onSubmit]
  )

  return (
    <View style={{ 
        backgroundColor: elevate(theme.surfaceContainerHighest, 10), 
        padding: 15, 
        borderRadius: 12, 
        gap: 12,
        elevation: 8,
        shadowColor: theme.shadow 
      }}>
      {attendance.selections.map((selection, index) => (
        <View key={selection.id}>
          <TouchableOpacity
            onPress={() => setOpenModalId(selection.id)}
            style={styles.selectionRow}
          >
            <View style={styles.selectionInfo}>
              <Text style={[styles.selectionTitle, { color: elevate(theme.onSurface, 10) }]}>{selection.name}</Text>
              {selections[index]?.optionName ? (
                <Text style={[styles.selectedOption, { color: elevate(theme.onSurfaceVariant, 10) }]}>
                  Ditt valg: {selections[index].optionName}
                </Text>
              ) : (
                <Text style={styles.errorMessage}>Du må velge et alternativ</Text>
              )}
            </View>

            <View
              style={[
                styles.selectButton,
                { backgroundColor: theme.primary, 
                  opacity: disabled ? 0.5 : 1,
                  elevation: 8,
                  shadowColor: theme.shadow 
                }
              ]}
            >
              <Octicons name="arrow-up-left" size={20} color={theme.onPrimary} />
            </View>
          </TouchableOpacity>

          <AnimatedModal
            visible={openModalId === selection.id}
            onClose={() => setOpenModalId(null)}
            modalWidth={300}
            modalMaxWidth={350}
          >
            {(closeModal) => (
              <View style={{ backgroundColor: theme.surfaceContainer, padding: 10, borderRadius: 20, maxHeight: 250 }}>
                <FlatList
                  data={selection.options}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={selection.options.length > 4}
                  contentContainerStyle={{ gap: 3 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        handleSelectionChange(index, item.id)
                        closeModal()
                      }}
                      style={{
                        backgroundColor:
                          selections[index]?.optionId === item.id
                            ? theme.primaryContainer
                            : theme.surfaceContainerHighest,
                        height: 50,
                        justifyContent: "center",
                        alignItems: "center",
                        borderRadius: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color:
                            selections[index]?.optionId === item.id
                              ? theme.onPrimaryContainer
                              : theme.onSurface,
                        }}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </AnimatedModal>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  selectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
