import React, { useState } from "react"
import { View, Text, LayoutAnimation, StyleSheet } from "react-native"
import type { Attendance, AttendancePool } from "../../../types/event"
import {
  getAttendablePool,
  getNonAttendablePools,
  getRegisteredAttendeeCount,
  getQueuedAttendeeCount,
} from "../../../utils/attendance"
import type { User } from "../../../types/user"
import { DisclosureRow, Tag, usePanelChromeColors } from "../../Panel"

interface NonAttendablePoolsBoxProps {
  attendance: Attendance
  user: User | null
}

export const NonAttendablePoolsBox: React.FC<NonAttendablePoolsBoxProps> = ({
  attendance,
  user,
}) => {
  const chrome = usePanelChromeColors()
  const hasAttendablePool = getAttendablePool(attendance, user) !== null
  const nonAttendablePools = getNonAttendablePools(attendance, user)
  const [open, setOpen] = useState(!hasAttendablePool)

  if (!attendance.pools.length) {
    return <Text style={[styles.empty, { color: chrome.textMuted }]}>Ingen påmeldingsgrupper</Text>
  }

  if (!nonAttendablePools.length) {
    return null
  }

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setOpen((current) => !current)
  }

  return (
    <View style={[styles.container, { borderTopColor: chrome.edge }]}>
      <DisclosureRow
        title={`${hasAttendablePool ? "Andre grupper" : "Påmeldingsgrupper"} (${nonAttendablePools.length})`}
        open={open}
        onPress={toggle}
      />

      {open &&
        nonAttendablePools.map((pool) => (
          <PoolRow key={pool.id} pool={pool} attendance={attendance} />
        ))}
    </View>
  )
}

const PoolRow = ({ pool, attendance }: { pool: AttendancePool; attendance: Attendance }) => {
  const chrome = usePanelChromeColors()
  const registeredAttendeeCount = getRegisteredAttendeeCount(attendance, pool.id)
  const queuedAttendeeCount = getQueuedAttendeeCount(attendance, pool.id)

  return (
    <View style={[styles.row, { borderTopColor: chrome.edge }]}>
      <Text numberOfLines={1} style={[styles.title, { color: chrome.text }]}>
        {pool.title}
      </Text>
      {pool.mergeDelayHours ? <Tag label={`+${pool.mergeDelayHours}t`} color={chrome.warning} /> : null}
      <Text style={[styles.count, { color: chrome.textMuted }]}>
        {registeredAttendeeCount}
        {pool.capacity > 0 && `/${pool.capacity}`}
        {queuedAttendeeCount > 0 && ` +${queuedAttendeeCount}`}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  empty: { fontSize: 13 },
  container: { borderTopWidth: StyleSheet.hairlineWidth },
  row: {
    minHeight: 44,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: { flex: 1, fontSize: 13 },
  count: { fontSize: 12, fontVariant: ["tabular-nums"] },
})

export default NonAttendablePoolsBox
