import React, { useState, useCallback } from "react"
import { View, Text, StyleSheet, Pressable, FlatList } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import type { Attendance, Attendee, AttendanceSelectionResponse } from "../../../types/event"
import { AnimatedModal } from "../../AnimatedModal"
import { InsetField, Panel, PanelHeader, usePanelChromeColors } from "../../Panel"

interface Props {
  attendance: Attendance
  attendee: Attendee
  onSubmit: (selections: AttendanceSelectionResponse[]) => void
  disabled?: boolean
}

export const SelectionsForm: React.FC<Props> = ({ attendance, attendee, onSubmit, disabled }) => {
  const chrome = usePanelChromeColors()

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
    <View style={styles.list}>
      {attendance.selections.map((selection, index) => {
        const chosen = selections[index]?.optionName
        return (
          <View key={selection.id}>
            <InsetField
              label={selection.name}
              value={chosen || "Velg"}
              valueColor={chosen ? chrome.text : chrome.danger}
              trailingIcon={disabled ? "lock-outline" : "chevron-right"}
              accessibilityLabel={`${selection.name}: ${chosen || "ikke valgt"}`}
              onPress={disabled ? undefined : () => setOpenModalId(selection.id)}
            />

            <AnimatedModal
              visible={openModalId === selection.id}
              onClose={() => setOpenModalId(null)}
              modalWidth={320}
              modalMaxWidth={360}
            >
              {(closeModal) => (
                <Panel style={styles.modal}>
                  <PanelHeader title={selection.name} style={styles.modalHeader} />
                  <FlatList
                    data={selection.options}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={selection.options.length > 5}
                    style={styles.options}
                    contentContainerStyle={styles.optionsContent}
                    renderItem={({ item, index: optionIndex }) => {
                      const selected = selections[index]?.optionId === item.id
                      return (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => {
                            handleSelectionChange(index, item.id)
                            closeModal()
                          }}
                          style={({ pressed }) => [
                            styles.option,
                            optionIndex > 0 && {
                              borderTopWidth: StyleSheet.hairlineWidth,
                              borderTopColor: chrome.edge,
                            },
                            pressed && { opacity: 0.6 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              { color: chrome.text, fontWeight: selected ? "700" : "500" },
                            ]}
                          >
                            {item.name}
                          </Text>
                          {selected && <MaterialCommunityIcons name="check" size={18} color={chrome.accent} />}
                        </Pressable>
                      )
                    }}
                  />
                </Panel>
              )}
            </AnimatedModal>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  list: { gap: 6 },
  modal: { paddingHorizontal: 15, paddingTop: 13, paddingBottom: 4 },
  modalHeader: { marginBottom: 4 },
  options: { maxHeight: 300 },
  optionsContent: {},
  option: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: { fontSize: 14 },
})

export default SelectionsForm
