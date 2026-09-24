import React from "react"
import { View, Text, StyleSheet } from "react-native"
import type { Attendance, Attendee } from "../../../types/event"
import { hasAttendeePaid } from "utils/attendance"
import { format as formatDate, isEqual, isPast, isThisYear, min } from "date-fns"
import { nb } from "date-fns/locale"
import { usePanelChromeColors } from "../../Panel"

interface AttendanceDateInfoProps {
  attendance: Attendance
  attendee: Attendee | null
  chargeScheduleDate?: Date | null
}

export const AttendanceDateInfo: React.FC<AttendanceDateInfoProps> = ({
  attendance,
  attendee,
  chargeScheduleDate,
}) => {
  const { registerStart, registerEnd, deregisterDeadline } = attendance

  const actualDeregisterDeadline = chargeScheduleDate
    ? min([deregisterDeadline, chargeScheduleDate])
    : deregisterDeadline

  const hasPaid = hasAttendeePaid(attendance, attendee) ?? false
  const showDeregisterDeadlineNotice =
    hasPaid && !isEqual(actualDeregisterDeadline, deregisterDeadline)

  const chrome = usePanelChromeColors()

  const dateBlocks = [
    {
      key: "registerStart",
      label: isPast(registerStart) ? "Åpnet" : "Åpner",
      date: registerStart,
      notice: false,
    },
    {
      key: "registerEnd",
      label: isPast(registerEnd) ? "Lukket" : "Lukker",
      date: registerEnd,
      notice: false,
    },
    {
      key: "deregisterDeadline",
      label: "Avmeldingsfrist",
      date: actualDeregisterDeadline,
      notice: showDeregisterDeadlineNotice,
    },
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <View>
      <View style={styles.dateBlocks}>
        {dateBlocks.map(({ key, label, date, notice }, index) => (
          <React.Fragment key={key}>
            {index > 0 && <View style={[styles.separator, { backgroundColor: chrome.edge }]} />}
            <View style={styles.dateBlock}>
              <Text
                numberOfLines={1}
                style={[styles.date, { color: notice ? chrome.danger : isPast(date) ? chrome.textMuted : chrome.text }]}
              >
                {formatDate(date, isThisYear(date) ? "d. MMM" : "dd.MM.yy", { locale: nb })}
              </Text>
              <Text numberOfLines={1} style={[styles.time, { color: chrome.textMuted }]}>
                kl. {formatDate(date, "HH:mm", { locale: nb })}
              </Text>
              <Text numberOfLines={1} style={[styles.label, { color: notice ? chrome.danger : chrome.textMuted }]}>
                {label}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {showDeregisterDeadlineNotice && (
        <Text style={[styles.notice, { color: chrome.danger }]}>
          Avmeldingsfristen er endret grunnet betaling.
        </Text>
      )}
    </View>
  )
}

export default AttendanceDateInfo

const styles = StyleSheet.create({
  dateBlocks: {
    minHeight: 84,
    paddingHorizontal: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  dateBlock: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  separator: { width: 1, height: 48 },
  date: { fontSize: 15, fontWeight: "700" },
  time: { marginTop: 1, fontSize: 12 },
  label: { marginTop: 3, fontSize: 11 },
  notice: { paddingHorizontal: 15, paddingBottom: 10, fontSize: 12 },
})
