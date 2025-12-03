import React from "react"
import { View, ScrollView, Text, StyleSheet, Button } from "react-native"
import type { Attendance, Attendee } from "../../../types/event"
import { hasAttendeePaid } from "utils/attendance"
import { format as formatDate, isEqual, isPast, isThisYear, min } from "date-fns"
import { da, nb } from "date-fns/locale"
import { useTheme } from "utils/theme";


interface AttendanceDateInfoProps {
  attendance: Attendance
  attendee: Attendee | null
  chargeScheduleDate?: Date | null
}

export const AttendanceDateInfo: React.FC<AttendanceDateInfoProps> = ({
  attendance,
  attendee,
  chargeScheduleDate
}) => {
  const { registerStart, registerEnd, deregisterDeadline } = attendance

  const actualDeregisterDeadline = chargeScheduleDate
    ? min([deregisterDeadline, chargeScheduleDate])
    : deregisterDeadline

  const hasPaid = hasAttendeePaid(attendance, attendee) ?? false
  const showDeregisterDeadlineNotice = hasPaid && !isEqual(actualDeregisterDeadline, deregisterDeadline)
  
  const theme = useTheme();
  const blockColor = showDeregisterDeadlineNotice ? theme.error : theme.secondary;

  const makeDateElement = (label: string, date: Date, time: string, showNotice?: boolean, icon?: React.ReactNode) => {
    const shortDateStr = formatDate(date, isThisYear(date) ? "dd. MMM" : "dd.MM.yyyy", { locale: nb })
    const textColor = showNotice ? theme.onError : theme.onSecondary;
    return (
      <View>
        <View style={styles.row}>

          <View >
            <Text style={[{ color: textColor, fontWeight: '800', marginBottom: 4 }]}>{label}</Text>
            <View >
              <Text style={{ color: textColor}}>{shortDateStr}</Text>
              <Text style={{ color: textColor }}>{`kl. ${time}`}</Text>
            </View>
          </View>
        </View>
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
        false,
      ),
    },
    {
      key: "registerEnd",
      date: registerEnd,
      element: makeDateElement(
        isPast(registerEnd) ? "Lukket" : "Lukker",
        registerEnd,
        formatDate(registerEnd, "HH:mm", { locale: nb }),
        false,
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

  const sortedElements = dateBlocks.slice().sort((a, b) => {
    const ta = a.date instanceof Date ? a.date.getTime() : Number.POSITIVE_INFINITY;
    const tb = b.date instanceof Date ? b.date.getTime() : Number.POSITIVE_INFINITY;
    return ta - tb;
  });

  const element = (
    <View style={[styles.dateBlocks, { justifyContent: 'space-between' }]}>
      {sortedElements.map(({ element, key }, index) => (
        <View key={key} style={[styles.dateBlock, {backgroundColor: blockColor}]}> 
          <View>
            {element}
          </View>
        </View>
      ))}
    </View>
  )

  if (!showDeregisterDeadlineNotice) return element

  return (
    <View>
      {element}
      <Text>Avmeldingsfrist er endret grunnet betaling.</Text>
    </View>
  )
}

export default AttendanceDateInfo

const styles = StyleSheet.create({
  dateBlocks: {
    flexDirection: "row",
    alignItems: 'flex-start',
  },
  dateBlock: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
