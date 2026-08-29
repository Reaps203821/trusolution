import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("appointment-reminders", {
    name: "Appointment reminders",
    importance: Notifications.AndroidImportance.HIGH,
  }).catch(() => {
    // Best-effort - if this fails, scheduling will still attempt to use
    // the fallback "Miscellaneous" channel Expo creates automatically.
  });
}

let permissionRequested = false;

export async function ensureNotificationPermission() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") {
    return true;
  }

  if (permissionRequested) {
    return false;
  }
  permissionRequested = true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

const buildTriggerDate = (appointment, offsetMs) => {
  const dateTime = new Date(`${appointment.date}T00:00:00`);
  // appointment.time is a free-text label (e.g. "3:00 PM"); best-effort parse.
  const match = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(appointment.time || "");
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    dateTime.setHours(hours, minutes, 0, 0);
  }
  return new Date(dateTime.getTime() - offsetMs);
};

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export async function scheduleAppointmentReminders(appointment) {
  if (Platform.OS === "web") return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const therapistName =
    typeof appointment.therapist === "object"
      ? appointment.therapist?.name
      : appointment.therapist;

  try {
    if (appointment.reminder?.dayBefore) {
      const triggerDate = buildTriggerDate(appointment, DAY_MS);
      if (triggerDate.getTime() > Date.now()) {
        await Notifications.scheduleNotificationAsync({
          identifier: `appt-${appointment.id}-day-before`,
          content: {
            title: "Appointment tomorrow",
            body: `You have a session with ${therapistName || "your therapist"} tomorrow at ${appointment.time}.`,
          },
          trigger:
            Platform.OS === "android"
              ? { date: triggerDate, channelId: "appointment-reminders" }
              : { date: triggerDate },
        });
      }
    }

    if (appointment.reminder?.oneHourBefore) {
      const triggerDate = buildTriggerDate(appointment, HOUR_MS);
      if (triggerDate.getTime() > Date.now()) {
        await Notifications.scheduleNotificationAsync({
          identifier: `appt-${appointment.id}-hour-before`,
          content: {
            title: "Appointment in 1 hour",
            body: `Your session with ${therapistName || "your therapist"} starts at ${appointment.time}.`,
          },
          trigger:
            Platform.OS === "android"
              ? { date: triggerDate, channelId: "appointment-reminders" }
              : { date: triggerDate },
        });
      }
    }
  } catch (error) {
    console.warn("Unable to schedule appointment reminders", error);
  }
}

export async function cancelAppointmentReminders(appointmentId) {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(
      `appt-${appointmentId}-day-before`,
    );
    await Notifications.cancelScheduledNotificationAsync(
      `appt-${appointmentId}-hour-before`,
    );
  } catch (error) {
    // Notification may not have existed - not an error worth surfacing.
  }
}
