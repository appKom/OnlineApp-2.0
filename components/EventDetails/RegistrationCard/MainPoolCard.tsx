import React from "react"
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native"
import type { Attendance } from "../../../types/event"
import { getAttendee, hasAttendeePaid, getAttendeeQueuePosition } from "../../../utils/attendance"
import { useCountdown } from "../../../utils/use-countdown"
import { User } from "../../../types/user"
import { Attendee } from "../../../types/event"
import Authenticator from "../../../utils/authenticator"
import { findActiveMembership } from "../../../utils/user-utils"
import {getAttendablePool, 
  getReservedAttendeeCount, 
  getUnreservedAttendeeCount 
} from "../../../utils/attendance"
import {
  formatDate,
  formatDistanceToNowStrict,
  interval,
  isFuture,
  isWithinInterval,
  roundToNearestHours,
  subMinutes,
} from "date-fns"
import { nb } from "date-fns/locale"
import { Ionicons, FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "utils/theme";

const theme = useTheme();

interface MainPoolCardProps {
  attendance: Attendance
  user: User | null
  authorizeUrl?: string
  chargeScheduleDate?: Date | null
}

export const MainPoolCard: React.FC<MainPoolCardProps> = ({ attendance, user, authorizeUrl, chargeScheduleDate }) => {
  const now = new Date();
  const attendee = getAttendee(attendance, user)

  const registerCountdownText = useCountdown(attendance.registerStart)
  const registerCountdownInterval = interval(subMinutes(attendance.registerStart, 15), attendance.registerStart)
  const isWithinRegisterCountdown = isWithinInterval(now, registerCountdownInterval)
  const showRegisterCountdown = isWithinRegisterCountdown && !attendee

  const paymentCountdownText = useCountdown(attendee?.paymentDeadline ?? null)
  const paymentCountdownInterval =
    attendee?.createdAt && attendee.paymentDeadline ? interval(attendee.createdAt, attendee.paymentDeadline) : null
  const isWithinPaymentCountdown =
    paymentCountdownInterval && hasAttendeePaid(attendance, attendee) === false
      ? isWithinInterval(now, paymentCountdownInterval)
      : false
  const showPaymentCountdown = isWithinPaymentCountdown && attendee?.paymentLink != null

  if (!user) {
    return (
      <TouchableOpacity onPress={() => Authenticator.login()} style={[styles.card, {backgroundColor: theme.inversePrimary}]}>
        <View style={{flex: 1, alignSelf: 'center', gap: 8}}>
          <Text style={{fontSize: 17, fontWeight: "bold", color: theme.primaryFixed}}>
            Du er ikke innlogget
          </Text>

          <View style={[styles.textItem]}>
            <Text style={{fontSize: 15, color: theme.primary}}>Logg inn</Text>
            <MaterialCommunityIcons name="login" color={theme.primary} size={15}/>
          </View>

          {attendance.attendancePrice && attendance.attendancePrice > 0 && (
            <PaymentStatus attendance={attendance} attendee={attendee} chargeScheduleDate={chargeScheduleDate} />
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const membership = findActiveMembership(user)

  if (!membership && !attendee) {
    return (
      <View style={styles.card}>
        <Text>Du har ikke registert medlemskap</Text>

        <View>
          <Text>Gå til OW for å registrere deg</Text>
        </View>

        {attendance.attendancePrice && attendance.attendancePrice > 0 && (
          <View>
            <PaymentStatus attendance={attendance} attendee={attendee} chargeScheduleDate={chargeScheduleDate} />
          </View>
        )}
      </View>
    )
  }

  const pool = getAttendablePool(attendance, user)

  if (!pool) {
    return (
      <View style={styles.card}>
        <Text>Du kan ikke melde deg på dette arrangementet</Text>
      </View>
    )
  }

  const unreservedAttendeeCount = getUnreservedAttendeeCount(attendance, pool.id)
  const reservedAttendeeCount = getReservedAttendeeCount(attendance, pool.id)
  const hasWaitlist = unreservedAttendeeCount > 0

  const servingPunishment = attendee?.earliestReservationAt && isFuture(attendee.earliestReservationAt)

  return (
    <View style={styles.card}>
      <View>
        <Text>
          {pool.title}
        </Text>

        {pool.mergeDelayHours && pool.mergeDelayHours > 0 && (
          <DelayPill
            mergeDelayHours={pool.mergeDelayHours}
          />
        )}
      </View>

      <View>
        {!showRegisterCountdown && (
          <View>
            <View>
              <Text>
                {reservedAttendeeCount}
                {/* Don't show capacity for merge pools (capacity = 0) */}
                {pool.capacity > 0 && `/${pool.capacity}`}
              </Text>

              {hasWaitlist && (
                <Text>
                  +{unreservedAttendeeCount} i kø
                </Text>
              )}
            </View>

            <View>
              {servingPunishment ? (
                <PunishmentStatus attendee={attendee} />
              ) : (
                <AttendanceStatus attendance={attendance} attendee={attendee} />
              )}
              <PaymentStatus attendance={attendance} attendee={attendee} chargeScheduleDate={chargeScheduleDate} />
            </View>
          </View>
        )}

        {showRegisterCountdown && (
          <View>
            <Text>{pool.capacity > 0 ? `${pool.capacity} plasser` : "Påmelding"} åpner om</Text>
            <Text>
              {registerCountdownText}
            </Text>
          </View>
        )}

        {showPaymentCountdown && attendee?.paymentLink && (
          <TouchableOpacity onPress={() => attendee.paymentLink && Linking.openURL(attendee.paymentLink)}>
            <View>
              <Text>Du må betale innen</Text>
              <Text>
                {paymentCountdownText}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

interface DelayPillProps {
  mergeDelayHours: number | null
}

const DelayPill = ({ mergeDelayHours }: DelayPillProps) => {
  const content = mergeDelayHours
    ? `Denne gruppen får plasser ${mergeDelayHours} timer etter påmeldingsstart`
    : "Denne påmeldingsgruppen kan få plasser senere"

  return (
    <View>
      <FontAwesome6 name="clock"/>
      <Text>{mergeDelayHours ? `${mergeDelayHours}t` : "TBD"}</Text>
    </View>
  )
}

interface AttendanceStatusProps {
  attendance: Attendance
  attendee: Attendee | null
}

const AttendanceStatus = ({ attendance, attendee }: AttendanceStatusProps) => {
  if (!attendee) {
    return (
      <View>
        <FontAwesome6 name="user-xmark"/>
        <Text>Du er ikke påmeldt</Text>
      </View>
    )
  }

  if (attendee.reserved === true) {
    return (
      <View>
        <FontAwesome6 name="user-check"/>
        <Text>Du er påmeldt</Text>
      </View>
    )
  }

  const queuePosition = getAttendeeQueuePosition(attendance, attendee.user)

  return (
    <View>
      <FontAwesome6 name="clock"/>
      <Text>Du er {queuePosition !== null && `${queuePosition}. `}i køen</Text>
    </View>
  )
}

interface PaymentStatusProps {
  attendance: Attendance
  attendee: Attendee | null
  chargeScheduleDate?: Date | null
}

const PaymentStatus = ({ attendance, attendee, chargeScheduleDate }: PaymentStatusProps) => {
  const hasPaid = hasAttendeePaid(attendance, attendee)

  if (!attendance.attendancePrice || hasPaid === null) {
    return null
  }

  if (!attendee) {
    return (
      <View style={[styles.textItem]}>
        <FontAwesome6 name="coins" color={theme.primary} size={15}/>
        <Text style={{fontSize: 15, color: theme.primary}}>{attendance.attendancePrice} kr</Text>
      </View>
    )
  }

  if (!hasPaid) {
    return (
      <View style={[styles.textItem]}>
        <FontAwesome6 name="xmark" color={theme.primary} size={15}/>
        <Text style={{fontSize: 15, color: theme.primary}} >{attendance.attendancePrice} kr ubetalt</Text>
      </View>
    )
  }

  if (attendee.paymentChargedAt) {
    return (
      <View style={[styles.textItem]}>
        <FontAwesome6 name="check" color={theme.primary} size={15}/>
        <Text style={{fontSize: 15, color: theme.primary}} >Du har betalt {attendance.attendancePrice} kr</Text>
      </View>
    )
  }

  if (attendee.paymentReservedAt) {
    return (
      <View>
        <FontAwesome6 name="check"/>

        <View>
          <Text>Du har reservert {attendance.attendancePrice} kr</Text>

          {chargeScheduleDate && (
            <Text>
              Du blir trukket rundt{" "}
              {formatDate(roundToNearestHours(chargeScheduleDate), "dd. MMM 'kl.' HH", { locale: nb })}
            </Text>
          )}
        </View>
      </View>
    )
  }

  if (attendee.paymentRefundedAt) {
    return (
      <View>
        <FontAwesome6 name="arrow-right-long" />
        <Text>Du er refundert {attendance.attendancePrice} kr</Text>
      </View>
    )
  }

  return null
}

interface PunishmentStatusProps {
  attendee: Attendee
}

const PunishmentStatus = ({ attendee }: PunishmentStatusProps) => {
  return (
    <View>
      <FontAwesome6 name="clock" />
      <Text>{formatDistanceToNowStrict(attendee.earliestReservationAt, { locale: nb })} utsettelse</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
  },
  textItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  }
})

export default MainPoolCard
