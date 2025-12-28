import React, { useState, useEffect, useRef, useMemo } from "react"
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
  PanResponder,
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

type ListItem =
  | { type: "header"; id: string; title: string }
  | { type: "attendee"; id: string; attendee: Attendee }

const SCREEN_HEIGHT = Dimensions.get("window").height
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6
const CLOSE_DISTANCE = 120
const CLOSE_VELOCITY = 1.1

export const ViewAttendeesButton: React.FC<ViewAttendeesButtonProps> = ({
  attendance,
  user,
}) => {
  const theme = useTheme()

  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const sheetAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const listData: ListItem[] = useMemo(() => {
    const sorted = [...attendance.attendees].sort(
      (a, b) =>
        new Date(a.earliestReservationAt).getTime() -
        new Date(b.earliestReservationAt).getTime()
    )

    const reserved = sorted.filter(a => a.reserved)
    const waitlist = sorted.filter(a => !a.reserved)

    const data: ListItem[] = []

    if (reserved.length > 0) {
      data.push({
        type: "header",
        id: "header-reserved",
        title: "Påmeldte",
      })

      reserved.forEach(a =>
        data.push({
          type: "attendee",
          id: a.id,
          attendee: a,
        })
      )
    }

    if (waitlist.length > 0) {
      data.push({
        type: "header",
        id: "header-waitlist",
        title: "Venteliste",
      })

      waitlist.forEach(a =>
        data.push({
          type: "attendee",
          id: a.id,
          attendee: a,
        })
      )
    }

    return data
  }, [attendance.attendees])

  useEffect(() => {
    if (!isMounted) return

    Animated.parallel([
      isOpen
        ? Animated.spring(sheetAnim, {
            toValue: 0,
            friction: 8,
            tension: 70,
            useNativeDriver: true,
          })
        : Animated.timing(sheetAnim, {
            toValue: SHEET_HEIGHT,
            duration: 220,
            useNativeDriver: true,
          }),

      Animated.timing(backdropOpacity, {
        toValue: isOpen ? 1 : 0,
        duration: isOpen ? 200 : 120,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished && !isOpen) {
        setIsMounted(false)
      }
    })
  }, [isOpen, isMounted])

  const openModal = () => {
    setIsMounted(true)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) sheetAnim.setValue(g.dy)
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > CLOSE_DISTANCE || g.vy > CLOSE_VELOCITY) {
          closeModal()
        } else {
          Animated.spring(sheetAnim, {
            toValue: 0,
            friction: 6,
            tension: 60,
            useNativeDriver: true,
          }).start()
        }
      },
    })
  ).current

  return (
    <>
      <TouchableOpacity
        disabled={!user}
        onPress={openModal}
        style={[
          styles.button,
          { backgroundColor: theme.secondaryContainer, opacity: !user ? 0.5 : 1 },
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

      {isMounted && (
        <Modal transparent animationType="none" onRequestClose={closeModal}>
          <View style={{ flex: 1 }}>
            <Animated.View
              style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}
            >
              <BlurView blurType="dark" blurAmount={5} style={{ flex: 1 }}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={closeModal}
                  style={{ flex: 1 }}
                />
              </BlurView>
            </Animated.View>

            <Animated.View
              style={[
                styles.bottomSheet,
                {
                  backgroundColor: theme.background,
                  transform: [{ translateY: sheetAnim }],
                },
              ]}
            >
              <View {...panResponder.panHandlers} style={styles.dragHeader}>
                <View
                  style={[
                    styles.handle,
                    { backgroundColor: theme.onSurfaceVariant },
                  ]}
                />
                <Text style={[styles.modalTitle, { color: theme.onBackground }]}>
                  Påmeldingsliste
                </Text>
              </View>

              <FlatList
                data={listData}
                keyExtractor={item => item.id}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews
                renderItem={({ item }) =>
                  item.type === "header" ? (
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
                  ) : (
                    <AttendeeRow attendee={item.attendee} user={user!} />
                  )
                }
              />
            </Animated.View>
          </View>
        </Modal>
      )}
    </>
  )
}

const AttendeeRow = ({ attendee, user }: { attendee: Attendee; user: User }) => {
  const theme = useTheme()
  const isUser = attendee.userId === user.id

  return (
    <View
      style={[
        styles.attendeeRow,
        { backgroundColor: isUser ? theme.primaryContainer : "transparent" },
      ]}
    >
      <Image
        source={
          attendee.user.imageUrl ? { uri: attendee.user.imageUrl } : undefined
        }
        style={styles.avatar}
      />
      <View>
        <Text style={[styles.userName, { color: theme.onBackground }]}>
          {attendee.user.name}
        </Text>
        <Text style={[styles.userGrade, { color: theme.onSurfaceVariant }]}>
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
    gap: 8,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 16, fontWeight: "600" },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
  },
  dragHeader: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
  },
  handle: {
    width: 40,
    height: 6,
    borderRadius: 3,
  },
  modalTitle: { fontSize: 20, fontWeight: "600" },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    fontWeight: "600",
  },
  attendeeRow: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  userName: { fontWeight: "600" },
  userGrade: { fontSize: 12 },
})

export default ViewAttendeesButton
