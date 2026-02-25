import React from "react"
import { View, Text, StyleSheet } from "react-native"
import type { Attendance, Attendee } from "../../../types/event"
import { hasAttendeePaid } from "utils/attendance"
import { format as formatDate, isEqual, isPast, isThisYear, min } from "date-fns"
import { nb } from "date-fns/locale"
import { useTheme } from "utils/theme"

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
  const blockColor = showDeregisterDeadlineNotice
    ? theme.error
    : theme.surfaceContainerHigh

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
    const textColor = showNotice ? theme.onError : theme.onSurface

    return (
      <View style={{  }}>
        <Text
          numberOfLines={1}
          style={{ color: textColor, fontWeight: "800", marginBottom: 4 }}
        >
          {label}
        </Text>
        <Text numberOfLines={1} style={{ color: textColor }}>
          {shortDateStr}
        </Text>
        <Text numberOfLines={1} style={{ color: textColor }}>
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
        <View
          key={key}
          style={[
            styles.dateBlock,
            {
              backgroundColor: blockColor,
              elevation: 8,
              shadowColor: theme.shadow,
              marginRight:
                index !== sortedElements.length - 1 ? 8 : 0,
            },
          ]}
        >
          {element}
        </View>
      ))}
    </View>
  )

  if (!showDeregisterDeadlineNotice) return content

  return (
    <View>
      {content}
      <Text>Avmeldingsfrist er endret grunnet betaling.</Text>
    </View>
  )
}

export default AttendanceDateInfo

const styles = StyleSheet.create({
  dateBlocks: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },
  dateBlock: {
    flexGrow: 1,     // expand to fill remaining space
    flexBasis: "auto",
    flexShrink: 0,   // prevent shrinking → prevents wrapping
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
})