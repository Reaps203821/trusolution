import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTherapist } from "../context/TherapistContext";
import { useAlert } from "../context/AlertContext";

const STATUS_COLORS = {
  Pending: { bg: "#F6E7C9", text: "#8A6A2F" },
  Confirmed: { bg: "#DCEEDF", text: "#2F6E43" },
  Declined: { bg: "#F0E3D2", text: "#8A6A57" },
  Canceled: { bg: "#F0E3D2", text: "#8A6A57" },
  Completed: { bg: "#E4E0F5", text: "#5847A0" },
};

export default function TherapistSessionsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { alert } = useAlert();
  const { appointments, isHydrated, respondToAppointment, refresh } = useTherapist();

  const [filter, setFilter] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const filters = ["All", "Pending", "Confirmed", "Past"];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const handleAccept = async (id) => {
    setProcessingId(id);
    await respondToAppointment(id, { status: "Confirmed" });
    setProcessingId(null);
  };

  const handleDecline = (id) => {
    alert(
      "Decline this request?",
      "The client will be notified this time doesn't work.",
      [
        { text: "Keep Pending", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            setProcessingId(id);
            await respondToAppointment(id, { status: "Declined" });
            setProcessingId(null);
          },
        },
      ],
    );
  };

  const today = new Date().toISOString().slice(0, 10);

  const filtered = appointments
    .filter((a) => {
      if (filter === "All") return true;
      if (filter === "Past") return a.date < today || a.status === "Completed";
      return a.status === filter;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.time.localeCompare(b.time);
    });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Sessions</Text>
      </View>

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === f && styles.filterChipTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {!isHydrated ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#7A4B2F" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={36} color="#A67C5B" />
            <Text style={styles.emptyText}>No sessions here yet.</Text>
          </View>
        ) : (
          filtered.map((appt) => {
            const colors = STATUS_COLORS[appt.status] || STATUS_COLORS.Pending;
            return (
              <TouchableOpacity
                key={appt.id}
                style={styles.sessionCard}
                onPress={() =>
                  navigation.navigate("TherapistSessionDetail", {
                    appointmentId: appt.id,
                  })
                }
                activeOpacity={0.85}
              >
                <View style={styles.sessionTopRow}>
                  <Text style={styles.sessionDate}>
                    {appt.date} \u2022 {appt.time}
                  </Text>
                  <View style={[styles.statusPill, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.statusPillText, { color: colors.text }]}>
                      {appt.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.sessionClient}>{appt.clientDisplayName}</Text>
                <Text style={styles.sessionType}>
                  {appt.sessionType || "Session"} \u2022 #{appt.bookingId}
                </Text>

                {appt.status === "Pending" && (
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.requestButton, styles.declineButton]}
                      onPress={() => handleDecline(appt.id)}
                      disabled={processingId === appt.id}
                    >
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.requestButton, styles.acceptButton]}
                      onPress={() => handleAccept(appt.id)}
                      disabled={processingId === appt.id}
                    >
                      <Text style={styles.acceptButtonText}>
                        {processingId === appt.id ? "..." : "Accept"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5E6CB" },
  header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6 },
  title: { fontSize: 22, fontWeight: "800", color: "#3D2B1F" },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#FFF8EE",
    borderWidth: 1,
    borderColor: "#ECD8C1",
  },
  filterChipActive: { backgroundColor: "#7A4B2F", borderColor: "#7A4B2F" },
  filterChipText: { fontSize: 12, fontWeight: "700", color: "#7A4B2F" },
  filterChipTextActive: { color: "#FFF9F3" },
  content: { paddingHorizontal: 18, paddingBottom: 40 },
  loadingState: { paddingVertical: 60, alignItems: "center" },
  emptyCard: { alignItems: "center", paddingVertical: 50, gap: 10 },
  emptyText: { fontSize: 13, color: "#8A6A57" },
  sessionCard: {
    backgroundColor: "#FFF8EE",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    padding: 14,
    marginBottom: 10,
  },
  sessionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sessionDate: { fontSize: 12, fontWeight: "700", color: "#7A4B2F" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusPillText: { fontSize: 11, fontWeight: "800" },
  sessionClient: { fontSize: 15, fontWeight: "800", color: "#3D2B1F" },
  sessionType: { fontSize: 12, color: "#8A6A57", marginTop: 2 },
  requestActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  requestButton: { flex: 1, alignItems: "center", borderRadius: 12, paddingVertical: 10 },
  declineButton: { backgroundColor: "#F0E3D2" },
  declineButtonText: { color: "#6E5444", fontSize: 13, fontWeight: "800" },
  acceptButton: { backgroundColor: "#3D7A4B" },
  acceptButtonText: { color: "#FFF9F3", fontSize: 13, fontWeight: "800" },
});
