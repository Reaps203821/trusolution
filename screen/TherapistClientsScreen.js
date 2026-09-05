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

export default function TherapistClientsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { clients, therapistProfile, isHydrated, refresh, getOrCreateConversation } =
    useTherapist();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [messagingId, setMessagingId] = useState(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const handleMessage = async (client) => {
    setMessagingId(client.clientId);
    const conversationId = await getOrCreateConversation({
      therapistId: therapistProfile?.id,
      clientId: client.clientId,
      therapistDisplayName: therapistProfile?.fullName,
      clientDisplayName: client.name,
    });
    setMessagingId(null);

    if (conversationId) {
      navigation.navigate("TherapistChat", {
        conversationId,
        otherName: client.name,
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Clients</Text>
        <Text style={styles.subtitle}>{clients.length} total</Text>
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
        ) : clients.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={40} color="#A67C5B" />
            <Text style={styles.emptyText}>No clients yet.</Text>
          </View>
        ) : (
          clients.map((client) => (
            <View key={client.clientId} style={styles.clientCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {client.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.clientTextWrap}>
                <Text style={styles.clientName}>{client.name}</Text>
                <Text style={styles.clientMeta}>
                  {client.sessionCount} session{client.sessionCount === 1 ? "" : "s"}
                  {"  \u2022  "}Last: {client.lastDate}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => handleMessage(client)}
                disabled={messagingId === client.clientId}
              >
                <Ionicons name="chatbubble-outline" size={18} color="#7A4B2F" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5E6CB" },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#3D2B1F" },
  subtitle: { fontSize: 13, color: "#8A6A57" },
  content: { paddingHorizontal: 18, paddingBottom: 40 },
  loadingState: { paddingVertical: 60, alignItems: "center" },
  emptyCard: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 13, color: "#8A6A57" },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8EE",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#7A4B2F",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFF8EE", fontSize: 17, fontWeight: "800" },
  clientTextWrap: { flex: 1 },
  clientName: { fontSize: 14, fontWeight: "800", color: "#3D2B1F" },
  clientMeta: { fontSize: 12, color: "#8A6A57", marginTop: 2 },
  messageButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F5E6CB",
    alignItems: "center",
    justifyContent: "center",
  },
});
