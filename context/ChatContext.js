import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CHAT_KEY = "@trusolution/chat-data-v1";
const ChatContext = createContext(null);

// A conversation is keyed by a stable id (peer id or therapist id).
// Each conversation holds an array of messages and an optional rating.
const createId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const raw = await AsyncStorage.getItem(CHAT_KEY);
        if (raw) {
          setConversations(JSON.parse(raw));
        }
      } catch (error) {
        console.warn("Unable to restore chat data", error);
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
    AsyncStorage.setItem(CHAT_KEY, JSON.stringify(conversations)).catch((e) =>
      console.warn("Unable to save chat data", e),
    );
  }, [isHydrated, conversations]);

  const getConversation = (conversationId) => {
    if (!conversationId) {
      return { messages: [], rating: null, meta: null };
    }
    return (
      conversations[conversationId] || { messages: [], rating: null, meta: null }
    );
  };

  const openConversation = ({ id, peerName, chatType, conversationStyle }) => {
    const existing = conversations[id];
    if (existing) {
      return existing;
    }

    const fresh = {
      messages: [],
      rating: null,
      meta: { id, peerName, chatType, conversationStyle },
    };
    setConversations((prev) => ({ ...prev, [id]: fresh }));
    return fresh;
  };

  const addMessage = (conversationId, { text, sender, time }) => {
    if (!conversationId) {
      return;
    }
    const message = {
      id: createId("msg"),
      text,
      sender,
      time,
    };
    setConversations((prev) => {
      const existing = prev[conversationId] || { messages: [], rating: null };
      return {
        ...prev,
        [conversationId]: {
          ...existing,
          messages: [...existing.messages, message],
        },
      };
    });
    return message;
  };

  const addReply = (conversationId, peerName, text) => {
    if (!conversationId) {
      return;
    }
    addMessage(conversationId, {
      text,
      sender: "peer",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  };

  const rateConversation = (conversationId, { rating, feedback, peerName }) => {
    if (!conversationId) {
      return;
    }
    setConversations((prev) => {
      const existing = prev[conversationId] || { messages: [] };
      return {
        ...prev,
        [conversationId]: {
          ...existing,
          rating: {
            rating,
            feedback,
            peerName,
            ratedAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  const value = useMemo(
    () => ({
      conversations,
      isHydrated,
      getConversation,
      openConversation,
      addMessage,
      addReply,
      rateConversation,
    }),
    [conversations, isHydrated],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const value = useContext(ChatContext);
  if (!value) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return value;
}
