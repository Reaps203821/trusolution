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

const formatWhen = (isoString) => {
  if (!isoString) return "";
  const then = new Date(isoString).getTime();
  const diffMinutes = Math.max(0, Math.floor((Date.now() - then) / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.floor(diffHours / 24)}d`;
};

export default function TherapistMessagesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { conversations, isHydrated, refresh } = useTherapist();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
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
        ) : conversations.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="chatbubbles-outline" size={40} color="#A67C5B" />
            <Text style={styles.emptyText}>No conversations yet.</Text>
          </View>
        ) : (
          conversations.map((conv) => (
            <TouchableOpacity
              key={conv.id}
              style={styles.conversationRow}
              onPress={() =>
                navigation.navigate("TherapistChat", {
                  conversationId: conv.id,
                  otherName: conv.otherName,
                })
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {conv.otherName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.conversationTextWrap}>
                <Text style={styles.conversationName} numberOfLines={1}>
                  {conv.otherName}
                </Text>
                <Text style={styles.conversationPreview} numberOfLines={1}>
                  {conv.lastMessagePreview || "No messages yet"}
                </Text>
              </View>
              <Text style={styles.conversationTime}>
                {formatWhen(conv.lastMessageAt)}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5E6CB" },
  header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: "800", color: "#3D2B1F" },
  content: { paddingHorizontal: 18, paddingBottom: 40 },
  loadingState: { paddingVertical: 60, alignItems: "center" },
  emptyCard: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 13, color: "#8A6A57" },
  conversationRow: {
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
  conversationTextWrap: { flex: 1 },
  conversationName: { fontSize: 14, fontWeight: "800", color: "#3D2B1F" },
  conversationPreview: { fontSize: 12, color: "#8A6A57", marginTop: 2 },
  conversationTime: { fontSize: 11, color: "#B29A7F" },
});
