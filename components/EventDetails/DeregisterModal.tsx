import React, { useEffect, useState } from "react"
import { View, Text, StyleSheet, TextInput } from "react-native"
import { AnimatedModal } from "../AnimatedModal"
import { ChoiceTrack, FieldLabel, Panel, PanelHeader, RaisedButton, usePanelChromeColors } from "../Panel"
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
  const chrome = usePanelChromeColors()
  const [selectedReason, setSelectedReason] = useState<DeregisterReasonType | null>(null)
  const [begrunnelse, setBegrunnelse] = useState("")

  useEffect(() => {
    if (!open) {
      setSelectedReason(null)
      setBegrunnelse("")
    }
  }, [open])

  return (
    <AnimatedModal visible={open} onClose={() => setOpen(false)} modalWidth="92%" modalMaxWidth={380}>
      {(closeModal) => (
        <Panel style={styles.modal}>
          <PanelHeader title="Meld av" />
          <Text style={[styles.intro, { color: chrome.textMuted }]}>
            Er du sikker? Plassen din går videre til neste på ventelisten.
          </Text>

          <View style={styles.group}>
            <FieldLabel>Grunn</FieldLabel>
            <ChoiceTrack
              options={DEREGISTER_REASON_TYPE_OPTIONS}
              value={selectedReason}
              onChange={setSelectedReason}
            />
          </View>

          <View style={styles.group}>
            <FieldLabel>Begrunnelse (valgfritt)</FieldLabel>
            <TextInput
              placeholder="Skriv en kort begrunnelse…"
              placeholderTextColor={chrome.textMuted}
              multiline
              numberOfLines={3}
              value={begrunnelse}
              onChangeText={setBegrunnelse}
              style={[
                styles.input,
                {
                  backgroundColor: chrome.recessed,
                  borderColor: chrome.edge,
                  borderBottomColor: chrome.highlight,
                  color: chrome.text,
                },
              ]}
            />
          </View>

          <View style={styles.buttons}>
            <RaisedButton flex label="Avbryt" onPress={closeModal} />
            <RaisedButton
              flex
              icon="account-minus-outline"
              label="Meld meg av"
              tone="danger"
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
            />
          </View>
        </Panel>
      )}
    </AnimatedModal>
  )
}

export default DeregisterModal

const styles = StyleSheet.create({
  modal: { padding: 15, gap: 14 },
  intro: { fontSize: 13, lineHeight: 18, marginTop: -6 },
  group: { gap: 8 },
  buttons: { flexDirection: "row", gap: 8 },
  input: {
    minHeight: 76,
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 14,
    textAlignVertical: "top",
  },
})
