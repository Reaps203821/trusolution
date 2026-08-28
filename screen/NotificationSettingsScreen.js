import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "@trusolution/notification-settings-v1";

const defaultSettings = {
  pushEnabled: true,
  messageAlerts: true,
  communityAlerts: true,
  reminders: false,
};

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState(defaultSettings);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) {
          setSettings({ ...defaultSettings, ...JSON.parse(raw) });
        }
      } catch (error) {
        console.warn("Unable to restore notification settings", error);
      } finally {
        setIsHydrated(true);
      }
    };
    restore();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch((e) =>
      console.warn("Unable to save notification settings", e),
    );
  }, [isHydrated, settings]);

  const updateSetting = (key) => (value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const options = [
    {
      title: "Push Notifications",
      subtitle: "Receive notifications on your device.",
      value: settings.pushEnabled,
      onChange: updateSetting("pushEnabled"),
    },
    {
      title: "New Messages",
      subtitle: "Get alerted when peers or therapists reply.",
      value: settings.messageAlerts,
      onChange: updateSetting("messageAlerts"),
    },
    {
      title: "Community Activity",
      subtitle: "Know when someone reacts or comments on your post.",
      value: settings.communityAlerts,
      onChange: updateSetting("communityAlerts"),
    },
    {
      title: "Mood Check Reminders",
      subtitle: "Daily reminders to check in with yourself.",
      value: settings.reminders,
      onChange: updateSetting("reminders"),
    },
  ];

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#3D2B1F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>

        {options.map((option) => (
          <View key={option.title} style={styles.card}>
            <View style={styles.textWrap}>
              <Text style={styles.cardTitle}>{option.title}</Text>
              <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
            </View>
            <Switch
              value={option.value}
              onValueChange={option.onChange}
              trackColor={{ false: "#E3C9AA", true: "#A06A46" }}
              thumbColor={option.value ? "#3D2B1F" : "#FFF8EC"}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5E6CB" },
  content: { padding: 18, paddingBottom: 28 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7EBDD",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    color: "#3D2B1F",
  },
  headerSpacer: { width: 40 },
  card: {
    backgroundColor: "#FFF8EE",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  textWrap: { flex: 1, paddingRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#4A2818", marginBottom: 6 },
  cardSubtitle: { fontSize: 13, lineHeight: 18, color: "#7B6753" },
});
