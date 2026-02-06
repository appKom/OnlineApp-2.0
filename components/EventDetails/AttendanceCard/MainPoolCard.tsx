import React from "react"
import { View, Text, TouchableOpacity, StyleSheet, Linking, Animated } from "react-native"
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
import { useTheme, blendColors, elevate } from "utils/theme";

interface MainPoolCardProps {
  attendance: Attendance
  user: User | null
  authorizeUrl?: string
  chargeScheduleDate?: Date | null
}

export const MainPoolCard: React.FC<MainPoolCardProps> = ({ attendance, user, authorizeUrl, chargeScheduleDate }) => {
  const theme = useTheme();
  const now = new Date();
  const attendee = getAttendee(attendance, user)
  
  // Pulse animation for payment countdown
  const pulseAnim = React.useRef(new Animated.Value(1)).current

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [])

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
      <TouchableOpacity onPress={() => Authenticator.login()} style={[styles.card, {backgroundColor: theme.inversePrimary, shadowColor: theme.shadow}]}>
        <View style={{flex: 1, alignSelf: 'center', gap: 8}}>
          <Text style={{fontSize: 17, fontWeight: "bold", color: theme.onPrimary}}>
            Du er ikke innlogget
          </Text>

          <View style={[styles.textItem]}>
            <Text style={{fontSize: 15, color: theme.onPrimary}}>Logg inn</Text>
            <MaterialCommunityIcons name="login" color={theme.onPrimary} size={15}/>
          </View>

          {attendance.attendancePrice && attendance.attendancePrice > 0 && (
            <PaymentStatus attendance={attendance} attendee={attendee} chargeScheduleDate={chargeScheduleDate} color={theme.onPrimary} />
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const membership = findActiveMembership(user)

  if (!membership && !attendee) {
    return (
      <View style={[styles.card, {backgroundColor: theme.primary, shadowColor: theme.shadow}]}> 
        <Text style={{ color: theme.onPrimary }}>Du har ikke registert medlemskap</Text>

        <View>
          <Text style={{ color: theme.onPrimary }}>Gå til OW for å registrere deg</Text>
        </View>

        {attendance.attendancePrice && attendance.attendancePrice > 0 && (
          <View>
            <PaymentStatus attendance={attendance} attendee={attendee} chargeScheduleDate={chargeScheduleDate} color={theme.onPrimary} />
          </View>
        )}
      </View>
    )
  }

  const pool = getAttendablePool(attendance, user)

  if (!pool) {
    return (
      <View style={[styles.card, { backgroundColor: theme.primary, alignItems: 'center', shadowColor: theme.shadow}]}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: 'bold',
            color: theme.onPrimary,
            maxWidth: '75%',
          }}
        >
          Du kan ikke melde deg på dette arrangemetet
        </Text>
      </View>
    )
  }

  const unreservedAttendeeCount = getUnreservedAttendeeCount(attendance, pool.id)
  const reservedAttendeeCount = getReservedAttendeeCount(attendance, pool.id)
  const hasWaitlist = unreservedAttendeeCount > 0

  const servingPunishment = attendee?.earliestReservationAt && isFuture(attendee.earliestReservationAt)

  const backgroundColor = !attendee ? theme.surfaceContainerHighest : attendee?.reserved === true ? theme.attending : theme.waitlist;
  const onBackgroundColor = !attendee
    ? theme.onSurface ?? theme.onPrimaryContainer ?? '#000'
    : attendee?.reserved === true
      ? theme.onAttending ?? '#000'
      : theme.onWaitlist ?? '#000'

  const cardBackground = blendColors(backgroundColor, theme.background, 0.7)

  return (
    <View style={{backgroundColor: cardBackground, borderRadius: 12, shadowColor: theme.shadow, elevation: 8}}>
      <View style={{ gap: 5, alignItems: "center", backgroundColor: backgroundColor, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
        <View style={{ flexDirection: "row", margin: 5 }}>
          <Text style={{ color: onBackgroundColor, padding: 5}}>
            {pool.title}
          </Text>

          {pool.mergeDelayHours && pool.mergeDelayHours > 0 && (
            <View style={{borderRadius: 5, justifyContent: "center"}}>
              <DelayPill
                mergeDelayHours={pool.mergeDelayHours}
                color={onBackgroundColor}
                backgroundColor={elevate(backgroundColor, 20)}
              />
            </View>
            
          )}
        </View>
        
      </View>

      <View style={{margin: 20}}>
        {!showRegisterCountdown && (
          <View style={{alignItems: "center"}}>
            <View style={{marginBottom: 5, alignItems: "center"}}>
              <Text style={{ color: onBackgroundColor, fontSize: 30, fontWeight: "bold" }}>
                {reservedAttendeeCount}
                {/* Don't show capacity for merge pools (capacity = 0) */}
                {pool.capacity > 0 && `/${pool.capacity}`}
              </Text>

              {hasWaitlist && (
                <Text style={{ color: onBackgroundColor, backgroundColor: backgroundColor, paddingVertical: 3, paddingHorizontal: 7, borderRadius: 7 }}>
                  +{unreservedAttendeeCount} i kø
                </Text>
              )}
            </View>

            <View style={{}}>
              {servingPunishment ? (
                <PunishmentStatus attendee={attendee} color={onBackgroundColor} />
              ) : (
                <AttendanceStatus attendance={attendance} attendee={attendee} color={onBackgroundColor} />
              )}
              <PaymentStatus
                attendance={attendance}
                attendee={attendee}
                chargeScheduleDate={chargeScheduleDate}
                color={onBackgroundColor}
              />
            </View>
          </View>
        )}

        {showRegisterCountdown && (
          <View style={{alignItems: "center"}}>
            <Text style={{ color: onBackgroundColor }}>{pool.capacity > 0 ? `${pool.capacity} plasser` : "Påmelding"} åpner om</Text>
            <Text style={{ color: onBackgroundColor, fontSize: 30, fontWeight: "bold" }}>
              {registerCountdownText}
            </Text>
          </View>
        )}

        {showPaymentCountdown && attendee?.paymentLink && (
          <TouchableOpacity onPress={() => attendee.paymentLink && Linking.openURL(attendee.paymentLink)}>
            <Animated.View style={{
              alignItems: "center",
              marginTop: 10,
              backgroundColor: "#FF9800",
              padding: 12,
              borderRadius: 10,
              gap: 8,
              transform: [{ scale: pulseAnim }]
            }}>
              <MaterialCommunityIcons name="alert-circle" size={28} color="#FFF" />
              <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "600" }}>Du må betale innen</Text>
              <Text style={{ color: "#FFF", fontSize: 24, fontWeight: "900" }}>
                {paymentCountdownText}
              </Text>
              <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "500" }}>Trykk her for å betale</Text>
            </Animated.View>
          </TouchableOpacity>
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

interface AttendanceStatusProps {
  attendance: Attendance
  attendee: Attendee | null
  color: string
}

const AttendanceStatus = ({ attendance, attendee, color }: AttendanceStatusProps) => {
  if (!attendee) {
    return (
      <View style={styles.textItem}>
        <FontAwesome6 name="user-xmark" color={color} />
        <Text style={{ color }}>Du er ikke påmeldt</Text>
      </View>
    )
  }

  if (attendee.reserved === true) {
    return (
      <View style={styles.textItem}>
        <FontAwesome6 name="user-check" color={color} />
        <Text style={{ color }}>Du er påmeldt</Text>
      </View>
    )
  }

  const queuePosition = getAttendeeQueuePosition(attendance, attendee.user)

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <FontAwesome6 name="clock" color={color} />
      <Text style={{ color }}>Du er {queuePosition !== null && `${queuePosition}. `}i køen</Text>
    </View>
  )
}

