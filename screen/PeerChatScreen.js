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
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useChat } from "../context/ChatContext";
import { useAlert } from "../context/AlertContext";

// Self-contained simulated exchange used only for the therapist
// pre-appointment placeholder chat - not backed by a database, since real
// therapist messaging is a separate feature from real peer matching.
function useSimulatedTherapistChat(peerName) {
  const [messages, setMessages] = useState([
    {
      id: "intro",
      text: `Hi, I'm ${peerName}. Feel free to share anything you'd like to discuss before our session.`,
      sender: "peer",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = (text) => {
    const userMessage = {
      id: `local-${Date.now()}`,
      text,
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMessage]);

    const replyText = "Thanks for sharing - we'll cover this in your session.";
    const typingDuration = Math.min(2800, 800 + replyText.length * 28);

    setTimeout(() => setIsTyping(true), 350);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `local-reply-${Date.now()}`,
          text: replyText,
          sender: "peer",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 350 + typingDuration);
  };

  return { messages, isTyping, sendMessage };
}

export default function PeerChatScreen({ route }) {
  const navigation = useNavigation();
  const { alert } = useAlert();
  const {
    conversationId,
    conversationStyle = "Both",
    peerName = "Peer",
    chatType = "peer",
  } = route.params || {};

  const insets = useSafeAreaInsets();
  const isPeer = chatType === "peer";

  const {
    otherName,
    messages: realMessages,
    loadConversation,
    leaveConversation,
    sendMessage: sendRealMessage,
    endConversation,
    reportConversation,
  } = useChat();

  const simulated = useSimulatedTherapistChat(peerName);

  const [inputText, setInputText] = useState("");
  const flatListRef = useRef();

  useEffect(() => {
    if (isPeer && conversationId) {
      loadConversation(conversationId);
      return () => leaveConversation();
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPeer, conversationId]);

  const displayName = isPeer ? otherName || peerName : peerName;
  const messages = isPeer ? realMessages : simulated.messages;
  const isPeerTyping = isPeer ? false : simulated.isTyping;

  const handleBackPress = React.useCallback(() => {
    if (chatType === "therapist") {
      navigation.goBack();
      return;
    }
    navigation.navigate("ChatWithPeer");
  }, [chatType, navigation]);

  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS !== "android") {
        return undefined;
      }

      const onBackPress = () => {
        handleBackPress();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [handleBackPress]),
  );

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: false });
  }, [messages.length, isPeerTyping]);

  const statusLabel = isPeer
    ? `Online \u2022 ${conversationStyle} style`
    : "Available now \u2022 Professional support";

  const sendMessage = () => {
    if (!inputText.trim()) {
      return;
    }

    if (isPeer) {
      sendRealMessage(conversationId, inputText.trim());
    } else {
      simulated.sendMessage(inputText.trim());
    }
    setInputText("");
  };

  const handleReport = () => {
    alert(
      "Report this conversation?",
      "We'll review it for anything that goes against community guidelines.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: async () => {
            const ok = await reportConversation(conversationId);
            alert(
              ok ? "Thanks" : "Something went wrong",
              ok
                ? "We've received your report and will take a look."
                : "Please try again.",
            );
          },
        },
      ],
    );
  };

  const handleEndChat = () => {
    alert("End this chat?", "You can rate the conversation afterward.", [
      { text: "Keep Chatting", style: "cancel" },
      {
        text: "End Chat",
        style: "destructive",
        onPress: async () => {
          await endConversation(conversationId);
          navigation.navigate("RatePeer", {
            peerName: displayName,
            conversationId,
          });
        },
      },
    ]);
  };

  const renderMessage = ({ item, index }) => {
    const isUser = item.sender === "user";
    const previousMessage = messages[index - 1];
    const showAvatar = !isUser && previousMessage?.sender !== "peer";

    return (
      <View style={[styles.messageRow, isUser && styles.userRow]}>
        {!isUser && (
          <View style={styles.avatarSlot}>
            {showAvatar ? (
              <View style={styles.peerAvatar}>
                <Text style={styles.peerAvatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        <View
          style={[styles.bubble, isUser ? styles.userBubble : styles.peerBubble]}
        >
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.timeText, isUser && styles.userTimeText]}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={22} color="#2D2418" />
          </TouchableOpacity>

          <View style={styles.headerIdentity}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.peerName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.peerStatus} numberOfLines={1}>
                {statusLabel}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {isPeer && (
              <TouchableOpacity style={styles.iconButton} onPress={handleReport}>
                <Ionicons name="flag-outline" size={20} color="#2D2418" />
              </TouchableOpacity>
            )}
            {chatType !== "therapist" && (
              <TouchableOpacity style={styles.iconButton} onPress={handleEndChat}>
                <Ionicons name="star-outline" size={20} color="#2D2418" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.dateDividerWrap}>
          <Text style={styles.dateDivider}>Today</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.messagesContent,
            { paddingBottom: 12 + insets.bottom },
          ]}
        />

        {isPeerTyping && (
          <View style={styles.typingRow}>
            <View style={styles.peerAvatar}>
              <Text style={styles.peerAvatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.typingBubble}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, styles.typingDotMid]} />
              <View style={styles.typingDot} />
            </View>
          </View>
        )}

        <View
          style={[
            styles.composerWrap,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}
        >
          <View style={styles.composer}>
            <TouchableOpacity style={styles.composerIcon}>
              <Ionicons name="happy-outline" size={22} color="#7B6A55" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Message"
              placeholderTextColor="#9C8B75"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
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
  container: {
    flex: 1,
    backgroundColor: "#D8C8A8",
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#E9DDC2",
    borderBottomWidth: 1,
    borderBottomColor: "#CCBC98",
  },
  headerIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#7B5B3D",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerAvatarText: {
    color: "#FFF7E7",
    fontSize: 18,
    fontWeight: "800",
  },
  headerTextWrap: {
    flex: 1,
  },
  peerName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2D2418",
  },
  peerStatus: {
    fontSize: 12,
    color: "#6E604D",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  dateDividerWrap: {
    alignItems: "center",
    paddingTop: 10,
  },
  dateDivider: {
    backgroundColor: "rgba(255, 248, 230, 0.88)",
    color: "#6E604D",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    fontSize: 12,
    fontWeight: "700",
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  userRow: {
    justifyContent: "flex-end",
  },
  avatarSlot: {
    width: 36,
    alignItems: "center",
    justifyContent: "flex-end",
    marginRight: 6,
  },
  peerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#C9B18D",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  peerAvatarText: {
    color: "#4A3928",
    fontWeight: "800",
    fontSize: 12,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0E3D2",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#9A8267",
    opacity: 0.6,
  },
  typingDotMid: {
    opacity: 0.9,
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
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
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    color: "#2D2418",
  },
  userMessageText: {
    color: "#FFF8EC",
  },
  timeText: {
    alignSelf: "flex-end",
    marginTop: 6,
    fontSize: 11,
    color: "#8E7C65",
  },
  userTimeText: {
    color: "#E8DAC7",
  },
  composerWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 8,
    backgroundColor: "#E9DDC2",
    borderTopWidth: 1,
    borderTopColor: "#CCBC98",
  },
  composer: {
    flex: 1,
    minHeight: 50,
    maxHeight: 110,
    backgroundColor: "#FFF9EE",
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  composerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#2D2418",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    maxHeight: 96,
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
  sendButtonDisabled: {
    backgroundColor: "#B4A288",
  },
});
