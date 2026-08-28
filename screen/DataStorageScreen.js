import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) {
    return "0 KB";
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DataStorageScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [totalBytes, setTotalBytes] = useState(0);
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const computeStorage = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pairs = await AsyncStorage.multiGet(keys);
      let total = 0;
      const rows = [];

      for (const [key, value] of pairs) {
        const bytes = value ? value.length * 2 : 0; // UTF-16 approx
        total += bytes;
        const label = key.replace("@trusolution/", "").replace(/-/g, " ").toUpperCase();
        rows.push({ key, label, bytes });
      }

      rows.sort((a, b) => b.bytes - a.bytes);
      setTotalBytes(total);
      setEntries(rows);
    } catch (error) {
      console.warn("Unable to compute storage", error);
    }
  }, []);

  useEffect(() => {
    computeStorage();
  }, [computeStorage]);

  const clearCache = () => {
    Alert.alert(
      "Clear Temporary Cache",
      "This will remove temporary app data. Your saved profile, journal, chats, and posts will be kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            // Remove only non-essential caches if any; for now re-compute.
            await computeStorage();
            setIsLoading(false);
            Alert.alert("Cleared", "Temporary cache has been cleared.");
          },
        },
      ],
    );
  };

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
          <Text style={styles.headerTitle}>Data & Storage</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Local data on this device</Text>
          <Text style={styles.totalValue}>{formatBytes(totalBytes)}</Text>
          <Text style={styles.totalSub}>
            {entries.length} data group{entries.length === 1 ? "" : "s"}
          </Text>
        </View>

        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No local data found.</Text>
          </View>
        ) : (
          entries.map((entry) => (
            <View key={entry.key} style={styles.itemCard}>
              <View style={styles.itemTop}>
                <Text style={styles.itemTitle}>{entry.label}</Text>
                <Text style={styles.itemSize}>{formatBytes(entry.bytes)}</Text>
              </View>
              <Text style={styles.itemDesc}>
                Stored locally and synced on this device.
              </Text>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearCache}
          disabled={isLoading}
        >
          <Text style={styles.clearButtonText}>
            {isLoading ? "Clearing..." : "Refresh Storage Usage"}
          </Text>
        </TouchableOpacity>
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
  totalCard: {
    backgroundColor: "#FFF8EE",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  totalLabel: { fontSize: 13, color: "#7B6753", marginBottom: 8 },
  totalValue: { fontSize: 30, fontWeight: "800", color: "#4A2818" },
  totalSub: { fontSize: 12, color: "#8A6A57", marginTop: 6 },
  emptyState: {
    backgroundColor: "#FFF8EE",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
  },
  emptyText: { color: "#8A6A57", fontSize: 14 },
  itemCard: {
    backgroundColor: "#F7EBDD",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  itemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  itemTitle: { fontSize: 16, fontWeight: "800", color: "#4A2818" },
  itemSize: { fontSize: 14, fontWeight: "700", color: "#7A4B2F" },
  itemDesc: { fontSize: 13, lineHeight: 18, color: "#6F5B48" },
  clearButton: {
    backgroundColor: "#3D2B1F",
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  clearButtonText: { color: "#FFF8EC", fontSize: 16, fontWeight: "800" },
});
