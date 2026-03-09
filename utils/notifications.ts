import { Platform, ToastAndroid, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import type { Event as EventType, Attendance } from "../types/event";
import * as Device from "expo-device";

const showMessage = (title: string, message: string) => {
  if (Platform.OS === "android") {
    ToastAndroid.show(`${message}`, ToastAndroid.SHORT);
  } else {
    Alert.alert(title, message);
  }
};

export const scheduleRegistrationReminder = async (
  event: EventType,
  attendance: Attendance,
): Promise<boolean> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const request = await Notifications.requestPermissionsAsync();
      if (request.status !== "granted") {
        showMessage("Feil", "Varsler er ikke tillatt");
        return false;
      }
    }

    // Set up notification channel for Android
    await Notifications.setNotificationChannelAsync("registration_reminder", {
      name: "Påmeldingsvarslinger",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });

    // Schedule notification for 10 minutes before registration starts
    const eventId = event.id;
    const registrationStartTime = attendance.registerStart;
    const startTime = new Date(registrationStartTime).getTime();
    const notificationTime = new Date(startTime - 10 * 60 * 1000);

    if (notificationTime <= new Date()) {
      showMessage("Feil", "Påmeldingen starter om mindre enn 10 minutter");
      return false;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: `registration-reminder-${eventId}`,
      content: {
        title: "Påmelding starter snart!",
        body: `${event.title} - Påmelding starter om 10 minutter`,
        sound: true,
        data: { eventId, eventTitle: event.title },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: notificationTime,
        channelId: "registration_reminder",
      },
    });

    showMessage("Suksess", `Påminnelse satt 10 minutter før påmeldingsstart`);
    return true;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    showMessage("Feil", "Kunne ikke sette påminnelse");
    return false;
  }
};

export const cancelRegistrationReminder = async (eventId: string) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(
      `registration-reminder-${eventId}`,
    );
    showMessage("Suksess", "Påminnelse avbrutt");
  } catch (error) {
    console.error("Error canceling notification:", error);
    showMessage("Feil", "Kunne ikke avbryte påminnelse");
  }
};

export const isRegistrationReminderScheduled = async (
  eventId: string,
): Promise<boolean> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.some(
      (notif) => notif.identifier === `registration-reminder-${eventId}`,
    );
  } catch (error) {
    console.error("Error checking scheduled notifications:", error);
    return false;
  }
};
