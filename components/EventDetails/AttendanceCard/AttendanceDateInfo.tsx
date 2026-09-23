import React from "react"
import { View, Text, StyleSheet } from "react-native"
import type { Attendance, Attendee } from "../../../types/event"
import { hasAttendeePaid } from "utils/attendance"
import { format as formatDate, isEqual, isPast, isThisYear, min } from "date-fns"
import { nb } from "date-fns/locale"
import { useTheme } from "utils/theme"
import { useEventChromeColors } from "../EventSurface"

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

  const theme = useTheme()
  const chrome = useEventChromeColors()

  const makeDateElement = (
    label: string,
    date: Date,
    time: string,
    showNotice?: boolean,
  ) => {
    const shortDateStr = formatDate(
      date,
      isThisYear(date) ? "dd. MMM" : "dd.MM.yy",
      { locale: nb },
    )
    const textColor = showNotice ? theme.error : theme.onSurface

    return (
      <View style={styles.dateContent}>
        <Text
          numberOfLines={1}
          style={{ color: textColor, fontWeight: "800", fontSize: 11, marginBottom: 4 }}
        >
          {label}
        </Text>
        <Text numberOfLines={1} style={{ color: textColor, fontSize: 12 }}>
          {shortDateStr}
        </Text>
        <Text numberOfLines={1} style={{ color: textColor, fontSize: 12 }}>
          {`kl. ${time}`}
        </Text>
      </View>
    )
  }

  const dateBlocks = [
    {
      key: "registerStart",
      date: registerStart,
      element: makeDateElement(
        isPast(registerStart) ? "Åpnet" : "Åpner",
        registerStart,
        formatDate(registerStart, "HH:mm", { locale: nb }),
      ),
    },
    {
      key: "registerEnd",
      date: registerEnd,
      element: makeDateElement(
        isPast(registerEnd) ? "Lukket" : "Lukker",
        registerEnd,
        formatDate(registerEnd, "HH:mm", { locale: nb }),
      ),
    },
    {
      key: "deregisterDeadline",
      date: actualDeregisterDeadline,
      element: makeDateElement(
        "Avmeldingsfrist",
        actualDeregisterDeadline,
        formatDate(actualDeregisterDeadline, "HH:mm", { locale: nb }),
        showDeregisterDeadlineNotice,
      ),
    },
  ]

  const sortedElements = dateBlocks
    .slice()
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const content = (
    <View style={styles.dateBlocks}>
      {sortedElements.map(({ element, key }, index) => (
        <React.Fragment key={key}>
          {index > 0 && (
            <View style={styles.verticalDivider}>
              <View style={{ flex: 1, backgroundColor: chrome.edge }} />
              <View style={{ flex: 1, backgroundColor: chrome.highlight }} />
            </View>
          )}
          <View
            style={[
              styles.dateBlock,
              key === "deregisterDeadline" && showDeregisterDeadlineNotice && {
                borderLeftWidth: 2,
                borderLeftColor: theme.error,
              },
            ]}
          >
            {element}
          </View>
        </React.Fragment>
      ))}
    </View>
  )

  if (!showDeregisterDeadlineNotice) return content

  return (
    <View>
      {content}
      <Text style={{ color: theme.error, marginTop: 8 }}>
        Avmeldingsfrist er endret grunnet betaling.
      </Text>
    </View>
  )
}

export default AttendanceDateInfo

const styles = StyleSheet.create({
  dateBlocks: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
  },
  dateBlock: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
    paddingVertical: 9,
    alignItems: "center",
  },
  dateContent: { alignItems: "center" },
  verticalDivider: { width: 2, flexDirection: "row", alignSelf: "stretch", marginVertical: 7 },
})
