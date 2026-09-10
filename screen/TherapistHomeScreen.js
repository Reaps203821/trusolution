import React, { useMemo, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTherapist } from "../context/TherapistContext";
import { hapticLight, hapticSuccess } from "../lib/haptics";

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
};
const initials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "DR";

const ActionCard = ({ icon, title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.actionIcon}><Ionicons name={icon} size={20} color="#FFF9F3" /></View>
    <Text style={styles.actionTitle}>{title}</Text>
    <Text style={styles.actionSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

export default function TherapistHomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { therapistProfile, pendingRequests, todaysSessions, nextSession, clients, conversations, isHydrated, refresh, respondToAppointment, getOrCreateConversation } = useTherapist();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [messagingId, setMessagingId] = useState(null);
  const today = new Date().toISOString().slice(0, 10);
  const schedule = useMemo(() => [...todaysSessions].sort((a, b) => a.time.localeCompare(b.time)), [todaysSessions]);
  const request = pendingRequests[0];
  const latestConversation = conversations.find((item) => item.lastMessagePreview);

  const openTab = (screen) => {
    hapticLight();
    navigation.navigate("TherapistTabs", { screen });
  };
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };
  const updateRequest = async (appointment, status) => {
    setProcessingId(appointment.id);
    const updated = await respondToAppointment(appointment.id, { status });
    setProcessingId(null);
    if (updated && status === "Confirmed") hapticSuccess();
  };
  const openMessage = async (client) => {
    setMessagingId(client.clientId);
    const conversationId = await getOrCreateConversation({
      therapistId: therapistProfile?.id,
      clientId: client.clientId,
      therapistDisplayName: therapistProfile?.fullName,
      clientDisplayName: client.name,
    });
    setMessagingId(null);
    if (conversationId) navigation.navigate("TherapistChat", { conversationId, otherName: client.name });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.name} numberOfLines={1}>{therapistProfile?.fullName || "Doctor"}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={() => openTab("TherapistSessions")} accessibilityLabel="View appointment requests">
            <Ionicons name="notifications-outline" size={21} color="#3D2B1F" />
            {pendingRequests.length > 0 && <View style={styles.bellDot} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarButton} onPress={() => openTab("TherapistProfileTab")} accessibilityLabel="Open profile">
            {therapistProfile?.photoUrl ? <Image source={{ uri: therapistProfile.photoUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initials(therapistProfile?.fullName)}</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 92 }]} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#7A4B2F" />}>
        {!isHydrated ? <View style={styles.loading}><ActivityIndicator color="#7A4B2F" /></View> : <>
          <View style={styles.hero}>
            <View style={styles.heroTop}><View style={styles.heroBadge}><Ionicons name="pulse" size={14} color="#256D3C" /><Text style={styles.heroBadgeText}>Practice overview</Text></View><TouchableOpacity onPress={() => navigation.navigate("TherapistAvailability")}><Text style={styles.heroLink}>Availability</Text></TouchableOpacity></View>
            <Text style={styles.heroTitle}>{todaysSessions.length ? `You have ${todaysSessions.length} session${todaysSessions.length === 1 ? "" : "s"} today.` : "Your schedule is clear today."}</Text>
            <Text style={styles.heroSubtitle}>{nextSession ? `Next up: ${nextSession.clientDisplayName} at ${nextSession.time}.` : "Use this time to update availability or review your clients."}</Text>
            <View style={styles.heroStats}>
              <TouchableOpacity style={styles.heroStat} onPress={() => openTab("TherapistSessions")}><Text style={styles.heroStatValue}>{todaysSessions.length}</Text><Text style={styles.heroStatLabel}>Today</Text></TouchableOpacity>
              <TouchableOpacity style={styles.heroStat} onPress={() => openTab("TherapistSessions")}><Text style={styles.heroStatValue}>{pendingRequests.length}</Text><Text style={styles.heroStatLabel}>Requests</Text></TouchableOpacity>
              <TouchableOpacity style={styles.heroStat} onPress={() => openTab("TherapistClients")}><Text style={styles.heroStatValue}>{clients.length}</Text><Text style={styles.heroStatLabel}>Clients</Text></TouchableOpacity>
            </View>
          </View>

          <View style={styles.actionGrid}>
            <ActionCard icon="calendar-outline" title="Sessions" subtitle="Review your schedule" onPress={() => openTab("TherapistSessions")} />
            <ActionCard icon="chatbubble-ellipses-outline" title="Messages" subtitle={latestConversation ? "Continue a conversation" : "Connect with a client"} onPress={() => openTab("TherapistMessages")} />
            <ActionCard icon="people-outline" title="Clients" subtitle="View client records" onPress={() => openTab("TherapistClients")} />
            <ActionCard icon="time-outline" title="Availability" subtitle="Manage your hours" onPress={() => navigation.navigate("TherapistAvailability")} />
          </View>

          {request && <><Section title="APPOINTMENT REQUEST" link={pendingRequests.length > 1 ? `See all ${pendingRequests.length}` : null} onPress={() => openTab("TherapistSessions")} />
            <View style={styles.requestCard}><View style={styles.requestIcon}><Ionicons name="calendar" size={19} color="#7A4B2F" /></View><View style={styles.requestDetails}><Text style={styles.requestName}>{request.clientDisplayName}</Text><Text style={styles.requestMeta}>{request.date} · {request.time}</Text><Text style={styles.requestMeta}>{request.sessionType || "Session"}</Text></View></View>
            <View style={styles.requestActions}><TouchableOpacity style={styles.declineButton} disabled={processingId === request.id} onPress={() => updateRequest(request, "Declined")}><Text style={styles.declineText}>Decline</Text></TouchableOpacity><TouchableOpacity style={styles.acceptButton} disabled={processingId === request.id} onPress={() => updateRequest(request, "Confirmed")}><Text style={styles.acceptText}>{processingId === request.id ? "Updating..." : "Accept request"}</Text></TouchableOpacity></View>
          </>}

          <Section title="NEXT SESSION" link={nextSession ? "View details" : null} onPress={() => nextSession && navigation.navigate("TherapistSessionDetail", { appointmentId: nextSession.id })} />
          {nextSession ? <TouchableOpacity style={styles.nextCard} activeOpacity={0.92} onPress={() => navigation.navigate("TherapistSessionDetail", { appointmentId: nextSession.id })}><View style={styles.timeWrap}><Text style={styles.nextTime}>{nextSession.time}</Text><Text style={styles.nextDay}>{nextSession.date === today ? "TODAY" : nextSession.date}</Text></View><View style={styles.nextDetails}><Text style={styles.nextClient}>{nextSession.clientDisplayName}</Text><Text style={styles.nextType}>{nextSession.sessionType || "Session"}</Text></View><Ionicons name="chevron-forward" size={20} color="#E7C9B7" /></TouchableOpacity> : <TouchableOpacity style={styles.emptyCard} onPress={() => navigation.navigate("TherapistAvailability")}><Ionicons name="calendar-outline" size={20} color="#7A4B2F" /><Text style={styles.emptyText}>No upcoming sessions. Update your availability.</Text><Ionicons name="chevron-forward" size={17} color="#B29A7F" /></TouchableOpacity>}

          <Section title="TODAY'S SCHEDULE" link="Open sessions" onPress={() => openTab("TherapistSessions")} />
          {schedule.length ? <View style={styles.scheduleCard}>{schedule.slice(0, 3).map((appointment, index) => <TouchableOpacity key={appointment.id} style={[styles.scheduleRow, index === Math.min(schedule.length, 3) - 1 && styles.lastRow]} onPress={() => navigation.navigate("TherapistSessionDetail", { appointmentId: appointment.id })}><Text style={styles.scheduleTime}>{appointment.time}</Text><View style={styles.scheduleDetails}><Text style={styles.scheduleClient} numberOfLines={1}>{appointment.clientDisplayName}</Text><Text style={styles.scheduleType}>{appointment.sessionType || "Session"}</Text></View><Ionicons name="chevron-forward" size={16} color="#B29A7F" /></TouchableOpacity>)}</View> : <View style={styles.scheduleEmpty}><Text style={styles.emptyText}>Nothing scheduled for today.</Text></View>}

          {latestConversation && <TouchableOpacity style={styles.messageBanner} activeOpacity={0.9} disabled={messagingId === latestConversation.clientId} onPress={() => openMessage({ clientId: latestConversation.clientId, name: latestConversation.otherName })}><View style={styles.messageIcon}><Ionicons name="chatbubble-ellipses" size={18} color="#FFF9F3" /></View><View style={styles.messageText}><Text style={styles.messageTitle}>{messagingId === latestConversation.clientId ? "Opening conversation..." : `Message from ${latestConversation.otherName}`}</Text><Text style={styles.messagePreview} numberOfLines={1}>{latestConversation.lastMessagePreview}</Text></View><Ionicons name="arrow-forward" size={18} color="#7A4B2F" /></TouchableOpacity>}
        </>}
      </ScrollView>
    </View>
  );
}

