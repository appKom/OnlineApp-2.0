import React from "react"
import { View, Text, StyleSheet, Animated } from "react-native"
import type { Attendance, AttendancePool } from "../../../types/event"
import { getAttendablePool, 
  getNonAttendablePools, 
  getReservedAttendeeCount, 
  getUnreservedAttendeeCount 
} from "../../../utils/attendance"
import type { User } from "../../../types/user"
import { FontAwesome6, MaterialIcons } from "@expo/vector-icons"
import { Collapsible, CollapsibleTrigger, CollapsibleContent, useCollapsible } from "../../Collapsible"
import { useTheme, withAlpha, elevate } from "../../../utils/theme"

interface NonAttendablePoolsBoxProps {
  attendance: Attendance
  user: User | null
}

export const NonAttendablePoolsBox: React.FC<NonAttendablePoolsBoxProps> = ({attendance, user }) => {
  const theme = useTheme();

  if (!attendance.pools.length) {
    return <Text>Ingen påmeldingsgrupper</Text>
  }

  const hasAttendablePool = getAttendablePool(attendance, user) !== null
  const nonAttendablePools = getNonAttendablePools(attendance, user)

  if (!nonAttendablePools.length) {
    return null
  }

  return (
    <View style={{ backgroundColor: withAlpha(theme.secondaryContainer, 0.99), padding: 12, borderRadius: 10 }}>
      <Collapsible defaultOpen={!hasAttendablePool}>
      <CollapsibleTrigger>
        {(isOpen, rotation) => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: theme.onSecondaryContainer, fontSize: 17, marginBottom: 5 }}>
              {hasAttendablePool ? "Andre påmeldingsgrupper" : "Påmeldingsgrupper"}
            </Text>
            <Animated.View style={{ transform: [{ rotate: rotation }] }}>
              <MaterialIcons 
                name="keyboard-arrow-down" 
                color={theme.onSecondaryContainer} 
                size={30}
              />
            </Animated.View>
          </View>
        )}
      </CollapsibleTrigger>

      <CollapsibleContent>
        <View>
          {nonAttendablePools.map((pool) => (
            <AttendanceBoxPoolSmall key={pool.id} pool={pool} attendance={attendance} />
          ))}
        </View>
      </CollapsibleContent>
    </Collapsible>
    </View>
  )
}

interface AttendanceBoxPoolSmallProps {
  pool: AttendancePool
  attendance: Attendance
}

const AttendanceBoxPoolSmall = ({ pool, attendance }: AttendanceBoxPoolSmallProps) => {
  const theme = useTheme();

  const reservedAttendeeCount = getReservedAttendeeCount(attendance, pool.id)
  const unreservedAttendeeCount = getUnreservedAttendeeCount(attendance, pool.id)

  return (
    <View style={{ flexDirection: "row", flex: 1, justifyContent: "space-between", alignItems: "center", backgroundColor: elevate(theme.secondaryContainer, 20), paddingHorizontal: 10, borderRadius: 10, height: 35, marginTop: 5 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <Text style={{ color: theme.onSecondaryContainer }}>{pool.title}</Text>

        {pool.mergeDelayHours ? <DelayPill mergeDelayHours={pool.mergeDelayHours} color={theme.onSecondaryContainer} backgroundColor={elevate(theme.secondaryContainer, 35)}/> : null}
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Text style={{ color: theme.onSecondaryContainer }}>
          {reservedAttendeeCount}
          {pool.capacity > 0 && `/${pool.capacity}`}
        </Text>

        {unreservedAttendeeCount > 0 && (
          <Text style={{ color: theme.onSecondaryContainer }}>+{unreservedAttendeeCount} i kø</Text>
        )}
      </View>
    </View>
  )
}

interface DelayPillProps {
  mergeDelayHours: number | null
  color?: string
  backgroundColor?: string
}

interface DelayPillProps {
  mergeDelayHours: number | null
  color?: string
  backgroundColor?: string
}

const DelayPill = ({ mergeDelayHours, color, backgroundColor }: DelayPillProps) => {
  const content = mergeDelayHours
    ? `Denne gruppen får plasser ${mergeDelayHours} timer etter påmeldingsstart`
    : "Denne påmeldingsgruppen kan få plasser senere"

  return (
    <View style={{flexDirection: "row", alignItems: "center", paddingVertical: 3, paddingHorizontal: 7, gap: 3, backgroundColor, borderRadius: 7}}>
      <FontAwesome6 name="clock" color={color} />
      <Text style={{ color }}>{mergeDelayHours ? `${mergeDelayHours}t` : "TBD"}</Text>
    </View>
  )
}


export default NonAttendablePoolsBox
