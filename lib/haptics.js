import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const safeHaptic = (fn) => {
  if (Platform.OS === "web") return;
  try {
    fn();
  } catch (error) {
    // Haptics unsupported on this device/simulator - fail silently.
  }
};

export const hapticSelect = () =>
  safeHaptic(() => Haptics.selectionAsync());

export const hapticLight = () =>
  safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));

export const hapticSuccess = () =>
  safeHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  );
