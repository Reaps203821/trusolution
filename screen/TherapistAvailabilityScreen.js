import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTherapist, DAY_NAMES } from "../context/TherapistContext";
import { useAlert } from "../context/AlertContext";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const buildInitialDays = (existingWindows) => {
  const byDay = {};
  existingWindows.forEach((w) => {
    byDay[w.dayOfWeek] = w;
  });

  return DAY_NAMES.map((name, index) => ({
    dayOfWeek: index,
    dayName: name,
    enabled: Boolean(byDay[index]),
    startTime: byDay[index]?.startTime || "09:00",
    endTime: byDay[index]?.endTime || "17:00",
  }));
};

export default function TherapistAvailabilityScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { availability, saveAvailability } = useTherapist();
  const { alert } = useAlert();
  const fromOnboarding = Boolean(route.params?.fromOnboarding);

  const [days, setDays] = useState(() => buildInitialDays(availability));
  const [isSaving, setIsSaving] = useState(false);

  const updateDay = (index, patch) => {
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    );
  };

  const handleSave = async () => {
    const enabledDays = days.filter((d) => d.enabled);

    for (const day of enabledDays) {
      if (!TIME_PATTERN.test(day.startTime) || !TIME_PATTERN.test(day.endTime)) {
        alert(
          "Check your times",
          `${day.dayName}'s hours need the format HH:MM, like 09:00.`,
        );
        return;
      }
      if (day.startTime >= day.endTime) {
        alert(
          "Check your times",
          `${day.dayName}'s end time needs to be after the start time.`,
        );
        return;
      }
    }

    setIsSaving(true);
    const ok = await saveAvailability(
      enabledDays.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime,
        endTime: d.endTime,
        slotMinutes: 60,
      })),
    );
    setIsSaving(false);

    if (!ok) {
      alert("Something went wrong", "We couldn't save your availability. Please try again.");
      return;
    }

    if (fromOnboarding) {
      navigation.replace("TherapistTabs");
    } else {
      alert("Saved", "Your availability has been updated.");
      navigation.goBack();
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your weekly availability</Text>
        <Text style={styles.subtitle}>
          Turn on the days you're bookable and set your hours. Clients will
          only be able to request times within these windows.
        </Text>

        {days.map((day, index) => (
          <View key={day.dayOfWeek} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>{day.dayName}</Text>
              <Switch
                value={day.enabled}
                onValueChange={(value) => updateDay(index, { enabled: value })}
                trackColor={{ false: "#ECD8C1", true: "#A98058" }}
                thumbColor="#FFF9F3"
              />
            </View>

            {day.enabled && (
              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <Text style={styles.timeLabel}>Start</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={day.startTime}
                    onChangeText={(v) => updateDay(index, { startTime: v })}
                    placeholder="09:00"
                    placeholderTextColor="#B8A38C"
                  />
                </View>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="#B8A38C"
                  style={styles.timeArrow}
                />
                <View style={styles.timeField}>
                  <Text style={styles.timeLabel}>End</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={day.endTime}
                    onChangeText={(v) => updateDay(index, { endTime: v })}
                    placeholder="17:00"
                    placeholderTextColor="#B8A38C"
                  />
                </View>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? "Saving..." : fromOnboarding ? "Finish Setup" : "Save Availability"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5E6CB" },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: "#3D2B1F", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#8A6A57", marginBottom: 20, lineHeight: 20 },
  dayCard: {
    backgroundColor: "#FFF8EE",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    padding: 14,
    marginBottom: 10,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayName: { fontSize: 15, fontWeight: "800", color: "#3D2B1F" },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 12,
    gap: 10,
  },
  timeField: { flex: 1 },
  timeLabel: { fontSize: 12, color: "#8A6A57", marginBottom: 4 },
  timeInput: {
    backgroundColor: "#F5E6CB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: "#3D2B1F",
    textAlign: "center",
  },
  timeArrow: { marginBottom: 10 },
  saveButton: {
    backgroundColor: "#3D2B1F",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 20,
  },
  saveButtonDisabled: { backgroundColor: "#B8A583" },
  saveButtonText: { color: "#FFF9F3", fontSize: 15, fontWeight: "800" },
});
