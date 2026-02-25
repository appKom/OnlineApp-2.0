import { Alert } from "react-native"
import * as Notifications from "expo-notifications"
import { SchedulableTriggerInputTypes } from "expo-notifications"
import type { Event as EventType, Attendance } from "../types/event"

export const scheduleRegistrationReminder = async (event: EventType, attendance: Attendance) => {
  try {
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== "granted") {
      const request = await Notifications.requestPermissionsAsync()
      if (request.status !== "granted") {
        Alert.alert("Feil", "Varsler er ikke tillatt")
        return
      }
    }

    // Set up notification channel for Android
    await Notifications.setNotificationChannelAsync("registration_reminder", {
      name: "Påmeldingsvarslinger",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: "default",
    })

    // Schedule notification for 15 minutes before registration starts
    const eventId = event.id
    const registrationStartTime = attendance.registerStart
    const startTime = new Date(registrationStartTime).getTime()
    const notificationTime = new Date(startTime - 8 * 60 * 1000)

    await Notifications.scheduleNotificationAsync({
      identifier: `registration-reminder-${eventId}`,
      content: {
        title: "Påmelding starter snart!",
        body: `${event.title} - Påmelding starter om 8 minutter`,
        sound: true,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: notificationTime,
        channelId: "registration_reminder",
      },
    })

    Alert.alert("Suksess", `Notification scheduled for ${notificationTime.toString()}`)
  } catch (error) {
    console.error("Error scheduling notification:", error)
    Alert.alert("Feil", "Kunne ikke sette påminnelse")
  }
}
