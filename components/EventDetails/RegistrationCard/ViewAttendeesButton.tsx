import React, { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native"
import { BlurView } from "@react-native-community/blur"
import { MaterialIcons } from "@expo/vector-icons"
import type { Attendance, Attendee } from "../../../types/event"
import type { User } from "../../../types/user"
import { useTheme } from "../../../utils/theme"

interface ViewAttendeesButtonProps {
  attendance: Attendance
  user: User | null
}

const SCREEN_HEIGHT = Dimensions.get("window").height

export const ViewAttendeesButton: React.FC<ViewAttendeesButtonProps> = ({
  attendance,
  user,
}) => {
  const theme = useTheme()
  const [modalVisible, setModalVisible] = useState(false)

  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current

  const allAttendees = [...attendance.attendees].sort(
    (a, b) =>
      new Date(a.earliestReservationAt).getTime() -
      new Date(b.earliestReservationAt).getTime()
  )

  const reservedAttendees = allAttendees.filter(a => a.reserved)
  const waitlistAttendees = allAttendees.filter(a => !a.reserved)

  useEffect(() => {
    if (modalVisible) {
      Animated.spring(sheetAnim, {
        toValue: 0,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.spring(sheetAnim, {
        toValue: SCREEN_HEIGHT,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }).start()
    }
  }, [modalVisible])

  return (
    <>
      <TouchableOpacity
        disabled={!user}
        onPress={() => setModalVisible(true)}
        style={[
          styles.button,
          {
            backgroundColor: theme.secondaryContainer,
            opacity: !user ? 0.5 : 1,
          },
        ]}
      >
        <MaterialIcons
          name="people"
          size={20}
          color={theme.onSecondaryContainer}
        />
        <Text style={[styles.buttonText, { color: theme.onSecondaryContainer }]}>
          Vis påmeldte
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible && !!user}
        transparent
        animationType="none"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1 }}>
          {/* 🔹 Static blur + backdrop */}
          <BlurView
            blurType="dark"
            blurAmount={5}
            style={StyleSheet.absoluteFill}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setModalVisible(false)}
              style={{ flex: 1 }}
            />
          </BlurView>

          {/* 🔹 Animated bottom sheet */}
          <Animated.View
            style={[
              styles.bottomSheet,
              {
                backgroundColor: theme.background,
                transform: [{ translateY: sheetAnim }],
              },
            ]}
          >
            <View style={styles.handleContainer}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: theme.onSurfaceVariant },
                ]}
              />
            </View>

            <Text
              style={[styles.modalTitle, { color: theme.onBackground }]}
            >
              Påmeldingsliste
            </Text>

            <FlatList
              data={[
                {
                  type: "reserved",
                  title: "Påmeldte",
                  attendees: reservedAttendees,
                },
                ...(waitlistAttendees.length > 0
                  ? [
                      {
                        type: "waitlist",
                        title: "Venteliste",
                        attendees: waitlistAttendees,
                      },
                    ]
                  : []),
              ]}
              keyExtractor={item => item.type}
              renderItem={({ item }) => (
                <View>
                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        backgroundColor: theme.surfaceVariant,
                        color: theme.onSurfaceVariant,
                      },
                    ]}
                  >
                    {item.title}
                  </Text>

                  {item.attendees.length > 0 ? (
                    item.attendees.map((attendee, index) => (
                      <AttendeeRow
                        key={attendee.id}
                        attendee={attendee}
                        user={user!}
                        index={index}
                      />
                    ))
                  ) : (
                    <Text
                      style={[
                        styles.emptyText,
                        { color: theme.onSurfaceVariant },
                      ]}
                    >
                      Ingen påmeldte
                    </Text>
                  )}
                </View>
              )}
            />
          </Animated.View>
        </View>
      </Modal>
    </>
  )
}

interface AttendeeRowProps {
  attendee: Attendee
  user: User
  index: number
}

const AttendeeRow = ({ attendee, user, index }: AttendeeRowProps) => {
  const theme = useTheme()
  const isUser = attendee.userId === user.id

  return (
    <View
      style={[
        styles.attendeeRow,
        {
          backgroundColor: isUser
            ? theme.primaryContainer
            : "transparent",
        },
      ]}
    >
      <Text style={[styles.index, { color: theme.onSurfaceVariant }]}>
        {index + 1}.
      </Text>

      <Image
        source={{ uri: attendee.user.imageUrl || undefined }}
        style={styles.avatar}
      />

      <View style={styles.userInfo}>
        <Text
          style={[styles.userName, { color: theme.onBackground }]}
          numberOfLines={1}
        >
          {attendee.user.name}
        </Text>

        <Text
          style={[
            styles.userGrade,
            { color: theme.onSurfaceVariant },
          ]}
        >
          {attendee.userGrade
            ? `${attendee.userGrade}. klasse`
            : "Ingen klasse"}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.6,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  attendeeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
  },
  index: {
    fontSize: 12,
    fontWeight: "600",
    width: 30,
    textAlign: "right",
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#ccc",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  userGrade: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 14,
    marginHorizontal: 16,
    marginVertical: 8,
  },
})

export default ViewAttendeesButton
