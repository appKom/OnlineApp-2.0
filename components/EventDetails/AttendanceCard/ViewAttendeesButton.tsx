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
  ScrollView,
} from "react-native"
import { BlurView } from "@react-native-community/blur"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import type { Attendance, Attendee } from "../../../types/event"
import type { User } from "../../../types/user"
import { ChoiceTrack, PanelDivider, RaisedButton, usePanelChromeColors } from "../../Panel"

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
  const chrome = usePanelChromeColors()

  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)

  const sheetAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const grades = useMemo(
    () => [...new Set(attendance.attendees.map(a => a.userGrade).filter((grade): grade is number => grade !== null))].sort((a, b) => a - b),
    [attendance.attendees]
  )

  const listData: ListItem[] = useMemo(() => {
    const sorted = attendance.attendees
      .filter(a => selectedGrade === null || a.userGrade === selectedGrade)
      .sort(
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
        title: `Påmeldte (${reserved.length})`,
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
        title: `Venteliste (${waitlist.length})`,
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
  }, [attendance.attendees, selectedGrade])

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
      <RaisedButton
        flex
        icon="account-multiple-outline"
        label="Påmeldte"
        disabled={!user}
        onPress={openModal}
      />

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
                  backgroundColor: chrome.surface,
                  borderColor: chrome.edge,
                  borderTopColor: chrome.highlight,
                  transform: [{ translateY: sheetAnim }],
                },
              ]}
            >
              <View {...panResponder.panHandlers} style={styles.dragHeader}>
                <View
                  style={[
                    styles.handle,
                    { backgroundColor: chrome.textMuted },
                  ]}
                />
                <Text style={[styles.modalTitle, { color: chrome.text }]}>
                  Påmeldingsliste
                </Text>
              </View>

              <View style={styles.filterArea}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
                  <ChoiceTrack
                    options={[null, ...grades].map(grade => ({
                      value: grade,
                      label: grade === null ? "Alle" : `${grade}. klasse`,
                    }))}
                    value={selectedGrade}
                    onChange={setSelectedGrade}
                    style={styles.filterTrack}
                  />
                </ScrollView>
              </View>
              <PanelDivider />

              <FlatList
                data={listData}
                keyExtractor={item => item.id}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: chrome.textMuted }]}>
                    Ingen påmeldte i denne klassen.
                  </Text>
                }
                renderItem={({ item }) =>
                  item.type === "header" ? (
                    <Text style={[styles.sectionTitle, { color: chrome.textMuted }]}>{item.title}</Text>
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
  const chrome = usePanelChromeColors()
  const isUser = attendee.userId === user.id

  return (
    <View
      style={[
        styles.attendeeRow,
        { borderTopColor: chrome.edge },
        isUser && { backgroundColor: chrome.raised },
      ]}
    >
      {attendee.user.imageUrl ? (
        <Image source={{ uri: attendee.user.imageUrl }} style={[styles.avatar, { borderColor: chrome.edge }]} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: chrome.recessed, borderColor: chrome.edge }]}>
          <MaterialCommunityIcons name="account-outline" size={18} color={chrome.icon} />
        </View>
      )}
      <View style={styles.userCopy}>
        <Text numberOfLines={1} style={[styles.userName, { color: chrome.text }]}>
          {attendee.user.name}
        </Text>
        <Text style={[styles.userGrade, { color: chrome.textMuted }]}>
          {attendee.userGrade
            ? `${attendee.userGrade}. klasse`
            : "Ingen klasse"}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
  },
  dragHeader: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
    gap: 10,
  },
  filterArea: { paddingVertical: 10 },
  filterOptions: { paddingHorizontal: 16 },
  filterTrack: { flexWrap: "nowrap" },
  emptyText: { padding: 20, textAlign: "center", fontSize: 14 },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  sectionTitle: {
    paddingHorizontal: 19,
    paddingTop: 16,
    paddingBottom: 8,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  attendeeRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  userCopy: { flex: 1 },
  userName: { fontSize: 14, fontWeight: "600" },
  userGrade: { fontSize: 12 },
})

export default ViewAttendeesButton
