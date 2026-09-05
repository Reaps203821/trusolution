import React, { useState } from "react";
import {
  View,
  Text,
  Image,
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

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export default function TherapistHomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    therapistProfile,
    pendingRequests,
    todaysSessions,
    nextSession,
    clients,
    conversations,
    isHydrated,
    refresh,
  } = useTherapist();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const recentActivity = [];
  if (pendingRequests.length > 0) {
    recentActivity.push({
      id: "pending",
      icon: "calendar-outline",
      text: `New appointment request from ${pendingRequests[0].clientDisplayName}`,
    });
  }
  const latestConversation = conversations.find((c) => c.lastMessagePreview);
  if (latestConversation) {
    recentActivity.push({
      id: "message",
      icon: "chatbubble-outline",
      text: `${latestConversation.otherName} sent you a message`,
    });
  }

  const todaysScheduleSorted = [...todaysSessions].sort((a, b) =>
    a.time.localeCompare(b.time),
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {getGreeting()}, {therapistProfile?.fullName || "Doctor"} 👋
          </Text>
          <Text style={styles.headerSubtitle}>Here's your practice today</Text>
        </View>
        <TouchableOpacity style={styles.bellButton}>
          <Ionicons name="notifications-outline" size={22} color="#3D2B1F" />
          {pendingRequests.length > 0 && <View style={styles.bellDot} />}
        </TouchableOpacity>
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
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{todaysSessions.length}</Text>
                <Text style={styles.statLabel}>TODAY'S SESSIONS</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{clients.length}</Text>
                <Text style={styles.statLabel}>TOTAL CLIENTS</Text>
              </View>
            </View>

            {nextSession && (
              <View style={styles.nextSessionCard}>
                <Text style={styles.nextSessionLabel}>NEXT SESSION</Text>
                <Text style={styles.nextSessionTime}>{nextSession.time}</Text>
                <Text style={styles.nextSessionClient}>
                  {nextSession.clientDisplayName}
                </Text>
                <Text style={styles.nextSessionType}>
                  {nextSession.sessionType || "Session"}
                </Text>
                <TouchableOpacity
                  style={styles.viewDetailsButton}
                  onPress={() =>
                    navigation.navigate("TherapistSessionDetail", {
                      appointmentId: nextSession.id,
                    })
                  }
                >
                  <Text style={styles.viewDetailsText}>View Details</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.sectionTitle}>TODAY'S SCHEDULE</Text>
            {todaysScheduleSorted.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Nothing scheduled for today.</Text>
              </View>
            ) : (
              <View style={styles.scheduleCard}>
                {todaysScheduleSorted.map((appt, index) => (
                  <TouchableOpacity
                    key={appt.id}
                    style={[
                      styles.scheduleRow,
                      index === todaysScheduleSorted.length - 1 && styles.scheduleRowLast,
                    ]}
                    onPress={() =>
                      navigation.navigate("TherapistSessionDetail", {
                        appointmentId: appt.id,
                      })
                    }
                  >
                    <Text style={styles.scheduleTime}>{appt.time}</Text>
                    <Text style={styles.scheduleClient} numberOfLines={1}>
                      {appt.clientDisplayName}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#B29A7F" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
            {recentActivity.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Nothing new right now.</Text>
              </View>
            ) : (
              <View style={styles.activityCard}>
                {recentActivity.map((item) => (
                  <View key={item.id} style={styles.activityRow}>
                    <Ionicons name={item.icon} size={16} color="#7A4B2F" />
                    <Text style={styles.activityText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5E6CB" },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
  },
  greeting: { fontSize: 19, fontWeight: "800", color: "#3D2B1F" },
  headerSubtitle: { fontSize: 13, color: "#8A6A57", marginTop: 3 },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF8EE",
    borderWidth: 1,
    borderColor: "#ECD8C1",
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#A84B3C",
  },
  content: { paddingHorizontal: 18, paddingBottom: 40 },
  loadingState: { paddingVertical: 60, alignItems: "center" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF8EE",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    paddingVertical: 16,
    alignItems: "center",
  },
  statValue: { fontSize: 26, fontWeight: "800", color: "#3D2B1F" },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8A6A57",
    marginTop: 4,
    letterSpacing: 0.4,
  },
  nextSessionCard: {
    backgroundColor: "#7A4B2F",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  nextSessionLabel: {
    color: "#E9D9C5",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  nextSessionTime: { color: "#FFF9F3", fontSize: 24, fontWeight: "800" },
  nextSessionClient: {
    color: "#FFF9F3",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 6,
  },
  nextSessionType: { color: "#E9D9C5", fontSize: 13, marginTop: 2 },
  viewDetailsButton: {
    marginTop: 14,
    backgroundColor: "#FFF9F3",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 11,
  },
  viewDetailsText: { color: "#3D2B1F", fontWeight: "800", fontSize: 13 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8A6A57",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 6,
  },
  emptyCard: {
    backgroundColor: "#FFF8EE",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    padding: 16,
    marginBottom: 18,
  },
  emptyText: { fontSize: 13, color: "#8A6A57" },
  scheduleCard: {
    backgroundColor: "#FFF8EE",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    marginBottom: 18,
    overflow: "hidden",
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F0E3D2",
    gap: 12,
  },
  scheduleRowLast: { borderBottomWidth: 0 },
  scheduleTime: {
    fontSize: 13,
    fontWeight: "800",
    color: "#7A4B2F",
    width: 68,
  },
  scheduleClient: { flex: 1, fontSize: 14, fontWeight: "700", color: "#3D2B1F" },
  activityCard: {
    backgroundColor: "#FFF8EE",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    padding: 14,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  activityText: { fontSize: 13, color: "#3D2B1F", flex: 1 },
});