const Section = ({ title, link, onPress }) => <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text>{link && <TouchableOpacity onPress={onPress}><Text style={styles.sectionLink}>{link}</Text></TouchableOpacity>}</View>;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5E6CB" }, content: { paddingHorizontal: 18 }, loading: { paddingVertical: 60, alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16 }, headerText: { flex: 1, paddingRight: 12 }, greeting: { fontSize: 15, color: "#8A6A57", fontWeight: "600" }, name: { fontSize: 25, color: "#3D2B1F", fontWeight: "800" }, headerActions: { flexDirection: "row", gap: 9 }, headerButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFF8EE", borderWidth: 1, borderColor: "#ECD8C1", alignItems: "center", justifyContent: "center" }, bellDot: { position: "absolute", top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: "#A84B3C", borderWidth: 1, borderColor: "#FFF8EE" }, avatarButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#7A4B2F", overflow: "hidden", alignItems: "center", justifyContent: "center" }, avatarImage: { width: "100%", height: "100%" }, avatarText: { color: "#FFF9F3", fontWeight: "800", fontSize: 13 },
  hero: { backgroundColor: "#7A4B2F", borderRadius: 26, padding: 19, marginBottom: 16 }, heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 13 }, heroBadge: { flexDirection: "row", gap: 6, alignItems: "center", backgroundColor: "#E7F4E1", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 }, heroBadgeText: { fontSize: 11, color: "#256D3C", fontWeight: "800" }, heroLink: { color: "#FFF9F3", fontSize: 12, fontWeight: "800", padding: 6 }, heroTitle: { color: "#FFF9F3", fontSize: 25, lineHeight: 31, fontWeight: "800" }, heroSubtitle: { color: "#F7E2D6", fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 16 }, heroStats: { flexDirection: "row", gap: 9 }, heroStat: { flex: 1, padding: 10, backgroundColor: "#8B5A3C", borderRadius: 14 }, heroStatValue: { color: "#FFF9F3", fontSize: 17, fontWeight: "800" }, heroStatLabel: { color: "#E7C9B7", fontSize: 11, marginTop: 2 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 10 }, actionCard: { width: "48.5%", backgroundColor: "#FFF8EE", borderRadius: 19, borderWidth: 1, borderColor: "#ECD8C1", padding: 14, marginBottom: 11 }, actionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#7A4B2F", alignItems: "center", justifyContent: "center", marginBottom: 9 }, actionTitle: { color: "#3D2B1F", fontSize: 14, fontWeight: "800" }, actionSubtitle: { color: "#8A6A57", fontSize: 11, lineHeight: 16, marginTop: 3 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, marginBottom: 9 }, sectionTitle: { color: "#8A6A57", fontSize: 11, letterSpacing: 0.7, fontWeight: "800" }, sectionLink: { color: "#7A4B2F", fontSize: 12, fontWeight: "800" }, requestCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF8EE", borderRadius: 16, borderWidth: 1, borderColor: "#ECD8C1", padding: 14, gap: 11 }, requestIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#F5E6CB", alignItems: "center", justifyContent: "center" }, requestDetails: { flex: 1 }, requestName: { color: "#3D2B1F", fontSize: 15, fontWeight: "800" }, requestMeta: { color: "#8A6A57", fontSize: 12, marginTop: 2 }, requestActions: { flexDirection: "row", gap: 9, marginTop: 9, marginBottom: 3 }, declineButton: { flex: 0.8, borderWidth: 1, borderColor: "#E4C9A8", backgroundColor: "#FFF8EE", borderRadius: 12, alignItems: "center", justifyContent: "center", paddingVertical: 11 }, declineText: { color: "#7A4B2F", fontWeight: "800", fontSize: 12 }, acceptButton: { flex: 1.2, backgroundColor: "#3D2B1F", borderRadius: 12, alignItems: "center", justifyContent: "center", paddingVertical: 11 }, acceptText: { color: "#FFF9F3", fontWeight: "800", fontSize: 12 },
  nextCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#7A4B2F", borderRadius: 18, padding: 15, gap: 13 }, timeWrap: { borderRightWidth: 1, borderRightColor: "#A67C5B", paddingRight: 13, minWidth: 72 }, nextTime: { color: "#FFF9F3", fontSize: 18, fontWeight: "800" }, nextDay: { color: "#E7C9B7", fontSize: 10, fontWeight: "800", marginTop: 3 }, nextDetails: { flex: 1 }, nextClient: { color: "#FFF9F3", fontSize: 15, fontWeight: "800" }, nextType: { color: "#E7C9B7", fontSize: 12, marginTop: 3 }, emptyCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF8EE", borderRadius: 16, borderWidth: 1, borderColor: "#ECD8C1", padding: 15, gap: 10 }, emptyText: { color: "#8A6A57", fontSize: 13, flex: 1 },
  scheduleCard: { borderRadius: 16, overflow: "hidden", backgroundColor: "#FFF8EE", borderWidth: 1, borderColor: "#ECD8C1" }, scheduleRow: { flexDirection: "row", alignItems: "center", padding: 13, gap: 12, borderBottomWidth: 1, borderBottomColor: "#F0E3D2" }, lastRow: { borderBottomWidth: 0 }, scheduleTime: { width: 58, color: "#7A4B2F", fontSize: 13, fontWeight: "800" }, scheduleDetails: { flex: 1 }, scheduleClient: { color: "#3D2B1F", fontSize: 14, fontWeight: "800" }, scheduleType: { color: "#8A6A57", fontSize: 11, marginTop: 2 }, scheduleEmpty: { backgroundColor: "#FFF8EE", padding: 15, borderRadius: 16, borderWidth: 1, borderColor: "#ECD8C1" },
  messageBanner: { flexDirection: "row", alignItems: "center", marginTop: 16, backgroundColor: "#F9F1E5", borderRadius: 16, borderWidth: 1, borderColor: "#E4C9A8", padding: 13, gap: 10 }, messageIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#7A4B2F", alignItems: "center", justifyContent: "center" }, messageText: { flex: 1 }, messageTitle: { color: "#3D2B1F", fontSize: 13, fontWeight: "800" }, messagePreview: { color: "#8A6A57", fontSize: 12, marginTop: 2 },
});
