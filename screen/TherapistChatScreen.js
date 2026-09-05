import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTherapist } from "../context/TherapistContext";

export default function TherapistChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { conversationId, otherName = "Conversation" } = route.params || {};

  const {
    activeMessages,
    loadConversationMessages,
    leaveConversation,
    sendConversationMessage,
  } = useTherapist();

  const [inputText, setInputText] = useState("");
  const flatListRef = useRef();

  useEffect(() => {
    if (conversationId) {
      loadConversationMessages(conversationId);
    }
    return () => leaveConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: false });
  }, [activeMessages.length]);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    sendConversationMessage(conversationId, inputText.trim());
    setInputText("");
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === "me";
    return (
      <View style={[styles.messageRow, isMe && styles.userRow]}>
        <View style={[styles.bubble, isMe ? styles.userBubble : styles.peerBubble]}>
          <Text style={[styles.messageText, isMe && styles.userMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.timeText, isMe && styles.userTimeText]}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#2D2418" />
          </TouchableOpacity>
          <View style={styles.headerIdentity}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {otherName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.peerName} numberOfLines={1}>
              {otherName}
            </Text>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={activeMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Say hello to start the conversation.
              </Text>
            </View>
          }
        />

        <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            style={styles.input}
            placeholder="Message"
            placeholderTextColor="#9C8B75"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#D8C8A8" },
  flex1: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#E9DDC2",
    borderBottomWidth: 1,
    borderBottomColor: "#CCBC98",
  },
  iconButton: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  headerIdentity: { flex: 1, flexDirection: "row", alignItems: "center", marginLeft: 8 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7B5B3D",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerAvatarText: { color: "#FFF7E7", fontSize: 16, fontWeight: "800" },
  peerName: { fontSize: 16, fontWeight: "800", color: "#2D2418", flex: 1 },
  messagesList: { flex: 1 },
  messagesContent: { paddingHorizontal: 12, paddingTop: 10, flexGrow: 1 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyText: { fontSize: 13, color: "#6E604D" },
  messageRow: { flexDirection: "row", marginBottom: 8 },
  userRow: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  peerBubble: {
    backgroundColor: "#FFF7E9",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  userBubble: {
    backgroundColor: "#7B5B3D",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  messageText: { fontSize: 15, lineHeight: 21, color: "#2D2418" },
  userMessageText: { color: "#FFF8EC" },
  timeText: { alignSelf: "flex-end", marginTop: 6, fontSize: 11, color: "#8E7C65" },
  userTimeText: { color: "#E8DAC7" },
  composerWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 8,
    backgroundColor: "#E9DDC2",
    borderTopWidth: 1,
    borderTopColor: "#CCBC98",
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    backgroundColor: "#FFF9EE",
    borderRadius: 24,
    fontSize: 15,
    color: "#2D2418",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#7B5B3D",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: { backgroundColor: "#B4A288" },
});
