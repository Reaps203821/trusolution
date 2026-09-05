import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
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

export default function TherapistSessionDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { alert } = useAlert();
  const { appointments, therapistProfile, respondToAppointment, getOrCreateConversation } =
    useTherapist();

  const [isProcessing, setIsProcessing] = useState(false);
  const appointment = appointments.find((a) => a.id === route.params?.appointmentId);

  if (!appointment) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#3D2B1F" />
          </TouchableOpacity>
        </View>
        <Text style={styles.notFoundText}>This session could not be found.</Text>
      </View>
    );
  }

  const colors = STATUS_COLORS[appointment.status] || STATUS_COLORS.Pending;

  const handleAccept = async () => {
    setIsProcessing(true);
    await respondToAppointment(appointment.id, { status: "Confirmed" });
    setIsProcessing(false);
  };

  const handleDecline = () => {
    alert("Decline this request?", "The client will be notified.", [
      { text: "Keep Pending", style: "cancel" },
      {
        text: "Decline",
        style: "destructive",
        onPress: async () => {
          setIsProcessing(true);
          await respondToAppointment(appointment.id, { status: "Declined" });
          setIsProcessing(false);
        },
      },
    ]);
  };

  const handleMessage = async () => {
    setIsProcessing(true);
    const conversationId = await getOrCreateConversation({
      therapistId: therapistProfile?.id,
      clientId: appointment.clientId,
      therapistDisplayName: therapistProfile?.fullName,
      clientDisplayName: appointment.clientDisplayName,
    });
    setIsProcessing(false);
    if (conversationId) {
      navigation.navigate("TherapistChat", {
        conversationId,
        otherName: appointment.clientDisplayName,
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#3D2B1F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Session Details</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.card}>
          <View style={[styles.statusPill, { backgroundColor: colors.bg, alignSelf: "flex-start" }]}>
            <Text style={[styles.statusPillText, { color: colors.text }]}>
              {appointment.status}
            </Text>
          </View>

          <Text style={styles.clientName}>{appointment.clientDisplayName}</Text>
          <Text style={styles.sessionMeta}>
            {appointment.sessionType || "Session"} \u2022 #{appointment.bookingId}
          </Text>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color="#7A4B2F" />
            <Text style={styles.infoText}>{appointment.date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color="#7A4B2F" />
            <Text style={styles.infoText}>{appointment.time}</Text>
          </View>

          {appointment.declineReason ? (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Decline reason</Text>
              <Text style={styles.reasonText}>{appointment.declineReason}</Text>
            </View>
          ) : null}
        </View>

        {appointment.status === "Pending" && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={handleDecline}
              disabled={isProcessing}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
              disabled={isProcessing}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.messageButton}
          onPress={handleMessage}
          disabled={isProcessing}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#7A4B2F" />
          <Text style={styles.messageButtonText}>Message Client</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5E6CB" },
  content: { padding: 18, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF8EE",
    borderWidth: 1,
    borderColor: "#ECD8C1",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#3D2B1F" },
  notFoundText: { textAlign: "center", marginTop: 40, color: "#8A6A57" },
  card: {
    backgroundColor: "#FFF8EE",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    padding: 18,
    marginBottom: 18,
  },
  statusPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, marginBottom: 12 },
  statusPillText: { fontSize: 12, fontWeight: "800" },
  clientName: { fontSize: 20, fontWeight: "800", color: "#3D2B1F" },
  sessionMeta: { fontSize: 13, color: "#8A6A57", marginTop: 4, marginBottom: 14 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  infoText: { fontSize: 14, color: "#3D2B1F", fontWeight: "600" },
  reasonBox: {
    marginTop: 12,
    backgroundColor: "#F5E6CB",
    borderRadius: 12,
    padding: 12,
  },
  reasonLabel: { fontSize: 11, fontWeight: "800", color: "#8A6A57", marginBottom: 4 },
  reasonText: { fontSize: 13, color: "#3D2B1F" },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  actionButton: { flex: 1, alignItems: "center", borderRadius: 14, paddingVertical: 13 },
  declineButton: { backgroundColor: "#F0E3D2" },
  declineButtonText: { color: "#6E5444", fontSize: 14, fontWeight: "800" },
  acceptButton: { backgroundColor: "#3D7A4B" },
  acceptButtonText: { color: "#FFF9F3", fontSize: 14, fontWeight: "800" },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#7A4B2F",
    borderRadius: 14,
    paddingVertical: 13,
  },
  messageButtonText: { color: "#7A4B2F", fontSize: 14, fontWeight: "800" },
});