interface PaymentStatusProps {
  attendance: Attendance
  attendee: Attendee | null
  chargeScheduleDate?: Date | null
  color: string
}

const PaymentStatus = ({ attendance, attendee, chargeScheduleDate, color }: PaymentStatusProps) => {
  const hasPaid = hasAttendeePaid(attendance, attendee)

  if (!attendance.attendancePrice || hasPaid === null) {
    return null
  }

  if (!attendee) {
    return (
      <View style={[styles.textItem]}>
        <FontAwesome6 name="coins" color={color} size={15}/>
        <Text style={{fontSize: 15, color}}>{attendance.attendancePrice} kr</Text>
      </View>
    )
  }

  if (!hasPaid) {
    return (
      <View style={[styles.textItem]}>
        <FontAwesome6 name="xmark" color="red" size={15}/>
        <Text style={{fontSize: 15, color}} >{attendance.attendancePrice} kr ubetalt</Text>
      </View>
    )
  }

  if (attendee.paymentChargedAt) {
    return (
      <View style={[styles.textItem]}>
        <FontAwesome6 name="check" color={color} size={15}/>
        <Text style={{fontSize: 15, color}} >Du har betalt {attendance.attendancePrice} kr</Text>
      </View>
    )
  }

  if (attendee.paymentReservedAt) {
    return (
      <View style={[styles.textItem]}>
        <FontAwesome6 name="check" color={color} />

        <View>
          <Text style={{ color }}>Du har reservert {attendance.attendancePrice} kr</Text>

          {chargeScheduleDate && (
            <Text style={{ color }}>
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
      <View style={[styles.textItem]}>
        <FontAwesome6 name="arrow-right-long" color={color} />
        <Text style={{ color }}>Du er refundert {attendance.attendancePrice} kr</Text>
      </View>
    )
  }

  return null
}

interface PunishmentStatusProps {
  attendee: Attendee
}

const PunishmentStatus = ({ attendee, color }: PunishmentStatusProps & { color: string }) => {
  return (
    <View style={ styles.textItem }>
      <FontAwesome6 name="clock" color={color} />
      <Text style={{ color }}>{formatDistanceToNowStrict(attendee.earliestReservationAt, { locale: nb })} utsettelse</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    elevation: 8,
  },
  textItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  }
})

export default MainPoolCard
