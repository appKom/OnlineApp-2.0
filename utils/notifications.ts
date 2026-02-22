import { Alert } from "react-native"
import * as Notifications from "expo-notifications"
import { SchedulableTriggerInputTypes } from "expo-notifications"

export const scheduleRegistrationReminder = async (eventId: string) => {
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

    // Schedule notification for 1 minute from now
    const notificationTime = new Date(Date.now() + 60 * 1000)

    await Notifications.scheduleNotificationAsync({
      identifier: `registration-reminder-${eventId}`,
      content: {
        title: "Test Notification",
        body: "This is a test notification scheduled 1 minute ago",
        sound: true,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: notificationTime,
        channelId: "registration_reminder",
      },
    })

    Alert.alert("Suksess", "Notification scheduled for 1 minute from now")
  } catch (error) {
    console.error("Error scheduling notification:", error)
    Alert.alert("Feil", "Kunne ikke sette påminnelse")
  }
}
